const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CLASS DEFINITIONS - Assassin Prototype
// ============================================================
const ORB_COST = 1000; // 1 Orb = 1000 Energy

const CLASS_DEFS = {
    assassin: {
        name: 'Assassin',
        emoji: '🥷',
        color: '#1e293b',
        maxHp: 120,
        maxMp: 5000, // 5 Orbs
        atk: 25,
        def: 5,
        atkSpeed: 800, // Fast attacker
        range: 'melee',
        atkRange: 1.5,
        moveSpeed: 0.05,
        skills: [
            {
                // Skill 0
                name: 'Phi Tiêu',
                orbCost: 1,
                cooldown: 5000,
                castTime: 0,
                type: 'projectile',
                multiplier: 1.5,
                dash: false
            },
            {
                // Skill 1
                name: 'Đột Kích',
                orbCost: 2,
                cooldown: 8000,
                castTime: 0,
                type: 'melee_strike',
                multiplier: 2.5,
                dash: true // Teleports behind enemy
            },
            {
                // Skill 2 (Ultimate)
                name: 'Bão Dao',
                orbCost: 3,
                cooldown: 15000,
                castTime: 2000, // 2s cast time
                type: 'aoe_damage',
                multiplier: 4.0,
                dash: false
            }
        ],
        passives: [
            { name: 'Né Tránh', type: 'dodge', value: 0.15 },
            { name: 'Đánh Lén', type: 'backstab_crit', value: 0.50 }
        ]
    }
};

// We will use 4 Assassins for testing, but give them simple names to distinguish
const SQUAD_ORDER = ['assassin', 'assassin', 'assassin', 'assassin'];

// ============================================================
// GAME STATE
// ============================================================
let rooms = {};
let waitingPlayer = null;

function createSquad(side) {
    const startX = side === 'left' ? -12 : 12;
    const direction = side === 'left' ? 1 : -1;

    return SQUAD_ORDER.map((classId, index) => {
        const def = CLASS_DEFS[classId];
        let xOffset = index * 1.5 * direction;

        return {
            classId,
            name: `${def.name} ${index + 1}`,
            emoji: def.emoji,
            color: def.color,
            hp: def.maxHp,
            maxHp: def.maxHp,
            mp: 1000, // Start with 1 Orb
            maxMp: def.maxMp,
            atk: def.atk,
            def: def.def,
            atkSpeed: def.atkSpeed,
            atkRange: def.atkRange,
            range: def.range,
            moveSpeed: def.moveSpeed,
            alive: true,
            x: startX + xOffset,
            y: 0,
            z: (index - 1.5) * 1.8,
            side,
            state: 'moving', // moving, attacking, casting, dead
            targetIndex: -1,
            lastAttackTime: 0,
            skillCooldowns: [0, 0, 0], // End timestamps for each skill
            queuedSkills: [],     // [0, 1, 2] indices of skills
            castingSkillId: null, // Index of currently casting skill
            castEndTime: 0      // When current cast finishes
        };
    });
}

function findBestTarget(attacker, enemySquad) {
    const alive = enemySquad.filter(m => m.alive);
    if (alive.length === 0) return null;
    let closest = alive[0];
    let closestDist = Math.abs(attacker.x - closest.x);
    alive.forEach(m => {
        const dist = Math.abs(attacker.x - m.x);
        if (dist < closestDist) {
            closestDist = dist;
            closest = m;
        }
    });
    return closest;
}

// ============================================================
// SOCKET HANDLING
// ============================================================
io.on('connection', (socket) => {
    if (waitingPlayer) {
        const roomId = `room_${Date.now()}`;
        const p1 = waitingPlayer;
        const p2 = socket.id;

        rooms[roomId] = {
            id: roomId,
            players: {
                [p1]: { side: 'left', squad: createSquad('left'), autoMode: false },
                [p2]: { side: 'right', squad: createSquad('right'), autoMode: false }
            },
            winner: null
        };

        io.sockets.sockets.get(p1)?.join(roomId);
        socket.join(roomId);
        if (io.sockets.sockets.get(p1)) io.sockets.sockets.get(p1).roomId = roomId;
        socket.roomId = roomId;

        io.to(roomId).emit('battleStart', { roomId, players: rooms[roomId].players, classDefs: CLASS_DEFS });
        waitingPlayer = null;
        startBattleLoop(roomId);
    } else {
        waitingPlayer = socket.id;
        socket.emit('waiting', { message: 'Đang chờ đối thủ...' });
    }

    socket.on('toggleAuto', (data) => {
        const roomId = socket.roomId;
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id].autoMode = data.autoMode;
        }
    });

    socket.on('queueSkill', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        const playerData = rooms[roomId].players[socket.id];
        if (!playerData) return;

        const member = playerData.squad[data.memberIndex];
        const skillIndex = data.skillIndex;
        if (!member || !member.alive || skillIndex === undefined) return;

        // Prevent queueing if already in queue to avoid spam
        if (!member.queuedSkills.includes(skillIndex)) {
            member.queuedSkills.push(skillIndex);
        }
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket.id) waitingPlayer = null;
        if (socket.roomId && rooms[socket.roomId]) {
            io.to(socket.roomId).emit('opponentDisconnected');
            delete rooms[socket.roomId];
        }
    });
});

