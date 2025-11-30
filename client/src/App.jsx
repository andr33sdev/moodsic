import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client';

// URL Backend
const API_URL = import.meta.env.PROD
  ? 'https://moodsic-76kt.onrender.com'
  : 'http://localhost:3000';

const socket = io(API_URL);

// --- ICONOS SVG ---
const Icons = {
  // Play/Pause rellenos para mejor visibilidad
  PlayFill: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
  PauseFill: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>,
  Live: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Rain: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 16.2A4.5 4.5 0 0 0 3.2 14.2"></path><path d="M8 19v2" /><path d="M12 20v2" /><path d="M16 18v2" /></svg>,
  Coffee: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
  Moon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Expand: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>,
  Minimize: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>,
  Volume: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Fire: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
  Heart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
};

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [activeMood, setActiveMood] = useState('gaming');
  const [hasJoined, setHasJoined] = useState(false);
  const [serverState, setServerState] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ripples, setRipples] = useState([]);

  // CONTROL DE AUDIO
  const [zenMode, setZenMode] = useState(false);
  const [rainVolume, setRainVolume] = useState(0);
  const [coffeeVolume, setCoffeeVolume] = useState(0);
  const [musicVolume, setMusicVolume] = useState(1);
  const [isLocalPaused, setIsLocalPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMobileVolume, setShowMobileVolume] = useState(false);

  // FEATURES
  const [sleepTimer, setSleepTimer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [memo, setMemo] = useState(() => localStorage.getItem('ghost_memo') || "");

  // VISUALES
  const [progress, setProgress] = useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("0:00");
  const [durationDisplay, setDurationDisplay] = useState("0:00");

  const audioRef = useRef(null);
  const rainRef = useRef(null);
  const coffeeRef = useRef(null);

  const addNotification = (text) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/songs`).then(res => res.json()).then(data => setSongs(data));
    socket.emit('request_users');
    socket.on('users_update', setUserCount);
    socket.on('new_reaction', (r) => { setReactions(prev => [...prev, r]); setTimeout(() => setReactions(prev => prev.filter(x => x.id !== r.id)), 4000); });
    socket.on('trigger_ripple', (r) => { setRipples(prev => [...prev, r]); setTimeout(() => setRipples(prev => prev.filter(x => x.id !== r.id)), 1200); });
    socket.on('sync_state', (state) => {
      setServerState(state);
      if (state.song) {
        if (currentSong?.id !== state.song.id) { if (!isLocalPaused) setIsLocalPaused(false); }
        setCurrentSong(state.song);
        if (state.mood) setActiveMood(state.mood);
      } else { setCurrentSong(null); }
    });
    socket.on('mood_updated', (mood) => { setActiveMood(mood); addNotification(`Room mood: ${mood.toUpperCase()}`); });
    return () => { socket.off('users_update'); socket.off('new_reaction'); socket.off('sync_state'); socket.off('mood_updated'); socket.off('trigger_ripple'); };
  }, [currentSong, isLocalPaused]);

  useEffect(() => { localStorage.setItem('ghost_memo', memo); }, [memo]);

  useEffect(() => {
    let interval = null;
    if (sleepTimer > 0) interval = setInterval(() => { setSleepTimer(prev => prev - 1); }, 60000);
    else if (sleepTimer === 0) { setIsLocalPaused(true); if (audioRef.current) audioRef.current.pause(); setSleepTimer(null); addNotification("Sleep Timer Finished"); }
    return () => clearInterval(interval);
  }, [sleepTimer]);

  useEffect(() => {
    if (rainRef.current) { rainRef.current.volume = rainVolume; if (rainVolume > 0 && rainRef.current.paused) rainRef.current.play().catch(() => { }); if (rainVolume === 0) rainRef.current.pause(); }
    if (coffeeRef.current) { coffeeRef.current.volume = coffeeVolume; if (coffeeVolume > 0 && coffeeRef.current.paused) coffeeRef.current.play().catch(() => { }); if (coffeeVolume === 0) coffeeRef.current.pause(); }
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [rainVolume, coffeeVolume, musicVolume]);

  const syncAudio = (force = false) => {
    if (!audioRef.current || !serverState || !serverState.startTime) return;
    if (isLocalPaused && !force) return;
    const now = Date.now();
    const serverTime = (now - serverState.startTime) / 1000;
    const drift = Math.abs(audioRef.current.currentTime - serverTime);
    if (force || drift > 2) audioRef.current.currentTime = serverTime;
    if (hasJoined && !isLocalPaused && audioRef.current.paused && serverTime > 0) { audioRef.current.play().catch(() => { }); }
  };

  useEffect(() => {
    if (!hasJoined || !currentSong) return;
    const interval = setInterval(() => syncAudio(false), 2000);
    return () => clearInterval(interval);
  }, [hasJoined, currentSong, serverState, isLocalPaused]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) setProgress((current / duration) * 100);
      const format = (t) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
      setCurrentTimeDisplay(format(current));
      setDurationDisplay(format(duration || 0));
      setIsPlaying(!audioRef.current.paused);
    }
  };

  const handleSongEnd = () => {
    const moodSongs = songs.filter(s => s.mood === activeMood);
    if (moodSongs.length > 0) { const randomIndex = Math.floor(Math.random() * moodSongs.length); handleTransmit(moodSongs[randomIndex]); }
  };

  const addTask = (e) => { e.preventDefault(); if (!newTask.trim()) return; setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]); setNewTask(""); };
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const handlePauseToggle = () => {
    if (isLocalPaused) { setIsLocalPaused(false); syncAudio(true); if (audioRef.current) audioRef.current.play(); addNotification("Resumed Live Sync"); }
    else { setIsLocalPaused(true); if (audioRef.current) audioRef.current.pause(); }
  };

  const handleJoinRoom = () => { setHasJoined(true); setTimeout(() => { if (audioRef.current) { audioRef.current.play().catch(() => { }); syncAudio(true); } }, 100); };
  const handleTransmit = (song) => { setCurrentSong(song); socket.emit('play_song', song); addNotification("Playing new track"); };
  const sendReaction = (emoji) => socket.emit('send_reaction', emoji);

  const handleBackgroundClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.song-row') || e.target.closest('textarea') || e.target.closest('.interactive')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    socket.emit('send_ripple', { x, y });
  };

  // --- THEME ---
  const theme = activeMood === 'gaming'
    ? { bg: 'linear-gradient(120deg, #09090b, #1e1b4b, #4c1d95, #0f172a)', accent: '#a78bfa', textSec: '#c4b5fd', glass: 'rgba(15, 23, 42, 0.8)', glow: 'rgba(167, 139, 250, 0.5)' }
    : { bg: 'linear-gradient(120deg, #022c22, #0d9488, #115e59, #042f2e)', accent: '#2dd4bf', textSec: '#99f6e4', glass: 'rgba(2, 44, 34, 0.8)', glow: 'rgba(45, 212, 191, 0.5)' };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');
    body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; font-family: 'Inter', sans-serif; overflow: hidden; }
    * { box-sizing: border-box; user-select: none; -webkit-tap-highlight-color: transparent; }
    
    .animate-bg { background-size: 300% 300% !important; animation: gradientBG 60s ease infinite; }
    @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-200px) scale(1.5); opacity: 0; } }
    @keyframes slideIn { 0% { transform: translateX(20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
    @keyframes rippleAnim { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; } 100% { transform: translate(-50%, -50%) scale(3); opacity: 0; } }
    
    /* Layout Logic */
    .layout-container { display: flex; height: 100%; width: 100%; position: relative; }
    .sidebar { width: 300px; margin: 20px 0 20px 20px; border-radius: 30px; padding: 30px 24px; display: flex; flex-direction: column; z-index: 10; background: ${theme.glass}; backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.08); transition: all 0.4s ease; }
    .main-content { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    
    /* Footer Logic - Desktop */
    .player-footer { 
        position: fixed; 
        bottom: 30px; 
        right: 30px; 
        left: 340px; /* Starts after sidebar + gap */
        height: 96px; 
        border-radius: 28px; 
        display: flex; 
        align-items: center; 
        padding: 0 30px; 
        z-index: 100; 
        background: ${theme.glass}; 
        backdrop-filter: blur(30px); 
        border: 1px solid rgba(255,255,255,0.08); 
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        transition: all 0.4s ease;
    }

    .mobile-header { display: none; }
    .song-list-container { padding: 40px 60px; overflow-y: auto; flex: 1; padding-bottom: 160px; }
    .zen-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-bottom: 100px; }

    /* Inputs */
    input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; height: 20px; display: flex; align-items: center; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: white; margin-top: -5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: transform 0.2s; }
    input[type=range]:hover::-webkit-slider-thumb { transform: scale(1.2); }

    .glass-button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); transition: all 0.2s; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; }
    .reaction-btn { width: 45px; height: 45px; borderRadius: 50%; color: ${theme.accent}; }
    .reaction-btn:hover { background: ${theme.accent}20; box-shadow: 0 0 20px ${theme.glow}; border-color: ${theme.accent}; }

    /* --- MOBILE RESPONSIVE --- */
    @media (max-width: 900px) {
        .sidebar { display: none; } 
        .player-footer { 
            left: 50%; 
            transform: translateX(-50%); 
            width: 92%; 
            bottom: 20px; 
            height: auto; 
            padding: 20px; 
            flex-wrap: wrap; 
            gap: 15px; 
        }
        .mobile-header { display: flex; position: absolute; top: 0; left: 0; right: 0; padding: 20px; z-index: 20; justify-content: space-between; align-items: center; }
        .song-list-container { padding: 100px 20px 180px 20px; }
        
        /* Mobile Footer Layout Reorder */
        .player-section-info { width: 100%; order: 1; display: flex; justify-content: space-between; align-items: center; }
        .player-section-controls { width: 100%; order: 2; }
        .player-section-actions { width: auto; order: 1; }
        
        .mobile-vol-slider { position: absolute; bottom: 100px; right: 20px; width: 40px; height: 120px; background: ${theme.glass}; backdrop-filter: blur(20px); padding: 15px 0; border-radius: 20px; display: flex; justify-content: center; border: 1px solid rgba(255,255,255,0.1); }
        .mobile-vol-slider input { transform: rotate(-90deg); width: 100px; }
    }
  `;

  if (!hasJoined) {
    return (
      <div className="animate-bg" style={{ height: '100vh', width: '100vw', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: 'center', background: theme.glass, padding: '60px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.08)', width: '90%', maxWidth: '400px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '10px', background: `linear-gradient(to right, #fff, ${theme.textSec})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ambienting.me</div>
          <p style={{ color: theme.textSec, marginBottom: '40px', fontSize: '1rem' }}>Your shared space for deep focus.</p>
          <button onClick={handleJoinRoom} style={{ padding: '18px 0', fontSize: '1.1rem', background: 'white', color: 'black', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '800', width: '100%', transition: 'transform 0.2s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.02)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>Enter Space</button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container animate-bg" onClick={handleBackgroundClick} style={{ background: theme.bg, color: 'white', transition: 'background 1.5s ease' }}>
      <style>{globalStyles}</style>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {ripples.map(r => (<div key={r.id} style={{ position: 'absolute', left: `${r.x}%`, top: `${r.y}%`, width: '100px', height: '100px', borderRadius: '50%', border: `2px solid rgba(255,255,255,0.2)`, transform: 'translate(-50%, -50%)', animation: 'rippleAnim 1s ease-out forwards' }}></div>))}
      </div>

      <div style={{ position: 'absolute', top: '90px', right: '20px', zIndex: 999, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', pointerEvents: 'none' }}>
        {notifications.map(n => (<div key={n.id} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '10px 20px', borderRadius: '12px', borderLeft: `3px solid ${theme.accent}`, animation: 'slideIn 0.3s ease-out', fontSize: '0.8rem', fontWeight: '600', backdropFilter: 'blur(20px)' }}>{n.text}</div>))}
      </div>

      <div className="mobile-header interactive">
        <div style={{ display: 'flex', background: theme.glass, borderRadius: '16px', padding: '4px' }}>
          {['gaming', 'relax'].map(mood => (
            <button key={mood} onClick={() => setActiveMood(mood)} style={{ background: activeMood === mood ? 'rgba(255,255,255,0.15)' : 'transparent', color: activeMood === mood ? 'white' : theme.textSec, border: 'none', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}>{mood.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: theme.glass, padding: '6px 12px', borderRadius: '20px' }}><Icons.Users /> <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{userCount}</span></div>
      </div>

      {!zenMode && (
        <div className="sidebar interactive">
          <div style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '40px', letterSpacing: '-1px' }}>ambienting<span style={{ color: theme.accent }}>.me</span></div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '4px', marginBottom: '30px' }}>
            {['gaming', 'relax'].map(mood => (
              <button key={mood} onClick={() => setActiveMood(mood)} style={{ flex: 1, textAlign: 'center', background: activeMood === mood ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeMood === mood ? 'white' : theme.textSec, border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', transition: 'all 0.2s' }}>{mood.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ padding: '0 10px', marginBottom: '30px' }}>
            <p style={{ fontSize: '0.7rem', color: theme.textSec, fontWeight: '700', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>Mixer</p>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px', color: '#eee', fontWeight: '600' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Rain /> Rain</span></div>
              <input type="range" min="0" max="1" step="0.05" value={rainVolume} onChange={(e) => setRainVolume(parseFloat(e.target.value))} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px', color: '#eee', fontWeight: '600' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Coffee /> Cafe</span></div>
              <input type="range" min="0" max="1" step="0.05" value={coffeeVolume} onChange={(e) => setCoffeeVolume(parseFloat(e.target.value))} />
            </div>
          </div>
          {activeMood === 'relax' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <p style={{ fontSize: '0.7rem', color: theme.textSec, fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Focus Tasks</p>
              <form onSubmit={addTask} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <input type="text" placeholder="Add task..." value={newTask} onChange={e => setNewTask(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', padding: '10px 15px', fontSize: '0.85rem', outline: 'none', fontWeight: '500' }} />
              </form>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', marginBottom: '8px', opacity: t.done ? 0.5 : 1, background: t.done ? 'transparent' : 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '10px' }}>
                    <button onClick={() => toggleTask(t.id)} style={{ background: t.done ? theme.accent : 'transparent', border: `2px solid ${t.done ? theme.accent : 'rgba(255,255,255,0.3)'}`, borderRadius: '6px', width: '20px', height: '20px', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>{t.done && <Icons.Check />}</button>
                    <span style={{ textDecoration: t.done ? 'line-through' : 'none', flex: 1, color: t.done ? theme.textSec : '#fff', fontWeight: '500' }}>{t.text}</span>
                    <button onClick={() => deleteTask(t.id)} className="glass-button" style={{ width: '28px', height: '28px', borderRadius: '8px', color: theme.textSec }}><Icons.Trash /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: theme.textSec }}><Icons.Edit /> <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Memo</span></div>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Type here..." style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '12px', color: '#eee', fontSize: '0.85rem', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5', padding: '10px' }} />
          </div>
        </div>
      )}

      <div className="main-content">
        <div style={{ position: 'absolute', top: '30px', right: '30px', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 20 }} className='interactive mobile-hidden'>
          <div className="glass-button" style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'default' }}><Icons.Users /> <span style={{ fontWeight: '700', fontSize: '0.85rem', marginLeft: '6px' }}>{userCount}</span></div>
          <button onClick={() => setSleepTimer(sleepTimer ? null : 30)} className="glass-button" style={{ background: sleepTimer ? theme.accent : null, color: sleepTimer ? 'black' : 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', gap: '6px', fontWeight: '700' }}><Icons.Moon /> {sleepTimer ? `${sleepTimer}m` : 'Sleep'}</button>
          <button onClick={() => setZenMode(!zenMode)} className="glass-button" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>{zenMode ? <Icons.Minimize /> : <Icons.Expand />}</button>
        </div>

        <div style={{ position: 'absolute', bottom: '140px', right: '40px', width: '100px', height: '400px', pointerEvents: 'none', zIndex: 50 }}>
          {reactions.map(r => (<div key={r.id} style={{ position: 'absolute', bottom: 0, right: '0', fontSize: '3rem', animation: 'floatUp 4s ease-out forwards', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}>{r.emoji}</div>))}
        </div>

        {!zenMode ? (
          <div className="song-list-container interactive">
            <div style={{ marginBottom: '50px', marginTop: '20px' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-2px', textShadow: '0 0 60px rgba(255,255,255,0.1)', lineHeight: 1 }}>{activeMood === 'gaming' ? 'Gaming Station' : 'Deep Focus'}</h1>
              <p style={{ color: theme.textSec, fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.5', fontWeight: '500' }}>Curated sonic landscapes for {activeMood === 'gaming' ? 'high performance & adrenaline.' : 'mental clarity & calm.'}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {songs.filter(s => s.mood === activeMood).map((song, i) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <div className="glass-button" key={song.id} style={{ justifyContent: 'flex-start', padding: '18px 28px', borderRadius: '20px', background: isActive ? 'rgba(255,255,255,0.1)' : null, borderColor: isActive ? theme.accent : null, boxShadow: isActive ? `0 10px 30px -10px ${theme.accent}60` : null }} onClick={() => !isActive && handleTransmit(song)}>
                    <div style={{ width: '40px', color: isActive ? theme.accent : theme.textSec, fontWeight: '700', fontSize: '1rem' }}>{isActive ? <div style={{ width: '10px', height: '10px', background: theme.accent, borderRadius: '50%', boxShadow: `0 0 15px ${theme.accent}` }}></div> : i + 1}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}><span style={{ fontWeight: '700', fontSize: '1.1rem', color: isActive ? '#fff' : '#eee' }}>{song.title}</span><br /><span style={{ fontSize: '0.9rem', color: theme.textSec, fontWeight: '500' }}>{song.artist}</span></div>
                    {isActive && <div style={{ padding: '8px 16px', background: theme.accent, borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', color: 'white', boxShadow: `0 5px 15px ${theme.accent}40` }}>PLAYING</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="zen-container animate-bg" style={{ animationDuration: '120s' }}>
            {currentSong ? (<div style={{ animation: 'fadeIn 1s ease' }}>
              <div className={`glass-panel ${isPlaying ? "pulse-effect" : ""}`} style={{ width: '220px', height: '220px', borderRadius: '50px', margin: '0 auto 50px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: theme.accent, boxShadow: `0 30px 80px -20px ${theme.accent}50`, border: `2px solid ${theme.accent}40` }}>🎵</div>
              <h1 style={{ fontSize: '5rem', fontWeight: '900', letterSpacing: '-3px', margin: 0, lineHeight: 1 }}>{currentSong.title}</h1>
              <h2 style={{ fontSize: '2rem', fontWeight: '500', color: theme.textSec, marginTop: '15px' }}>{currentSong.artist}</h2>
            </div>) : <h1 style={{ color: theme.textSec, fontWeight: '300', fontSize: '2rem' }}>Silence...</h1>}
          </div>
        )}
      </div>

      {currentSong && (
        <div className="player-footer interactive">
          {/* INFO */}
          <div className="player-section-info" style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <div style={{ width: '56px', height: '56px', background: `linear-gradient(135deg, ${theme.accent}, rgba(0,0,0,0))`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', boxShadow: `0 10px 25px -5px ${theme.accent}50` }}>🎵</div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}><div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{currentSong.title}</div><div style={{ fontSize: '0.85rem', color: theme.textSec, fontWeight: '600' }}>{currentSong.artist}</div></div>
            {/* Mobile Toggle */}
            <button className="glass-button mobile-only" onClick={() => setShowMobileVolume(!showMobileVolume)} style={{ width: '40px', height: '40px', borderRadius: '50%', marginLeft: 'auto', display: window.innerWidth > 900 ? 'none' : 'flex' }}><Icons.Volume /></button>
            {showMobileVolume && <div className="mobile-vol-slider"><input type="range" min="0" max="1" step="0.1" value={musicVolume} onChange={e => setMusicVolume(e.target.value)} /></div>}
          </div>

          {/* CONTROLS (Solo Play/Pause y Seek) */}
          <div className="player-section-controls" style={{ flex: 1.5, maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '5px' }}>
              <button onClick={handlePauseToggle} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', boxShadow: `0 10px 30px -5px rgba(255,255,255,0.5)`, transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                {isLocalPaused ? <Icons.PlayFill style={{ marginLeft: '4px' }} /> : <Icons.PauseFill />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.75rem', color: theme.textSec, width: '100%', fontWeight: '700' }}>
              <span>{currentTimeDisplay}</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: theme.accent, borderRadius: '4px', transition: 'width 0.1s linear', boxShadow: `0 0 15px ${theme.accent}` }}></div></div>
              <span>{durationDisplay}</span>
            </div>
          </div>

          {/* RIGHT ACTIONS (Volume + Reactions) */}
          <div className="player-section-actions" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '25px', alignItems: 'center' }}>
            {/* Desktop Volume Slider */}
            <div className="mobile-hidden" style={{ width: '140px', display: window.innerWidth > 900 ? 'flex' : 'none', alignItems: 'center', gap: '12px', color: theme.textSec }}><Icons.Volume /> <input type="range" min="0" max="1" step="0.1" value={musicVolume} onChange={e => setMusicVolume(e.target.value)} style={{ flex: 1 }} /></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => sendReaction('🔥')} className="glass-button reaction-btn h-24"><Icons.Fire /></button>
              <button onClick={() => sendReaction('❤️')} className="glass-button reaction-btn"><Icons.Heart /></button>
            </div>
          </div>

          <audio ref={audioRef} src={currentSong.url} onLoadedMetadata={() => syncAudio(false)} onTimeUpdate={handleTimeUpdate} onEnded={handleSongEnd} style={{ display: 'none' }} />
          <audio ref={rainRef} src="https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" loop style={{ display: 'none' }} crossOrigin="anonymous" />
          <audio ref={coffeeRef} src="https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" loop style={{ display: 'none' }} crossOrigin="anonymous" />
        </div>
      )}
    </div>
  )
}

export default App