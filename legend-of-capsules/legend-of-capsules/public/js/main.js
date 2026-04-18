import * as THREE from 'three';

// ============================================================
// SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 18);
camera.lookAt(0, -1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('game-container').appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(2, 10, 5);
scene.add(dirLight);

const groundGeo = new THREE.PlaneGeometry(50, 20);
const groundMat = new THREE.MeshPhongMaterial({ color: 0x2d5016, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

const gridHelper = new THREE.GridHelper(50, 50, 0x3a6b1f, 0x244c0d);
gridHelper.position.y = -0.49;
scene.add(gridHelper);

// ============================================================
// STATE
// ============================================================
const socket = io();
let myId = null;
let mySide = null;
let roomData = null;
let classDefs = null;
let capsules = {}; 
let isAuto = false;
let cameraTargetX = 0;

// Consts
const ORB_COST = 1000;

// ============================================================
// CAPSULE CREATION & VFX
// ============================================================
function createCharTexture(emoji, color, label, isMyTeam) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(64, 70, 45, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(48, 52, 18, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(46, 62, 12, 0, Math.PI * 2); ctx.arc(82, 62, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15'; // Yellow eyes for assassin
    ctx.beginPath(); ctx.arc(50, 62, 5, 0, Math.PI * 2); ctx.arc(78, 62, 5, 0, Math.PI * 2); ctx.fill();

    // Ninja mask line
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 75, 88, 10);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, 64, 135);

    if (isMyTeam) {
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(64, 70, 48, 0, Math.PI * 2); ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

function createBarSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 128, 16);
    ctx.fillStyle = color; ctx.fillRect(2, 2, 124, 12);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.18, 1);
    sprite.userData = { canvas, ctx, texture, color };
    return sprite;
}

function updateBarSprite(sprite, percent) {
    const { ctx, texture, color } = sprite.userData;
    ctx.clearRect(0, 0, 128, 16);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 128, 16);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 128, 16);
    ctx.fillStyle = color;
    ctx.fillRect(2, 2, 124 * Math.max(0, Math.min(1, percent)), 12);
    texture.needsUpdate = true;
}

function createTeamLabel(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(text, 128, 32); ctx.fillText(text, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4, 0.75, 1);
    return sprite;
}

function createCapsuleGroup(memberData, classDef, isMyTeam) {
    const group = new THREE.Group();
    const tex = createCharTexture(classDef.emoji, memberData.color, memberData.name, isMyTeam);
    const mat = new THREE.SpriteMaterial({ map: tex });
    const body = new THREE.Sprite(mat);
    body.scale.set(1.8, 2.2, 1); body.position.y = 1;
    group.add(body); group.userData.body = body;

    const hpBar = createBarSprite('#22c55e'); hpBar.position.y = 2.5; group.add(hpBar); group.userData.hpBar = hpBar;
    
    const castBar = createBarSprite('#facc15'); castBar.position.y = 2.7; castBar.visible = false;
    group.add(castBar); group.userData.castBar = castBar;

    group.position.set(memberData.x, 0, memberData.z || 0);
    group.userData.memberData = memberData;
    return group;
}

// ============================================================
// VFX
// ============================================================
let damageNumbers = [];
let effects = [];

function spawnDamageNumber(x, y, z, value, type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = type === 'crit' ? '900 48px Arial' : type === 'dodge' ? 'bold 32px Arial' : 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = type === 'heal' ? '#22c55e' : type === 'crit' ? '#facc15' : type === 'dodge' ? '#94a3b8' : '#ff4444';
    ctx.strokeStyle = '#000'; ctx.lineWidth = type === 'crit' ? 6 : 4;
    const text = type === 'dodge' ? 'DODGE' : type === 'heal' ? `+${value}` : `-${value}`;
    ctx.strokeText(text, 64, 44); ctx.fillText(text, 64, 44);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.scale.set(1.8, 0.9, 1);
    if(type === 'crit') sprite.scale.set(2.5, 1.25, 1);
    
    sprite.position.set(x + (Math.random() - 0.5) * 0.5, y + 3, z + 0.5);
    scene.add(sprite);
    damageNumbers.push({ sprite, life: 1.0, vy: type === 'crit' ? 0.05 : 0.03 });
}

