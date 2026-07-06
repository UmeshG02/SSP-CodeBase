'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Lock, Unlock, Save, Play, Shield, X } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: Lock,
  info: Shield,
};

const colors = {
  success: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', title: 'text-emerald-300' },
  warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', icon: 'text-amber-400', title: 'text-amber-300' },
  error: { border: 'border-red-500/30', bg: 'bg-red-500/10', icon: 'text-red-400', title: 'text-red-300' },
  info: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', icon: 'text-indigo-400', title: 'text-indigo-300' },
};

export function createNotification(type: NotificationType, title: string, message?: string): Notification {
  return { id: Math.random().toString(36).substring(2, 9), type, title, message };
}

export default function NotificationToast({ notification, onDismiss }: { notification: Notification; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[notification.type];
  const color = colors[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-[1000] transition-all duration-300 max-w-sm ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-xl border ${color.border} ${color.bg} backdrop-blur-md p-4 shadow-lg`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 shrink-0 ${color.icon}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${color.title}`}>{notification.title}</p>
            {notification.message && (
              <p className="text-xs text-zinc-400 mt-0.5">{notification.message}</p>
            )}
          </div>
          <button
            onClick={() => { setVisible(false); setTimeout(() => onDismiss(notification.id), 300); }}
            className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
