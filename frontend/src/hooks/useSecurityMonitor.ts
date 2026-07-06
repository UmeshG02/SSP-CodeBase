'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SecurityMonitorConfig {
  enabled: boolean;
  fullscreenRequired: boolean;
  tabSwitchEnabled: boolean;
  windowFocusDetection: boolean;
  copyPasteDisabled: boolean;
  rightClickDisabled: boolean;
  devToolsDisabled: boolean;
  onViolation: (type: string, details?: string) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onFocusChange?: (hasFocus: boolean) => void;
}

export function useSecurityMonitor(config: SecurityMonitorConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const getBrowserInfo = useCallback(() => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    let osName = 'Unknown';
    if (ua.includes('Windows')) osName = 'Windows';
    else if (ua.includes('Mac')) osName = 'macOS';
    else if (ua.includes('Linux')) osName = 'Linux';
    else if (ua.includes('Android')) osName = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';
    return { browser, os: osName };
  }, []);

  useEffect(() => {
    const { enabled } = configRef.current;
    if (!enabled) return;

    const handleVisibilityChange = () => {
      const cfg = configRef.current;
      if (!cfg.enabled || !cfg.tabSwitchEnabled) return;
      if (document.hidden) {
        cfg.onViolation('TAB_SWITCH', 'User switched tab or minimized browser');
      }
    };

    const handleWindowBlur = () => {
      const cfg = configRef.current;
      if (!cfg.enabled || !cfg.windowFocusDetection) return;
      cfg.onViolation('WINDOW_BLUR', 'Browser window lost focus');
      cfg.onFocusChange?.(false);
    };

    const handleWindowFocus = () => {
      const cfg = configRef.current;
      cfg.onFocusChange?.(true);
    };

    const handleFullscreenChange = () => {
      const cfg = configRef.current;
      const isFullscreen = !!document.fullscreenElement;
      cfg.onFullscreenChange?.(isFullscreen);
      if (!isFullscreen && cfg.fullscreenRequired && cfg.enabled) {
        cfg.onViolation('EXIT_FULLSCREEN', 'User exited fullscreen mode');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const cfg = configRef.current;
      if (cfg.enabled && cfg.rightClickDisabled) {
        e.preventDefault();
        cfg.onViolation('RIGHT_CLICK', 'User attempted right-click');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const cfg = configRef.current;
      if (cfg.enabled && cfg.copyPasteDisabled) {
        e.preventDefault();
        cfg.onViolation('COPY_ATTEMPT', 'User attempted to copy');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const cfg = configRef.current;
      if (cfg.enabled && cfg.copyPasteDisabled) {
        e.preventDefault();
        cfg.onViolation('PASTE_ATTEMPT', 'User attempted to paste');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const cfg = configRef.current;
      if (!cfg.enabled || !cfg.devToolsDisabled) return;
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        cfg.onViolation('DEVTOOLS', 'Attempted to open DevTools');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const cfg = configRef.current;
      if (cfg.enabled) {
        cfg.onViolation('PAGE_REFRESH', 'User attempted to refresh or navigate away');
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return { getBrowserInfo };
}
