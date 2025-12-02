import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Coffee, Zap, Save, RefreshCw, Server, AlertCircle, CheckCircle, User, LogIn } from 'lucide-react';

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [apiUrl, setApiUrl] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    duration: 15,
    mood: 7,
    productivity: 7,
    activities: {
      coffee: false,
      exercise: false,
      reading: false,
      meditation: false
    }
  });

  // Load API URL & User from local storage
  useEffect(() => {
    const savedUrl = localStorage.getItem('solver_api_url');
    const savedUser = localStorage.getItem('solver_user_id');
    if (savedUrl) setApiUrl(savedUrl);
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

  const toggleActivity = (key) => {
    setFormData(prev => ({
      ...prev,
      activities: { ...prev.activities, [key]: !prev.activities[key] }
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
    
    const activityList = Object.keys(formData.activities).filter(k => formData.activities[k]);
    const payload = {
      userId: userId, // Include User ID in payload
      duration: parseInt(formData.duration),
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
      setFormData(prev => ({...prev, mood: 5, productivity: 5}));
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

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Solver Society
            </h1>
            <p className="text-slate-400 text-sm">Identify yourself to access the optimization engine.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-300 font-medium mb-2">Username / Agent ID</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. Solver001"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">API Endpoint</label>
              <div className="relative">
                <Server className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={handleApiSave}
                  placeholder="Paste AWS API Gateway URL..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/50"
            >
              <LogIn size={20} />
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Solver Society
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome, <span className="text-indigo-400 font-mono">{userId}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="hidden md:flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 opacity-50">
              <Server size={14} className="text-indigo-400" />
              <span className="text-xs text-slate-400 max-w-[150px] truncate">{apiUrl}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Notifications */}
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 z-50 ${
            notification.type === 'error' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-emerald-900/50 border-emerald-500 text-emerald-200'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => switchTab('input')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'input' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            <Zap size={18} />
            Input Data
          </button>
          <button 
            onClick={() => switchTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            <Activity size={18} />
            Solver Results
          </button>
        </div>

        {/* INPUT VIEW */}
        {activeTab === 'input' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="text-indigo-400" />
              Log Morning Routine
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Duration Slider */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-medium">Total Duration (Minutes)</label>
                  <span className="text-indigo-400 font-mono font-bold text-lg">{formData.duration} min</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Mood & Productivity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-medium">Mood Score</label>
                    <span className="text-cyan-400 font-mono font-bold text-lg">{formData.mood}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={formData.mood}
                    onChange={(e) => setFormData({...formData, mood: e.target.value})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Groggy</span>
                    <span>Ecstatic</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-medium">Productivity</label>
                    <span className="text-emerald-400 font-mono font-bold text-lg">{formData.productivity}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={formData.productivity}
                    onChange={(e) => setFormData({...formData, productivity: e.target.value})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Distracted</span>
                    <span>Laser Focus</span>
                  </div>
                </div>
              </div>

              {/* Activities Toggles */}
              <div>
                <label className="block text-slate-300 font-medium mb-4">Activities Completed</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(formData.activities).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleActivity(key)}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                        formData.activities[key] 
                          ? 'bg-indigo-900/30 border-indigo-500 text-indigo-200' 
                          : 'bg-slate-750 border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <span className="capitalize font-medium">{key}</span>
                      {formData.activities[key] && <CheckCircle size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Save />}
                Calculate Solver Score
              </button>
            </form>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="text-indigo-400" />
                Performance Metrics
              </h2>
              <button 
                onClick={fetchRoutines}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Chart */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-80">
              {routines.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={routines}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tickFormatter={(value) => value ? value.substring(5) : ''}
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="solver_score" name="Solver Score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Activity size={48} className="mb-2 opacity-50" />
                  <p>No data found for user {userId}. Start logging!</p>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Activities</th>
                      <th className="px-6 py-4 text-center">Time</th>
                      <th className="px-6 py-4 text-center">Mood</th>
                      <th className="px-6 py-4 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {routines.map((r, index) => (
                      <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-400">{r.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {r.activities && r.activities.map((a, i) => (
                              <span key={i} className="px-2 py-1 bg-indigo-900/40 text-indigo-300 text-xs rounded border border-indigo-500/20">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono">{r.duration}m</td>
                        <td className="px-6 py-4 text-center font-mono text-cyan-400">{r.mood}</td>
                        <td className="px-6 py-4 text-center font-bold text-indigo-400">{r.solver_score}</td>
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