// ============================================================
// BATTLE ENGINE
// ============================================================
function startBattleLoop(roomId) {
    const tickRate = 50; // 50ms per tick
    const interval = setInterval(() => {
        const room = rooms[roomId];
        if (!room || room.winner) { clearInterval(interval); return; }

        const now = Date.now();
        const playerIds = Object.keys(room.players);

        playerIds.forEach(playerId => {
            const playerData = room.players[playerId];
            const opponentId = playerIds.find(id => id !== playerId);
            const opponentData = room.players[opponentId];

            // AUTO MODE LOGIC
            if (playerData.autoMode) {
                playerData.squad.forEach(member => {
                    if (!member.alive) return;
                    const def = CLASS_DEFS[member.classId];
                    // Prioritize Skill 2 -> 1 -> 0
                    for (let i = 2; i >= 0; i--) {
                        if (member.mp >= def.skills[i].orbCost * ORB_COST && now > member.skillCooldowns[i]) {
                            if (!member.queuedSkills.includes(i)) {
                                member.queuedSkills.push(i);
                            }
                        }
                    }
                });
            }

            playerData.squad.forEach((member, memberIndex) => {
                if (!member.alive) return;

                // Mana Regen over time
                member.mp = Math.min(member.maxMp, member.mp + 8); // 8 energy per 50ms tick

                const def = CLASS_DEFS[member.classId];

                // FIND TARGET
                const target = findBestTarget(member, opponentData.squad);
                if (!target) return;
                const targetIdx = opponentData.squad.indexOf(target);
                member.targetIndex = targetIdx;

                // CHECK SKILL QUEUE & CASTING
                if (member.state === 'casting') {
                    if (now >= member.castEndTime) {
                        // EXECUTING CASTED SKILL
                        executeSkill(roomId, playerId, memberIndex, opponentId, member.castingSkillId);
                        member.state = 'idle';
                        member.castingSkillId = null;
                    }
                    return; // Can't move or attack while casting
                }

                // If not casting, check if we should start casting a queued skill
                if (member.queuedSkills.length > 0) {
                    const skillIdxToCast = member.queuedSkills[0]; // Peek
                    const skillDef = def.skills[skillIdxToCast];
                    const cost = skillDef.orbCost * ORB_COST;

                    // If enough mana and off cooldown
                    if (member.mp >= cost && now >= member.skillCooldowns[skillIdxToCast]) {
                        member.queuedSkills.shift(); // Dequeue
                        member.mp -= cost;
                        member.skillCooldowns[skillIdxToCast] = now + skillDef.cooldown;

                        if (skillDef.castTime > 0) {
                            member.state = 'casting';
                            member.castingSkillId = skillIdxToCast;
                            member.castEndTime = now + skillDef.castTime;
                            io.to(roomId).emit('castStart', { 
                                casterId: playerId, casterIdx: memberIndex, 
                                skillIdx: skillIdxToCast, castTime: skillDef.castTime 
                            });
                            return; // Stop here, now we are casting
                        } else {
                            // Instant cast
                            executeSkill(roomId, playerId, memberIndex, opponentId, skillIdxToCast);
                            return; // Skill cast takes priority over attack this tick
                        }
                    } else if (member.mp < cost) {
                        // Not enough mana, leave it in queue but proceed with normal attack
                    }
                }

                // NORMAL MOVEMENT & ATTACK
                const dx = target.x - member.x;
                const dz = target.z - member.z;
                const dist2D = Math.sqrt(dx * dx + dz * dz);

                if (dist2D > member.atkRange) {
                    member.state = 'moving';
                    const dirX = dx / dist2D;
                    const dirZ = dz / dist2D;
                    member.x += dirX * member.moveSpeed * tickRate;
                    member.z += dirZ * member.moveSpeed * tickRate;
                } else {
                    member.state = 'attacking';
                    if (now - member.lastAttackTime >= member.atkSpeed) {
                        // Dodge check
                        const targetDef = CLASS_DEFS[target.classId];
                        let isDodge = Math.random() < 0.15; // Assassin base dodge 15%
                        
                        if (isDodge) {
                            io.to(roomId).emit('autoAttack', {
                                attackerId: playerId, attackerIndex: memberIndex,
                                targetId: opponentId, targetIndex: targetIdx, damage: 0, dodged: true
                            });
                        } else {
                            // Attack lands
                            const dmg = Math.max(1, member.atk - target.def);
                            target.hp = Math.max(0, target.hp - dmg);
                            if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
                            
                            // Mana from attack (150 energy)
                            member.mp = Math.min(member.maxMp, member.mp + 150);

                            io.to(roomId).emit('autoAttack', {
                                attackerId: playerId, attackerIndex: memberIndex,
                                targetId: opponentId, targetIndex: targetIdx, damage: dmg, dodged: false
                            });
                        }
                        member.lastAttackTime = now;
                    }
                }
            });
        });

        broadcastState(roomId);
        checkWinCondition(roomId);
    }, tickRate);
}

