import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import CaloriesRing from '../features/dashboard/CaloriesRing';
import QuickLog from '../features/dashboard/QuickLog';
import WeightChart from '../features/dashboard/WeightChart';
import DailyHistory from '../features/dashboard/DailyHistory';
import { ArrowLeft, RotateCcw, User, AlertTriangle } from 'lucide-react';

const MacroCard = ({ label, current, target, color }) => {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="section-label" style={{ marginBottom: '12px' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {Math.round(current)}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-dim)' }}>g</span>
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ {target}g</span>
      </div>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { caloriesEaten, macrosEaten, resetAll, getCalculations, goTo, t } = useStore();
  const { targetCalories, targetMacros } = getCalculations();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', position: 'relative' }}>
      
      {/* Custom Confirm Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card animate-in" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center', border: '1px solid #ef4444' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{t('confirm_reset')}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {t('confirm_reset_desc')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}
              >
                {t('btn_no')}
              </button>
              <button 
                onClick={resetAll}
                style={{ padding: '12px 24px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {t('btn_yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="animate-in" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <button className="btn-ghost" onClick={() => goTo('input')}>
          <ArrowLeft size={18} />
          <span>{t('back')}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-ghost" onClick={() => setShowConfirm(true)} style={{ color: '#ef4444' }}>
            <RotateCcw size={16} />
            <span style={{ fontSize: '0.8rem' }}>{t('reset_all')}</span>
          </button>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--primary-dim)',
            border: '1px solid rgba(57,255,20,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={16} color="var(--primary)" />
          </div>
        </div>
      </header>

      <div className="grid-12">
        {/* SECTION 1: CALORIES HERO */}
        <div className="col-12 glass-card animate-in delay-1" style={{
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div className="section-label" style={{ textAlign: 'center' }}>{t('calories_progress')}</div>
          <CaloriesRing eaten={caloriesEaten} target={targetCalories} />
          <div style={{
            display: 'flex',
            gap: '40px',
            marginTop: '24px',
            textAlign: 'center',
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(caloriesEaten)}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{t('eaten')}</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, opacity: 0.3 }}>{targetCalories}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{t('daily_target')}</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MACROS */}
        <div className="col-4 animate-in delay-2">
          <MacroCard label={t('protein')} current={macrosEaten.protein} target={targetMacros.protein} color="var(--color-protein)" />
        </div>
        <div className="col-4 animate-in delay-3">
          <MacroCard label={t('carbs')} current={macrosEaten.carb} target={targetMacros.carb} color="var(--color-carb)" />
        </div>
        <div className="col-4 animate-in delay-3">
          <MacroCard label={t('fat')} current={macrosEaten.fat} target={targetMacros.fat} color="var(--color-fat)" />
        </div>

        {/* SECTION 3: QUICK LOG */}
        <div className="col-4 glass-card animate-in delay-4" style={{ padding: '24px' }}>
          <div className="section-label">{t('quick_log')}</div>
          <QuickLog />
        </div>

        {/* SECTION 4: WEIGHT CHART */}
        <div className="col-8 glass-card animate-in delay-5" style={{ padding: '24px' }}>
          <WeightChart />
        </div>

        {/* SECTION 5: PERFORMANCE HISTORY */}
        <div className="col-12 glass-card animate-in delay-6" style={{ padding: '24px' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>{t('history')}</div>
          <DailyHistory />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '40px 0 20px',
        fontSize: '0.65rem',
        color: 'var(--text-dim)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        opacity: 0.3,
      }}>
        © 2026 GYMBRO · Engineered for Results
      </footer>
    </div>
  );
};

export default DashboardPage;
