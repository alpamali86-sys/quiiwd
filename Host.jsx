import { useEffect, useState } from 'react'; import { QRCodeSVG } from 'qrcode.react'; import { socket, ANS } from '../socket'; import Timer from '../Timer';
export default function Host() {
  const [quizzes, setQuizzes] = useState([]); const [s, setS] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { fetch('/api/quizzes').then(r => r.json()).then(setQuizzes);
    socket.on('room:state', setS); socket.on('room:closed', () => setS(null)); return () => socket.off('room:state', setS); }, []);
  const start = id => socket.emit('host:create', { quizId: id }, r => r.error && setErr(r.error));
  const next = () => socket.emit('host:advance');
  if (!s) return (<main className="mx-auto max-w-2xl px-5 py-10 space-y-4"><h1 className="text-3xl font-extrabold">Pick a quiz to host</h1>
    {err && <p className="text-coral">{err}</p>}
    {quizzes.map(q => <button key={q.id} onClick={() => start(q.id)} className="card w-full text-left hover:border-lime transition">
      <b className="text-xl">{q.title}</b><span className="text-mute block">{q.count} questions</span></button>)}</main>);
  const link = `${location.origin}/join/${s.code}`;
  const label = { lobby: 'Start game', question: 'End question', reveal: 'Leaderboard', leaderboard: s.index + 1 === s.total ? 'Final podium' : 'Next question' }[s.state];
  return (<main className="mx-auto max-w-5xl px-5 py-8 min-h-screen flex flex-col">
    {s.state === 'lobby' && <div className="grid md:grid-cols-2 gap-8 items-center flex-1 animate-pop">
      <div className="card text-center"><div className="bg-white p-4 rounded-xl inline-block"><QRCodeSVG value={link} size={240} /></div>
        <p className="text-mute mt-4 break-all">{link}</p><p className="text-6xl font-extrabold tracking-[.2em] text-lime mt-2">{s.code}</p></div>
      <div><h2 className="text-2xl font-bold mb-4">{s.title} · {s.players.length} joined</h2>
        <div className="flex flex-wrap gap-2">{s.players.map(p => <span key={p} className="bg-panel border border-line rounded-full px-4 py-2 animate-pop">{p}</span>)}</div></div></div>}
    {s.state === 'question' && <div className="flex-1 flex flex-col gap-6 animate-pop" key={s.index}>
      <Timer endsAt={s.q.endsAt} time={s.q.time} /><h2 className="text-3xl md:text-5xl font-extrabold">{s.q.text}</h2>
      <p className="text-mute">{s.answered} / {s.players.length} answered</p><Options q={s.q} /></div>}
    {s.state === 'reveal' && <div className="flex-1 flex flex-col gap-6 animate-pop"><h2 className="text-3xl md:text-5xl font-extrabold">{s.q.text}</h2>
      <Options q={s.q} correct={s.correct} counts={s.counts} /></div>}
    {s.state === 'leaderboard' && <div className="flex-1 animate-pop"><h2 className="text-4xl font-extrabold mb-6">Leaderboard</h2>
      <ol className="space-y-3">{s.board.map(p => <li key={p.id} className="card !p-4 flex justify-between text-2xl"><span><b className="text-lime mr-4">{p.rank}</b>{p.nick}</span><b>{p.score}</b></li>)}</ol></div>}
    {s.state === 'finished' && <Podium board={s.board} />}
    {s.state !== 'finished' ? <button className="btn-p mt-8 self-end text-xl" onClick={next} disabled={s.state === 'lobby' && !s.players.length}>{label}</button>
      : <a href="/" className="btn-s mt-8 self-center">Home</a>}
  </main>);
}
function Options({ q, correct, counts }) {
  return <div className="grid sm:grid-cols-2 gap-4">{q.options.map((o, k) => (
    <div key={k} className={`${ANS[k].bg} text-ink rounded-2xl p-5 text-xl font-bold flex gap-3 justify-between transition ${correct !== undefined && correct !== k ? 'opacity-25' : ''}`}>
      <span>{ANS[k].glyph} {o}</span>{counts && <span>{counts[k]}{correct === k && ' ✓'}</span>}</div>))}</div>;
}
function Podium({ board }) {
  const order = [board[1], board[0], board[2]]; const h = ['h-40', 'h-56', 'h-28'];
  return <div className="flex-1 flex flex-col justify-end"><h2 className="text-4xl font-extrabold text-center mb-8">Podium</h2>
    <div className="flex items-end justify-center gap-3">{order.map((p, i) => p && (<div key={p.id} className="w-1/3 max-w-[200px] text-center">
      <p className="font-bold text-xl truncate">{p.nick}</p><p className="text-mute mb-2">{p.score}</p>
      <div className={`${h[i]} origin-bottom animate-rise ${p.rank === 1 ? 'bg-lime' : 'bg-line'} text-ink rounded-t-2xl grid place-items-center text-5xl font-extrabold`}
        style={{ animationDelay: `${(3 - p.rank) * .4}s` }}><span className={p.rank === 1 ? '' : 'text-white'}>{p.rank}</span></div></div>))}</div></div>;
}
