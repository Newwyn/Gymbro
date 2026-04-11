import React from 'react';
import { useStore } from '../../store/useStore';
import { History as HistoryIcon, CheckCircle2, XCircle } from 'lucide-react';

const DailyHistory = () => {
  const { history, t } = useStore();

  if (!history || history.length === 0) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center', 
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        border: '1px dashed var(--glass-border)',
        borderRadius: '16px'
      }}>
        {t('history_empty')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {history.map((day, i) => {
        const isSuccess = day.eaten <= day.target && day.eaten > 0;
        const percent = Math.min(100, Math.round((day.eaten / day.target) * 100));
        
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isSuccess ? 
                <CheckCircle2 size={18} color="var(--primary)" /> : 
                <XCircle size={18} color="#ef4444" />
              }
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{day.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{day.eaten} / {day.target} kcal</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{percent}% {t('history_goal')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DailyHistory;
