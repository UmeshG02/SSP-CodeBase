'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import { CheckCircle2, Circle, Code, Database, Compass, Check, AlertCircle, ArrowLeft, Lightbulb, MessageSquare } from 'lucide-react';

export default function DayWorkspace() {
  const router = useRouter();
  const { id } = useParams();

  const [dayInfo, setDayInfo] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auxiliary forms states
  const [aptSelected, setAptSelected] = useState<string>('');
  const [puzAnswer, setPuzAnswer] = useState<string>('');
  const [intAnswer, setIntAnswer] = useState<string>('');
  
  // Submission feedback
  const [submittingApt, setSubmittingApt] = useState(false);
  const [submittingPuz, setSubmittingPuz] = useState(false);
  const [submittingInt, setSubmittingInt] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: string]: { status: 'success' | 'error', msg: string } }>({});

  const [codingDifficultyTab, setCodingDifficultyTab] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');

  const loadData = async () => {
    try {
      const data = await apiFetch(`/roadmap/days/${id}`);
      setDayInfo(data.day);
      setProblems(data.problems);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load day workspace:', err);
      setError(err.message || 'Access Denied: This day is currently locked.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleAuxSubmit = async (slug: string, value: string, type: 'apt' | 'puz' | 'int') => {
    if (!value.trim()) return;

    if (type === 'apt') setSubmittingApt(true);
    if (type === 'puz') setSubmittingPuz(true);
    if (type === 'int') setSubmittingInt(true);

    try {
      const res = await apiFetch(`/challenges/${slug}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          code: value,
          language: 'text',
        }),
      });

      if (res.submission && res.submission.status === 'ACCEPTED') {
        setFeedback(prev => ({
          ...prev,
          [slug]: { status: 'success', msg: 'Correct! Well done.' },
        }));
        // reload solved list states
        loadData();
      } else {
        setFeedback(prev => ({
          ...prev,
          [slug]: { status: 'error', msg: type === 'int' ? 'Response too short. Explain in at least 10 characters.' : 'Incorrect answer. Try again!' },
        }));
      }
    } catch (err: any) {
      setFeedback(prev => ({
        ...prev,
        [slug]: { status: 'error', msg: err.message || 'Submission error' },
      }));
    } finally {
      if (type === 'apt') setSubmittingApt(false);
      if (type === 'puz') setSubmittingPuz(false);
      if (type === 'int') setSubmittingInt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Access Denied</h3>
        <p className="text-xs text-zinc-400 max-w-sm text-center">{error}</p>
        <Link href="/dashboard" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Filter problems by type
  const codingProblems = problems.filter(p => p.type === 'CODING');
  const sqlProblem = problems.find(p => p.type === 'SQL');
  const aptProblem = problems.find(p => p.type === 'APTITUDE');
  const intProblem = problems.find(p => p.type === 'INTERVIEW');
  const puzProblem = problems.find(p => p.type === 'PUZZLE');

  const filteredCoding = codingProblems.filter(p => p.difficulty === codingDifficultyTab);

  // Calculate completion percentage
  const totalTasks = problems.length;
  const completedTasks = problems.filter(p => p.solved).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400">Week {dayInfo.weekNumber}</span>
            <span className="text-zinc-700">•</span>
            <span className="text-xs font-bold text-zinc-400">Day {dayInfo.dayNumber}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 grid md:grid-cols-3 gap-8 flex-grow">
        
        {/* Left 2 Cols: Main Activities Checklist */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Day Intro & Objectives */}
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">{dayInfo.title}</h1>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 space-y-2">
              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Learning Objectives</h5>
              <ul className="space-y-1">
                {dayInfo.objectives.map((obj: string, index: number) => (
                  <li key={index} className="text-xs text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Progress bar */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/30 to-zinc-900 border border-zinc-850 flex items-center justify-between gap-6">
            <div className="flex-grow space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white">Daily Progress</span>
                <span className="text-indigo-400">{completedTasks} / {totalTasks} Tasks ({completionPercentage}%)</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-550"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Activities Selection Checklist */}
          <div className="space-y-6">
            
            {/* 1. Daily Coding Challenges */}
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Coding Challenges (10 total)</span>
              </h3>

              {/* Tabs for Difficulty levels */}
              <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-850 self-start w-max">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCodingDifficultyTab(tab)}
                    className={`px-3 py-1 rounded text-[10px] font-black tracking-wide cursor-pointer transition-all ${
                      codingDifficultyTab === tab
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tasks List */}
              <div className="grid gap-2.5">
                {filteredCoding.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {p.solved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-700 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white leading-none">{p.title}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Difficulty: {p.difficulty} • +{p.points} ⚡</p>
                      </div>
                    </div>

                    <Link
                      href={`/challenges/${p.slug}`}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                        p.solved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 hover:bg-indigo-600 border border-zinc-700 hover:border-indigo-500 text-white'
                      }`}
                    >
                      {p.solved ? 'Review Solution' : 'Solve Challenge'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SQL Challenge */}
            {sqlProblem && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>Database Playgrounds (1 SQL)</span>
                </h3>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-900 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {sqlProblem.solved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-700 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white leading-none">{sqlProblem.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">Difficulty: {sqlProblem.difficulty} • +{sqlProblem.points} ⚡</p>
                    </div>
                  </div>

                  <Link
                    href={`/challenges/${sqlProblem.slug}`}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      sqlProblem.solved
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 hover:bg-amber-600 border border-zinc-700 hover:border-amber-500 text-white'
                    }`}
                  >
                    {sqlProblem.solved ? 'Review Query' : 'Execute SQL'}
                  </Link>
                </div>
              </div>
            )}

            {/* 3. Aptitude Quiz (MCQ) */}
            {aptProblem && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>Aptitude Challenge (1 MCQ)</span>
                </h3>
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-4">
                  <div className="flex items-start gap-3">
                    {aptProblem.solved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 flex-grow">
                      <h4 className="text-sm font-bold text-white">{aptProblem.title}</h4>
                      <div className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed border-l-2 border-zinc-800 pl-3">
                        {aptProblem.description.replace(/\*Options JSON format:\*[\s\S]*/, '')}
                      </div>
                    </div>
                  </div>

                  {!aptProblem.solved && (
                    <div className="space-y-4 pl-8">
                      <div className="grid grid-cols-2 gap-2">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setAptSelected(opt)}
                            className={`p-3 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                              aptSelected === opt
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                                : 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                            }`}
                          >
                            Option {opt}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() => handleAuxSubmit(aptProblem.slug, aptSelected, 'apt')}
                          disabled={submittingApt || !aptSelected}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all text-xs font-bold rounded-lg text-white"
                        >
                          {submittingApt ? 'Submitting...' : 'Submit Quiz Option'}
                        </button>
                        {feedback[aptProblem.slug] && (
                          <p className={`text-xs font-bold ${
                            feedback[aptProblem.slug].status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {feedback[aptProblem.slug].msg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {aptProblem.solved && (
                    <p className="text-xs font-bold text-emerald-400 pl-8">Quiz answered correctly (+15 ⚡ awarded!)</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Interview Prompt (Text Response) */}
            {intProblem && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Interview Prompt (Self-Assessment)</span>
                </h3>
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-4">
                  <div className="flex items-start gap-3">
                    {intProblem.solved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 flex-grow">
                      <h4 className="text-sm font-bold text-white">{intProblem.title}</h4>
                      <div className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed border-l-2 border-zinc-800 pl-3">
                        {intProblem.description.replace(/\*Type your response in the text field below.*/, '')}
                      </div>
                    </div>
                  </div>

                  {!intProblem.solved && (
                    <div className="space-y-4 pl-8">
                      <textarea
                        value={intAnswer}
                        onChange={e => setIntAnswer(e.target.value)}
                        placeholder="Write your explanation here..."
                        className="w-full h-24 p-3 rounded-lg border border-zinc-850 bg-zinc-950 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      />

                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() => handleAuxSubmit(intProblem.slug, intAnswer, 'int')}
                          disabled={submittingInt || intAnswer.trim().length < 10}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all text-xs font-bold rounded-lg text-white"
                        >
                          {submittingInt ? 'Submitting...' : 'Submit Response'}
                        </button>
                        {feedback[intProblem.slug] && (
                          <p className={`text-xs font-bold ${
                            feedback[intProblem.slug].status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {feedback[intProblem.slug].msg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {intProblem.solved && (
                    <p className="text-xs font-bold text-emerald-400 pl-8">Interview answer recorded (+15 ⚡ awarded!)</p>
                  )}
                </div>
              </div>
            )}

            {/* 5. Logic Puzzle */}
            {puzProblem && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Logical Puzzle (1 Riddle)</span>
                </h3>
                <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-4">
                  <div className="flex items-start gap-3">
                    {puzProblem.solved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 flex-grow">
                      <h4 className="text-sm font-bold text-white">{puzProblem.title}</h4>
                      <div className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed border-l-2 border-zinc-800 pl-3">
                        {puzProblem.description.replace(/\*Provide your single-word answer in the box.*/, '')}
                      </div>
                    </div>
                  </div>

                  {!puzProblem.solved && (
                    <div className="space-y-4 pl-8">
                      <input
                        type="text"
                        value={puzAnswer}
                        onChange={e => setPuzAnswer(e.target.value)}
                        placeholder="Type answer..."
                        className="p-2.5 rounded-lg border border-zinc-850 bg-zinc-950 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors w-max"
                      />

                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() => handleAuxSubmit(puzProblem.slug, puzAnswer, 'puz')}
                          disabled={submittingPuz || !puzAnswer.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all text-xs font-bold rounded-lg text-white"
                        >
                          {submittingPuz ? 'Submitting...' : 'Submit Riddle Solution'}
                        </button>
                        {feedback[puzProblem.slug] && (
                          <p className={`text-xs font-bold ${
                            feedback[puzProblem.slug].status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {feedback[puzProblem.slug].msg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {puzProblem.solved && (
                    <p className="text-xs font-bold text-emerald-400 pl-8">Puzzle resolved correctly (+20 ⚡ awarded!)</p>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right 1 Col: Floating AI Summary & Recommendations */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-850 space-y-4 sticky top-24">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
              <span>AI Learning Companion</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                <h5 className="text-[10px] font-black tracking-wider text-indigo-400 uppercase">Topic Digest</h5>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  In today's lesson on <span className="text-white font-bold">{dayInfo.title.replace(/^Day \d+ - /, '')}</span>, we cover standard syntax rules and conceptual mechanics described in the syllabus PDF. Use functions scopes and type definitions to pass compiling sandboxes.
                </p>
              </div>
              
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-1.5">
                <h5 className="text-[10px] font-black tracking-wider text-zinc-500 uppercase">Pro Tip</h5>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Stuck? You can toggle to your preferred language dropdown inside each coding playground. Java and C++ sandboxes compile and run natively against test constraints.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