function executeSkill(roomId, casterId, casterIdx, opponentId, skillIdx) {
    const room = rooms[roomId];
    const member = room.players[casterId].squad[casterIdx];
    const skillDef = CLASS_DEFS[member.classId].skills[skillIdx];
    const opponentData = room.players[opponentId];
    
    let effects = [];

    // Dash logic: Dash behind the weakest or targeted enemy
    if (skillDef.dash) {
        const target = findBestTarget(member, opponentData.squad);
        if (target) {
            const dir = room.players[casterId].side === 'left' ? 1 : -1;
            // Teleport behind target
            member.x = target.x + (1.5 * dir); 
            member.z = target.z; // match Z to backstab perfectly
            // Passive Backstab Crit Logic (Simulated by 1.5x multi here for the sake of demo)
            const dmg = Math.floor(member.atk * skillDef.multiplier * 1.5); // 50% extra for backstab
            target.hp = Math.max(0, target.hp - dmg);
            if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
            
            effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg, isCrit: true });
        }
    } else if (skillDef.type === 'aoe_damage') {
        opponentData.squad.forEach((enemy, i) => {
            if (enemy.alive) {
                const dmg = Math.floor(member.atk * skillDef.multiplier);
                enemy.hp = Math.max(0, enemy.hp - dmg);
                if (enemy.hp === 0) { enemy.alive = false; enemy.state = 'dead'; }
                effects.push({ targetIndex: i, damage: dmg });
            }
        });
    } else if (skillDef.type === 'projectile') {
        const target = findBestTarget(member, opponentData.squad);
        if (target) {
            const dmg = Math.floor(member.atk * skillDef.multiplier);
            target.hp = Math.max(0, target.hp - dmg);
            if (target.hp === 0) { target.alive = false; target.state = 'dead'; }
            effects.push({ targetIndex: opponentData.squad.indexOf(target), damage: dmg });
        }
    }

    io.to(roomId).emit('skillExecuted', {
        casterId, casterIdx, skillIdx, type: skillDef.type, dash: skillDef.dash, newX: member.x, newZ: member.z, effects
    });
}

function broadcastState(roomId) {
    if (!rooms[roomId]) return;
    io.to(roomId).emit('stateUpdate', { players: rooms[roomId].players });
}

function checkWinCondition(roomId) {
    const room = rooms[roomId];
    if (!room || room.winner) return;

    Object.keys(room.players).forEach(playerId => {
        const allDead = room.players[playerId].squad.every(m => !m.alive);
        if (allDead) {
            const winnerId = Object.keys(room.players).find(id => id !== playerId);
            room.winner = winnerId;
            io.to(roomId).emit('battleEnd', { winnerId, loserId: playerId });
        }
    });
}

server.listen(PORT, () => {
    console.log(`Legend of Capsules is running at http://localhost:${PORT}`);
});
