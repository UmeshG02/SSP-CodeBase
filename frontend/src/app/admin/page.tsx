'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import { UploadCloud, CheckCircle, AlertCircle, ArrowLeft, Loader2, FileText, Settings, Database, Plus } from 'lucide-react';

export default function AdminPortal() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successPath, setSuccessPath] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a syllabus PDF file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessPath(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Custom fetch for multipart file uploads
      const token = localStorage.getItem('ssp_token');
      const response = await fetch('http://localhost:3001/roadmap/upload-pdf', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.message || 'Failed to compile PDF roadmap.');
      }

      const data = await response.json();
      setSuccessPath(data);
      setFile(null);
    } catch (err: any) {
      console.error('PDF upload error:', err);
      setError(err.message || 'Internal connection error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs font-bold text-indigo-400">Admin Control Center</span>
        </div>
      </header>

      {/* Container */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 space-y-12 flex-grow">
        
        {/* Onboarding Summary info */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white">Curriculum Administrator</h1>
          <p className="text-sm text-zinc-400">
            Upload educational syllabus guides or custom interview question banks. The system's parsing module extracts numbered topic sequences, partitions chapters into 7-day modules, and attaches daily practice challenges.
          </p>
        </div>

        {/* Action Sections */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Upload PDF Section */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-850 space-y-6">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <span>Import PDF Syllabus</span>
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 hover:border-indigo-500/50 transition-colors relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <FileText className="w-10 h-10 text-zinc-500" />
                {file ? (
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-zinc-300">Click to browse or drop PDF here</p>
                    <p className="text-[10px] text-zinc-500">Supports standard document syllabus formats</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing & Generating Path...</span>
                  </>
                ) : (
                  <span>Compile PDF Roadmap</span>
                )}
              </button>
            </form>

            {/* Notifications */}
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successPath && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2 text-xs text-emerald-400">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">Path Generated Successfully!</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed pl-6">
                  Syllabus path <span className="text-white font-bold">"{successPath.title}"</span> compiled and added to learning options. You can now select it inside your dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-850 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>Roadmap Configs</span>
              </h3>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Locking Mode</span>
                  <span className="text-indigo-400 font-bold">Strict Completion Sequential</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Problems Per Day</span>
                  <span className="text-zinc-300 font-semibold">10 Coding + 4 Auxiliary</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Seeded Path</span>
                  <span className="text-emerald-400 font-bold">Active: Python Programming</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
              <Database className="w-5 h-5 text-amber-500" />
              <div>
                <h5 className="text-xs font-bold text-white">PostgreSQL Sandbox Connected</h5>
                <p className="text-[10px] text-zinc-500">All 15-state SQL variations loaded</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
