'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { apiFetch } from '@/utils/api';
import { 
  Code, Database, Play, CheckCircle, AlertTriangle, Sparkles, 
  ArrowLeft, Trophy, Award, Flame, Sun, Moon,
  MessageSquare, History, Lock, Send, User, ShieldAlert, Shield, ShieldCheck
} from 'lucide-react';

interface Params {
  slug: string;
}

// Helper to parse inline backticks like `code`
const parseInlineCode = (text: string, theme: 'dark' | 'light') => {
  const segments = text.split('`');
  return segments.map((seg, i) => {
    if (i % 2 !== 0) {
      return (
        <code key={i} className={`px-1 py-0.5 rounded font-mono text-[11px] border ${
          theme === 'light'
            ? 'text-indigo-800 bg-indigo-50 border-indigo-200/60 font-semibold'
            : 'text-indigo-400 bg-indigo-950/40 border-indigo-500/10'
        }`}>
          {seg}
        </code>
      );
    }
    return seg;
  });
};

const renderMarkdown = (text: string, theme: 'dark' | 'light') => {
  if (!text) return null;
  
  // Split by code blocks ```
  const parts = text.split('```');
  return parts.map((part, index) => {
    // Odd indices are code blocks
    if (index % 2 !== 0) {
      const cleanCode = part.replace(/^(json|javascript|python|cpp|java|typescript)\n/, '').trim();
      return (
        <pre key={index} className={`p-3 rounded-lg text-xs font-mono overflow-x-auto my-3 select-text border ${
          theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900 font-medium' : 'bg-zinc-900/60 border-zinc-850 text-zinc-300'
        }`}>
          {cleanCode}
        </pre>
      );
    }

    // Even indices are standard markdown lines
    const lines = part.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      
      // Headers: ###
      if (trimmed.startsWith('###')) {
        const headingText = trimmed.replace(/^###\s*/, '');
        return (
          <h3 key={`${index}-${lineIdx}`} className={`text-xs font-extrabold uppercase tracking-wider mt-6 mb-2.5 flex items-center gap-1.5 border-b pb-1.5 ${
            theme === 'light' ? 'text-zinc-900 border-zinc-200' : 'text-white border-zinc-900'
          }`}>
            {headingText}
          </h3>
        );
      }
      
      // Bullet list: -
      if (trimmed.startsWith('-')) {
        const listText = trimmed.replace(/^-\s*/, '');
        return (
          <li key={`${index}-${lineIdx}`} className={`ml-4 list-disc text-xs leading-relaxed py-0.5 font-sans ${
            theme === 'light' ? 'text-zinc-900' : 'text-zinc-300'
          }`}>
            {parseInlineCode(listText, theme)}
          </li>
        );
      }

      // Standard paragraph
      if (trimmed === '') {
        return <div key={`${index}-${lineIdx}`} className="h-2" />;
      }

      return (
        <p key={`${index}-${lineIdx}`} className={`text-xs leading-relaxed font-sans py-0.5 ${
          theme === 'light' ? 'text-zinc-900' : 'text-zinc-300'
        }`}>
          {parseInlineCode(line, theme)}
        </p>
      );
    });
  });
};

const parseRuntimeError = (rawErr: string) => {
  const clean = rawErr.replace(/^ERR:\s*/, '').trim();
  
  // Find error type
  let type = 'Runtime Error';
  const match = clean.match(/([a-zA-Z]+Error):/);
  if (match) {
    type = match[1];
  } else if (clean.includes('Segmentation fault')) {
    type = 'Segmentation Fault';
  } else if (clean.includes('division by zero') || clean.includes('ZeroDivisionError')) {
    type = 'Division By Zero';
  } else if (clean.includes('SyntaxError')) {
    type = 'SyntaxError';
  }

  // Find line number where it happened
  let lineInfo = '';
  const pyLineMatch = clean.match(/line\s+(\d+)/i);
  if (pyLineMatch) {
    lineInfo = `Line ${pyLineMatch[1]}`;
  } else {
    const jsLineMatch = clean.match(/:(\d+):\d+/);
    if (jsLineMatch) {
      lineInfo = `Line ${jsLineMatch[1]}`;
    }
  }

  return { type, message: clean, lineInfo };
};

