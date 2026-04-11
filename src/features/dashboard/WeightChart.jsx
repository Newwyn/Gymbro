import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Scale, X } from 'lucide-react';

const WeightChart = () => {
  const { weightHistory, addWeightEntry, deleteWeightEntry, t } = useStore();
  const [weight, setWeight] = useState('');

  const handleAdd = () => {
    if (weight) {
      addWeightEntry(Number(weight));
      setWeight('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-label">{t('weight_tracking')}</div>
      
      {weightHistory.length > 0 ? (
        <div style={{ height: '200px', width: '100%', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-dim)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                hide 
                domain={['dataMin - 2', 'dataMax + 2']} 
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15,23,42,0.9)', 
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  fontSize: '0.8rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="var(--primary)" 
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ 
          height: '200px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          border: '1px dashed var(--glass-border)',
          borderRadius: '16px'
        }}>
          <Scale size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
          {t('no_weight_data')}
        </div>
      )}

      {/* Manual Entry */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={t('enter_weight')}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleAdd} 
          className="btn-primary" 
          style={{ padding: '0 16px' }} 
          disabled={!weight}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Entry Management */}
      {weightHistory.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {/* Show last 3 entries for management */}
          {weightHistory.slice().reverse().slice(0, 3).map((entry) => (
            <div key={entry.date} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px'
            }}>
              <span>{entry.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{entry.weight} kg</span>
                <button 
                  onClick={() => deleteWeightEntry(entry.date)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeightChart;
