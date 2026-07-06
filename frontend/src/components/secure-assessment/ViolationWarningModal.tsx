'use client';

import { ShieldAlert, AlertTriangle, Lock, Clock } from 'lucide-react';

interface ViolationWarningModalProps {
  visible: boolean;
  violationCount: number;
  maxViolations: number;
  message: string;
  isLocked: boolean;
  onDismiss: () => void;
  onReturnToDashboard?: () => void;
  theme?: 'dark' | 'light';
}

export default function ViolationWarningModal({
  visible,
  violationCount,
  maxViolations,
  message,
  isLocked,
  onDismiss,
  onReturnToDashboard,
  theme = 'dark',
}: ViolationWarningModalProps) {
  if (!visible) return null;

  const warningNumber = Math.min(violationCount, maxViolations);
  const isLastWarning = violationCount === maxViolations - 1;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
    >
      <div className={`relative rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border ${
        isLocked
          ? 'bg-zinc-900 border-red-500/60'
          : isLastWarning
            ? 'bg-zinc-900 border-amber-500/60'
            : 'bg-zinc-900 border-orange-500/40'
      }`}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${
            isLocked
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            {isLocked ? (
              <Lock className="w-8 h-8 text-red-400" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            )}
          </div>

          <h2 className={`text-xl font-bold ${isLocked ? 'text-red-400' : 'text-amber-400'}`}>
            {isLocked ? 'Assessment Locked' : `Warning ${warningNumber} of ${maxViolations}`}
          </h2>

          <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-300'}`}>
            {message}
          </p>

          {!isLocked && (
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Violations: {violationCount} / {maxViolations}</span>
            </div>
          )}

          {isLocked ? (
            <div className="w-full space-y-3">
              <div className="bg-red-950/40 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-xs">
                  Your assessment has been locked for 30 minutes.
                </p>
              </div>
              <button
                onClick={() => onReturnToDashboard?.()}
                className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer"
            >
              I Understand — Return to Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
