require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ESTADO GLOBAL
let currentPlayback = {
    song: null,
    startTime: null, // Momento exacto en milisegundos
    mood: 'gaming'
};

io.on('connection', (socket) => {
    console.log('🔌 Nuevo usuario conectado:', socket.id);

    // 1. ESPEJO INMEDIATO: Si hay algo sonando, se lo enviamos al nuevo
    if (currentPlayback.song) {
        console.log(`📡 Enviando estado actual a ${socket.id}:`, currentPlayback.song.title);
        socket.emit('sync_state', currentPlayback);
    }

    // 2. RECIBIR ORDEN DE PLAY
    socket.on('play_song', (song) => {
        console.log('▶️ Play recibido:', song.title);
        currentPlayback = {
            song: song,
            startTime: Date.now(), // Marca de tiempo del servidor
            mood: song.mood || 'gaming'
        };
        io.emit('sync_state', currentPlayback);
    });

    socket.on('change_mood', (mood) => {
        currentPlayback.mood = mood;
        io.emit('mood_updated', mood);
    });
});

app.get('/api/songs', async (req, res) => {
    const { data, error } = await supabase.from('songs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server listo en puerto ${PORT}`);
});