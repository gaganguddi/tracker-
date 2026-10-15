import React, { useState } from 'react';

const APP_PIN = '1976';

export const AppLock = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (pin === APP_PIN) {
      setPin('');
      setError('');
      onUnlock();
      return;
    }
    setPin('');
    setError('Incorrect lock code.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface px-5">
      <form onSubmit={submit} className="w-full max-w-xs rounded-2xl border border-outline-variant/40 bg-surface-container p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <span className="material-symbols-outlined text-[26px]">lock</span>
        </div>
        <h1 className="text-lg font-bold text-on-surface">App locked</h1>
        <p className="mt-1 text-xs text-on-surface-variant">Enter your 4-digit code to continue.</p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength="4"
          value={pin}
          onChange={(event) => {
            setPin(event.target.value.replace(/\D/g, ''));
            setError('');
          }}
          aria-label="Lock code"
          className="mt-5 w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-3 py-3 text-center text-2xl tracking-[0.55em] text-on-surface outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-xs text-error">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary">
          Unlock
        </button>
        <p className="mt-4 text-[10px] text-on-surface-variant">This app locks after 30 minutes of inactivity.</p>
      </form>
    </div>
  );
};
