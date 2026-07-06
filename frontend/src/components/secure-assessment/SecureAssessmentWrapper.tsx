'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { apiFetch } from '@/utils/api';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useAutoSave } from '@/hooks/useAutoSave';
import ExamInstructionsModal from './ExamInstructionsModal';
import ViolationWarningModal from './ViolationWarningModal';
import AssessmentLockedScreen from './AssessmentLockedScreen';
import SecurityStatusPanel from './SecurityStatusPanel';
import NotificationToast, { createNotification, Notification as NotificationType } from './NotificationToast';

interface SecureAssessmentWrapperProps {
  problemId: string;
  problemSlug: string;
  problemTitle?: string;
  problemType?: string;
  children: ReactNode;
  getCode: () => string;
  getLanguage?: () => string;
  getCurrentQuestion?: () => number;
  theme?: 'dark' | 'light';
}

export default function SecureAssessmentWrapper({
  problemId,
  problemSlug,
  problemTitle,
  problemType,
  children,
  getCode,
  getLanguage = () => 'text',
  getCurrentQuestion = () => 1,
  theme = 'dark',
}: SecureAssessmentWrapperProps) {
  const [secureMode, setSecureMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [violationMessage, setViolationMessage] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [lockDuration, setLockDuration] = useState(30);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  const secureModeRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const addNotification = useCallback((type: NotificationType['type'], title: string, message?: string) => {
    const notif = createNotification(type, title, message);
    setNotifications(prev => [...prev, notif]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

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

  const handleViolation = useCallback(async (type: string, details?: string) => {
    if (!secureModeRef.current || isLocked) return;

    const newCount = violationCount + 1;
    setViolationCount(newCount);
    const maxV = maxViolations;

    const { browser, os } = getBrowserInfo();

    try {
      const result = await apiFetch('/secure-assessment/violation', {
        method: 'POST',
        body: {
          sessionId: sessionIdRef.current,
          problemId,
          violationType: type,
          details: details || type,
          totalCount: newCount,
          browser,
          os,
        },
      });

      if (result.locked) {
        setIsLocked(true);
        setShowWarning(false);
        secureModeRef.current = false;
        setSecureMode(false);
        addNotification('error', 'Assessment Locked', `Assessment locked due to ${maxV} violations.`);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        const remaining = await apiFetch(`/secure-assessment/remaining-lock-time/${sessionIdRef.current}`);
        setRemainingLockSeconds(remaining.remainingSeconds || 0);
        return;
      }

      const msg = newCount >= maxV - 1
        ? (newCount >= maxV
          ? `Your assessment has been locked due to ${maxV} violations.`
          : `Warning ${newCount} of ${maxV}: One final warning remains. Another violation will lock your assessment for 30 minutes.`)
        : `Warning ${newCount} of ${maxV}: You have left the secure assessment environment. Please return immediately.`;

      setViolationMessage(msg);
      setShowWarning(true);
      addNotification('warning', `Warning ${newCount}/${maxV}`, type.replace(/_/g, ' '));
    } catch (err) {
      console.error('Failed to record violation:', err);
    }
  }, [isLocked, violationCount, maxViolations, problemId, getBrowserInfo, addNotification]);

  const { getBrowserInfo: _getBrowserInfo } = useSecurityMonitor({
    enabled: secureMode,
    fullscreenRequired: true,
    tabSwitchEnabled: true,
    windowFocusDetection: true,
    copyPasteDisabled: true,
    rightClickDisabled: true,
    devToolsDisabled: true,
    onViolation: handleViolation,
    onFullscreenChange: (fs) => setIsFullscreen(fs),
    onFocusChange: (focused) => {
      setIsConnected(focused);
    },
  });

  const { lastSaved, saving: isAutoSaving, triggerSave } = useAutoSave({
    enabled: secureMode,
    sessionId,
    problemId,
    intervalMs: 15000,
    getContent: () => ({
      code: getCode(),
      language: getLanguage(),
      questionNumber: getCurrentQuestion(),
    }),
    onSaved: () => {
      addNotification('success', 'Auto Saved', 'Your work has been saved automatically.');
    },
  });

  const startAssessment = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (_) {}

    try {
      const session = await apiFetch('/secure-assessment/start', {
        method: 'POST',
        body: {
          problemId,
          maxViolations: 3,
          lockDuration: 30,
          totalQuestions: 1,
          currentCode: getCode(),
          currentLanguage: getLanguage(),
        },
      });
      setSessionId(session.id);
      sessionIdRef.current = session.id;
      setMaxViolations(session.maxViolations);
      setLockDuration(session.lockDuration);
      setViolationCount(0);
      setShowInstructions(false);
      secureModeRef.current = true;
      setSecureMode(true);
      setIsLocked(false);
      setRemainingLockSeconds(0);
      addNotification('info', 'Assessment Started', 'Secure mode is now active.');
    } catch (err) {
      console.error('Failed to start assessment:', err);
      addNotification('error', 'Failed to Start', 'Could not start secure assessment session.');
    }
  }, [problemId, getCode, getLanguage, addNotification]);

  const exitSecureMode = useCallback(() => {
    secureModeRef.current = false;
    setSecureMode(false);
    setShowInstructions(false);
    setShowWarning(false);
    setViolationMessage(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const resumeAssessment = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await apiFetch(`/secure-assessment/resume/${sessionId}`, { method: 'POST' });
      setViolationCount(result.violationCount || 0);
      setSecureMode(true);
      secureModeRef.current = true;
      setIsLocked(false);
      setRemainingLockSeconds(0);

      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (_) {}

      addNotification('info', 'Assessment Unlocked', 'You may now resume your assessment.');
    } catch (err: any) {
      console.error('Failed to resume:', err);
      addNotification('error', 'Cannot Resume', err.message || 'Failed to resume assessment.');
    }
  }, [sessionId, addNotification]);

  const handleReturnToDashboard = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  const checkLockStatus = useCallback(async () => {
    if (!sessionId) return;
    try {
      const status = await apiFetch(`/secure-assessment/remaining-lock-time/${sessionId}`);
      if (status.locked) {
        setIsLocked(true);
        setRemainingLockSeconds(status.remainingSeconds);
        secureModeRef.current = false;
        setSecureMode(false);
      } else if (status.expired) {
        setIsLocked(false);
        setRemainingLockSeconds(0);
        addNotification('info', 'Lock Expired', 'Your assessment lock period has expired.');
      }
    } catch (_) {}
  }, [sessionId, addNotification]);

  useEffect(() => {
    if (isLocked && remainingLockSeconds > 0) {
      const interval = setInterval(() => {
        setRemainingLockSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, remainingLockSeconds]);

  const [assessmentTimer, setAssessmentTimer] = useState<string>('');
  useEffect(() => {
    if (!secureMode || isLocked) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      setAssessmentTimer(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [secureMode, isLocked]);

  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Exam Instructions Modal */}
      <ExamInstructionsModal
        visible={showInstructions}
        onStart={startAssessment}
        onCancel={exitSecureMode}
        theme={theme}
        problemTitle={problemTitle}
      />

      {/* Violation Warning Modal */}
      <ViolationWarningModal
        visible={showWarning}
        violationCount={violationCount}
        maxViolations={maxViolations}
        message={violationMessage || ''}
        isLocked={false}
        onDismiss={() => setShowWarning(false)}
        onReturnToDashboard={handleReturnToDashboard}
        theme={theme}
      />

      {/* Assessment Locked Screen */}
      <AssessmentLockedScreen
        locked={isLocked}
        remainingSeconds={remainingLockSeconds}
        reason={`Maximum violations (${maxViolations}) reached.`}
        onUnlock={resumeAssessment}
        onReturnToDashboard={handleReturnToDashboard}
        theme={theme}
      />

      {/* Notifications */}
      {notifications.slice(-3).map(n => (
        <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
      ))}

      {/* Security Status Panel */}
      <SecurityStatusPanel
        secureMode={secureMode}
        violationCount={violationCount}
        maxViolations={maxViolations}
        isFullscreen={isFullscreen}
        isAutoSaving={isAutoSaving}
        lastSaved={lastSaved}
        isConnected={isConnected}
        assessmentTimer={assessmentTimer}
        currentQuestion={getCurrentQuestion()}
        theme={theme}
      />

      {/* Children with secure mode controls injected via render props / context */}
      {typeof children === 'function'
        ? (children as any)({
            secureMode,
            isLocked,
            violationCount,
            maxViolations,
            showInstructions: () => setShowInstructions(true),
            exitSecureMode,
            triggerSave,
            sessionId,
          })
        : children}
    </>
  );
}
