'use client';

import { Shield, Monitor, AlertTriangle, Copy, MousePointer2, Keyboard, Eye, Clock, Save, Wifi } from 'lucide-react';

interface ExamInstructionsModalProps {
  visible: boolean;
  onStart: () => void;
  onCancel: () => void;
  theme?: 'dark' | 'light';
  problemTitle?: string;
}

export default function ExamInstructionsModal({
  visible,
  onStart,
  onCancel,
  theme = 'dark',
  problemTitle,
}: ExamInstructionsModalProps) {
  if (!visible) return null;

  const rules = [
    { icon: Monitor, text: 'Full Screen mode will be activated', color: 'text-indigo-400' },
    { icon: Eye, text: 'Tab switching and window focus are monitored', color: 'text-amber-400' },
    { icon: Copy, text: 'Copy and paste are disabled during the exam', color: 'text-red-400' },
    { icon: MousePointer2, text: 'Right-click is disabled', color: 'text-red-400' },
    { icon: Keyboard, text: 'Developer tools (F12, Ctrl+Shift+I) are blocked', color: 'text-red-400' },
    { icon: AlertTriangle, text: '3 violations will lock your assessment for 30 minutes', color: 'text-amber-400' },
    { icon: Save, text: 'Your work is auto-saved every 15 seconds', color: 'text-emerald-400' },
    { icon: Clock, text: 'Timer will display remaining assessment time', color: 'text-indigo-400' },
    { icon: Wifi, text: 'Stable internet connection is required throughout', color: 'text-cyan-400' },
  ];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className={`rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border max-h-[90vh] overflow-y-auto ${
        theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Secure Assessment Mode
            </h2>
            {problemTitle && (
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {problemTitle}
              </p>
            )}
          </div>
        </div>

        <div className={`rounded-xl border p-4 mb-6 ${
          theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/20 border-amber-500/15'
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'}`}>
              By starting this assessment, you agree to the monitoring rules below. 
              Violating the security policy will result in warnings and potential lockdown of your assessment.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mb-6">
          <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${
            theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'
          }`}>
            Assessment Rules
          </h3>
          {rules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                  theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/40 border-zinc-850'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${rule.color}`} />
                <span className={`text-xs ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {rule.text}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border cursor-pointer ${
              theme === 'light'
                ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
