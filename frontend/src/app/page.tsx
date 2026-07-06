'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code, Database, Brain, Trophy, Zap, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col justify-between">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse-glow" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">S</div>
          <span>SSP CodeBase</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth?mode=login" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Log In
          </Link>
          <Link href="/auth?mode=signup" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-semibold rounded-lg text-white shadow-lg shadow-indigo-600/25">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center z-10 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing Gamified Interview Prep</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Level Up Your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Coding Skills</span>.
          </h1>

          <p className="text-zinc-400 text-lg sm:text-xl max-w-lg leading-relaxed">
            Practice programming, SQL queries, and system design challenges. Stay motivated with a Duolingo-style streak system, ⚡ rewards, levels, and contests.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link href="/auth?mode=signup" className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-colors font-bold rounded-xl text-white shadow-lg shadow-indigo-600/30">
              Get Started for Free
            </Link>
            <Link href="/dashboard" className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 transition-all font-semibold rounded-xl text-zinc-300 hover:text-white">
              Explore Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Feature Visual Graphics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative lg:h-[450px] w-full flex items-center justify-center"
        >
          <div className="w-full max-w-[460px] glass rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-float">
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs text-zinc-500 font-mono">two-sum.js</span>
            </div>

            <pre className="text-xs font-mono text-zinc-400 overflow-x-auto leading-relaxed">
              <code>{`// Task: Find two indices that sum to target
function solve(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`}</code>
            </pre>

            {/* Simulated success popup */}
            <div className="absolute bottom-4 right-4 bg-emerald-950/90 border border-emerald-500/50 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">✓</div>
              <div>
                <p className="text-xs font-bold text-white">All test cases passed!</p>
                <p className="text-[10px] text-emerald-400">+20 ⚡ • +10 Coins</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature Grids */}
      <section className="bg-zinc-950/80 border-t border-zinc-900 py-16 z-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Interactive Code Editor</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Write, compile, and run your code on a split-pane interface with real-time feedback and customized test case matching.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Interactive SQL Playground</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Run database queries in a sandboxed, isolated PostgreSQL environment and check result alignments immediately.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Aptitude & AI Coach</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Solve quantitative quizzes and puzzle challenges. Request hints and optimizations powered by advanced AI logic.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 z-10 text-center text-xs text-zinc-600">
        <p>&copy; {new Date().getFullYear()} SSP CodeBase. Built for interview excellence.</p>
      </footer>
    </div>
  );
}
