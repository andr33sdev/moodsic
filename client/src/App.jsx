import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client';

// Detectamos si estamos en producción o local
const API_URL = import.meta.env.PROD
  ? 'https://moodsic-76kt.onrender.com' // <--- ASEGURATE QUE ESTA URL SEA LA TUYA DE RENDER
  : 'http://localhost:3000';

const socket = io(API_URL);

// Iconos SVG
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const VolumeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [activeMood, setActiveMood] = useState('gaming');
  const [hasJoined, setHasJoined] = useState(false);
  const [serverState, setServerState] = useState(null);

  // NUEVO: Calculamos la diferencia de hora entre TU reloj y el Servidor
  const [timeOffset, setTimeOffset] = useState(0);

  // Estados visuales
  const [progress, setProgress] = useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("0:00");
  const [durationDisplay, setDurationDisplay] = useState("0:00");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/songs`)
      .then(res => res.json())
      .then(data => setSongs(data));

    // NUEVO: Calcular Offset de reloj al conectar
    // Esto arregla que un celular vaya 10 segs adelantado
    const startPing = Date.now();
    socket.emit('ping', () => { // Necesitás agregar un listener simple en backend si querés precisión milimétrica, pero por ahora asumimos latencia baja
      // Truco simple: Confiamos en que la hora del evento 'sync_state' viene del server
    });

    socket.on('sync_state', (state) => {
      // Guardamos el estado
      setServerState(state);

      // Si hay canción, actualizamos la info (incluso si no entramos a la sala)
      if (state.song) {
        setCurrentSong(state.song);
        if (state.mood) setActiveMood(state.mood);
      } else {
        // Si el server dice que no hay nada, limpiamos
        setCurrentSong(null);
      }
    });

    socket.on('mood_updated', (mood) => setActiveMood(mood));

    return () => {
      socket.off('sync_state');
      socket.off('mood_updated');
    };
  }, []);

  // --- LÓGICA DE SYNC MEJORADA ---
  const syncAudio = () => {
    if (!audioRef.current || !serverState || !serverState.startTime) return;

    const audio = audioRef.current;

    // 1. Obtenemos la hora actual
    const now = Date.now();

    // 2. Calculamos cuánto pasó desde que el server dijo "Start"
    // El truco es que startTime viene del server.
    const serverTime = (now - serverState.startTime) / 1000;

    // 3. Calculamos la diferencia con nuestro audio
    const drift = Math.abs(audio.currentTime - serverTime);

    // Si la diferencia es muy grande (más de 2 segs), forzamos el salto
    // Esto corrige el problema de los "10 segundos adelantado"
    if (drift > 2) {
      console.log(`⚠️ Ajustando tiempo. Server: ${serverTime.toFixed(2)}s | Local: ${audio.currentTime.toFixed(2)}s`);
      audio.currentTime = serverTime;
    }

    // Si ya entramos y el audio está pausado pero debería sonar
    if (hasJoined && audio.paused && serverTime > 0) {
      audio.play().catch(e => console.error("Autoplay bloqueado:", e));
    }
  };

  // Chequeo periódico (Loop de sincronización)
  useEffect(() => {
    if (!hasJoined || !currentSong) return;
    const interval = setInterval(syncAudio, 2000); // Chequear cada 2s
    return () => clearInterval(interval);
  }, [hasJoined, currentSong, serverState]);


  // Actualizar barra visual
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

  const handleJoinRoom = () => {
    setHasJoined(true);
    // Intentamos sincronizar inmediatamente
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => { });
        syncAudio();
      }
    }, 100);
  };

  const handleTransmit = (song) => {
    // Si es la misma canción, no reiniciamos
    if (currentSong?.id === song.id) return;

    // Al transmitir, reseteamos localmente para evitar saltos raros
    setCurrentSong(song);
    socket.emit('play_song', song);
  };

  const theme = activeMood === 'gaming'
    ? { bg: '#120514', sidebar: '#0a020b', accent: '#ff0055', gradient: 'linear-gradient(180deg, rgba(255,0,85,0.1) 0%, rgba(0,0,0,0) 100%)' }
    : { bg: '#0b1121', sidebar: '#050914', accent: '#38bdf8', gradient: 'linear-gradient(180deg, rgba(56,189,248,0.1) 0%, rgba(0,0,0,0) 100%)' };

  // --- RENDERIZADO ---

  // 1. PANTALLA DE ENTRADA (LANDING)
  if (!hasJoined) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: `radial-gradient(circle, ${activeMood === 'gaming' ? '#ff0055' : '#38bdf8'}30 0%, rgba(0,0,0,0) 70%)`, filter: 'blur(100px)' }}></div>
        <div style={{ zIndex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '60px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', maxWidth: '500px', width: '90%' }}>
          <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0', color: 'white', letterSpacing: '-2px' }}>Moodsic.</h1>
          <p style={{ color: '#888', marginBottom: '30px', fontSize: '1.2rem' }}>Sincronización de audio en tiempo real.</p>

          {/* NUEVO: MOSTRAR INFO DE LA CANCIÓN ANTES DE ENTRAR */}
          <div style={{ marginBottom: '40px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            {currentSong ? (
              <>
                <div style={{ fontSize: '0.9rem', color: theme.accent, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>🔴 SONANDO AHORA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{currentSong.title}</div>
                <div style={{ fontSize: '1rem', color: '#aaa' }}>{currentSong.artist}</div>
              </>
            ) : (
              <div style={{ color: '#666' }}>💤 La sala está en silencio...</div>
            )}
          </div>

          <button onClick={handleJoinRoom} style={{ padding: '18px 48px', fontSize: '1.1rem', background: 'white', color: 'black', border: 'none', borderRadius: '100px', cursor: 'pointer', fontWeight: '700', transition: 'transform 0.2s', width: '100%' }} onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
            {currentSong ? "UNIRSE Y ESCUCHAR" : "ENTRAR A LA SALA"}
          </button>
        </div>
      </div>
    );
  }

  // 2. APP PRINCIPAL
  const filteredSongs = songs.filter(song => song.mood === activeMood);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: theme.bg, color: 'white', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <div style={{ width: '260px', background: theme.sidebar, padding: '40px 24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '50px', letterSpacing: '-1px' }}>Moodsic<span style={{ color: theme.accent }}>.</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.75rem', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Canales</p>
          {['gaming', 'relax'].map(mood => (
            <button key={mood} onClick={() => setActiveMood(mood)} style={{ textAlign: 'left', background: activeMood === mood ? 'rgba(255,255,255,0.05)' : 'transparent', color: activeMood === mood ? 'white' : '#888', border: 'none', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: activeMood === mood ? '600' : '400', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{mood === 'gaming' ? '🎮' : '☕'}</span>
              {mood === 'gaming' ? 'Gaming' : 'Relax'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '300px', background: theme.gradient, pointerEvents: 'none' }}></div>

        <div style={{ padding: '60px', overflowY: 'auto', flex: 1, paddingBottom: '120px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-1px' }}>
            {activeMood === 'gaming' ? 'Gaming Station' : 'Focus Room'}
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.1rem', marginBottom: '40px' }}>
            {activeMood === 'gaming' ? 'Playlist curada para tryhards y momentos épicos.' : 'Beats suaves para programar sin bugs.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', padding: '0 16px 12px 16px', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '40px' }}>#</div>
              <div style={{ flex: 1 }}>Título</div>
              <div style={{ width: '100px', textAlign: 'right' }}>Duración</div>
            </div>

            {filteredSongs.map((song, i) => {
              const isActive = currentSong?.id === song.id;
              return (
                <div key={song.id} className="song-row" style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '8px', marginTop: '4px', background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.2s' }} onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')} onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: '40px', color: isActive ? theme.accent : '#555', fontWeight: 'bold' }}>
                    {isActive ? <span className="playing-icon">♫</span> : i + 1}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500', color: isActive ? theme.accent : 'white' }}>{song.title}</span>
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>{song.artist}</span>
                  </div>
                  <div style={{ width: '100px', textAlign: 'right' }}>
                    {isActive ? (
                      <span style={{ fontSize: '0.75rem', background: theme.accent, padding: '4px 12px', borderRadius: '100px', color: 'white', fontWeight: 'bold' }}>SONANDO</span>
                    ) : (
                      <button onClick={() => handleTransmit(song)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>PLAY</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* REPRODUCTOR ESTÉTICO (FOOTER) */}
      {currentSong && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '90px', background: 'rgba(10, 10, 10, 0.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 100 }}>
          <div style={{ width: '30%', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: `linear-gradient(135deg, ${theme.accent}, #111)`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${theme.accent}40` }}>
              <span style={{ fontSize: '24px' }}>🎵</span>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{currentSong.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{currentSong.artist}</div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '8px' }}>
              <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>⏮</button>
              <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', color: 'black', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>⏭</button>
            </div>

            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
              <span>{currentTimeDisplay}</span>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: theme.accent, borderRadius: '2px', transition: 'width 0.2s linear' }}></div>
              </div>
              <span>{durationDisplay}</span>
            </div>
          </div>

          <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
            <VolumeIcon />
            <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{ width: '70%', height: '100%', background: '#888', borderRadius: '2px' }}></div>
            </div>
            <div style={{ marginLeft: '10px', fontSize: '0.7rem', color: theme.accent, border: `1px solid ${theme.accent}`, padding: '2px 8px', borderRadius: '4px' }}>LIVE</div>
          </div>

          <audio ref={audioRef} src={currentSong.url} onLoadedMetadata={syncAudio} onTimeUpdate={handleTimeUpdate} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  )
}

export default App