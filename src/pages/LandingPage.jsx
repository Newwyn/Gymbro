import React from 'react';
import { useStore } from '../store/useStore';
import { ArrowRight, Dumbbell } from 'lucide-react';

const LandingPage = () => {
  const { goTo, language, setLanguage, t, user } = useStore();

  const handleStart = () => {
    if (user.age && user.weight && user.height) {
      goTo('dashboard');
    } else {
      goTo('input');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background Glows */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(57,255,20,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '600px' }}>
        {/* Icon */}
        <div className="animate-in" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'var(--primary-dim)',
          border: '1px solid rgba(57,255,20,0.2)',
          marginBottom: '32px',
        }}>
          <Dumbbell size={36} color="var(--primary)" />
        </div>

        {/* Title */}
        <h1 className="animate-in delay-1" style={{
          fontSize: 'clamp(4rem, 10vw, 7rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #39FF14, #00D4FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {t('landing_title')}
        </h1>

        {/* Subtitle */}
        <p className="animate-in delay-2" style={{
          fontSize: '1.15rem',
          color: 'var(--text-dim)',
          fontWeight: 400,
          marginBottom: '40px',
          lineHeight: 1.6,
        }}>
          {t('landing_subtitle')}
        </p>

        {/* Language Switcher */}
        <div className="animate-in delay-3" style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.03)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          marginBottom: '32px',
          gap: '4px'
        }}>
          {['en', 'vi'].map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: language === l ? 'var(--primary)' : 'transparent',
                color: language === l ? '#000' : 'var(--text-dim)',
                border: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {l === 'en' ? 'English' : 'Tiếng Việt'}
            </button>
          ))}
        </div>

        <br />

        {/* CTA Button */}
        <button
          className="btn-primary animate-in delay-4"
          onClick={handleStart}
          style={{
            padding: '20px 52px',
            fontSize: '1.1rem',
            borderRadius: '20px',
            animation: 'fadeIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s forwards, pulse-glow 3s ease-in-out 1s infinite',
            opacity: 0,
          }}
        >
          <span>{t('landing_cta')}</span>
          <ArrowRight size={22} />
        </button>
      </div>

      {/* Footer tag */}
      <div className="animate-in delay-5" style={{
        position: 'absolute',
        bottom: '32px',
        fontSize: '0.7rem',
        color: 'var(--text-dim)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontWeight: 600,
        opacity: 0.4,
      }}>
        {t('landing_footer')}
      </div>
    </div>
  );
};

export default LandingPage;
