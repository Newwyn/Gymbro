import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, X, Utensils, RotateCcw } from 'lucide-react';

const QuickLog = () => {
  const { addFood, foodLogs, deleteFoodEntry, resetDay, t } = useStore();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !kcal) return;
    addFood(name, Number(kcal));
    setName('');
    setKcal('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t('food_name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=" "
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t('calories')}</label>
          <input
            type="number"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="0"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={!name || !kcal}>
          <Plus size={18} />
          <span>{t('add_food')}</span>
        </button>
      </form>

      {/* Daily Logs List */}
      {foodLogs.length > 0 && (
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-label" style={{ marginBottom: 0, fontSize: '0.6rem' }}>{t('recent_logs')}</div>
            <button 
              onClick={resetDay} 
              style={{ background: 'none', border: '1px solid var(--glass-border)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-dim)', fontSize: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={10} />
              {t('reset_day')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {foodLogs.map((log) => (
              <div key={log.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils size={12} color="var(--primary)" style={{ opacity: 0.5 }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.calories} kcal</div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteFoodEntry(log.id)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#ef4444', opacity: 0.6 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', opacity: 0.6 }}>
        {t('note_manual')}
      </div>
    </div>
  );
};

export default QuickLog;
