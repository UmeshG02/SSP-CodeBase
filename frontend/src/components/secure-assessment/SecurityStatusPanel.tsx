'use client';

import { Shield, ShieldCheck, ShieldAlert, Clock, Save, Wifi, Monitor, AlertTriangle } from 'lucide-react';

interface SecurityStatusPanelProps {
  secureMode: boolean;
  violationCount: number;
  maxViolations: number;
  isFullscreen: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  isConnected: boolean;
  assessmentTimer?: string;
  currentQuestion?: number;
  theme?: 'dark' | 'light';
}

export default function SecurityStatusPanel({
  secureMode,
  violationCount,
  maxViolations,
  isFullscreen,
  isAutoSaving,
  lastSaved,
  isConnected,
  assessmentTimer,
  currentQuestion,
  theme = 'dark',
}: SecurityStatusPanelProps) {
  if (!secureMode) return null;

  const warningsLeft = maxViolations - violationCount;
  const isLocked = violationCount >= maxViolations;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md text-xs ${
      theme === 'light'
        ? 'bg-white/90 border-zinc-200 text-zinc-700'
        : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
    }`}>
      {/* Secure Mode Status */}
      <div className="flex items-center gap-1.5">
        {isLocked ? (
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className={`font-semibold ${isLocked ? 'text-red-400' : 'text-emerald-400'}`}>
          {isLocked ? 'Locked' : 'Secure'}
        </span>
      </div>

      <div className="w-px h-4 bg-zinc-700" />

      {/* Timer */}
      {assessmentTimer && (
        <>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span className="font-mono tabular-nums">{assessmentTimer}</span>
          </div>
          <div className="w-px h-4 bg-zinc-700" />
        </>
      )}

      {/* Full Screen */}
      <div className="flex items-center gap-1">
        <Monitor className={`w-3 h-3 ${isFullscreen ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className={`${isFullscreen ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isFullscreen ? 'FS' : 'No FS'}
        </span>
      </div>

      <div className="w-px h-4 bg-zinc-700" />

      {/* Warnings */}
      <div className={`flex items-center gap-1 font-bold ${
        warningsLeft <= 1 ? 'text-red-400' : warningsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400'
      }`}>
        <AlertTriangle className="w-3 h-3" />
        <span>{violationCount}/{maxViolations}</span>
      </div>

      <div className="w-px h-4 bg-zinc-700" />

      {/* Auto Save */}
      <div className="flex items-center gap-1">
        <Save className={`w-3 h-3 ${isAutoSaving ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
        <span className={isAutoSaving ? 'text-indigo-400' : 'text-zinc-500'}>
          {isAutoSaving ? 'Saving...' : (lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Ready')}
        </span>
      </div>

      {/* Connection */}
      <div className="w-px h-4 bg-zinc-700" />
      <div className="flex items-center gap-1">
        <Wifi className={`w-3 h-3 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`} />
        <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Question Number */}
      {currentQuestion !== undefined && (
        <>
          <div className="w-px h-4 bg-zinc-700" />
          <span className="text-zinc-500">Q{currentQuestion}</span>
        </>
      )}
    </div>
  );
}
