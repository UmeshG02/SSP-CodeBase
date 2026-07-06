'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { apiFetch } from '@/utils/api';

interface AutoSaveConfig {
  enabled: boolean;
  sessionId: string | null;
  problemId: string;
  intervalMs?: number;
  getContent: () => { code: string; language?: string; questionNumber?: number };
  onSaved?: () => void;
  onError?: (err: any) => void;
}

export function useAutoSave(config: AutoSaveConfig) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const intervalRef = useRef<any>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const save = useCallback(async () => {
    const cfg = configRef.current;
    if (!cfg.enabled || !cfg.sessionId) return;

    setSaving(true);
    try {
      const content = cfg.getContent();
      await apiFetch('/secure-assessment/auto-save', {
        method: 'POST',
        body: {
          sessionId: cfg.sessionId,
          code: content.code,
          language: content.language,
          questionNumber: content.questionNumber,
        },
      });
      setLastSaved(new Date());
      setSaveCount(prev => prev + 1);
      cfg.onSaved?.();
    } catch (err) {
      console.error('Auto-save failed:', err);
      cfg.onError?.(err);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    const cfg = configRef.current;
    if (!cfg.enabled || !cfg.sessionId) return;

    intervalRef.current = setInterval(save, cfg.intervalMs || 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [save]);

  const triggerSave = useCallback(() => {
    save();
  }, [save]);

  return {
    lastSaved,
    saving,
    saveCount,
    triggerSave,
  };
}