export default function ChallengeWorkspace({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { slug } = use(params);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Challenge workspace states
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [sqlQuery, setSqlQuery] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [aiHint, setAiHint] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [allChallenges, setAllChallenges] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Left Pane Tabs
  const [activeTab, setActiveTab] = useState('problem');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Console Tabs for testcases
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  // ── Exam Secure Mode ────────────────────────────────────────────────────────
  const [secureMode, setSecureMode] = useState(false);
  const [examConfig, setExamConfig] = useState<any>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  const [examLocked, setExamLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number | null>(null);
  const violationCountRef = useRef(0);
  const examConfigRef = useRef<any>(null);
  const secureModeRef = useRef(false);
  const problemRef = useRef<any>(null);

  // Lockout Timer Countdown Hook
  useEffect(() => {
    if (lockTimeRemaining === null || lockTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setExamLocked(false);
          localStorage.removeItem(`ssp_exam_lock_${slug}`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockTimeRemaining, slug]);
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Read theme preference
    const savedTheme = localStorage.getItem('ssp_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }

    async function loadProblem() {
      try {
        const data = await apiFetch(`/challenges/${slug}`);
        setProblem(data);
        problemRef.current = data;
        
        let initialLang = 'javascript';
        try {
          const userProfile = await apiFetch('/profile');
          if (userProfile && userProfile.prefLang) {
            const pref = userProfile.prefLang.toLowerCase();
            if (['python', 'javascript', 'java', 'cpp', 'typescript'].includes(pref)) {
              initialLang = pref;
              setLanguage(pref);
            }
          }
        } catch (e) {
          console.error('Failed to load user language preference:', e);
        }

        if (data.type === 'CODING' && data.templateCode) {
          const templates = JSON.parse(data.templateCode);
          setCode(templates[initialLang] || '');
        } else if (data.type === 'SQL') {
          setSqlQuery('-- Write your SQL query here\n');
        }

        const allChals = await apiFetch('/challenges');
        setAllChallenges(allChals);

        // Load exam config
        try {
          const config = await apiFetch('/challenges/secure-mode/config');
          setExamConfig(config);
          examConfigRef.current = config;
        } catch (e) {
          console.warn('Could not load exam config', e);
        }

        // Check if locked
        const lockExpires = localStorage.getItem(`ssp_exam_lock_${slug}`);
        if (lockExpires) {
          const remainingTime = parseInt(lockExpires, 10) - Date.now();
          if (remainingTime > 0) {
            setExamLocked(true);
            setLockTimeRemaining(Math.ceil(remainingTime / 1000));
            setViolationWarning(`Your assessment has been locked due to exam integrity violations. Please wait for the lockout timer to expire.`);
          } else {
            localStorage.removeItem(`ssp_exam_lock_${slug}`);
          }
        }
      } catch (err) {
        console.warn('Failed to load problem:', err);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
    setShowSuccessModal(false);
    setActiveTab('problem');
    setAiHint('');
    setOutput(null);
    setSelectedTestCaseIdx(0);
  }, [slug, router]);

  const fetchAIHint = async () => {
    setHintLoading(true);
    try {
      const data = await apiFetch(`/challenges/${slug}/hint`, {
        method: 'POST',
        body: { code, language }
      });
      if (data && data.hint) {
        setAiHint(data.hint);
      } else {
        setAiHint('Try breaking the problem down into smaller helper functions and checking for boundary edge conditions.');
      }
    } catch (e) {
      setAiHint('Consider using a dictionary or hash map to keep track of elements you have already visited. This can help reduce your time complexity.');
    } finally {
      setHintLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ssp_theme', nextTheme);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (problem && problem.templateCode) {
      const templates = JSON.parse(problem.templateCode);
      setCode(templates[lang] || '');
    }
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (tab === 'submissions') {
      try {
        const data = await apiFetch(`/challenges/${slug}/submissions`);
        setSubmissions(data);
      } catch (e) {
        console.error('Failed to load submissions:', e);
      }
    } else if (tab === 'leaderboard') {
      try {
        const data = await apiFetch(`/challenges/${slug}/leaderboard`);
        setLeaderboard(data);
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
      }
    } else if (tab === 'discussions') {
      try {
        const data = await apiFetch(`/challenges/${slug}/comments`);
        setComments(data);
      } catch (e) {
        console.error('Failed to load comments:', e);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commenting) return;
    setCommenting(true);
    try {
      const res = await apiFetch(`/challenges/${slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      });
      setComments(prev => [res, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setCommenting(false);
    }
  };

  // ── Secure Mode Helpers ─────────────────────────────────────────────────────
  const getBrowserInfo = () => {
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
  };

  const handleViolation = useCallback(async (type: string, details?: string) => {
    if (!secureModeRef.current || examLocked) return;

    const config = examConfigRef.current;
    const maxV = config?.maxViolations ?? 3;
    const newCount = violationCountRef.current + 1;
    violationCountRef.current = newCount;
    setViolationCount(newCount);

    // Log to backend
    try {
      const { browser, os } = getBrowserInfo();
      await apiFetch('/challenges/secure-mode/violation', {
        method: 'POST',
        body: JSON.stringify({
          problemId: problemRef.current?.id ?? '',
          violationType: type,
          details: details ?? type,
          totalCount: newCount,
          browser,
          os,
        }),
      });
    } catch (_) {}

    if (newCount >= maxV) {
      // Auto-submit and lock
      const reason = `Auto-submitted after ${newCount} exam security violations.`;
      setViolationWarning(config?.warningMsg3 ?? reason);
      setExamLocked(true);
      secureModeRef.current = false;
      setSecureMode(false);

      // Lockout duration configuration: 30 minutes
      const lockExpires = Date.now() + 30 * 60 * 1000;
      localStorage.setItem(`ssp_exam_lock_${slug}`, lockExpires.toString());
      setLockTimeRemaining(30 * 60);

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Auto submit current code
      try {
        const prob = problemRef.current;
        if (prob?.type === 'CODING') {
          await apiFetch(`/challenges/${prob.slug}/submit`, {
            method: 'POST',
            body: JSON.stringify({ code, language, autoSubmitted: true, autoSubmitReason: reason }),
          });
        } else if (prob?.type === 'SQL') {
          await apiFetch(`/challenges/${prob.slug}/submit-sql`, {
            method: 'POST',
            body: JSON.stringify({ query: sqlQuery, autoSubmitted: true, autoSubmitReason: reason }),
          });
        }
      } catch (_) {}
    } else if (newCount === maxV - 1) {
      setViolationWarning(
        config?.warningMsg2 ?? `Warning ${newCount} of ${maxV}: One more violation will auto-submit your assessment.`
      );
    } else {
      setViolationWarning(
        config?.warningMsg1 ?? `Warning ${newCount} of ${maxV}: You have left the exam window. Please return immediately.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examLocked, code, language, sqlQuery]);

  // Listen for browser events when secure mode is active
  useEffect(() => {
    if (!secureMode) return;

    const onVisibilityChange = () => {
      if (document.hidden) handleViolation('TAB_SWITCH', 'User switched tab or minimized browser');
    };
    const onBlur = () => {
      if (secureModeRef.current) handleViolation('WINDOW_BLUR', 'Browser window lost focus');
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && secureModeRef.current) {
        handleViolation('EXIT_FULLSCREEN', 'User exited fullscreen');
      }
    };
    const onContextMenu = (e: MouseEvent) => {
      if (secureModeRef.current) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!secureModeRef.current) return;
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        handleViolation('DEVTOOLS', 'Attempted to open DevTools');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [secureMode, handleViolation]);

  const startSecureMode = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (_) {}
    setViolationCount(0);
    violationCountRef.current = 0;
    setViolationWarning(null);
    setExamLocked(false);
    secureModeRef.current = true;
    setSecureMode(true);
  };

  const exitSecureMode = () => {
    secureModeRef.current = false;
    setSecureMode(false);
    setViolationWarning(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const handleRun = async () => {
    if (running || examLocked) return;
    setRunning(true);
    setOutput(null);
    setSelectedTestCaseIdx(0);

    try {
      let res;
      if (problem.type === 'CODING') {
        res = await apiFetch(`/challenges/${problem.slug}/submit`, {
          method: 'POST',
          body: JSON.stringify({
            code,
            language,
          }),
        });
      } else {
        res = await apiFetch(`/challenges/${problem.slug}/submit-sql`, {
          method: 'POST',
          body: JSON.stringify({
            query: sqlQuery,
          }),
        });
      }

      setOutput(res);

      if (res.status === 'ACCEPTED') {
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Execution failed:', err);
      setOutput({
        status: 'COMPILE_ERROR',
        message: err.message || 'Network evaluation failure',
        testCases: [],
      });
    } finally {
      setRunning(false);
    }
  };

  const handleNextQuestion = (nextSlug: string) => {
    setShowSuccessModal(false);
    router.push(`/challenges/${nextSlug}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light' ? 'bg-zinc-50' : 'bg-zinc-950'
      }`}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'light' ? 'bg-zinc-50 text-zinc-950' : 'bg-zinc-950 text-zinc-100'
    }`}>

      {/* ── Violation Warning Overlay ── */}
      {violationWarning && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
        >
          <div className="relative bg-zinc-900 border border-red-500/60 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-400">Security Violation Detected</h2>
              <p className="text-zinc-300 text-sm leading-relaxed">{violationWarning}</p>
              {!examLocked && (
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Violations: {violationCount} / {examConfig?.maxViolations ?? 3}</span>
                </div>
              )}
              {examLocked ? (
                <div className="w-full space-y-3">
                  <div className="bg-red-950/40 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-300 text-xs">Your assessment has been locked and auto-submitted.</p>
                    {lockTimeRemaining !== null && (
                      <p className="text-red-400 font-mono text-sm font-bold mt-2">
                        Lockout Time Remaining: {Math.floor(lockTimeRemaining / 60)}m {lockTimeRemaining % 60}s
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setViolationWarning(null); router.push('/dashboard'); }}
                    className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-medium text-white transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setViolationWarning(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-colors"
                >
                  I Understand — Return to Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className={`border-b h-14 flex items-center justify-between z-20 px-6 ${
        theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-zinc-950'
      }`}>
        <div className="flex items-center gap-4">
          {!secureMode && (
            <Link href="/dashboard" className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              theme === 'light' ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900' : 'border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white'
            }`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Challenges</span>
            <span className="text-zinc-700">/</span>
            <span className={`font-bold text-sm ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{problem?.title}</span>
          </div>

          {/* Secure Mode Status Badge */}
          {secureMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Mode
              <span className="text-amber-400 ml-1">({violationCount}/{examConfig?.maxViolations ?? 3} violations)</span>
            </div>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {problem?.type === 'CODING' && !examLocked && (
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 border ${
                theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-zinc-800' : 'bg-zinc-900 border-zinc-850 text-white'
              }`}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
            </select>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              theme === 'light'
                ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950'
                : 'border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Secure Mode Toggle */}
          {!examLocked && (
            secureMode ? (
              <button
                onClick={exitSecureMode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Exit Secure Mode
              </button>
            ) : (
              <button
                onClick={startSecureMode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                Secure Mode
              </button>
            )
          )}

          <button
            onClick={handleRun}
            disabled={running || examLocked}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 transition-all text-xs font-bold rounded-lg text-white cursor-pointer"
          >
            {running ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Submit Solution</span>
          </button>
        </div>
      </header>

      {/* Pane Layout Split */}
      <div className={`flex-grow grid lg:grid-cols-2 overflow-hidden h-[calc(100vh-56px)] ${
        theme === 'light' ? 'bg-zinc-50' : 'bg-zinc-950'
      }`}>
        
        {/* Left Pane: Tab System */}
        <div className={`border-r flex flex-col h-full overflow-hidden ${
          theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-zinc-950/20'
        }`}>
          {/* Tab Selection Headers */}
          <div className={`flex border-b shrink-0 ${
            theme === 'light' ? 'border-zinc-200 bg-zinc-100/50' : 'border-zinc-900 bg-zinc-950/80'
          }`}>
            {[
              { id: 'problem', label: 'Problem', icon: Code },
              { id: 'submissions', label: 'Submissions', icon: History },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'discussions', label: 'Discussions', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? theme === 'light'
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                        : 'border-indigo-500 text-indigo-400 bg-indigo-50/5'
                      : theme === 'light'
                        ? 'border-transparent text-zinc-500 hover:text-zinc-800'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents scrollable container */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            
            {/* Tab: Problem description */}
            {activeTab === 'problem' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      problem?.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      problem?.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {problem?.difficulty}
                    </span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-xs text-indigo-500 font-extrabold">+{problem?.points} ⚡</span>
                  </div>

                  <h1 className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>{problem?.title}</h1>

                  <div className="space-y-1 select-text">
                    {renderMarkdown(problem?.description, theme)}
                  </div>
                </div>

                {/* AI Helper drawer */}
                <div className={`p-4 rounded-xl border space-y-3 mt-6 ${
                  theme === 'light' ? 'bg-indigo-50/55 border-indigo-200' : 'bg-indigo-950/20 border-indigo-500/15'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-indigo-500 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Interview Hints</span>
                    </h4>
                    <button
                      onClick={fetchAIHint}
                      disabled={hintLoading}
                      className="text-[10px] bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/25 px-2.5 py-1 rounded text-indigo-400 font-bold transition-all cursor-pointer"
                    >
                      {hintLoading ? 'Loading Hint...' : 'Ask AI Coach'}
                    </button>
                  </div>
                  {aiHint && (
                    <p className={`text-xs leading-relaxed font-mono p-3 rounded-lg border ${
                      theme === 'light' ? 'bg-white border-indigo-200 text-indigo-900' : 'bg-zinc-950/40 border-indigo-500/10 text-indigo-200/90'
                    }`}>
                      {aiHint}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Tab: User Submissions History */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>Your Submission History</h3>
                <div className="space-y-2.5">
                  {submissions.map((sub: any) => (
                    <div key={sub.id} className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                      theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-850 text-zinc-300'
                    }`}>
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-[4px] font-extrabold text-[10px] ${
                          sub.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {sub.status}
                        </span>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1.5">{new Date(sub.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right text-zinc-400 font-mono">
                        <p>Lang: {sub.language}</p>
                        <p className="text-[10px] text-zinc-500">{sub.runtime}ms • {sub.memory}KB</p>
                      </div>
                    </div>
                  ))}

                  {submissions.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-6">You have not submitted any solutions for this challenge yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Leaderboard */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>Top Solutions</h3>
                <div className="divide-y divide-zinc-850">
                  {leaderboard.map((sub: any, index: number) => {
                    const prof = sub.user?.profile;
                    return (
                      <div key={sub.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center font-extrabold text-zinc-500">{index + 1}</span>
                          <div className="w-7 h-7 rounded-full bg-zinc-850 overflow-hidden flex items-center justify-center border border-zinc-800">
                            {prof?.avatarUrl ? <img src={prof.avatarUrl} alt="" className="w-full h-full" /> : <User className="w-4 h-4 text-zinc-600" />}
                          </div>
                          <div>
                            <p className={`font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof?.name || 'User'}</p>
                            <p className="text-[10px] text-zinc-500">@{prof?.username}</p>
                          </div>
                        </div>
                        <div className="text-right font-mono text-zinc-400">
                          <p className="text-indigo-400 font-extrabold">{sub.runtime} ms</p>
                          <p className="text-[10px] text-zinc-500">{sub.memory} KB</p>
                        </div>
                      </div>
                    );
                  })}

                  {leaderboard.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-6">No solutions recorded for this challenge yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Discussions */}
            {activeTab === 'discussions' && (
              <div className="space-y-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>Discussion Board</h3>

                {/* Comment Posting Input */}
                <form onSubmit={handleAddComment} className={`flex gap-2 border rounded-xl p-2.5 ${
                  theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-850'
                }`}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Join the discussion... write a comment"
                    className={`flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-xs px-2 focus:ring-transparent ${
                      theme === 'light' ? 'text-zinc-900' : 'text-white'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={commenting || !newComment.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Comments Thread list */}
                <div className="space-y-4">
                  {comments.map((c: any) => {
                    const prof = c.user?.profile;
                    return (
                      <div key={c.id} className={`p-3.5 rounded-xl border space-y-2 ${
                        theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-850'
                      }`}>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            {prof?.avatarUrl ? <img src={prof.avatarUrl} alt="" className="w-full h-full" /> : <User className="w-3.5 h-3.5 text-zinc-600" />}
                          </div>
                          <div>
                            <span className={`font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof?.name}</span>
                            <span className="text-zinc-500 ml-1.5">@{prof?.username}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={`text-xs leading-relaxed font-sans ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'}`}>{c.content}</p>
                      </div>
                    );
                  })}

                  {comments.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-6">Be the first to leave a comment on this problem!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Workspace Editor & Terminal Console */}
        <div className="flex flex-col overflow-hidden">
          {/* Workspace Input area */}
          <div className="flex-grow min-h-[50%] relative">
            {problem?.type === 'CODING' ? (
              <Editor
                height="100%"
                language={language}
                theme={theme === 'light' ? 'light' : 'vs-dark'}
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 22,
                  scrollbar: { verticalScrollbarSize: 8 },
                  padding: { top: 12 },
                }}
              />
            ) : (
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className={`w-full h-full p-4 font-mono text-sm border-none outline-none resize-none focus:ring-0 ${
                  theme === 'light' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
                }`}
                placeholder="-- Write your SQL query here..."
              />
            )}
          </div>

          {/* Bottom Pane: Compilation / SQL Output Console */}
          <div className={`h-[40%] border-t p-5 overflow-y-auto space-y-4 flex flex-col justify-between ${
            theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-zinc-950'
          }`}>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Console Terminal</h4>

            {running ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-xs text-zinc-400 font-mono animate-pulse">
                  Running evaluation test cases...
                </p>
              </div>
            ) : output ? (
              <div className="space-y-4 flex-grow flex flex-col justify-between">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    {output.status === 'ACCEPTED' ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-xs font-bold animate-pulse">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{output.status}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{output.status}</span>
                      </span>
                    )}
                    {output.runtime && <span className="text-xs text-zinc-500">Runtime: {output.runtime}ms</span>}
                    {output.memory && <span className="text-xs text-zinc-500">Memory: {output.memory}KB</span>}
                  </div>
                  <span className={`text-xs font-mono max-w-md truncate ${
                    theme === 'light' ? 'text-rose-700 font-semibold' : 'text-rose-400'
                  }`}>{output.message}</span>
                </div>

                {/* Compilation or Empty Testcases log block */}
                {(!output.testCases || output.testCases.length === 0) && (
                  <div className={`p-4 rounded-xl border font-mono text-xs leading-relaxed overflow-auto max-h-[150px] flex-grow ${
                    theme === 'light'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-950/20 border-rose-500/10 text-rose-300'
                  }`}>
                    <pre className="whitespace-pre-wrap">{output.message || 'Execution error occurred.'}</pre>
                  </div>
                )}

                {/* HackerRank-style Test Cases selectors */}
                {output.testCases && output.testCases.length > 0 && (
                  <div className="flex-grow flex flex-col overflow-hidden min-h-[140px] mt-2">
                    
                    {/* TestCase Tabs selectors */}
                    <div className={`flex gap-2 border-b overflow-x-auto pb-1.5 shrink-0 ${
                      theme === 'light' ? 'border-zinc-200' : 'border-zinc-850'
                    }`}>
                      {output.testCases.map((tc: any, index: number) => (
                        <button
                          key={tc.id || index}
                          onClick={() => setSelectedTestCaseIdx(index)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectedTestCaseIdx === index
                              ? theme === 'light'
                                ? 'bg-zinc-200/80 border border-zinc-300 text-zinc-800'
                                : 'bg-zinc-850 border border-zinc-700 text-white'
                              : theme === 'light'
                                ? 'bg-zinc-100 border border-transparent text-zinc-500 hover:text-zinc-800'
                                : 'bg-zinc-900 border border-transparent text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tc.passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span>
                            {tc.isSample ? `Sample Case ${index}` : `Test Case ${index}`}
                          </span>
                          {!tc.isSample && <Lock className="w-3 h-3 text-zinc-500" />}
                        </button>
                      ))}
                    </div>

                    {/* Selected TestCase details */}
                    <div className="flex-grow overflow-y-auto py-3 space-y-3">
                      {(() => {
                        const tc = output.testCases[selectedTestCaseIdx];
                        if (!tc) return null;

                        if (tc.isSample) {
                          if (tc.actual && (tc.actual.startsWith('ERR:') || tc.actual.startsWith('ERR '))) {
                            const errDetail = parseRuntimeError(tc.actual);
                            return (
                              <div className={`p-4 rounded-xl border space-y-3 ${
                                theme === 'light'
                                  ? 'bg-rose-50 border-rose-250 text-rose-950 shadow-sm'
                                  : 'bg-rose-950/20 border-rose-500/20 text-rose-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-rose-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{errDetail.type}</span>
                                  </h5>
                                  {errDetail.lineInfo && (
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                      theme === 'light' ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-rose-950 border-rose-800 text-rose-300'
                                    }`}>
                                      {errDetail.lineInfo}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold leading-normal font-sans">
                                  The execution of your code encountered an exception:
                                </p>
                                <pre className={`p-3 rounded-lg text-xs font-mono overflow-auto max-h-[140px] border whitespace-pre-wrap select-text ${
                                  theme === 'light'
                                    ? 'bg-white border-rose-200 text-rose-900'
                                    : 'bg-zinc-950 border-rose-950/50 text-rose-350'
                                }`}>
                                  {errDetail.message}
                                </pre>
                              </div>
                            );
                          }

                          return (
                            <div className="grid md:grid-cols-3 gap-3 text-xs font-mono">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Input</span>
                                <pre className={`p-2 border rounded-lg overflow-x-auto max-h-[80px] ${
                                  theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900 font-medium' : 'bg-zinc-900 border-zinc-850 text-zinc-300'
                                }`}>{tc.input}</pre>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Expected Output</span>
                                <pre className={`p-2 border rounded-lg overflow-x-auto max-h-[80px] ${
                                  theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-emerald-600 font-medium' : 'bg-zinc-900 border-zinc-850 text-emerald-400'
                                }`}>{tc.expected}</pre>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Your Output</span>
                                <pre className={`p-2 border rounded-lg overflow-x-auto max-h-[80px] ${
                                  tc.passed
                                    ? theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-emerald-600 font-medium' : 'bg-zinc-900 border-zinc-850 text-emerald-400'
                                    : theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-rose-600 font-medium' : 'bg-zinc-900 border-zinc-850 text-rose-400'
                                }`}>{tc.actual}</pre>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className={`p-3 border rounded-xl flex items-start gap-3 ${
                              theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-850' : 'bg-zinc-900/60 border-zinc-850 text-zinc-300'
                            }`}>
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div className="space-y-1">
                                <h5 className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'}`}>Hidden Testcase</h5>
                                <p className="text-[10px] text-zinc-500 leading-normal">
                                  This is a hidden test case used to evaluate your code edge conditions. Submitting inputs, expected outputs, and variable outcomes are masked for evaluation safety.
                                </p>
                                <p className="text-[10px] font-bold mt-2">
                                  Evaluation Result:{' '}
                                  <span className={tc.passed ? 'text-emerald-500' : 'text-rose-500'}>
                                    {tc.passed ? 'Passed ✓' : (tc.hasError ? 'Runtime Error ✗' : 'Wrong Answer ✗')}
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-xs text-zinc-500 font-mono">
                Click Submit Solution to execute test cases and review metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 text-center animate-float">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto">
              🎉
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Challenge Solved!</h3>
              <p className="text-sm text-zinc-400">
                Excellent job! You successfully solved "{problem?.title}" and earned{' '}
                <span className="text-indigo-400 font-extrabold">+{problem?.points} ⚡</span>.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {(() => {
                const currentIndex = allChallenges.findIndex((c) => c.slug === slug);
                const nextProblem =
                  currentIndex !== -1 && currentIndex < allChallenges.length - 1
                    ? allChallenges[currentIndex + 1]
                    : null;

                if (nextProblem) {
                  return (
                    <button
                      onClick={() => handleNextQuestion(nextProblem.slug)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-all font-bold rounded-xl text-white shadow-lg text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Next Challenge ({nextProblem.title})</span>
                    </button>
                  );
                } else {
                  return (
                    <div className="text-xs text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                      🏆 You have completed all today's challenges!
                    </div>
                  );
                }
              })()}

              <Link
                href="/dashboard"
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 transition-all font-semibold rounded-xl text-zinc-300 hover:text-white border border-zinc-800 text-sm block"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
