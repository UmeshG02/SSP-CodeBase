'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import { Trophy, Coins, Star, Award, Flame, LogOut, Lock, CheckCircle, Play, ChevronRight, Compass, Sun, Moon } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [profile, setProfile] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  
  // Weekly selection states
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [weekProblems, setWeekProblems] = useState<any[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);

  // Competitive MNC states
  const [hubTab, setHubTab] = useState<'modules' | 'competitive'>('modules');
  const [competitiveProblems, setCompetitiveProblems] = useState<any[]>([]);
  const [loadingCompetitive, setLoadingCompetitive] = useState(false);
  const [selectedMncFilter, setSelectedMncFilter] = useState<'ALL' | 'TCS' | 'WIPRO' | 'INFOSYS' | 'ACCENTURE' | 'COGNIZANT'>('ALL');

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize theme and load data
  useEffect(() => {
    // Read theme preference
    const savedTheme = localStorage.getItem('ssp_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }

    async function loadData() {
      try {
        const profData = await apiFetch('/profile');
        setProfile(profData);

        const roadData = await apiFetch('/roadmap/paths/python-programming-journey');
        setRoadmap(roadData);
        
        // Start on current week
        setSelectedWeekNum(roadData.userProgress.currentWeek);

        const leaderData = await apiFetch('/profile/leaderboard');
        setLeaderboard(leaderData);

        // Load all challenges for competitive section
        setLoadingCompetitive(true);
        const allProblems = await apiFetch('/challenges');
        // Filter out those that are not associated with any day (competitive ones)
        const compProbs = allProblems.filter((p: any) => !p.dayId);
        setCompetitiveProblems(compProbs);
        setLoadingCompetitive(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        router.push('/auth');
      } finally {
        setLoading(false);
        setLoadingCompetitive(false);
      }
    }
    loadData();
  }, [router]);

  // Fetch problems when week changes
  useEffect(() => {
    if (!roadmap) return;
    const selectedWeek = roadmap.weeks.find((w: any) => w.weekNumber === selectedWeekNum);
    if (!selectedWeek || selectedWeek.days.length === 0) return;

    if (!selectedWeek.days[0].unlocked) {
      setWeekProblems([]);
      return;
    }

    async function loadProblems() {
      setProblemsLoading(true);
      try {
        const dayId = selectedWeek.days[0].id;
        const data = await apiFetch(`/roadmap/days/${dayId}`);
        setWeekProblems(data.problems || []);
      } catch (err) {
        console.warn('Failed to load week problems:', err);
      } finally {
        setProblemsLoading(false);
      }
    }
    loadProblems();
  }, [selectedWeekNum, roadmap]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ssp_theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('ssp_token');
    localStorage.removeItem('ssp_user');
    router.push('/');
  };

  if (loading || !profile || !roadmap) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light' ? 'bg-zinc-50' : 'bg-zinc-950'
      }`}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const streakVal = profile?.user?.streaks?.currentStreak || 0;
  const badgesList = profile?.user?.badges || [];

  const selectedWeek = roadmap.weeks.find((w: any) => w.weekNumber === selectedWeekNum) || roadmap.weeks[0];
  const isWeekUnlocked = selectedWeek.days.length > 0 && selectedWeek.days[0].unlocked;

  // Filter 10 questions into Easy (5), Medium (3), Hard (2)
  const easyProblems = weekProblems.filter(p => p.difficulty === 'EASY');
  const mediumProblems = weekProblems.filter(p => p.difficulty === 'MEDIUM');
  const hardProblems = weekProblems.filter(p => p.difficulty === 'HARD');

  const totalProblemsCount = weekProblems.length;
  const solvedProblemsCount = weekProblems.filter(p => p.solved).length;
  const progressPercent = totalProblemsCount > 0 ? Math.round((solvedProblemsCount / totalProblemsCount) * 100) : 0;

  // Filter competitive problems by selected MNC tag
  const filteredCompetitive = competitiveProblems.filter((p: any) => {
    if (selectedMncFilter === 'ALL') return true;
    return p.tags.some((t: string) => t.toUpperCase() === selectedMncFilter.toUpperCase());
  });

  // Find user's active page link
  let activeDayId = null;
  const currentActiveWeek = roadmap.weeks.find((w: any) => w.weekNumber === roadmap.userProgress.currentWeek);
  if (currentActiveWeek && currentActiveWeek.days.length > 0) {
    activeDayId = currentActiveWeek.days[0].id;
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col ${
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
    }`}>
      {/* Navigation Header */}
      <nav className={`border-b sticky top-0 z-20 backdrop-blur ${
        theme === 'light' ? 'border-zinc-200 bg-white/80' : 'border-zinc-900 bg-zinc-950/60'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className={`flex items-center gap-2 font-black text-xl tracking-tight ${
            theme === 'light' ? 'text-zinc-900' : 'text-white'
          }`}>
            <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white font-black text-sm">S</div>
            <span>SSP CodeBase</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 text-xs border-r pr-4 ${
              theme === 'light' ? 'border-zinc-200 text-zinc-700' : 'border-zinc-800 text-zinc-300'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] ${
                theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
              }`}>
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>Hi, <span className={`font-black ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>{profile?.name}</span></span>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                theme === 'light'
                  ? 'text-amber-600 bg-amber-500/5 border-amber-500/10'
                  : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
              }`}>
                <Coins className="w-3.5 h-3.5" />
                <span>{profile?.coins} Coins</span>
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                theme === 'light'
                  ? 'text-orange-600 bg-orange-500/5 border-orange-500/10'
                  : 'text-orange-500 bg-orange-500/10 border-orange-500/20'
              }`}>
                <Flame className="w-3.5 h-3.5" />
                <span>{streakVal} Day Streak</span>
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                theme === 'light'
                  ? 'text-indigo-600 bg-indigo-500/5 border-indigo-500/10'
                  : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
              }`}>
                <Star className="w-3.5 h-3.5" />
                <span>Level {profile?.level}</span>
              </span>
            </div>

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

            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950'
                  : 'border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 grid lg:grid-cols-3 gap-8 flex-grow">
        {/* Left 2 Cols: Weekly Practice Hub */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Welcome Card & Active Path Resume Info */}
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
            theme === 'light'
              ? 'bg-gradient-to-br from-indigo-50/50 via-zinc-100/50 to-white border-zinc-200 shadow-sm'
              : 'bg-gradient-to-br from-indigo-950/40 via-zinc-900/50 to-zinc-900 border-zinc-850'
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1 w-max">
                <Compass className="w-3 h-3" />
                Active Learning Path
              </span>
              <h2 className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{roadmap.path.title}</h2>
              <p className={theme === 'light' ? 'text-zinc-600 text-sm' : 'text-zinc-400 text-sm'}>
                You are currently on <span className={`font-bold ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>Module {roadmap.userProgress.currentWeek}</span>
              </p>
            </div>
            
            {activeDayId && (
              <button
                onClick={() => setSelectedWeekNum(roadmap.userProgress.currentWeek)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 text-sm justify-center cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Go to Active Module</span>
              </button>
            )}
          </div>

          {/* Tab Selector: curriculum modules vs competitive exams */}
          <div className="flex gap-4 p-1.5 rounded-2xl bg-zinc-950/60 border border-zinc-900">
            <button
              onClick={() => setHubTab('modules')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hubTab === 'modules'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : theme === 'light'
                    ? 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Module Wise Curriculum</span>
            </button>
            <button
              onClick={() => setHubTab('competitive')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hubTab === 'competitive'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : theme === 'light'
                    ? 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Competitive Exams (TCS/Wipro/MNCs)</span>
            </button>
          </div>

          {hubTab === 'modules' ? (
            <div className={`p-6 rounded-2xl border space-y-6 ${
              theme === 'light'
                ? 'bg-white border-zinc-200 shadow-sm'
                : 'bg-zinc-900/40 border-zinc-900'
            }`}>
              
              {/* Horizontal Module Tabs Selector */}
              <div className={`flex items-center gap-2 overflow-x-auto pb-2 border-b scrollbar-none ${
                theme === 'light' ? 'border-zinc-200' : 'border-zinc-900'
              }`}>
                {roadmap.weeks.map((w: any) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWeekNum(w.weekNumber)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0 cursor-pointer ${
                      selectedWeekNum === w.weekNumber
                        ? 'bg-indigo-600 text-white shadow'
                        : theme === 'light'
                          ? 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    Module {w.weekNumber}
                  </button>
                ))}
              </div>

              {/* Week Focus Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className={`text-base font-extrabold ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>{selectedWeek.title}</h3>
                  <p className="text-xs text-zinc-500">Master core concepts by completing these 10 challenges.</p>
                </div>
                {isWeekUnlocked && totalProblemsCount > 0 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-400">{solvedProblemsCount} / {totalProblemsCount} Solved</span>
                    <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Problems List (Locks Evaluator) */}
              {!isWeekUnlocked ? (
                <div className={`p-12 text-center rounded-xl border flex flex-col items-center justify-center space-y-4 ${
                  theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-850'
                }`}>
                  <Lock className={`w-8 h-8 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-zinc-850' : 'text-white'}`}>Module Locked</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">Complete all coding challenges in the previous modules to unlock this module.</p>
                  
                  <div className="w-8 h-px bg-zinc-800 my-2" />
                  
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const keyInput = (e.target as any).elements.accessKey.value;
                      if (!keyInput) return;
                      try {
                        const res = await apiFetch('/roadmap/unlock-with-key', {
                          method: 'POST',
                          body: { key: keyInput }
                        });
                        if (res.success) {
                          alert(`Successfully unlocked "${res.title}" with access key!`);
                          window.location.reload();
                        }
                      } catch (err: any) {
                        alert(err.message || 'Invalid key.');
                      }
                    }}
                    className="w-full max-w-xs space-y-2"
                  >
                    <input
                      type="text"
                      name="accessKey"
                      placeholder="Enter Module Access Key..."
                      className={`w-full px-3 py-2 text-xs rounded-lg border text-center outline-none ${
                        theme === 'light' ? 'bg-white border-zinc-300 text-zinc-950 focus:border-indigo-500' : 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold rounded-lg text-white cursor-pointer"
                    >
                      Unlock Module with Key
                    </button>
                  </form>
                </div>
              ) : problemsLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* 1. EASY Tier (5 questions) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Easy Level</span>
                      <span className="text-zinc-500 font-normal font-sans">(5 challenges)</span>
                    </h4>
                    <div className="grid gap-2">
                      {easyProblems.map((p: any) => (
                        <ChallengeItem key={p.id} p={p} theme={theme} />
                      ))}
                    </div>
                  </div>

                  {/* 2. MEDIUM Tier (3 questions) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Medium Level</span>
                      <span className="text-zinc-500 font-normal font-sans">(3 challenges)</span>
                    </h4>
                    <div className="grid gap-2">
                      {mediumProblems.map((p: any) => (
                        <ChallengeItem key={p.id} p={p} theme={theme} />
                      ))}
                    </div>
                  </div>

                  {/* 3. HARD Tier (2 questions) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Hard Level</span>
                      <span className="text-zinc-500 font-normal font-sans">(2 challenges)</span>
                    </h4>
                    <div className="grid gap-2">
                      {hardProblems.map((p: any) => (
                        <ChallengeItem key={p.id} p={p} theme={theme} />
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className={`p-6 rounded-2xl border space-y-6 ${
              theme === 'light'
                ? 'bg-white border-zinc-200 shadow-sm'
                : 'bg-zinc-900/40 border-zinc-900'
            }`}>
              {/* MNC Filter Tabs */}
              <div className={`flex items-center gap-2 overflow-x-auto pb-2 border-b scrollbar-none ${
                theme === 'light' ? 'border-zinc-200' : 'border-zinc-900'
              }`}>
                {(['ALL', 'TCS', 'WIPRO', 'INFOSYS', 'ACCENTURE', 'COGNIZANT'] as const).map((mnc) => (
                  <button
                    key={mnc}
                    onClick={() => setSelectedMncFilter(mnc)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0 cursor-pointer ${
                      selectedMncFilter === mnc
                        ? 'bg-indigo-600 text-white shadow'
                        : theme === 'light'
                          ? 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    {mnc === 'ALL' ? 'All Companies' : mnc}
                  </button>
                ))}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className={`text-base font-extrabold ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
                  MNC Placement Coding Papers
                </h3>
                <p className="text-xs text-zinc-500">
                  Practice past 5 years actual coding questions from top recruiters.
                </p>
              </div>

              {/* Problems list */}
              {loadingCompetitive ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : filteredCompetitive.length > 0 ? (
                <div className="grid gap-4">
                  {filteredCompetitive.map((p: any) => (
                    <ChallengeItem key={p.id} p={p} theme={theme} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No MNC questions found for this category.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 1 Col: Gamified Cabinet & Leaderboard */}
        <div className="space-y-8">
          
          {/* Badge Cabinet */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
          }`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Badge Cabinet</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {badgesList.map((ub: any) => (
                <div key={ub.id} className={`p-2 rounded-lg border flex flex-col items-center text-center space-y-1 ${
                  theme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-950 border-zinc-900'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    🏆
                  </div>
                  <p className={`text-[9px] font-bold truncate max-w-full ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{ub.badge.name}</p>
                </div>
              ))}
              {badgesList.length === 0 && (
                <p className="text-xs text-zinc-500 col-span-3 text-center py-2">Solve challenges to unlock custom badges.</p>
              )}
            </div>
          </div>

          {/* Leaderboard Cabinet */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
          }`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Path Leaderboard</span>
            </h3>

            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((u: any, idx: number) => {
                const isSelf = u.userId === profile.userId;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      isSelf
                        ? theme === 'light'
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-indigo-950/20 border-indigo-500/30'
                        : theme === 'light'
                          ? 'bg-zinc-50/60 border-zinc-100 hover:border-zinc-200'
                          : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-xs font-black ${
                        idx === 0 ? 'text-amber-500' :
                        idx === 1 ? 'text-zinc-400' :
                        idx === 2 ? 'text-amber-700' :
                        'text-zinc-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className={`text-xs font-bold truncate max-w-[120px] ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{u.name}</p>
                        <p className="text-[9px] text-zinc-500">Level {u.level}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-indigo-500">{u.xp} ⚡</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Sub-component for individual problem list item
function ChallengeItem({ p, theme }: { p: any, theme: 'dark' | 'light' }) {
  return (
    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
      theme === 'light'
        ? 'bg-zinc-50/50 border-zinc-200 hover:border-indigo-400'
        : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-800'
    }`}>
      <div className="flex items-center gap-3">
        {p.solved ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <div className={`w-5 h-5 rounded-full border shrink-0 ${
            theme === 'light' ? 'border-zinc-300' : 'border-zinc-800'
          }`} />
        )}
        <div>
          <h5 className={`text-sm font-bold leading-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{p.title.replace(/^.*:\s*/, '')}</h5>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1">
            <span>+{p.points} ⚡</span>
            <span>•</span>
            {p.tags.map((t: string) => (
              <span key={t} className={`px-1.5 py-0.5 rounded text-[9px] ${
                theme === 'light' ? 'bg-zinc-200/60 text-zinc-600' : 'bg-zinc-900 text-zinc-400'
              }`}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <Link
        href={`/challenges/${p.slug}`}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-0.5 group transition-all cursor-pointer ${
          p.solved
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
            : theme === 'light'
              ? 'bg-zinc-100 hover:bg-indigo-600 hover:text-white border-zinc-300 text-zinc-700'
              : 'bg-zinc-800 hover:bg-indigo-600 border border-zinc-700 hover:border-indigo-500 text-white'
        }`}
      >
        <span>{p.solved ? 'Review Solution' : 'Solve'}</span>
        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
