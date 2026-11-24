import express from 'express'; import http from 'http'; import cors from 'cors';
import { Server } from 'socket.io'; import mongoose from 'mongoose';
import { seedQuiz } from './seed.js';

const Quiz = mongoose.model('Quiz', new mongoose.Schema({
  title: { type: String, required: true },
  questions: [{ text: String, options: [String], correct: Number, time: { type: Number, default: 20 } }],
}));
await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pulsequiz');
if (!(await Quiz.countDocuments())) await Quiz.create(seedQuiz);

const app = express(); app.use(cors(), express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ---------- REST: quizzes (correct answers never leave the server in lists) ----------
app.get('/api/quizzes', async (_q, res) =>
  res.json((await Quiz.find()).map(q => ({ id: q._id, title: q.title, count: q.questions.length }))));
app.post('/api/quizzes', async (req, res) => {
  const { title, questions } = req.body || {};
  const ok = typeof title === 'string' && title.trim() && Array.isArray(questions) && questions.length &&
    questions.every(q => q.text?.trim() && q.options?.length === 4 && q.options.every(o => o?.trim()) &&
      Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4 && q.time >= 5 && q.time <= 120);
  if (!ok) return res.status(400).json({ error: 'Invalid quiz' });
  const quiz = await Quiz.create({ title: title.trim(), questions });
  res.json({ id: quiz._id });
});

// ---------- Game engine (in-memory rooms) ----------
const rooms = new Map();
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { let c; do c = Array.from({ length: 6 }, () => ALPHA[Math.random() * ALPHA.length | 0]).join(''); while (rooms.has(c)); return c; };
const ranking = r => [...r.players.values()].sort((a, b) => b.score - a.score).map((p, i) => ({ id: p.id, nick: p.nick, score: p.score, rank: i + 1 }));

function view(r) {
  const q = r.quiz.questions[r.i];
  const v = { code: r.code, state: r.state, total: r.quiz.questions.length, index: r.i, title: r.quiz.title,
    players: [...r.players.values()].map(p => p.nick), answered: r.answers.size };
  if (r.state === 'question') v.q = { text: q.text, options: q.options, endsAt: r.endsAt, time: q.time };
  if (r.state === 'reveal') { v.q = { text: q.text, options: q.options }; v.correct = q.correct;
    v.counts = q.options.map((_, k) => [...r.answers.values()].filter(a => a.choice === k).length); }
  if (r.state === 'leaderboard' || r.state === 'finished') v.board = ranking(r).slice(0, r.state === 'finished' ? 3 : 5);
  return v;
}
function push(r) {
  const v = view(r), rank = ranking(r);
  io.to(r.host).emit('room:state', v);
  for (const p of r.players.values()) {
    const a = r.answers.get(p.id);
    io.to(p.sid).emit('room:state', { ...v, me: { nick: p.nick, score: p.score, rank: rank.find(x => x.id === p.id).rank,
      answered: !!a, correct: r.state === 'reveal' ? a?.choice === r.quiz.questions[r.i].correct : undefined, gained: a?.gained || 0 } });
  }
}
function advance(r) {
  clearTimeout(r.timer);
  const last = r.i === r.quiz.questions.length - 1;
  if (r.state === 'lobby' || r.state === 'leaderboard') {
    if (r.state === 'leaderboard') { if (last) r.state = 'finished'; else r.i++; }
    if (r.state !== 'finished') {
      const q = r.quiz.questions[r.i]; r.state = 'question'; r.answers = new Map();
      r.startedAt = Date.now(); r.endsAt = r.startedAt + q.time * 1000;
      r.timer = setTimeout(() => { if (r.state === 'question') advance(r); }, q.time * 1000 + 300);
    }
  } else if (r.state === 'question') {
    const q = r.quiz.questions[r.i];
    for (const [id, a] of r.answers) if (a.choice === q.correct) {
      a.gained = Math.round(1000 * (1 - a.elapsed / (q.time * 1000) / 2)); r.players.get(id).score += a.gained; }
    r.state = 'reveal';
  } else if (r.state === 'reveal') r.state = 'leaderboard';
  push(r);
}

io.on('connection', socket => {
  const hostRoom = () => [...rooms.values()].find(r => r.host === socket.id);
  socket.on('host:create', async ({ quizId }, ack) => {
    try {
      const quiz = await Quiz.findById(quizId).lean(); if (!quiz) return ack({ error: 'Quiz not found' });
      const code = newCode();
      rooms.set(code, { code, quiz, host: socket.id, players: new Map(), answers: new Map(), state: 'lobby', i: 0 });
      socket.join(code); ack({ code }); push(rooms.get(code));
    } catch { ack({ error: 'Bad quiz id' }); }
  });
  socket.on('host:advance', () => { const r = hostRoom(); if (r && !(r.state === 'lobby' && !r.players.size) && r.state !== 'finished') advance(r); });
  socket.on('player:join', ({ code, nickname }, ack) => {
    const r = rooms.get(String(code || '').toUpperCase()); const nick = String(nickname || '').trim().slice(0, 16);
    if (!r) return ack({ error: 'Room not found' });
    if (r.state !== 'lobby') return ack({ error: 'Game already started' });
    if (!nick) return ack({ error: 'Enter a nickname' });
    if ([...r.players.values()].some(p => p.nick.toLowerCase() === nick.toLowerCase())) return ack({ error: 'Nickname taken' });
    r.players.set(socket.id, { id: socket.id, sid: socket.id, nick, score: 0 });
    socket.data.code = r.code; socket.join(r.code); ack({ ok: true }); push(r);
  });
  socket.on('player:answer', ({ choice }) => {
    const r = rooms.get(socket.data.code); if (!r || r.state !== 'question' || !r.players.has(socket.id)) return;
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
    if (r.answers.has(socket.id) || Date.now() > r.endsAt + 300) return; // one answer only, no late answers
    r.answers.set(socket.id, { choice, elapsed: Date.now() - r.startedAt, gained: 0 });
    if (r.answers.size === r.players.size) advance(r); else push(r);
  });
  socket.on('disconnect', () => {
    const r = rooms.get(socket.data.code);
    if (r) { if (r.state === 'lobby') r.players.delete(socket.id); push(r); }
    const h = hostRoom(); if (h) { clearTimeout(h.timer); io.to(h.code).emit('room:closed'); rooms.delete(h.code); }
  });
});
server.listen(process.env.PORT || 4000, () => console.log('PulseQuiz server on :4000'));
