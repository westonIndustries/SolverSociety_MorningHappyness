import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Coffee, Zap, Save, RefreshCw, Server, AlertCircle, CheckCircle, User, LogIn, ChevronRight, BookOpen, Dumbbell, Sparkles, ShowerHead, Settings, LogOut, ShieldAlert, Calculator } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

// --- FIREBASE CONFIGURATION ---
// The app checks for environment variables first.
// If missing, it will allow manual entry in the UI for testing.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
let auth = null;
try {
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  
  // API URL State
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('solver_api_url') || process.env.REACT_APP_API_URL || ''
  );
  
  // Auth State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);

  // Manual Firebase Config State (for users without .env)
  const [manualConfig, setManualConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: ''
  });
  const [needsConfig, setNeedsConfig] = useState(!firebaseConfig.apiKey);

  // Form State
  const [formData, setFormData] = useState({
    mood: 7,
    productivity: 7,
    hasCoffee: false,
    durations: { exercise: 0, reading: 0, meditation: 0, core: 20 }
  });

  const totalDuration = Object.values(formData.durations).reduce((a, b) => parseInt(a) + parseInt(b), 0);

  // Listen for auth state changes
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            // Automatically fetch data when logged in
            fetchRoutines(currentUser.email); 
        }
      });
      return () => unsubscribe();
    }
  }, [needsConfig]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleApiSave = (e) => {
    const url = e.target.value;
    setApiUrl(url);
    localStorage.setItem('solver_api_url', url);
  };

  // --- GOOGLE LOGIN LOGIC ---
  const handleGoogleLogin = async () => {
    if (!auth) {
        // Try to init with manual config if .env was missing
        try {
            const app = initializeApp(manualConfig);
            auth = getAuth(app);
            setNeedsConfig(false);
        } catch (e) {
            showNotification('error', 'Invalid Configuration Details');
            return;
        }
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showNotification('success', 'Authenticated with Google');
    } catch (error) {
      console.error(error);
      // SPECIFIC ERROR HANDLING FOR MISSING CONSOLE CONFIG
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        showNotification('error', 'Enable "Google" in Firebase Console > Authentication > Sign-in method');
      } else {
        showNotification('error', 'Login Failed: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        setRoutines([]);
    }
  };

  // --- DATA LOGIC ---
  const updateDuration = (key, value) => {
    setFormData(prev => ({
      ...prev,
      durations: { ...prev.durations, [key]: parseInt(value) || 0 }
    }));
  };

  const fetchRoutines = async (email) => {
    if (!apiUrl || !email) return;
    setLoading(true);
    try {
      // Use EMAIL as the User ID for the backend
      const baseUrl = apiUrl.endsWith('/routines') ? apiUrl : `${apiUrl}/routines`;
      const endpoint = `${baseUrl}?userId=${encodeURIComponent(email)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setRoutines(data);
    } catch (error) {
      console.error("Fetch error:", error);
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
    
    const activityList = [];
    if (formData.hasCoffee) activityList.push('coffee');
    if (formData.durations.exercise > 0) activityList.push('exercise');
    if (formData.durations.reading > 0) activityList.push('reading');
    if (formData.durations.meditation > 0) activityList.push('meditation');
    
    const payload = {
      userId: user.email, // Send Google Email as ID
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
      setFormData(prev => ({
        ...prev, 
        mood: 7, 
        productivity: 7,
        hasCoffee: false,
        durations: { ...prev.durations, exercise: 0, reading: 0, meditation: 0 }
      }));
      fetchRoutines(user.email);
      setActiveTab('dashboard');
    } catch (error) {
      showNotification('error', 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard' && routines.length === 0 && user) {
      fetchRoutines(user.email);
    }
  };

  const BackgroundEffects = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '4s'}} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '7s'}} />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '5s'}} />
    </div>
  );

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center p-4 relative text-slate-100">
        <BackgroundEffects />
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
           
          <div className="text-center mb-8 mt-2">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent mb-2">
              Solver Society
            </h1>
            <p className="text-indigo-200/60 text-xs font-medium tracking-widest uppercase">Optimization Engine Access</p>
          </div>

          {/* CONFIGURATION NEEDED SCREEN (If .env is missing) */}
          {needsConfig ? (
            <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-200 text-sm flex gap-3 items-start">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Firebase Config Missing</p>
                        <p className="opacity-80">Please add your Firebase keys to <code>.env</code> or enter them below for temporary access.</p>
                    </div>
                </div>
                
                <input 
                    type="text" 
                    placeholder="API Key"
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-300"
                    value={manualConfig.apiKey}
                    onChange={(e) => setManualConfig({...manualConfig, apiKey: e.target.value})}
                />
                 <input 
                    type="text" 
                    placeholder="Auth Domain (e.g. app.firebaseapp.com)"
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-300"
                    value={manualConfig.authDomain}
                    onChange={(e) => setManualConfig({...manualConfig, authDomain: e.target.value})}
                />
                 <input 
                    type="text" 
                    placeholder="Project ID"
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-300"
                    value={manualConfig.projectId}
                    onChange={(e) => setManualConfig({...manualConfig, projectId: e.target.value})}
                />
                <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                    Save & Connect
                </button>
            </div>
          ) : (
            // STANDARD LOGIN BUTTON
            <div className="space-y-6">
                <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-3 shadow-lg hover:-translate-y-0.5"
                >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
                </button>
            </div>
          )}

          {/* Hidden Server Config */}
          <div className="mt-8 pt-4 border-t border-white/5 text-center">
            <button 
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="text-xs text-slate-500 hover:text-indigo-400 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
                <Settings size={12} />
                <span>Connection Settings</span>
            </button>
            
            {showServerConfig && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="relative group text-left">
                        <Server className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input 
                        type="text" 
                        value={apiUrl}
                        onChange={handleApiSave}
                        placeholder="Paste AWS API Gateway URL..."
                        className="w-full bg-slate-950/30 border border-slate-700/50 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-300 focus:border-indigo-500/50 outline-none"
                        />
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-indigo-500 selection:text-white p-4 md:p-8 relative">
      <BackgroundEffects />
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
              Solver Society
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <p className="text-slate-400 text-sm">Active Agent</p>
                <p className="text-indigo-300 font-mono text-xs tracking-wide">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 border border-white/5 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm flex items-center gap-2"
            >
              <LogOut size={14} />
              Terminate Session
            </button>
          </div>
        </header>

        {notification && (
          <div className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50 backdrop-blur-md ${
            notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-100' : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        <div className="flex justify-center mb-8">
            <div className="bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 inline-flex backdrop-blur-sm shadow-xl">
                <button 
                    onClick={() => switchTab('input')}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === 'input' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-100' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 scale-95'
                    }`}
                >
                    <Zap size={16} />
                    Data Entry
                </button>
                <button 
                    onClick={() => switchTab('dashboard')}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === 'dashboard' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-100' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 scale-95'
                    }`}
                >
                    <Activity size={16} />
                    Analytics
                </button>
            </div>
        </div>

        {activeTab === 'input' && (
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Daily Log</h2>
                        <p className="text-slate-400 text-sm mt-0.5">Record morning metrics.</p>
                    </div>
                </div>
                <div className="text-right bg-slate-950/30 px-5 py-3 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Total Time</p>
                    <p className="text-3xl font-mono font-bold text-white leading-none">
                        {totalDuration}<span className="text-sm text-indigo-400 ml-1 font-sans font-medium">min</span>
                    </p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="space-y-6">
                <label className="text-slate-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Time Allocation
                </label>
                
                <div className="grid gap-4">
                    {/* Exercise */}
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 hover:bg-slate-800/40 transition-colors group">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3 text-indigo-300">
                                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors"><Dumbbell size={18} /></div>
                                <span className="font-medium text-slate-200">Exercise</span>
                            </div>
                            <span className="font-mono text-white bg-slate-900/50 border border-white/5 px-3 py-1 rounded-lg text-sm min-w-[3.5rem] text-center shadow-inner">{formData.durations.exercise}m</span>
                        </div>
                        <input 
                            type="range" min="0" max="90" step="5"
                            value={formData.durations.exercise}
                            onChange={(e) => updateDuration('exercise', e.target.value)}
                            className="w-full h-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                    </div>
                    {/* Reading */}
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 hover:bg-slate-800/40 transition-colors group">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3 text-purple-300">
                                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors"><BookOpen size={18} /></div>
                                <span className="font-medium text-slate-200">Reading</span>
                            </div>
                            <span className="font-mono text-white bg-slate-900/50 border border-white/5 px-3 py-1 rounded-lg text-sm min-w-[3.5rem] text-center shadow-inner">{formData.durations.reading}m</span>
                        </div>
                        <input 
                            type="range" min="0" max="90" step="5"
                            value={formData.durations.reading}
                            onChange={(e) => updateDuration('reading', e.target.value)}
                            className="w-full h-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                        />
                    </div>
                    {/* Meditation */}
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 hover:bg-slate-800/40 transition-colors group">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3 text-cyan-300">
                                <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors"><Sparkles size={18} /></div>
                                <span className="font-medium text-slate-200">Meditation</span>
                            </div>
                            <span className="font-mono text-white bg-slate-900/50 border border-white/5 px-3 py-1 rounded-lg text-sm min-w-[3.5rem] text-center shadow-inner">{formData.durations.meditation}m</span>
                        </div>
                        <input 
                            type="range" min="0" max="60" step="5"
                            value={formData.durations.meditation}
                            onChange={(e) => updateDuration('meditation', e.target.value)}
                            className="w-full h-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                        />
                    </div>
                    {/* Core */}
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 hover:bg-slate-800/40 transition-colors group">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="p-2 bg-slate-500/10 rounded-lg group-hover:bg-slate-500/20 transition-colors"><ShowerHead size={18} /></div>
                                <span className="font-medium text-slate-200">Core Routine</span>
                            </div>
                            <span className="font-mono text-white bg-slate-900/50 border border-white/5 px-3 py-1 rounded-lg text-sm min-w-[3.5rem] text-center shadow-inner">{formData.durations.core}m</span>
                        </div>
                        <input 
                            type="range" min="5" max="60" step="5"
                            value={formData.durations.core}
                            onChange={(e) => updateDuration('core', e.target.value)}
                            className="w-full h-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-slate-500 hover:accent-slate-400"
                        />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-gradient-to-br from-cyan-950/30 to-slate-900/30 rounded-2xl border border-cyan-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/10 transition-colors"></div>
                  <div className="flex justify-between items-end relative z-10">
                    <label className="text-cyan-200 font-bold text-xs uppercase tracking-widest">Mood Score</label>
                    <span className="text-cyan-400 font-mono font-bold text-3xl">{formData.mood}<span className="text-sm text-cyan-600/50 ml-1 font-sans">/10</span></span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={formData.mood}
                    onChange={(e) => setFormData({...formData, mood: e.target.value})}
                    className="w-full h-2 bg-slate-900/50 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 relative z-10"
                  />
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-cyan-700 font-bold relative z-10">
                    <span>Groggy</span>
                    <span>Ecstatic</span>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-gradient-to-br from-emerald-950/30 to-slate-900/30 rounded-2xl border border-emerald-900/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                  <div className="flex justify-between items-end relative z-10">
                    <label className="text-emerald-200 font-bold text-xs uppercase tracking-widest">Productivity</label>
                    <span className="text-emerald-400 font-mono font-bold text-3xl">{formData.productivity}<span className="text-sm text-emerald-600/50 ml-1 font-sans">/10</span></span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={formData.productivity}
                    onChange={(e) => setFormData({...formData, productivity: e.target.value})}
                    className="w-full h-2 bg-slate-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 relative z-10"
                  />
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-emerald-700 font-bold relative z-10">
                    <span>Distracted</span>
                    <span>Laser Focus</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, hasCoffee: !prev.hasCoffee}))}
                    className={`w-full p-5 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-300 group ${
                    formData.hasCoffee
                        ? 'bg-amber-900/20 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                        : 'bg-slate-800/20 border-white/5 hover:bg-slate-800/40 hover:border-white/10'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${formData.hasCoffee ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/30 text-slate-500'}`}>
                            <Coffee size={24} />
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold text-sm ${formData.hasCoffee ? 'text-amber-100' : 'text-slate-300'}`}>Caffeine Intake</span>
                            <span className="text-xs text-slate-500">Did you consume coffee?</span>
                        </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.hasCoffee ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-600'
                    }`}>
                        {formData.hasCoffee && <CheckCircle size={14} strokeWidth={4} />}
                    </div>
                </button>
              </div>

              {/* LIVE FORMULA PREVIEW */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/20 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none md:hidden"></div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calculator size={14} className="text-indigo-400" /> Live Formula Preview
                </h3>
                
                <div className="overflow-x-auto pb-2">
                    <div className="flex items-center text-sm font-mono min-w-max">
                        {/* Term 1: Raw Output */}
                        <div className="flex flex-col items-center p-2 rounded-lg bg-slate-900/50 border border-white/5">
                            <div className="flex gap-2 mb-1">
                                <span className="text-cyan-400 font-bold" title="Mood">{formData.mood}</span>
                                <span className="text-slate-500">+</span>
                                <span className="text-emerald-400 font-bold" title="Productivity">{formData.productivity}</span>
                            </div>
                            <div className="w-full h-px bg-slate-600 my-1"></div>
                            <span className="text-slate-300 font-bold" title="Duration">{totalDuration || 1}</span>
                        </div>

                        {/* Multiplier */}
                        <div className="mx-3 text-slate-500 font-bold">×</div>
                        <div className="flex flex-col items-center">
                            <span className="text-indigo-400 font-bold">10</span>
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Scale</span>
                        </div>

                        {/* Coffee Mod */}
                        <div className="mx-3 text-slate-500 font-bold">×</div>
                        <div className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${formData.hasCoffee ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                            <span className={`font-bold ${formData.hasCoffee ? "text-amber-400" : "text-slate-500"}`}>
                                {formData.hasCoffee ? "1.2" : "1.0"}
                            </span>
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Caffeine</span>
                        </div>

                        {/* Result */}
                        <div className="mx-4 text-slate-500 font-bold">=</div>
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-indigo-500/20 rounded-lg blur-lg group-hover:bg-indigo-500/30 transition-all"></div>
                            <span className="text-2xl font-bold text-white relative">
                                {(( (parseInt(formData.mood) + parseInt(formData.productivity)) * 10 / (totalDuration || 1) ) * (formData.hasCoffee ? 1.2 : 1.0)).toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-xl shadow-indigo-900/30 hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-6 group"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                <span className="tracking-wide">Calculate Optimization Score</span>
              </button>
            </form>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-2 px-2">
               <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="text-indigo-400" size={20} />
                Performance Metrics
              </h2>
              <button 
                onClick={() => fetchRoutines(user.email)}
                className="p-2.5 bg-slate-800/50 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 rounded-xl text-slate-400 transition-all shadow-lg"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 h-96 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
              {routines.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={routines}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
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
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '1rem', padding: '12px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}
                      cursor={{ stroke: '#6366f1', strokeWidth: 2, opacity: 0.3 }}
                    />
                    <Line type="monotone" dataKey="solver_score" name="Solver Score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#1e1b4b', strokeWidth: 2, stroke: '#818cf8' }} activeDot={{ r: 7, fill: '#818cf8', stroke: '#fff' }} />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" dot={false} opacity={0.7} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Activity size={64} className="mb-4 opacity-10" />
                  <p className="text-sm font-medium">No data found for user <span className="text-indigo-400 font-mono">{user.email}</span>.</p>
                  <p className="text-xs mt-2 opacity-60">Start logging to see analytics.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Activities</th>
                      <th className="px-8 py-5 text-center">Time</th>
                      <th className="px-8 py-5 text-center">Mood</th>
                      <th className="px-8 py-5 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {routines.map((r, index) => (
                      <tr key={index} className="hover:bg-indigo-500/5 transition-colors group">
                        <td className="px-8 py-5 font-mono text-slate-400 text-xs">{r.date}</td>
                        <td className="px-8 py-5">
                          <div className="flex gap-2 flex-wrap">
                            {r.activities && r.activities.map((a, i) => (
                              <span key={i} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-[10px] uppercase tracking-wide font-bold rounded-md border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center font-mono text-xs text-slate-400">{r.duration}m</td>
                        <td className="px-8 py-5 text-center font-mono text-xs text-cyan-400">{r.mood}</td>
                        <td className="px-8 py-5 text-center">
                            <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full font-bold text-xs border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
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