import React, { useState } from 'react';

export const SecurityLock = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (password === 'Gagan@03') {
      setIsUnlocking(true);
      setError(false);
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface text-on-surface">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-sm flex flex-col items-center text-center p-6 bg-surface-container/90 backdrop-blur-xl rounded-3xl border border-outline-variant/30 shadow-2xl">
        {/* Shield / Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/40 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(78,222,163,0.3)]">
          <span className="material-symbols-outlined text-primary text-[32px]">lock</span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold text-base text-on-surface">SpendWise</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-semibold">Vault</span>
        </div>

        <h1 className="text-xl font-bold text-on-surface mb-2">
          Security Lock
        </h1>

        <p className="text-xs text-on-surface-variant mb-6 max-w-xs leading-relaxed">
          Enter your master password to access your daily expense tracker.
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex flex-col text-left gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
              MASTER PASSWORD
            </label>
            <div className={`relative flex items-center bg-surface-container-high rounded-xl border transition-all ${
              error ? 'border-error ring-1 ring-error' : 'border-outline-variant/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
            }`}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pl-3.5 pr-1 text-on-surface-variant hover:text-on-surface transition-colors flex items-center"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                className="w-full bg-transparent text-on-surface text-sm py-3 px-2 focus:outline-none placeholder:text-on-surface-variant"
              />
            </div>
            {error && (
              <span className="text-[11px] text-error pl-1 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">error</span>
                Incorrect password. Please try again.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-bold text-sm shadow-[0_4px_20px_rgba(78,222,163,0.3)] hover:shadow-[0_4px_28px_rgba(78,222,163,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isUnlocking ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Unlocking Vault...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <span>Unlock Vault</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
          <span>Protected with Client-Side Authentication Gate</span>
        </div>
      </div>
    </div>
  );
};
