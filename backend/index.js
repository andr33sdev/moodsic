// server/index.js
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
    startTime: null,
    mood: 'gaming'
};

// NUEVO: Contador de usuarios
let connectedUsers = 0;

io.on('connection', (socket) => {
    // 1. Manejo de Usuarios
    connectedUsers++;
    io.emit('users_update', connectedUsers); // Avisar a todos que entró alguien
    console.log(`Usuario conectado. Total: ${connectedUsers}`);

    // Enviar estado actual al nuevo
    if (currentPlayback.song) {
        socket.emit('sync_state', currentPlayback);
    }

    // 2. Manejo de Música
    socket.on('play_song', (song) => {
        currentPlayback = { song, startTime: Date.now(), mood: song.mood || 'gaming' };
        io.emit('sync_state', currentPlayback);
    });

    // 3. NUEVO: Manejo de Reacciones
    socket.on('send_reaction', (emoji) => {
        // Retransmitimos el emoji a todos (incluido el que lo envió para que vea su propia reacción)
        io.emit('new_reaction', { id: Date.now(), emoji });
    });

    socket.on('change_mood', (mood) => {
        currentPlayback.mood = mood;
        io.emit('mood_updated', mood);
    });

    // 4. Desconexión
    socket.on('disconnect', () => {
        connectedUsers--;
        io.emit('users_update', connectedUsers); // Avisar que alguien salió
        console.log(`Usuario desconectado. Total: ${connectedUsers}`);
    });

    // NUEVO: Ripple Effect Compartido
    // Recibimos coordenadas en porcentaje (x, y) para que sirva en cualquier tamaño de pantalla
    socket.on('send_ripple', (coords) => {
        // Retransmitimos a todos (incluido el que lo mandó para feedback instantáneo)
        io.emit('trigger_ripple', { id: Date.now(), x: coords.x, y: coords.y });
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