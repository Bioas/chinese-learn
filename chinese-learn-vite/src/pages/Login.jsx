import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import InkParticles from '../components/InkParticles';
import useTranslation from '../hooks/useTranslation';

const LOGIN_INK_CHARS = ['登', '錄', '學', '習', '進', '步'];

export default function Login({ onClose }) {
  const { t } = useTranslation();
  const { login, register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError(t('auth.required'));
      return;
    }

    try {
      if (isRegister) {
        await register(email, password);
        setSuccess(t('auth.registerSuccess'));
      } else {
        await login(email, password);
        onClose?.();
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? t('auth.networkError')
        : err.message);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      onClose?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <InkParticles chars={LOGIN_INK_CHARS} />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-lg popup-overlay-enter"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.06] overflow-hidden popup-enter"
        style={{
          background: 'linear-gradient(160deg, color-mix(in srgb, var(--bg-card) 95%, var(--accent-from)), var(--bg-primary) 80%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-from) 0%, transparent 60%)', opacity: 0.15, borderRadius: '16px 0 0 0' }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none" style={{ background: 'linear-gradient(315deg, var(--accent-from) 0%, transparent 60%)', opacity: 0.15, borderRadius: '0 0 16px 0' }} />

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted hover:text-primary">
          <Icon name="xmark" className="text-lg" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl font-bold gradient-text">上山</span>
            <h2 className="text-xl font-bold mt-2 text-primary">
              {isRegister ? t('auth.createAccount') : t('auth.welcomeBack')}
            </h2>
            <p className="text-sm text-secondary mt-1">
              {isRegister ? t('auth.createAccountHint') : t('auth.loginHint')}
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2 mb-4 text-center">{success}</p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="input-field w-full"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="input-field w-full"
            />
            <button type="submit" className="btn-primary w-full justify-center">
              <Icon name={isRegister ? 'plus' : 'check'} />
              {isRegister ? t('auth.register') : t('auth.login')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            <span className="text-[11px] text-muted">{t('auth.or')}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          </div>

          {/* Google */}
          <button onClick={handleGoogle} className="btn-secondary w-full justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          {/* Toggle mode */}
          <p className="text-center mt-5 text-xs text-muted">
            {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }} className="font-medium underline underline-offset-2 hover:text-accent transition-colors" style={{ color: 'var(--accent-from)' }}>
              {isRegister ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
