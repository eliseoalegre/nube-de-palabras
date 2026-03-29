const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/respond', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'respond.html'));
});

// Estado en memoria
let state = {
  question: null,
  answers: []
};

io.on('connection', (socket) => {
  // Enviar estado actual al conectarse
  socket.emit('current-state', state);

  // Profesor configura nueva pregunta
  socket.on('new-question', (question) => {
    state.question = question;
    state.answers = [];
    io.emit('new-question', question);
  });

  // Alumno envía respuesta
  socket.on('submit-answer', (answer) => {
    const trimmed = answer.trim();
    if (trimmed && state.question) {
      state.answers.push(trimmed);
      io.emit('new-answer', trimmed);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
