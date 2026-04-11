import React from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, Calculator } from 'lucide-react';

const InputPage = () => {
  const { 
    user, setUser, 
    goal, setGoal, 
    targetWeightChange, 
    weeksToGoal,
    getCalculations, 
    goTo,
    language,
    t
  } = useStore();

  const isValid = user.age && user.weight && user.height;

  const handleCalculate = () => {
    if (isValid) goTo('dashboard');
  };

  const calcs = getCalculations();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>

        {/* Back Button */}
        <button
          className="btn-ghost animate-in"
          onClick={() => goTo('landing')}
          style={{ marginBottom: '24px' }}
        >
          <ArrowLeft size={18} />
          <span>{t('back')}</span>
        </button>

        {/* Main Card */}
        <div className="glass-card animate-in delay-1" style={{ padding: '40px 32px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
            {t('setup_title')}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '32px' }}>
            {t('setup_subtitle')}
          </p>

          {/* Age & Gender Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>{t('age')}</label>
              <input
                type="number"
                value={user.age}
                onChange={(e) => setUser({ age: e.target.value })}
                placeholder=" "
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-dim)',
                marginBottom: '8px',
              }}>{t('gender')}</label>
              <div className="toggle-group">
                {['male', 'female'].map((g) => (
                  <button
                    key={g}
                    className={`toggle-btn ${user.gender === g ? 'active' : ''}`}
                    onClick={() => setUser({ gender: g })}
                  >
                    {t(g)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weight & Height Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>{t('weight')}</label>
              <input
                type="number"
                value={user.weight}
                onChange={(e) => setUser({ weight: e.target.value })}
                placeholder=" "
              />
            </div>
            <div className="form-group">
              <label>{t('height')}</label>
              <input
                type="number"
                value={user.height}
                onChange={(e) => setUser({ height: e.target.value })}
                placeholder=" "
              />
            </div>
          </div>

          {/* Activity Level */}
          <div className="form-group">
            <label>{t('activity')}</label>
            <select
              value={user.activityLevel}
              onChange={(e) => setUser({ activityLevel: e.target.value })}
            >
              {['sedentary', 'light', 'moderate', 'active', 'athlete'].map(lvl => (
                <option key={lvl} value={lvl}>{t(`activity_${lvl}`)}</option>
              ))}
            </select>
          </div>

          {/* Goal Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-dim)',
              marginBottom: '10px',
            }}>{t('goal')}</label>
            <div className="toggle-group">
              {[
                { id: 'cutting', key: 'goal_cutting' },
                { id: 'maintain', key: 'goal_maintain' },
                { id: 'bulking', key: 'goal_bulking' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`toggle-btn ${goal === item.id ? (item.id === 'maintain' ? 'active' : 'active-accent') : ''}`}
                  onClick={() => setGoal(item.id)}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Goal Details (Only for Cutting/Bulking) */}
          {goal !== 'maintain' && (
            <div className="animate-in" style={{ marginBottom: '24px', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t(goal === 'cutting' ? 'weight_to_lose' : 'weight_to_gain')}</label>
                  <input
                    type="number"
                    value={targetWeightChange}
                    onChange={(e) => useStore.setState({ targetWeightChange: e.target.value })}
                    placeholder=" "
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t('duration')}</label>
                  <input
                    type="number"
                    value={weeksToGoal}
                    onChange={(e) => useStore.setState({ weeksToGoal: e.target.value })}
                    placeholder=" "
                  />
                </div>
              </div>

              {/* Real-time Feedback */}
              {calcs.kgPerWeek > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('rate_change')}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{calcs.kgPerWeek} kg / {language === 'en' ? 'week' : 'tuần'}</span>
                  </div>
                  
                  {calcs.goalStatus === 'dangerous' && (
                    <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', marginTop: '4px' }}>
                      {t('warning_aggressive')}
                    </div>
                  )}
                  {calcs.goalStatus === 'aggressive' && (
                    <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.75rem', marginTop: '4px' }}>
                      {t('warning_moderate')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Calculate CTA */}
          <button
            className="btn-primary w-full"
            onClick={handleCalculate}
            disabled={!isValid || (goal !== 'maintain' && (!targetWeightChange || !weeksToGoal))}
          >
            <Calculator size={20} />
            <span>{t('calculate')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputPage;
