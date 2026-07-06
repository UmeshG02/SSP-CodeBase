'use client';

import { useState, useEffect } from 'react';
import { Lock, Clock, ShieldAlert, Unlock, AlertTriangle } from 'lucide-react';

interface AssessmentLockedScreenProps {
  locked: boolean;
  remainingSeconds: number;
  reason?: string;
  unlockTime?: string;
  onUnlock?: () => void;
  onReturnToDashboard?: () => void;
  theme?: 'dark' | 'light';
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AssessmentLockedScreen({
  locked,
  remainingSeconds: initialRemaining,
  reason,
  unlockTime,
  onUnlock,
  onReturnToDashboard,
  theme = 'dark',
}: AssessmentLockedScreenProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemaining);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setRemainingSeconds(initialRemaining);
    setExpired(initialRemaining <= 0);
  }, [initialRemaining]);

  useEffect(() => {
    if (!locked || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [locked, remainingSeconds]);

  if (!locked && !expired) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className="bg-zinc-900 border border-red-500/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-6">
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${
            expired
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            {expired ? (
              <Unlock className="w-10 h-10 text-emerald-400" />
            ) : (
              <Lock className="w-10 h-10 text-red-400" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className={`text-2xl font-black ${expired ? 'text-emerald-400' : 'text-red-400'}`}>
              {expired ? 'Assessment Unlocked' : 'Assessment Locked'}
            </h2>
            <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {expired
                ? 'You may now resume your assessment.'
                : (reason || 'For security reasons, your assessment has been temporarily locked because the maximum number of allowed violations has been reached.')
              }
            </p>
          </div>

          {!expired && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>Remaining lock time</span>
              </div>
              <div className="text-5xl font-mono font-black text-red-400 tracking-widest tabular-nums">
                {formatCountdown(remainingSeconds)}
              </div>
              {unlockTime && (
                <p className="text-xs text-zinc-500">
                  Expected unlock: {new Date(unlockTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {expired ? (
            <div className="w-full space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-emerald-300 text-xs">
                  The lock period has expired. You may continue with your assessment.
                </p>
              </div>
              <button
                onClick={onUnlock}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Resume Assessment
              </button>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div className="bg-red-950/40 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs text-left">
                  Repeated violations trigger longer lock periods. Please wait for the timer to expire or contact your administrator.
                </p>
              </div>
              <button
                onClick={onReturnToDashboard}
                className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
