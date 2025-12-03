import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Coffee, Zap, Save, RefreshCw, Server, AlertCircle, CheckCircle, User, LogIn, ChevronRight, BookOpen, Dumbbell, Sparkles, ShowerHead } from 'lucide-react';

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  
  // AUTOMATION UPDATE: Check for Environment Variable or Local Storage default
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('solver_api_url') || process.env.REACT_APP_API_URL || ''
  );
  
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [notification, setNotification] = useState(null);

  // UPDATED: Form State now tracks specific durations
  const [formData, setFormData] = useState({
    mood: 7,
    productivity: 7,
    hasCoffee: false,
    durations: {
      exercise: 0,
      reading: 0,
      meditation: 0,
      core: 20 // Default "getting ready" time
    }
  });

  // Calculate total duration derived from individual times
  const totalDuration = Object.values(formData.durations).reduce((a, b) => parseInt(a) + parseInt(b), 0);

  // Load User from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('solver_user_id');
    if (savedUser) {
      setUserId(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApiSave = (e) => {
    const url = e.target.value;
    setApiUrl(url);
    localStorage.setItem('solver_api_url', url);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (userId.trim().length > 0) {
      localStorage.setItem('solver_user_id', userId);
      setIsLoggedIn(true);
      fetchRoutines();
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('solver_user_id');
    setRoutines([]);
    setUserId('');
  };

  const updateDuration = (key, value) => {
    setFormData(prev => ({
      ...prev,
      durations: { ...prev.durations, [key]: parseInt(value) || 0 }
    }));
  };

  const fetchRoutines = async () => {
    if (!apiUrl || !userId) return;
    setLoading(true);
    try {
      // Append /routines and query param for userId
      const baseUrl = apiUrl.endsWith('/routines') ? apiUrl : `${apiUrl}/routines`;
      const endpoint = `${baseUrl}?userId=${encodeURIComponent(userId)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setRoutines(data);
      if(activeTab === 'dashboard' && isLoggedIn) showNotification('success', 'Data refreshed successfully');
    } catch (error) {
      console.error("Fetch error:", error);
      showNotification('error', 'Failed to fetch data. Check API URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiUrl) {
      showNotification('error', 'Please configure your API URL first.');
      return;
    }

    setLoading(true);
    
    // Construct activities list based on durations > 0
    const activityList = [];
    if (formData.hasCoffee) activityList.push('coffee');
    if (formData.durations.exercise > 0) activityList.push('exercise');
    if (formData.durations.reading > 0) activityList.push('reading');
    if (formData.durations.meditation > 0) activityList.push('meditation');
    
    const payload = {
      userId: userId,
      duration: totalDuration,
      mood: parseInt(formData.mood),
      productivity: parseInt(formData.productivity),
      activities: activityList,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const endpoint = apiUrl.endsWith('/routines') ? apiUrl : `${apiUrl}/routines`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit');

      showNotification('success', 'Routine logged via Optimization Engine.');
      // Reset daily vars but keep core routine
      setFormData(prev => ({
        ...prev, 
        mood: 7, 
        productivity: 7,
        hasCoffee: false,
        durations: { ...prev.durations, exercise: 0, reading: 0, meditation: 0 }
      }));
      fetchRoutines();
      setActiveTab('dashboard');
    } catch (error) {
      showNotification('error', 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard' && routines.length === 0) {
      fetchRoutines();
    }
  };

  // Shared Background Component
  const BackgroundEffects = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]" />
    </div>
  );

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4 relative">
        <BackgroundEffects />
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
           {/* Decorative Top Border */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
           
          <div className="text-center mb-8 mt-2">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent mb-2">
              Solver Society
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase opacity-80">Optimization Engine Access</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Agent Identity</label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter Agent ID (e.g. Solver001)"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Gateway Endpoint</label>
              <div className="relative group">
                <Server className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={handleApiSave}
                  placeholder="AWS API Gateway URL..."
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              <span>Initialize Session</span>
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white p-4 md:p-8 relative">
      <BackgroundEffects />
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
              Solver Society
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-slate-400 text-sm">
                Active Agent: <span className="text-indigo-300 font-mono tracking-wide">{userId}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 p-2 px-3 rounded-lg border border-white/5 text-xs text-slate-500">
              <Server size={12} className="text-indigo-400" />
              <span className="max-w-[150px] truncate">{apiUrl}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-white/5 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
            >
              Terminate Session
            </button>
          </div>
        </header>

        {/* Notifications */}
        {notification && (
          <div className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50 backdrop-blur-md ${
            notification.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-100' : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
            <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 inline-flex backdrop-blur-sm">
                <button 
                    onClick={() => switchTab('input')}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'input' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Zap size={16} />
                    Data Entry
                </button>
                <button 
                    onClick={() => switchTab('dashboard')}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'dashboard' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Activity size={16} />
                    Analytics
                </button>
            </div>
        </div>

        {/* INPUT VIEW */}
        {activeTab === 'input' && (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Log Morning Allocation</h2>
                        <p className="text-slate-400 text-sm">Input specific times to calculate total duration.</p>
                    </div>
                </div>
                {/* Total Duration Display */}
                <div className="text-right">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Morning Time</p>
                    <p className="text-3xl font-mono font-bold text-white leading-none mt-1">
                        {totalDuration}<span className="text-lg text-indigo-400 ml-1">min</span>
                    </p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* Activity Time Allocator */}
              <div className="space-y-6">
                <label className="text-slate-300 font-medium text-sm uppercase tracking-wider block">Time Allocation (Minutes)</label>
                
                {/* Exercise */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-indigo-300">
                            <Dumbbell size={18} />
                            <span className="font-medium">Exercise</span>
                        </div>
                        <span className="font-mono text-white bg-slate-700/50 px-2 py-1 rounded text-sm min-w-[3rem] text-center">{formData.durations.exercise}m</span>
                    </div>
                    <input 
                        type="range" min="0" max="90" step="5"
                        value={formData.durations.exercise}
                        onChange={(e) => updateDuration('exercise', e.target.value)}
                        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Reading */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-indigo-300">
                            <BookOpen size={18} />
                            <span className="font-medium">Reading</span>
                        </div>
                        <span className="font-mono text-white bg-slate-700/50 px-2 py-1 rounded text-sm min-w-[3rem] text-center">{formData.durations.reading}m</span>
                    </div>
                    <input 
                        type="range" min="0" max="90" step="5"
                        value={formData.durations.reading}
                        onChange={(e) => updateDuration('reading', e.target.value)}
                        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Meditation */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-indigo-300">
                            <Sparkles size={18} />
                            <span className="font-medium">Meditation</span>
                        </div>
                        <span className="font-mono text-white bg-slate-700/50 px-2 py-1 rounded text-sm min-w-[3rem] text-center">{formData.durations.meditation}m</span>
                    </div>
                    <input 
                        type="range" min="0" max="60" step="5"
                        value={formData.durations.meditation}
                        onChange={(e) => updateDuration('meditation', e.target.value)}
                        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Core/Misc */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ShowerHead size={18} />
                            <span className="font-medium">Core Routine (Shower, Prep)</span>
                        </div>
                        <span className="font-mono text-white bg-slate-700/50 px-2 py-1 rounded text-sm min-w-[3rem] text-center">{formData.durations.core}m</span>
                    </div>
                    <input 
                        type="range" min="5" max="60" step="5"
                        value={formData.durations.core}
                        onChange={(e) => updateDuration('core', e.target.value)}
                        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-500"
                    />
                </div>
              </div>

              {/* Mood & Productivity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 p-5 bg-cyan-950/10 rounded-xl border border-cyan-900/20">
                  <div className="flex justify-between items-end">
                    <label className="text-cyan-200 font-medium text-sm uppercase tracking-wider">Mood Score</label>
                    <span className="text-cyan-400 font-mono font-bold text-2xl">{formData.mood}<span className="text-sm text-cyan-600/50 ml-1">/10</span></span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={formData.mood}
                    onChange={(e) => setFormData({...formData, mood: e.target.value})}
                    className="w-full h-2 bg-cyan-950/50 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                  />
                  <div className="flex justify-between text-xs text-cyan-700 font-medium">
                    <span>Groggy</span>
                    <span>Ecstatic</span>
                  </div>
                </div>

                <div className="space-y-4 p-5 bg-emerald-950/10 rounded-xl border border-emerald-900/20">
                  <div className="flex justify-between items-end">
                    <label className="text-emerald-200 font-medium text-sm uppercase tracking-wider">Productivity</label>
                    <span className="text-emerald-400 font-mono font-bold text-2xl">{formData.productivity}<span className="text-sm text-emerald-600/50 ml-1">/10</span></span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={formData.productivity}
                    onChange={(e) => setFormData({...formData, productivity: e.target.value})}
                    className="w-full h-2 bg-emerald-950/50 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                  />
                  <div className="flex justify-between text-xs text-emerald-700 font-medium">
                    <span>Distracted</span>
                    <span>Laser Focus</span>
                  </div>
                </div>
              </div>

              {/* Coffee Toggle */}
              <div>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, hasCoffee: !prev.hasCoffee}))}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                    formData.hasCoffee
                        ? 'bg-amber-900/20 border-amber-500/50 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                        : 'bg-slate-800/40 border-white/5 text-slate-500 hover:bg-slate-800 hover:border-white/10'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Coffee size={20} className={formData.hasCoffee ? "text-amber-400" : "text-slate-500"} />
                        <span className="font-medium">Did you have coffee?</span>
                    </div>
                    {formData.hasCoffee && <CheckCircle size={20} className="text-amber-400" />}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-3 shadow-lg shadow-indigo-900/50 hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                <span>Calculate Optimization Score</span>
              </button>
            </form>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-2 px-2">
               <h2 className="text-lg font-medium text-slate-300 flex items-center gap-2">
                <Activity className="text-indigo-400" size={20} />
                Performance Metrics
              </h2>
              <button 
                onClick={fetchRoutines}
                className="p-2 bg-slate-800/50 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 rounded-lg text-slate-400 transition-all"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Chart */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 h-80 backdrop-blur-xl shadow-lg relative">
              {routines.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={routines}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      tickFormatter={(value) => value ? value.substring(5) : ''}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                        stroke="#64748b" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.75rem', padding: '12px' }}
                      itemStyle={{ color: '#e2e8f0', fontSize: '0.875rem' }}
                      cursor={{ stroke: '#6366f1', strokeWidth: 2, opacity: 0.5 }}
                    />
                    <Line type="monotone" dataKey="solver_score" name="Solver Score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#1e1b4b', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#818cf8' }} />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Activity size={48} className="mb-4 opacity-20" />
                  <p className="text-sm">No data found for user <span className="text-indigo-400">{userId}</span>.</p>
                  <p className="text-xs mt-2 opacity-60">Start logging to see analytics.</p>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-white/5">
                    <tr>
                      <th className="px-6 py-5">Date</th>
                      <th className="px-6 py-5">Activities</th>
                      <th className="px-6 py-5 text-center">Time</th>
                      <th className="px-6 py-5 text-center">Mood</th>
                      <th className="px-6 py-5 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {routines.map((r, index) => (
                      <tr key={index} className="hover:bg-indigo-500/5 transition-colors group">
                        <td className="px-6 py-4 font-mono text-slate-400 text-xs">{r.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {r.activities && r.activities.map((a, i) => (
                              <span key={i} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-[10px] uppercase tracking-wide font-bold rounded-md border border-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">{r.duration}m</td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-cyan-400">{r.mood}</td>
                        <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full font-bold text-xs border border-indigo-500/30">
                                {r.solver_score}
                            </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}