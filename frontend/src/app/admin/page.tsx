'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, API_URL } from '@/utils/api';
import { 
  Users, BookOpen, BarChart2, Shield, Settings, Database, UploadCloud, 
  Plus, Search, Filter, Trash2, CheckCircle, AlertCircle, ArrowLeft, 
  Loader2, FileText, Lock, Unlock, Award, Coins, Flame, Edit, ArrowRight,
  TrendingUp, RefreshCw, MessageSquare, Megaphone, Terminal, UserPlus, Check, Moon, Sun,
  ShieldAlert, ShieldCheck, AlertTriangle, Save, Play
} from 'lucide-react';

export default function AdminPortal() {
  const router = useRouter();
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Auth gate states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'syllabus' | 'announcements' | 'logs' | 'security'>('dashboard');

  // Security tab state
  const [examConfig, setExamConfig] = useState<any>(null);
  const [examConfigForm, setExamConfigForm] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const [autoSubmissions, setAutoSubmissions] = useState<any[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [violationSearch, setViolationSearch] = useState('');
  const [securityDashboard, setSecurityDashboard] = useState<any>(null);
  const [lockedAssessments, setLockedAssessments] = useState<any[]>([]);
  const [securityAuditLogs, setSecurityAuditLogs] = useState<any[]>([]);
  const [securitySubTab, setSecuritySubTab] = useState<'overview' | 'violations' | 'locked' | 'audit' | 'config'>('overview');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [extendLockSessionId, setExtendLockSessionId] = useState('');
  const [extendLockMinutes, setExtendLockMinutes] = useState(15);
  const [showExtendModal, setShowExtendModal] = useState(false);

  // Stats Dashboard state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [streamFilter, setStreamFilter] = useState<'today' | 'yesterday' | 'custom' | 'all'>('all');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>('');

  // User Management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Create User Form state
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    username: '',
    password: '',
    name: '',
    role: 'USER',
    college: '',
    company: ''
  });

  // Content Management state
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [showProblemEditor, setShowProblemEditor] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);

  // Problem Editor Form state
  const [problemForm, setProblemForm] = useState<any>({
    title: '',
    slug: '',
    description: '',
    difficulty: 'EASY',
    type: 'CODING',
    points: 10,
    tags: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    templateCode: '{}',
    solutionCode: '',
    testCases: []
  });

  // PDF Syllabus State
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusUploading, setSyllabusUploading] = useState(false);
  const [syllabusSuccess, setSyllabusSuccess] = useState<any>(null);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);

  // Announcements state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annSuccess, setAnnSuccess] = useState(false);

  // Support Requests & Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ssp_theme');
    if (savedTheme === 'light') {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ssp_theme', nextTheme);
  };

  // Helper to trigger transient toasts
  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Check auth and role
  const checkAdminAuth = async () => {
    setLoadingAuth(true);
    const token = localStorage.getItem('ssp_admin_token');
    if (!token) {
      setIsAuthenticated(false);
      setLoadingAuth(false);
      return;
    }

    try {
      const profile = await apiFetch('/profile');
      if (profile && profile.user && profile.user.role !== 'USER') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setAuthError('Access Denied: Administrator privileges required.');
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Admin Login request
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: usernameInput, password: passwordInput }
      });
      if (data && data.token) {
        localStorage.setItem('ssp_admin_token', data.token);
        
        // Confirm user role
        const profile = await apiFetch('/profile');
        if (profile && profile.user && profile.user.role !== 'USER') {
          setIsAuthenticated(true);
          triggerToast('success', `Welcome back, ${profile.name}!`);
        } else {
          localStorage.removeItem('ssp_admin_token');
          setAuthError('Access Denied: Non-administrator account.');
        }
      } else {
        setAuthError('Invalid credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    }
  };

  // Fetch Dashboard statistics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await apiFetch('/admin/stats');
      if (data) setStats(data);
    } catch (err: any) {
      triggerToast('error', 'Failed to retrieve dashboard statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const queryParams = new URLSearchParams();
      if (userSearch) queryParams.append('search', userSearch);
      if (userRoleFilter) queryParams.append('role', userRoleFilter);

      const data = await apiFetch(`/admin/users?${queryParams.toString()}`);
      if (data) setUsersList(data);
    } catch (err: any) {
      triggerToast('error', 'Failed to fetch user directory');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Content Problems
  const fetchProblems = async () => {
    setLoadingProblems(true);
    try {
      const data = await apiFetch('/admin/problems');
      if (data) setProblemsList(data);
    } catch (err: any) {
      triggerToast('error', 'Failed to fetch database problems');
    } finally {
      setLoadingProblems(false);
    }
  };

  // Fetch Logs & Requests
  const fetchLogsAndTickets = async () => {
    setLoadingLogs(true);
    try {
      const [logsData, ticketsData] = await Promise.all([
        apiFetch('/admin/audit-logs').catch(() => []),
        apiFetch('/admin/support').catch(() => [])
      ]);
      setAuditLogs(Array.isArray(logsData) ? logsData : []);
      setSupportRequests(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (err: any) {
      triggerToast('error', 'Failed to load support logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchSecurityData = async () => {
    setLoadingSecurity(true);
    try {
      const [config, viols, autoSubs, dashboard, locked, auditLogs] = await Promise.all([
        apiFetch('/secure-assessment/config').catch(() => null),
        apiFetch('/secure-assessment/admin/violations?limit=100').catch(() => ({ logs: [] })),
        apiFetch('/challenges/secure-mode/auto-submissions').catch(() => []),
        apiFetch('/secure-assessment/admin/dashboard').catch(() => null),
        apiFetch('/secure-assessment/admin/locked').catch(() => []),
        apiFetch('/secure-assessment/admin/audit-logs?limit=50').catch(() => ({ logs: [] })),
      ]);
      if (config) {
        setExamConfig(config);
        setExamConfigForm({ ...config });
      }
      setViolations(Array.isArray(viols?.logs) ? viols.logs : []);
      setAutoSubmissions(Array.isArray(autoSubs) ? autoSubs : []);
      setSecurityDashboard(dashboard);
      setLockedAssessments(Array.isArray(locked) ? locked : []);
      setSecurityAuditLogs(Array.isArray(auditLogs?.logs) ? auditLogs.logs : []);
    } catch (err: any) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const saveExamConfig = async () => {
    setSavingConfig(true);
    setConfigSaved(false);
    try {
      const updated = await apiFetch('/secure-assessment/admin/config', {
        method: 'PUT',
        body: examConfigForm,
      });
      setExamConfig(updated);
      setExamConfigForm({ ...updated });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
      triggerToast('success', 'Security configuration saved successfully');
    } catch (err: any) {
      triggerToast('error', 'Failed to save config');
    } finally {
      setSavingConfig(false);
    }
  };

  const adminUnlockAssessment = async (sessionId: string) => {
    setAdminActionLoading(true);
    try {
      await apiFetch('/secure-assessment/admin/unlock', {
        method: 'POST',
        body: { sessionId },
      });
      triggerToast('success', 'Assessment unlocked successfully');
      fetchSecurityData();
    } catch (err: any) {
      triggerToast('error', err.message || 'Failed to unlock assessment');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const adminExtendLock = async () => {
    if (!extendLockSessionId) return;
    setAdminActionLoading(true);
    try {
      await apiFetch('/secure-assessment/admin/extend-lock', {
        method: 'POST',
        body: { sessionId: extendLockSessionId, extraMinutes: extendLockMinutes },
      });
      triggerToast('success', `Lock extended by ${extendLockMinutes} minutes`);
      setShowExtendModal(false);
      fetchSecurityData();
    } catch (err: any) {
      triggerToast('error', err.message || 'Failed to extend lock');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const adminResetViolations = async (sessionId: string) => {
    setAdminActionLoading(true);
    try {
      await apiFetch('/secure-assessment/admin/reset-violations', {
        method: 'POST',
        body: { sessionId },
      });
      triggerToast('success', 'Violation count reset');
      fetchSecurityData();
    } catch (err: any) {
      triggerToast('error', 'Failed to reset violations');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const adminIgnoreViolation = async (violationId: string) => {
    setAdminActionLoading(true);
    try {
      await apiFetch('/secure-assessment/admin/ignore-violation', {
        method: 'POST',
        body: { violationId },
      });
      triggerToast('success', 'Violation ignored');
      fetchSecurityData();
    } catch (err: any) {
      triggerToast('error', 'Failed to ignore violation');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const exportViolations = async (format: 'json' | 'csv') => {
    try {
      const data = await apiFetch(`/secure-assessment/admin/export?format=${format}`);
      const blob = new Blob(
        [format === 'csv' ? data : JSON.stringify(data, null, 2)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `violation-logs.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      triggerToast('success', `Violations exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      triggerToast('error', 'Failed to export violations');
    }
  };

  // Load tabs contents dynamically
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'content') fetchProblems();
    if (activeTab === 'logs') fetchLogsAndTickets();
    if (activeTab === 'security') fetchSecurityData();
  }, [activeTab, isAuthenticated]);

  // Unlock day/module overrides
  const handleProgressUnlock = async (type: 'day' | 'module', targetVal: number) => {
    if (!selectedUser) return;
    try {
      const endpoint = type === 'day' 
        ? `/admin/users/${selectedUser.id}/unlock-day` 
        : `/admin/users/${selectedUser.id}/unlock-module`;
      
      const body = type === 'day' ? { dayNumber: targetVal } : { moduleNumber: targetVal };

      await apiFetch(endpoint, {
        method: 'POST',
        body
      });
      triggerToast('success', `Unlocked ${type === 'day' ? `Day ${targetVal}` : `Module ${targetVal}`} successfully`);
      fetchUsers();
      // Reload active profile drawer details
      setSelectedUser((prev: any) => ({
        ...prev,
        currentModule: type === 'module' ? targetVal : prev.currentModule,
        currentDay: type === 'day' ? targetVal : prev.currentDay
      }));
    } catch (err: any) {
      triggerToast('error', err.message || 'Progress unlock failed');
    }
  };

  // Lock module override
  const handleProgressLock = async (moduleNumber: number) => {
    if (!selectedUser) return;
    try {
      await apiFetch(`/admin/users/${selectedUser.id}/lock-module`, {
        method: 'POST',
        body: { moduleNumber }
      });
      triggerToast('success', `Locked module ${moduleNumber} progression`);
      fetchUsers();
      setSelectedUser((prev: any) => ({
        ...prev,
        currentModule: Math.max(1, moduleNumber - 1),
        currentDay: 1
      }));
    } catch (err: any) {
      triggerToast('error', err.message || 'Progress lock failed');
    }
  };

  // Toggle explicit access-key module unlock for a user
  const handleToggleModuleAccess = async (moduleNumber: number, currentHasAccess: boolean) => {
    if (!selectedUser) return;
    try {
      const endpoint = currentHasAccess 
        ? `/admin/users/${selectedUser.id}/revoke-module-access` 
        : `/admin/users/${selectedUser.id}/grant-module-access`;
      
      await apiFetch(endpoint, {
        method: 'POST',
        body: { moduleNumber }
      });
      
      triggerToast('success', `${currentHasAccess ? 'Revoked' : 'Granted'} access key unlock for Module ${moduleNumber}`);
      fetchUsers();
      
      // Update selectedUser local list
      setSelectedUser((prev: any) => {
        const list = prev.unlockedWeeks || [];
        const nextList = currentHasAccess ? list.filter((m: number) => m !== moduleNumber) : [...list, moduleNumber];
        return { ...prev, unlockedWeeks: nextList };
      });
    } catch (err: any) {
      triggerToast('error', err.message || 'Access key toggle failed');
    }
  };

  // Grant coins / XP
  const handleGrantReward = async (rewardType: 'xp' | 'coins', val: number) => {
    if (!selectedUser) return;
    try {
      const endpoint = `/admin/users/${selectedUser.id}/grant-${rewardType}`;
      await apiFetch(endpoint, {
        method: 'POST',
        body: { amount: val }
      });
      triggerToast('success', `Granted +${val} ${rewardType.toUpperCase()} successfully`);
      
      // Update local state in drawer
      setSelectedUser((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          xp: rewardType === 'xp' ? (prev.profile?.xp || 0) + val : (prev.profile?.xp || 0),
          coins: rewardType === 'coins' ? (prev.profile?.coins || 0) + val : (prev.profile?.coins || 0)
        }
      }));
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', err.message || 'Grant transaction failed');
    }
  };

  // Reset Streak override
  const handleResetStreak = async () => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to reset this user\'s daily streaks?')) return;
    try {
      await apiFetch(`/admin/users/${selectedUser.id}/reset-streak`, {
        method: 'POST'
      });
      triggerToast('success', 'User daily active streak reset to 0');
      setSelectedUser((prev: any) => ({
        ...prev,
        streak: 0,
        longestStreak: 0
      }));
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', err.message || 'Streak reset failed');
    }
  };

  // Award manual badge
  const handleAwardBadge = async (badgeName: string) => {
    if (!selectedUser || !badgeName) return;
    try {
      await apiFetch(`/admin/users/${selectedUser.id}/award-badge`, {
        method: 'POST',
        body: { badgeName }
      });
      triggerToast('success', `Awarded badge "${badgeName}" to user`);
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', err.message || 'Badge award failed');
    }
  };

  // Change user role
  const handleChangeRole = async (userId: string, nextRole: string) => {
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PUT',
        body: { role: nextRole }
      });
      triggerToast('success', `Role changed to ${nextRole}`);
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', err.message || 'Role change failed');
    }
  };

  // Delete User override
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('WARNING: Deleting this user account will permanently purge their profile, credentials, code submissions, progress, and rankings. This action is destructive and CANNOT be undone. Proceed?')) return;
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      triggerToast('success', 'User account permanently deleted');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', err.message || 'Delete user failed');
    }
  };

  // Reset Password override
  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter the new password for this user (minimum 6 characters):');
    if (newPassword === null) return; // Admin cancelled the prompt

    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      await apiFetch(`/admin/users/${userId}/reset-password`, { 
        method: 'POST',
        body: { password: trimmed }
      });
      triggerToast('success', 'User password successfully updated');
    } catch (err: any) {
      triggerToast('error', err.message || 'Reset password failed');
    }
  };

  // Create User submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: createUserForm
      });
      triggerToast('success', 'User account created successfully');
      setShowCreateUserModal(false);
      setCreateUserForm({
        email: '',
        username: '',
        password: '',
        name: '',
        role: 'USER',
        college: '',
        company: ''
      });
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', err.message || 'Create user failed');
    }
  };

  // Save Problem Editor details
  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = typeof problemForm.tags === 'string' 
        ? problemForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : problemForm.tags;

      const endpoint = selectedProblem 
        ? `/admin/problems/${selectedProblem.id}`
        : '/admin/problems';

      const method = selectedProblem ? 'PUT' : 'POST';

      await apiFetch(endpoint, {
        method,
        body: {
          ...problemForm,
          tags: tagsArray
        }
      });

      triggerToast('success', `Challenge ${selectedProblem ? 'updated' : 'created'} successfully`);
      setShowProblemEditor(false);
      setSelectedProblem(null);
      fetchProblems();
    } catch (err: any) {
      triggerToast('error', err.message || 'Save challenge failed');
    }
  };

  // Delete Problem
  const handleDeleteProblem = async (probId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    try {
      await apiFetch(`/admin/problems/${probId}`, { method: 'DELETE' });
      triggerToast('success', 'Challenge deleted');
      fetchProblems();
    } catch (err: any) {
      triggerToast('error', 'Delete problem failed');
    }
  };

  // PDF Syllabus Upload
  const handleSyllabusUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusFile) {
      setSyllabusError('Please select a syllabus PDF file first.');
      return;
    }

    setSyllabusUploading(true);
    setSyllabusError(null);
    setSyllabusSuccess(null);

    const formData = new FormData();
    formData.append('file', syllabusFile);

    try {
      const token = localStorage.getItem('ssp_admin_token');
      const response = await fetch(`${API_URL}/roadmap/upload-pdf`, {
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
      setSyllabusSuccess(data);
      setSyllabusFile(null);
      triggerToast('success', 'PDF Syllabus imported into learning pathway');
    } catch (err: any) {
      setSyllabusError(err.message || 'Internal connection error.');
    } finally {
      setSyllabusUploading(false);
    }
  };

  // Broadcast announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    try {
      await apiFetch('/admin/announcements', {
        method: 'POST',
        body: { title: annTitle, content: annContent }
      });
      setAnnSuccess(true);
      setAnnTitle('');
      setAnnContent('');
      triggerToast('success', 'Broadcast announcement sent');
      setTimeout(() => setAnnSuccess(false), 3000);
    } catch (err: any) {
      triggerToast('error', 'Broadcast failed');
    }
  };

  // Resolve support ticket
  const handleResolveTicket = async (ticketId: string, nextStatus: string) => {
    try {
      await apiFetch(`/admin/support/${ticketId}`, {
        method: 'PUT',
        body: { status: nextStatus }
      });
      triggerToast('success', `Ticket marked as ${nextStatus}`);
      fetchLogsAndTickets();
    } catch (err: any) {
      triggerToast('error', 'Failed to resolve support ticket');
    }
  };

  // Open Problem Editor modal
  const openProblemEditor = (prob: any = null) => {
    setSelectedProblem(prob);
    if (prob) {
      setProblemForm({
        title: prob.title,
        slug: prob.slug,
        description: prob.description,
        difficulty: prob.difficulty,
        type: prob.type,
        points: prob.points,
        tags: prob.tags ? prob.tags.join(', ') : '',
        inputFormat: prob.inputFormat || '',
        outputFormat: prob.outputFormat || '',
        constraints: prob.constraints || '',
        templateCode: prob.templateCode || '{}',
        solutionCode: prob.solutionCode || '',
        testCases: prob.testCases || []
      });
    } else {
      setProblemForm({
        title: '',
        slug: '',
        description: '',
        difficulty: 'EASY',
        type: 'CODING',
        points: 10,
        tags: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        templateCode: '{}',
        solutionCode: '',
        testCases: [{ input: '', expected: '', isSample: true }]
      });
    }
    setShowProblemEditor(true);
  };

  // Manage test cases inside local form
  const addFormTestCase = () => {
    setProblemForm((prev: any) => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expected: '', isSample: false }]
    }));
  };

  const updateFormTestCase = (index: number, key: string, val: any) => {
    setProblemForm((prev: any) => {
      const copy = [...prev.testCases];
      copy[index] = { ...copy[index], [key]: val };
      return { ...prev, testCases: copy };
    });
  };

  const removeFormTestCase = (index: number) => {
    setProblemForm((prev: any) => ({
      ...prev,
      testCases: prev.testCases.filter((_: any, i: number) => i !== index)
    }));
  };

  // Export report to CSV helper
  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] || '')).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-mono text-zinc-400 animate-pulse">Initializing Administrative Session...</span>
      </div>
    );
  }

  // 1. Secure Login Page view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${
        theme === 'light' ? 'bg-zinc-50' : 'bg-zinc-950'
      }`}>
        <div className={`max-w-md w-full p-8 rounded-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-zinc-200 shadow-xl text-zinc-900' : 'bg-zinc-900 border-zinc-850 shadow-2xl text-white'
        }`}>
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex p-3.5 rounded-xl bg-indigo-500/10 text-indigo-500 mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">SSP Admin Control</h1>
            <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Enter credentials to access learning modules and user controls.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Username / Email</label>
              <input
                type="email"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-950'
                    : 'bg-zinc-950 border-zinc-800 focus:border-indigo-500 text-white'
                }`}
                placeholder="admin@ssp.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-950'
                    : 'bg-zinc-950 border-zinc-800 focus:border-indigo-500 text-white'
                }`}
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl text-white text-xs font-black tracking-wider uppercase cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Authorize Credentials
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-xs text-indigo-400 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to standard workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Stream activity filtering
  const filteredActivity = (stats?.recentActivity || []).filter((act: any) => {
    const actDate = new Date(act.createdAt);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const actMidnight = new Date(actDate);
    actMidnight.setHours(0, 0, 0, 0);

    if (streamFilter === 'today') {
      return actMidnight.getTime() === today.getTime();
    }
    if (streamFilter === 'yesterday') {
      return actMidnight.getTime() === yesterday.getTime();
    }
    if (streamFilter === 'custom') {
      if (!selectedCustomDate) return false;
      const yyyy = actDate.getFullYear();
      const mm = String(actDate.getMonth() + 1).padStart(2, '0');
      const dd = String(actDate.getDate()).padStart(2, '0');
      const actDateStr = `${yyyy}-${mm}-${dd}`;
      return actDateStr === selectedCustomDate;
    }
    return true;
  });

  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const targetMidnight = new Date(date);
    targetMidnight.setHours(0, 0, 0, 0);
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (targetMidnight.getTime() === today.getTime()) {
      return `Today, ${timeStr}`;
    } else if (targetMidnight.getTime() === yesterday.getTime()) {
      return `Yesterday, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    }
  };

  // 2. Full Admin Portal Workspace
  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
    }`}>
      
      {/* Toast popup */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-slide-in text-xs font-semibold ${
          toast.type === 'success' 
            ? theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
            : theme === 'light' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/80 border-rose-800 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className={`border-b sticky top-0 z-20 backdrop-blur ${
        theme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-zinc-950/80 border-zinc-900'
      }`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-indigo-400 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Workspace</span>
            </Link>
            <div className="w-px h-4 bg-zinc-800" />
            <h1 className="text-sm font-black flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Admin Console</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border hover:scale-105 transition-all cursor-pointer ${
                theme === 'light' ? 'bg-zinc-100 border-zinc-250 text-zinc-800' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('ssp_admin_token');
                setIsAuthenticated(false);
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Grid Layout */}
      <div className="max-w-[1600px] w-full mx-auto px-6 py-8 flex-grow flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Overview & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'users'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'content'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Challenge Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'syllabus'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Syllabus Compiler</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Announcements</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Audit Trail & Support</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'security'
                ? theme === 'light' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-indigo-600 text-white'
                : theme === 'light' ? 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-650' : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Exam Security</span>
          </button>
        </aside>

        {/* Content Pane */}
        <main className="flex-grow min-w-0">
          
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black">Overview Dashboard</h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-450'}`}>
                    Real-time platforms health, enrollment, and coding challenge statistics.
                  </p>
                </div>
                <button
                  onClick={fetchStats}
                  disabled={loadingStats}
                  className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light' ? 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-200'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingStats || !stats ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-mono">Aggregating real-time stats metrics...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Grid Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-5 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Total Enrollment</span>
                      <h3 className="text-2xl font-black mt-1 text-indigo-500">{stats.totalUsers}</h3>
                      <p className="text-[10px] text-zinc-400 mt-2">Active accounts registered</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Active Today (DAU)</span>
                      <h3 className="text-2xl font-black mt-1 text-amber-500">{stats.activeUsersToday}</h3>
                      <p className="text-[10px] text-zinc-400 mt-2">Active streak log transactions</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Problems Evaluated</span>
                      <h3 className="text-2xl font-black mt-1 text-emerald-500">{stats.problemsSolvedToday}</h3>
                      <p className="text-[10px] text-zinc-400 mt-2">Code completions accepted today</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Total Submissions</span>
                      <h3 className="text-2xl font-black mt-1 text-purple-500">{stats.totalSubmissions}</h3>
                      <p className="text-[10px] text-zinc-400 mt-2">Total platform runs count</p>
                    </div>
                  </div>

                  {/* Graphic Visualizations (SVG Charts) */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* User Growth Line Chart */}
                    <div className={`p-6 rounded-2xl border md:col-span-2 ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Weekly Submissions Volume</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">Simulated scale (last 7 days)</span>
                      </div>
                      <div className="h-48 w-full relative">
                        <svg className="w-full h-full" viewBox="0 0 500 150">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Grid Lines */}
                          <line x1="0" y1="30" x2="500" y2="30" stroke="#27272a" strokeDasharray="3,3" />
                          <line x1="0" y1="80" x2="500" y2="80" stroke="#27272a" strokeDasharray="3,3" />
                          <line x1="0" y1="130" x2="500" y2="130" stroke="#27272a" strokeDasharray="3,3" />
                          
                          {/* Line Chart Path */}
                          <path
                            d="M 10,130 Q 80,90 150,110 T 300,50 T 420,60 T 500,20 L 500,150 L 10,150 Z"
                            fill="url(#chartGrad)"
                          />
                          <path
                            d="M 10,130 Q 80,90 150,110 T 300,50 T 420,60 T 500,20"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3.5"
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-3">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    {/* Difficulty Donut Chart */}
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-6">Difficulty Split</h4>
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-32 h-32 relative flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#27272a" strokeWidth="2.5" />
                            {/* Easy segment: e.g. 50% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="50 50" strokeDashoffset="0" />
                            {/* Medium segment: e.g. 30% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="30 70" strokeDashoffset="-50" />
                            {/* Hard segment: e.g. 20% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-80" />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-[9px] font-bold uppercase text-zinc-500 block">Total</span>
                            <span className="text-sm font-black">{stats.totalProblems}</span>
                          </div>
                        </div>

                        <div className="w-full text-[10px] space-y-1.5 font-mono">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Easy</span>
                            <span className="font-bold text-zinc-400">{stats.difficultyDistribution.easy} problems</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium</span>
                            <span className="font-bold text-zinc-400">{stats.difficultyDistribution.medium} problems</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hard</span>
                            <span className="font-bold text-zinc-400">{stats.difficultyDistribution.hard} problems</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Performers & Recent Log Transactions */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span>Leaderboard Leaders (⚡)</span>
                      </h4>
                      <div className="divide-y divide-zinc-850">
                        {stats.topPerformers.map((user: any, idx: number) => (
                           <div key={user.username} className="py-3.5 flex justify-between items-center text-xs">
                             <div className="flex items-center gap-3">
                               <span className="font-bold text-zinc-500">#{idx + 1}</span>
                               <div>
                                 <h5 className="font-extrabold text-white">{user.name}</h5>
                                 <p className="text-[10px] text-zinc-500 font-mono">@{user.username}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <span className="text-indigo-400 font-black font-mono">{user.xp} ⚡</span>
                               <span className="block text-[9px] text-zinc-500">Level {user.level}</span>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Submissions Activity */}
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-emerald-400" />
                          <span>Live Execution Streams ({filteredActivity.length})</span>
                        </h4>
                        <div className="flex gap-1 bg-zinc-950/60 p-0.5 rounded-lg border border-zinc-900 items-center">
                          {(['today', 'yesterday', 'custom', 'all'] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setStreamFilter(filter)}
                              className={`px-2 py-1 rounded-md text-[9px] font-black capitalize transition-all cursor-pointer ${
                                streamFilter === filter
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              {filter === 'custom' ? 'Select Date' : filter}
                            </button>
                          ))}
                          {streamFilter === 'custom' && (
                            <input
                              type="date"
                              value={selectedCustomDate}
                              onChange={(e) => setSelectedCustomDate(e.target.value)}
                              className={`ml-1.5 px-2 py-0.5 rounded text-[9px] border outline-none font-bold cursor-pointer ${
                                theme === 'light'
                                  ? 'bg-white border-zinc-300 text-zinc-900'
                                  : 'bg-zinc-950 border-zinc-800 text-white'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                        {filteredActivity.length > 0 ? (
                          filteredActivity.map((act: any) => (
                            <div key={act.id} className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-900 flex justify-between items-center text-xs font-mono">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-indigo-400 font-bold block">{act.user}</span>
                                <span className="text-zinc-300 font-medium">{act.problem}</span>
                              </div>
                              <div className="text-right space-y-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  act.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>{act.status}</span>
                                <span className="block text-[8px] text-zinc-650">{formatActivityDate(act.createdAt)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-zinc-500 text-xs">
                            No submissions recorded for this date range.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black">User Directory</h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-450'}`}>
                    Manage user status settings, reset passwords, or override daily locking pathways.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>

              {/* Filters list */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                  theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'
                }`}>
                  <Search className="w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchUsers();
                    }}
                    placeholder="Search by name, username or email..."
                    className="bg-transparent border-none outline-none w-full text-xs"
                  />
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                  theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'
                }`}>
                  <Filter className="w-4 h-4 text-zinc-500" />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                    }}
                    className="bg-transparent border-none outline-none w-full text-xs font-bold cursor-pointer text-zinc-500"
                  >
                    <option value="" className="bg-zinc-900 text-white">All Roles</option>
                    <option value="USER" className="bg-zinc-900 text-white">User</option>
                    <option value="ADMIN" className="bg-zinc-900 text-white">Admin</option>
                    <option value="SUPER_ADMIN" className="bg-zinc-900 text-white">Super Admin</option>
                    <option value="CONTENT_MANAGER" className="bg-zinc-900 text-white">Content Manager</option>
                    <option value="MODERATOR" className="bg-zinc-900 text-white">Moderator</option>
                    <option value="SUPPORT_STAFF" className="bg-zinc-900 text-white">Support Staff</option>
                  </select>
                </div>

                <button 
                  onClick={fetchUsers}
                  className={`py-2.5 rounded-xl border font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all cursor-pointer ${
                    theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-850 text-zinc-200'
                  }`}
                >
                  Apply Search
                </button>
              </div>

              {/* Users table */}
              {loadingUsers ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-mono">Fetching users details directory...</span>
                </div>
              ) : (
                <div className={`border rounded-2xl overflow-hidden ${
                  theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={`text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 border-b ${
                        theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-850'
                      }`}>
                        <tr>
                          <th className="p-4">Full Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Module Position</th>
                          <th className="p-4">Submissions</th>
                          <th className="p-4">⚡</th>
                          <th className="p-4">Coins</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {usersList.map((user) => (
                          <tr 
                            key={user.id} 
                            onClick={() => setSelectedUser(user)}
                            className={`group cursor-pointer hover:bg-indigo-500/5 transition-colors ${
                              selectedUser?.id === user.id ? 'bg-indigo-500/10' : ''
                            }`}
                          >
                            <td className="p-4">
                              <div>
                                <h5 className="font-extrabold group-hover:text-indigo-400 transition-colors">{user.profile?.name || 'No Name'}</h5>
                                <span className="text-[10px] text-zinc-500 font-mono">@{user.profile?.username || 'user'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-zinc-400 font-mono">{user.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                                user.role === 'SUPER_ADMIN' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : user.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}>{user.role}</span>
                            </td>
                            <td className="p-4 font-mono text-zinc-400">
                              Mod {user.currentModule} • Day {user.currentDay}
                            </td>
                            <td className="p-4 font-mono text-zinc-400">{user.submissionsCount}</td>
                            <td className="p-4 font-mono text-indigo-400 font-black">{user.profile?.xp || 0}</td>
                            <td className="p-4 font-mono text-amber-500 font-black">{user.profile?.coins || 0}</td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleResetPassword(user.id)}
                                  className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                    theme === 'light' ? 'bg-zinc-100 border-zinc-250 hover:bg-zinc-200 text-zinc-800' : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-800 text-zinc-200'
                                  }`}
                                  title="Reset password"
                                >
                                  Reset Pass
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold cursor-pointer"
                                  title="Delete user permanently"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Export buttons */}
                  <div className={`p-4 border-t flex justify-between items-center text-xs ${
                    theme === 'light' ? 'border-zinc-200' : 'border-zinc-850'
                  }`}>
                    <span className="text-zinc-500 font-mono">Found {usersList.length} users</span>
                    <button
                      onClick={() => handleExportCSV(usersList.map(u => ({
                        id: u.id,
                        name: u.profile?.name,
                        username: u.profile?.username,
                        email: u.email,
                        role: u.role,
                        xp: u.profile?.xp,
                        coins: u.profile?.coins,
                        streak: u.streak
                      })), 'users_export.csv')}
                      className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        theme === 'light' ? 'bg-zinc-100 border-zinc-250 hover:bg-zinc-200 text-zinc-800' : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      <span>Export Directory to CSV</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Side Drawer: Selected User details overrides */}
              {selectedUser && (
                <div className={`p-6 rounded-2xl border space-y-6 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-lg' : 'bg-zinc-900 border-zinc-850'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Selected user overrides</span>
                      <h3 className="text-lg font-black text-white mt-1">{selectedUser.profile?.name}</h3>
                      <p className="text-xs text-zinc-500 font-mono">@{selectedUser.profile?.username} • {selectedUser.email}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedUser(null)} 
                      className="text-xs font-bold text-zinc-500 hover:text-white cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase">Streak status</span>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-white">{selectedUser.streak} days</span>
                      </div>
                      <button 
                        onClick={handleResetStreak}
                        className="text-[9px] text-rose-400 hover:underline block mt-2"
                      >
                        Reset streak to 0
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase">⚡ Level</span>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white">{selectedUser.profile?.xp || 0} ⚡</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => handleGrantReward('xp', 50)} 
                          className="text-[9px] text-indigo-400 hover:underline"
                        >
                          +50 ⚡
                        </button>
                        <button 
                          onClick={() => handleGrantReward('xp', 250)} 
                          className="text-[9px] text-indigo-400 hover:underline"
                        >
                          +250 ⚡
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase">Coins bank</span>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-white">{selectedUser.profile?.coins || 0} Coins</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => handleGrantReward('coins', 10)} 
                          className="text-[9px] text-amber-400 hover:underline"
                        >
                          +10 Coins
                        </button>
                        <button 
                          onClick={() => handleGrantReward('coins', 100)} 
                          className="text-[9px] text-amber-400 hover:underline"
                        >
                          +100 Coins
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase">Curriculum Position</span>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-zinc-500" />
                        <span className="font-bold text-white">Mod {selectedUser.currentModule} • Day {selectedUser.currentDay}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => handleProgressUnlock('module', selectedUser.currentModule + 1)} 
                          className="text-[9px] text-emerald-400 hover:underline"
                        >
                          Unlock Next Module
                        </button>
                        <button 
                          onClick={() => handleProgressLock(selectedUser.currentModule)} 
                          className="text-[9px] text-rose-400 hover:underline"
                        >
                          Lock Current
                        </button>
                      </div>
                    </div>
                    
                    {/* User-Specific Module Key Overrides */}
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 space-y-3 md:col-span-4">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Individual Module Key Access Overrides (Key Unlock)</h4>
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Check modules to explicitly grant this user access by module key. This unlocks the module uniquely for this user, separate from sequential progress rules.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1 text-zinc-300 font-mono">
                        {[1, 2, 3, 4, 5, 6, 7].map(num => {
                          const isExplicit = selectedUser.unlockedWeeks && selectedUser.unlockedWeeks.includes(num);
                          const isSequential = selectedUser.currentModule >= num;
                          const isUnlocked = isExplicit || isSequential;
                          
                          return (
                            <label 
                              key={num} 
                              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isExplicit
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : isSequential
                                    ? 'bg-zinc-800/40 border-zinc-700/50 text-zinc-500'
                                    : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:border-zinc-800'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold">Module {num}</span>
                                <span className="text-[8px] font-mono text-zinc-500">Key: module-{num}-key</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isUnlocked}
                                disabled={isSequential}
                                onChange={() => handleToggleModuleAccess(num, isExplicit)}
                                className="rounded border-zinc-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Manual Badge Assigner */}
                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-3 text-xs">
                      <h5 className="font-bold text-white">Award Seasonal Badge Manually</h5>
                      <div className="flex gap-2">
                        {['Python Wizard', 'Streak Master', 'Algorithm Hero', 'SQL Guru'].map(b => (
                          <button
                            key={b}
                            onClick={() => handleAwardBadge(b)}
                            className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                          >
                            Award {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Role overrides */}
                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-3 text-xs">
                      <h5 className="font-bold text-white">Administrator Role Access Controls</h5>
                      <div className="flex gap-2">
                        {['USER', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'].map(r => (
                          <button
                            key={r}
                            onClick={() => handleChangeRole(selectedUser.id, r)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              selectedUser.role === r 
                                ? 'bg-indigo-600 text-white border-transparent'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                            }`}
                          >
                            Set {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHALLENGE EDITOR */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black">Challenge Database</h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-450'}`}>
                    Create, edit, or remove coding exercises, SQL evaluations, and puzzles.
                  </p>
                </div>
                <button
                  onClick={() => openProblemEditor()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Problem</span>
                </button>
              </div>

              {/* Problems list table */}
              {loadingProblems ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-mono">Loading challenges directory...</span>
                </div>
              ) : (
                <div className={`border rounded-2xl overflow-hidden ${
                  theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={`text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 border-b ${
                        theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-850'
                      }`}>
                        <tr>
                          <th className="p-4">Title</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Difficulty</th>
                          <th className="p-4">⚡ Reward</th>
                          <th className="p-4">Test Cases</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {problemsList.map((prob) => (
                          <tr key={prob.id} className="hover:bg-indigo-500/5 transition-colors">
                            <td className="p-4 font-bold text-white">
                              <div>
                                <h5 className="font-extrabold">{prob.title}</h5>
                                <span className="text-[10px] text-zinc-500 font-mono">{prob.slug}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {prob.type}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                prob.difficulty === 'EASY' ? 'text-emerald-400 bg-emerald-500/10'
                                : prob.difficulty === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10'
                                : 'text-rose-400 bg-rose-500/10'
                              }`}>{prob.difficulty}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-indigo-400">+{prob.points} ⚡</td>
                            <td className="p-4 font-mono text-zinc-400">{prob.testCases?.length || 0} loaded</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openProblemEditor(prob)}
                                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    theme === 'light' ? 'bg-zinc-100 border-zinc-255 text-zinc-850 hover:bg-zinc-200' : 'bg-zinc-950 border-zinc-900 text-zinc-200 hover:bg-zinc-800'
                                  }`}
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteProblem(prob.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Problem Editor / Creator Modal */}
              {showProblemEditor && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4">
                  <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-2xl border shadow-2xl space-y-6 ${
                    theme === 'light' ? 'bg-white border-zinc-250 text-zinc-900' : 'bg-zinc-900 border-zinc-850 text-white'
                  }`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black">{selectedProblem ? 'Modify Challenge' : 'Create Custom Challenge'}</h3>
                      <button 
                        onClick={() => setShowProblemEditor(false)}
                        className="text-xs text-zinc-500 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveProblem} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Problem Title</label>
                          <input
                            type="text"
                            required
                            value={problemForm.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProblemForm((prev: any) => ({
                                ...prev,
                                title: val,
                                slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                              }));
                            }}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">URL Slug</label>
                          <input
                            type="text"
                            required
                            value={problemForm.slug}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, slug: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Challenge Type</label>
                          <select
                            value={problemForm.type}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, type: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                            }`}
                          >
                            <option value="CODING">Coding</option>
                            <option value="SQL">SQL Database</option>
                            <option value="APTITUDE">Aptitude</option>
                            <option value="INTERVIEW">Interview Theory</option>
                            <option value="PUZZLE">Puzzle Logic</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Difficulty</label>
                          <select
                            value={problemForm.difficulty}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, difficulty: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                            }`}
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">⚡ Points</label>
                          <input
                            type="number"
                            value={problemForm.points}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, points: Number(e.target.value) }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Tags (comma separated)</label>
                          <input
                            type="text"
                            value={problemForm.tags}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, tags: e.target.value }))}
                            placeholder="arrays, math, recursion"
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-zinc-400">Problem Description (Markdown Supported)</label>
                        <textarea
                          rows={6}
                          required
                          value={problemForm.description}
                          onChange={(e) => setProblemForm((prev: any) => ({ ...prev, description: e.target.value }))}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none font-mono ${
                            theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                          }`}
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Input Format</label>
                          <textarea
                            rows={3}
                            value={problemForm.inputFormat}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, inputFormat: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-880 text-white'
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Output Format</label>
                          <textarea
                            rows={3}
                            value={problemForm.outputFormat}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, outputFormat: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-880 text-white'
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Constraints</label>
                          <textarea
                            rows={3}
                            value={problemForm.constraints}
                            onChange={(e) => setProblemForm((prev: any) => ({ ...prev, constraints: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                              theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-880 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Test Case manager inside modal */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                          <h4 className="text-xs font-black uppercase text-zinc-300">Test Cases Evaluation Set</h4>
                          <button
                            type="button"
                            onClick={addFormTestCase}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Testcase</span>
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {problemForm.testCases.map((tc: any, index: number) => (
                            <div key={index} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-900 flex gap-4 items-start">
                              <div className="flex-grow grid md:grid-cols-2 gap-3 text-[11px] font-mono">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-extrabold uppercase text-zinc-500">Input Data</span>
                                  <textarea
                                    rows={2}
                                    value={tc.input}
                                    onChange={(e) => updateFormTestCase(index, 'input', e.target.value)}
                                    className="w-full p-1.5 bg-zinc-900 border border-zinc-800 rounded outline-none text-white text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-extrabold uppercase text-zinc-500">Expected Output</span>
                                  <textarea
                                    rows={2}
                                    value={tc.expected}
                                    onChange={(e) => updateFormTestCase(index, 'expected', e.target.value)}
                                    className="w-full p-1.5 bg-zinc-900 border border-zinc-800 rounded outline-none text-white text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 justify-center items-end shrink-0 pt-3">
                                <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={tc.isSample}
                                    onChange={(e) => updateFormTestCase(index, 'isSample', e.target.checked)}
                                    className="rounded border-zinc-800"
                                  />
                                  <span>Sample Case</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeFormTestCase(index)}
                                  className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl text-white text-xs font-black tracking-wider uppercase cursor-pointer"
                      >
                        {selectedProblem ? 'Save Modifications' : 'Publish Problem'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PDF ROADMAP IMPORT */}
          {activeTab === 'syllabus' && (
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-850 space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-400" />
                  <span>Import PDF Syllabus Syllabus</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Upload educational syllabus guides or custom interview question banks. The system's parsing module extracts numbered topic sequences, partitions chapters into 7-day modules, and attaches daily practice challenges.
                </p>
              </div>

              <form onSubmit={handleSyllabusUpload} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3 hover:border-indigo-500/50 transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSyllabusFile(e.target.files[0]);
                        setSyllabusError(null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={syllabusUploading}
                  />
                  <FileText className="w-12 h-12 text-zinc-500" />
                  {syllabusFile ? (
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">{syllabusFile.name}</p>
                      <p className="text-[10px] text-zinc-500">{(syllabusFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                  disabled={syllabusUploading || !syllabusFile}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {syllabusUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing & Generating Path...</span>
                    </>
                  ) : (
                    <span>Compile PDF Roadmap</span>
                  )}
                </button>
              </form>

              {syllabusError && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{syllabusError}</span>
                </div>
              )}

              {syllabusSuccess && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2 text-xs text-emerald-400">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="font-bold">Path Generated Successfully!</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-6">
                    Syllabus path <span className="text-white font-bold">"{syllabusSuccess.title}"</span> compiled and added to learning options. You can now select it inside your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className={`p-6 rounded-2xl border space-y-6 ${
              theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
            }`}>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-400" />
                  <span>Platform Announcements Broadcast</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Send global notifications or broadcast announcements to warn users of maintenance, releases, or achievements.
                </p>
              </div>

              <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-400">Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="E.g., Module 3 Release!"
                    className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                      theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-400">Content / Body</label>
                  <textarea
                    rows={4}
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Type details..."
                    className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                      theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-lg text-xs font-bold text-white cursor-pointer"
                >
                  Broadcast Announcement
                </button>
              </form>

              {annSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Announcement sent and broadcasted to all active learning paths!</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT LOGS & SUPPORT TICKETS */}
          {activeTab === 'logs' && (
            <div className="space-y-8">
              {/* Support Tickets Section */}
              <div className={`p-6 rounded-2xl border space-y-4 ${
                theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
              }`}>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <span>Pending Support Desk Tickets</span>
                </h3>
                
                {loadingLogs ? (
                  <div className="h-24 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : supportRequests.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono">No support tickets found.</p>
                ) : (
                  <div className="space-y-3">
                    {supportRequests.map((req) => (
                      <div key={req.id} className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900 flex justify-between items-start text-xs font-mono">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500">From: {req.name} ({req.email})</span>
                          <h5 className="font-extrabold text-white">{req.subject}</h5>
                          <p className="text-zinc-400 font-sans leading-relaxed">{req.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            req.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>{req.status}</span>
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => handleResolveTicket(req.id, 'RESOLVED')}
                              className="text-[9px] text-indigo-400 hover:underline cursor-pointer"
                            >
                              Mark resolved
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Logs */}
              <div className={`p-6 rounded-2xl border space-y-4 ${
                theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'
              }`}>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span>Security Action Audit Logs</span>
                </h3>

                {loadingLogs ? (
                  <div className="h-24 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono">No security logs recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 flex justify-between items-center text-[11px] font-mono">
                        <div>
                          <span className="text-indigo-400 font-bold">[{log.action}]</span>
                          <span className="text-zinc-300 ml-2">by {log.adminEmail}</span>
                          <p className="text-zinc-500 text-[10px] mt-1">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: EXAM SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black">Exam Security Dashboard</h2>
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Monitor violations, manage locked assessments, and configure security rules.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportViolations('csv')}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      theme === 'light' ? 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportViolations('json')}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      theme === 'light' ? 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={fetchSecurityData}
                    disabled={loadingSecurity}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      theme === 'light' ? 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSecurity ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className={`flex gap-1 p-1 rounded-xl border ${theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart2 },
                  { id: 'violations', label: 'Violations', icon: AlertTriangle },
                  { id: 'locked', label: 'Locked', icon: Lock },
                  { id: 'audit', label: 'Audit Log', icon: Shield },
                  { id: 'config', label: 'Configuration', icon: Settings },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSecuritySubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        securitySubTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {tab.id === 'locked' && lockedAssessments.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">{lockedAssessments.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Overview Sub-tab */}
              {securitySubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  {securityDashboard ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Violations', value: securityDashboard.totalViolations, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Locked Assessments', value: securityDashboard.lockedAssessments, icon: Lock, color: 'text-red-400', bg: 'bg-red-500/10' },
                        { label: 'Currently Locked', value: securityDashboard.currentlyLockedUsers, icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                        { label: 'Active Sessions', value: securityDashboard.activeSessions, icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Total Sessions', value: securityDashboard.totalSessions, icon: BarChart2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        { label: "Today's Violations", value: securityDashboard.violationsToday, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        { label: 'Repeat Offenders', value: securityDashboard.repeatOffenders?.length || 0, icon: Users, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                        { label: 'Violation Types', value: securityDashboard.mostCommonViolations?.length || 0, icon: Filter, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                      ].map((stat, i) => {
                        const StatIcon = stat.icon;
                        return (
                          <div key={i} className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-extrabold uppercase ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{stat.label}</span>
                              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <StatIcon className={`w-4 h-4 ${stat.color}`} />
                              </div>
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    </div>
                  )}

                  {/* Most Common Violation Types */}
                  {securityDashboard?.mostCommonViolations?.length > 0 && (
                    <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                      <h3 className={`text-base font-black flex items-center gap-2 mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        Most Common Violation Types
                      </h3>
                      <div className="space-y-2.5">
                        {securityDashboard.mostCommonViolations.map((v: any, i: number) => {
                          const maxCount = Math.max(...securityDashboard.mostCommonViolations.map((x: any) => x.count));
                          const pct = Math.round((v.count / maxCount) * 100);
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={`font-bold ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>{v.type.replace(/_/g, ' ')}</span>
                                <span className="text-zinc-500">{v.count}</span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden ${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Repeat Offenders */}
                  {securityDashboard?.repeatOffenders?.length > 0 && (
                    <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                      <h3 className={`text-base font-black flex items-center gap-2 mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        <Users className="w-5 h-5 text-rose-400" />
                        Repeat Offenders
                      </h3>
                      <div className="space-y-2">
                        {securityDashboard.repeatOffenders.map((o: any, i: number) => (
                          <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/40 border-zinc-850'}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500 text-xs font-bold w-5">{i + 1}</span>
                              <div>
                                <p className="text-xs font-bold text-zinc-300">{o.user?.profile?.name || 'Unknown'}</p>
                                <p className="text-[10px] text-zinc-500">{o.user?.email}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">{o.violationCount} violations</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Violations */}
                  {securityDashboard?.recentViolations?.length > 0 && (
                    <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                      <h3 className={`text-base font-black flex items-center gap-2 mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                        Recent Violations
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className={`border-b ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                              {['User', 'Type', 'Problem', 'Time'].map(h => (
                                <th key={h} className="text-left pb-2 pr-4 font-extrabold uppercase text-zinc-500 text-[10px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {securityDashboard.recentViolations.map((v: any) => (
                              <tr key={v.id} className={`transition-colors ${theme === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/30'}`}>
                                <td className="py-2 pr-4">
                                  <span className="text-zinc-300 font-semibold">{v.user?.profile?.name || 'Unknown'}</span>
                                </td>
                                <td className="py-2 pr-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    v.violationType === 'TAB_SWITCH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    v.violationType === 'EXIT_FULLSCREEN' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    v.violationType === 'DEVTOOLS' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  }`}>{v.violationType}</span>
                                </td>
                                <td className="py-2 pr-4 text-zinc-400">{v.problem?.title}</td>
                                <td className="py-2 text-zinc-600">{new Date(v.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Violations Sub-tab */}
              {securitySubTab === 'violations' && (
                <div className={`p-6 rounded-2xl border space-y-4 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Violation Logs
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">{violations.length}</span>
                    </h3>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                      <Search className="w-3 h-3 text-zinc-400" />
                      <input type="text" placeholder="Search..." value={violationSearch} onChange={e => setViolationSearch(e.target.value)} className="bg-transparent outline-none text-xs w-40" />
                    </div>
                  </div>
                  {loadingSecurity ? (
                    <div className="h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                  ) : violations.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono">No violations recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className={`border-b ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                            {['Student', 'Problem', 'Type', 'Count', 'Browser', 'OS', 'Session', 'Time', 'Actions'].map(h => (
                              <th key={h} className="text-left pb-2 pr-4 font-extrabold uppercase text-zinc-500 text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {violations
                            .filter(v =>
                              !violationSearch ||
                              v.user?.email?.toLowerCase().includes(violationSearch.toLowerCase()) ||
                              v.violationType?.toLowerCase().includes(violationSearch.toLowerCase()) ||
                              v.user?.profile?.name?.toLowerCase().includes(violationSearch.toLowerCase())
                            )
                            .map(v => (
                              <tr key={v.id} className={`transition-colors ${theme === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/30'}`}>
                                <td className="py-2 pr-4">
                                  <div className="font-semibold text-zinc-300">{v.user?.profile?.name ?? 'Unknown'}</div>
                                  <div className="text-zinc-500">{v.user?.email}</div>
                                </td>
                                <td className="py-2 pr-4 text-zinc-400 max-w-[120px] truncate">{v.problem?.title}</td>
                                <td className="py-2 pr-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    v.violationType === 'TAB_SWITCH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    v.violationType === 'EXIT_FULLSCREEN' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    v.violationType === 'DEVTOOLS' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  }`}>{v.violationType}</span>
                                </td>
                                <td className="py-2 pr-4 font-bold text-amber-400">{v.totalCount}</td>
                                <td className="py-2 pr-4 text-zinc-500">{v.browser}</td>
                                <td className="py-2 pr-4 text-zinc-500">{v.os}</td>
                                <td className="py-2 pr-4 text-zinc-500">{v.session?.status || '-'}</td>
                                <td className="py-2 pr-4 text-zinc-600 text-[10px]">{new Date(v.createdAt).toLocaleString()}</td>
                                <td className="py-2">
                                  <button
                                    onClick={() => adminIgnoreViolation(v.id)}
                                    disabled={adminActionLoading}
                                    className="text-[10px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors cursor-pointer"
                                  >
                                    Ignore
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Locked Assessments Sub-tab */}
              {securitySubTab === 'locked' && (
                <div className={`p-6 rounded-2xl border space-y-4 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                  <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    <Lock className="w-5 h-5 text-red-400" />
                    Locked Assessments
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">{lockedAssessments.length}</span>
                  </h3>
                  {loadingSecurity ? (
                    <div className="h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                  ) : lockedAssessments.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono">No locked assessments.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className={`border-b ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                            {['Student', 'Problem', 'Locked At', 'Duration', 'Unlocks At', 'Violations', 'Actions'].map(h => (
                              <th key={h} className="text-left pb-2 pr-4 font-extrabold uppercase text-zinc-500 text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {lockedAssessments.map((a: any) => {
                            const remainingSec = a.unlocksAt ? Math.max(0, Math.floor((new Date(a.unlocksAt).getTime() - Date.now()) / 1000)) : 0;
                            const remainingMin = Math.floor(remainingSec / 60);
                            const remainingStr = remainingMin > 0 ? `${remainingMin}m` : '<1m';
                            return (
                              <tr key={a.id} className={`transition-colors ${theme === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/30'}`}>
                                <td className="py-2 pr-4">
                                  <div className="font-semibold text-zinc-300">{a.user?.profile?.name || 'Unknown'}</div>
                                  <div className="text-zinc-500">{a.user?.email}</div>
                                </td>
                                <td className="py-2 pr-4 text-zinc-400">{a.problem?.title}</td>
                                <td className="py-2 pr-4 text-zinc-500 text-[10px]">{new Date(a.lockedAt).toLocaleString()}</td>
                                <td className="py-2 pr-4 text-zinc-400">{a.lockDuration} min</td>
                                <td className="py-2 pr-4">
                                  <span className={remainingSec > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{remainingStr}</span>
                                  <span className="text-zinc-600 text-[10px] ml-1">{a.unlocksAt ? new Date(a.unlocksAt).toLocaleTimeString() : '-'}</span>
                                </td>
                                <td className="py-2 pr-4 text-amber-400 font-bold">{a.violationCount}/{a.maxViolations}</td>
                                <td className="py-2">
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => adminUnlockAssessment(a.id)}
                                      disabled={adminActionLoading}
                                      className="text-[10px] px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors cursor-pointer"
                                    >
                                      Unlock
                                    </button>
                                    <button
                                      onClick={() => { setExtendLockSessionId(a.id); setShowExtendModal(true); }}
                                      className="text-[10px] px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 transition-colors cursor-pointer"
                                    >
                                      Extend
                                    </button>
                                    <button
                                      onClick={() => adminResetViolations(a.id)}
                                      disabled={adminActionLoading}
                                      className="text-[10px] px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 transition-colors cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Audit Log Sub-tab */}
              {securitySubTab === 'audit' && (
                <div className={`p-6 rounded-2xl border space-y-4 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                  <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Security Audit Log
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px]">{securityAuditLogs.length}</span>
                  </h3>
                  {loadingSecurity ? (
                    <div className="h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                  ) : securityAuditLogs.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono">No security events recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className={`border-b ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                            {['User', 'Action', 'Details', 'IP Address', 'Timestamp'].map(h => (
                              <th key={h} className="text-left pb-2 pr-4 font-extrabold uppercase text-zinc-500 text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {securityAuditLogs.map((e: any) => (
                            <tr key={e.id} className={`transition-colors ${theme === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/30'}`}>
                              <td className="py-2 pr-4 text-zinc-300">{e.user?.profile?.name || e.user?.email || 'System'}</td>
                              <td className="py-2 pr-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  e.action.includes('LOCKED') || e.action.includes('VIOLATION') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  e.action.includes('UNLOCKED') || e.action.includes('RESUMED') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  e.action.includes('STARTED') || e.action.includes('SUBMITTED') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}>{e.action}</span>
                              </td>
                              <td className="py-2 pr-4 text-zinc-500 max-w-[200px] truncate">{e.details}</td>
                              <td className="py-2 pr-4 text-zinc-600">{e.ipAddress || '-'}</td>
                              <td className="py-2 text-zinc-600 text-[10px]">{new Date(e.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Configuration Sub-tab */}
              {securitySubTab === 'config' && (
                <div className={`p-6 rounded-2xl border space-y-5 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-850'}`}>
                  <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Secure Mode Configuration
                  </h3>

                  {loadingSecurity ? (
                    <div className="h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                  ) : !examConfigForm ? (
                    <p className="text-xs text-zinc-500">No configuration found. Refresh to load defaults.</p>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Max Violations</label>
                          <input type="number" min={1} max={10} value={examConfigForm.maxViolations ?? 3} onChange={e => setExamConfigForm((p: any) => ({ ...p, maxViolations: parseInt(e.target.value) }))}
                            className={`w-32 p-2.5 rounded-lg border text-xs outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Lock Duration (minutes)</label>
                          <input type="number" min={1} max={120} value={examConfigForm.lockDurationMinutes ?? 30} onChange={e => setExamConfigForm((p: any) => ({ ...p, lockDurationMinutes: parseInt(e.target.value) }))}
                            className={`w-32 p-2.5 rounded-lg border text-xs outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Auto-Save Interval (seconds)</label>
                          <input type="number" min={5} max={120} value={examConfigForm.autoSaveInterval ?? 15} onChange={e => setExamConfigForm((p: any) => ({ ...p, autoSaveInterval: parseInt(e.target.value) }))}
                            className={`w-32 p-2.5 rounded-lg border text-xs outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Violation Reset Policy</label>
                          <select value={examConfigForm.violationResetPolicy ?? 'AFTER_ASSESSMENT'} onChange={e => setExamConfigForm((p: any) => ({ ...p, violationResetPolicy: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'}`}>
                            <option value="AFTER_ASSESSMENT">After Assessment Ends</option>
                            <option value="MANUAL">Manual Only (Admin)</option>
                            <option value="DAILY">Daily Reset</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'fullscreenEnabled', label: 'Enforce Fullscreen' },
                          { key: 'tabSwitchEnabled', label: 'Detect Tab Switch' },
                          { key: 'copyPasteDisabled', label: 'Disable Copy/Paste' },
                          { key: 'rightClickDisabled', label: 'Block Right Click' },
                          { key: 'devToolsDisabled', label: 'Block DevTools Keys' },
                          { key: 'windowFocusDetection', label: 'Window Focus Detection' },
                          { key: 'enforceFullScreen', label: 'Require Full Screen' },
                          { key: 'autoSaveEnabled', label: 'Enable Auto-Save' },
                        ].map(({ key, label }) => (
                          <label key={key} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                            examConfigForm[key]
                              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                              : theme === 'light' ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-800 bg-zinc-950/40 text-zinc-500'
                          }`}>
                            <input type="checkbox" className="accent-emerald-500" checked={!!examConfigForm[key]}
                              onChange={e => setExamConfigForm((p: any) => ({ ...p, [key]: e.target.checked }))} />
                            <span className="text-xs font-semibold">{label}</span>
                          </label>
                        ))}
                      </div>

                      {(['warningMsg1', 'warningMsg2', 'warningMsg3'] as const).map((key, i) => (
                        <div key={key} className="space-y-1.5">
                          <label className={`text-[10px] font-extrabold uppercase ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-orange-400' : 'text-red-400'}`}>
                            Warning Message {i + 1} {i === 2 ? '(Final / Auto-Submit)' : ''}
                          </label>
                          <textarea rows={2} value={examConfigForm[key] ?? ''}
                            onChange={e => setExamConfigForm((p: any) => ({ ...p, [key]: e.target.value }))}
                            className={`w-full p-2.5 rounded-lg border text-xs outline-none resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'}`} />
                        </div>
                      ))}

                      <div className="flex items-center gap-3">
                        <button onClick={saveExamConfig} disabled={savingConfig}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-all rounded-xl text-white text-xs font-bold cursor-pointer">
                          {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Configuration
                        </button>
                        {configSaved && <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Saved!</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* Modal: Create User Account */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-8 rounded-2xl border shadow-2xl space-y-6 ${
            theme === 'light' ? 'bg-white border-zinc-250 text-zinc-900' : 'bg-zinc-900 border-zinc-850 text-white'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">Register User Account</h3>
              <button 
                onClick={() => setShowCreateUserModal(false)}
                className="text-xs text-zinc-500 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-955' : 'bg-zinc-950 border-zinc-800 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-400">Username</label>
                <input
                  type="text"
                  required
                  value={createUserForm.username}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-955' : 'bg-zinc-950 border-zinc-800 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-955' : 'bg-zinc-950 border-zinc-800 text-white'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-400">Initial Password</label>
                <input
                  type="password"
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-955' : 'bg-zinc-950 border-zinc-800 text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl text-white text-xs font-black tracking-wider uppercase cursor-pointer"
              >
                Register & Save Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Extend Lock Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4">
          <div className={`max-w-sm w-full p-6 rounded-2xl border shadow-2xl space-y-4 ${theme === 'light' ? 'bg-white border-zinc-250 text-zinc-900' : 'bg-zinc-900 border-zinc-850 text-white'}`}>
            <h3 className="text-lg font-black">Extend Lock Duration</h3>
            <p className="text-xs text-zinc-400">Increase the lock time for this assessment session.</p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-zinc-400">Additional Minutes</label>
              <select
                value={extendLockMinutes}
                onChange={e => setExtendLockMinutes(parseInt(e.target.value))}
                className={`w-full p-2.5 rounded-lg border text-xs outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-white'}`}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExtendModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                  theme === 'light' ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={adminExtendLock}
                disabled={adminActionLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer"
              >
                {adminActionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Extend Lock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