function spawnShadowTrail(x, y, z, tx, tz) {
    // A simple line or ghost sprite to show dash
    const mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
    const points = [new THREE.Vector3(x, y+1, z), new THREE.Vector3(tx, y+1, tz)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    effects.push({ mesh: line, life: 1.0, type: 'line' });
}

function spawnAoeExplosion(x, z) {
    const geo = new THREE.CircleGeometry(3, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(geo, mat);
    circle.rotation.x = -Math.PI/2;
    circle.position.set(x, 0.1, z);
    scene.add(circle);
    effects.push({ mesh: circle, life: 1.0, type: 'expand' });
}

function updateVfx() {
    damageNumbers = damageNumbers.filter(dn => {
        dn.life -= 0.02;
        dn.sprite.position.y += dn.vy;
        dn.sprite.material.opacity = Math.max(0, dn.life);
        if (dn.life <= 0) { scene.remove(dn.sprite); return false; }
        return true;
    });

    effects = effects.filter(fx => {
        fx.life -= 0.05;
        if(fx.type === 'line') fx.mesh.material.opacity = fx.life * 0.5;
        if(fx.type === 'expand') {
            fx.mesh.scale.setScalar(1 + (1 - fx.life) * 2);
            fx.mesh.material.opacity = fx.life * 0.8;
        }
        if (fx.life <= 0) { scene.remove(fx.mesh); return false; }
        return true;
    });
}

let attackAnims = [];
function triggerAttackAnim(group, direction) {
    attackAnims.push({ group, originalX: group.position.x, phase: 'forward', progress: 0, direction });
}
function updateAttackAnims() {
    attackAnims = attackAnims.filter(anim => {
        anim.progress += 0.2;
        if (anim.phase === 'forward') {
            anim.group.position.x = anim.originalX + anim.direction * Math.sin(anim.progress) * 0.4;
            if (anim.progress >= Math.PI / 2) { anim.phase = 'back'; anim.progress = 0; }
        } else {
            anim.group.position.x = anim.originalX + anim.direction * Math.cos(anim.progress) * 0.4;
            if (anim.progress >= Math.PI / 2) { anim.group.position.x = anim.originalX; return false; }
        }
        return true;
    });
}

// ============================================================
// BUILD SCENE
// ============================================================
function buildBattleScene(data) {
    roomData = data; classDefs = data.classDefs;
    Object.entries(data.players).forEach(([playerId, playerData]) => {
        const isMyTeam = (playerId === myId);
        capsules[playerId] = [];
        playerData.squad.forEach((member) => {
            const group = createCapsuleGroup(member, classDefs[member.classId], isMyTeam);
            scene.add(group); capsules[playerId].push(group);
        });
        if (isMyTeam) mySide = playerData.side;
    });

    const myLabel = createTeamLabel('⭐ ĐỘI CỦA BẠN', '#00d4ff');
    myLabel.position.set(mySide === 'left' ? -8 : 8, 3, -1); scene.add(myLabel);
    const enemyLabel = createTeamLabel('👹 ĐỐI THỦ', '#ff4444');
    enemyLabel.position.set(mySide === 'left' ? 8 : -8, 3, -1); scene.add(enemyLabel);

    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    document.getElementById('combat-hud').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
}

// ============================================================
// UPDATE LOGIC
// ============================================================
function updateHUD(players) {
    if (!myId || !players[myId]) return;
    const squad = players[myId].squad;
    const now = Date.now();

    squad.forEach((member, i) => {
        const card = document.getElementById(`member-${i}`);
        if (!card) return;

        // HP
        const hpFill = card.querySelector('.hp-fill');
        hpFill.style.width = member.maxHp > 0 ? `${(member.hp/member.maxHp)*100}%` : '0%';
        
        // Orbs
        const orbs = member.mp / ORB_COST;
        const fullOrbs = Math.floor(orbs);
        const remainder = orbs - fullOrbs;
        
        const orbBar = document.getElementById(`orb-bar-${i}`);
        if (orbBar) {
            Array.from(orbBar.children).forEach((orb, idx) => {
                if (idx < fullOrbs) orb.style.setProperty('--fill-pct', '100%');
                else if (idx === fullOrbs) orb.style.setProperty('--fill-pct', `${remainder*100}%`);
                else orb.style.setProperty('--fill-pct', '0%');
            });
        }

        // Skills
        const def = classDefs[member.classId];
        for(let s=0; s<3; s++) {
            const btn = document.getElementById(`btn-${i}-${s}`);
            if(!btn) continue;
            
            const cost = def.skills[s].orbCost;
            let isReady = false;
            let isQueued = member.queuedSkills.includes(s);

            // Queue numbers
            const qNum = btn.querySelector('.queue-num');
            if(isQueued) {
                const qIdx = member.queuedSkills.indexOf(s);
                qNum.textContent = qIdx + 1;
            }

            if (!member.alive) {
                btn.className = 'skill-btn disabled' + (s===2?' ultimate':'');
            } else {
                if (member.mp >= cost * ORB_COST && now > member.skillCooldowns[s]) {
                    isReady = true;
                }
                
                let cls = 'skill-btn';
                if(s===2) cls += ' ultimate';
                if(isReady) cls += ' ready';
                if(isQueued) cls += ' queued';
                if(!isReady && !isQueued) cls += ' disabled';
                btn.className = cls;
            }
        }
    });

    // Auto Btn
    const autoBtn = document.getElementById('btn-auto');
    if(players[myId].autoMode) {
        autoBtn.textContent = 'AUTO MODE: ON';
        autoBtn.classList.add('active');
    } else {
        autoBtn.textContent = 'AUTO MODE: OFF';
        autoBtn.classList.remove('active');
    }
}

function updateSceneFromState(players) {
    const now = Date.now();
    Object.entries(players).forEach(([playerId, playerData]) => {
        if (!capsules[playerId]) return;
        playerData.squad.forEach((member, i) => {
            const group = capsules[playerId][i];
            if (!group) return;

            group.position.x += (member.x - group.position.x) * 0.15;
            group.position.z += (member.z - group.position.z) * 0.15;

            updateBarSprite(group.userData.hpBar, member.hp / member.maxHp);

            if (member.state === 'casting' && member.castEndTime > now) {
                const def = classDefs[member.classId].skills[member.castingSkillId];
                if(def && def.castTime > 0) {
                    group.userData.castBar.visible = true;
                    // Approximaite progression just based on end time relative to full cast param. 
                    // To be precise we need start time, but we can fake it:
                    const timeRemaining = member.castEndTime - now;
                    // Wait, we don't have start time in member state. Let's assume progress based on a local cast property if needed,
                    // Actually, simpler: just let server pass start time, or just pulse the cast bar.
                    // For now, let's just make it a yellow bar that flashes
                    updateBarSprite(group.userData.castBar, 1 - (timeRemaining / 2000)); 
                }
            } else {
                group.userData.castBar.visible = false;
            }

            if (!member.alive) {
                group.userData.body.material.opacity = 0.25;
                group.userData.castBar.visible = false;
                group.userData.hpBar.visible = false;
                group.scale.set(1, 0.4, 1);
                group.position.y = -0.35;
            }
        });
    });

    if (myId && players[myId]) {
        const alive = players[myId].squad.filter(m => m.alive);
        if (alive.length > 0) {
            const avgX = alive.reduce((sum, m) => sum + m.x, 0) / alive.length;
            cameraTargetX = avgX * 0.6; 
        }
    }
}

// ============================================================
// SOCKET EVENTS
// ============================================================
socket.on('connect', () => { myId = socket.id; });
socket.on('waiting', (data) => { document.getElementById('loading-text').textContent = data.message; });
socket.on('battleStart', (data) => { buildBattleScene(data); });
socket.on('stateUpdate', (data) => {
    roomData = { ...roomData, players: data.players };
    updateSceneFromState(data.players); updateHUD(data.players);
});

socket.on('autoAttack', (data) => {
    const atkGrp = capsules[data.attackerId]?.[data.attackerIndex];
    const tgtGrp = capsules[data.targetId]?.[data.targetIndex];
    if (atkGrp) triggerAttackAnim(atkGrp, roomData.players[data.attackerId].side === 'left' ? 1 : -1);
    if (tgtGrp) spawnDamageNumber(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z, data.damage, data.dodged ? 'dodge' : 'normal');
});

socket.on('skillExecuted', (data) => {
    const memberGrp = capsules[data.casterId]?.[data.casterIdx];
    
    if (data.dash && memberGrp) {
        // Visual teleport trial
        spawnShadowTrail(memberGrp.position.x, memberGrp.position.y, memberGrp.position.z, data.newX, data.newZ);
        // Force snap position to prevent slow lerp
        memberGrp.position.x = data.newX;
        memberGrp.position.z = data.newZ;
    }

    if (data.type === 'aoe_damage' && memberGrp) {
        spawnAoeExplosion(memberGrp.position.x, memberGrp.position.z);
    }

    const opponentId = Object.keys(roomData.players).find(id => id !== data.casterId);
    data.effects.forEach(effect => {
        const tgtGrp = capsules[opponentId]?.[effect.targetIndex];
        if (tgtGrp) {
            spawnDamageNumber(tgtGrp.position.x, tgtGrp.position.y, tgtGrp.position.z, effect.damage, effect.isCrit ? 'crit' : 'normal');
        }
    });

    if(memberGrp) {
        // Hide cast bar
        memberGrp.userData.castBar.visible = false;
    }
});

socket.on('battleEnd', (data) => {
    const resultEl = document.getElementById('battle-result');
    resultEl.style.display = 'flex';
    resultEl.querySelector('.result-text').textContent = data.winnerId === myId ? '🏆 CHIẾN THẮNG!' : '💀 THẤT BẠI!';
    resultEl.querySelector('.result-text').style.color = data.winnerId === myId ? '#ffd700' : '#ef4444';
});

// ============================================================
// UI INPUTS
// ============================================================
window.queueSkill = function(memberIndex, skillIndex) {
    socket.emit('queueSkill', { memberIndex, skillIndex });
};

window.toggleAuto = function() {
    isAuto = !isAuto;
    socket.emit('toggleAuto', { autoMode: isAuto });
};

// ============================================================
// LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    camera.position.x += (cameraTargetX - camera.position.x) * 0.05;
    camera.lookAt(camera.position.x, 0, 0);
    updateVfx(); updateAttackAnims();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();
