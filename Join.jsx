import { useEffect, useState } from 'react'; import { useParams } from 'react-router-dom'; import { socket, ANS } from '../socket'; import Timer from '../Timer';
export default function Join() {
  const { code: c } = useParams(); const [code, setCode] = useState(c || ''); const [nick, setNick] = useState('');
  const [s, setS] = useState(null); const [err, setErr] = useState(''); const [picked, setPicked] = useState(null);
  useEffect(() => { socket.on('room:state', st => { setS(st); if (st.state === 'question') setPicked(p => st.me?.answered ? p : null); }); socket.on('room:closed', () => setS(null)); return () => socket.off('room:state'); }, []);
  const join = e => { e.preventDefault(); socket.emit('player:join', { code, nickname: nick }, r => r.error && setErr(r.error)); };
  const answer = k => { setPicked(k); socket.emit('player:answer', { choice: k }); };
  if (!s) return (<main className="mx-auto max-w-sm px-5 py-16"><form onSubmit={join} className="card space-y-4 animate-pop">
    <h1 className="text-3xl font-extrabold">Join game</h1>
    <input className="input uppercase text-center tracking-widest" placeholder="Room code" maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
    <input className="input" placeholder="Nickname" maxLength={16} value={nick} onChange={e => setNick(e.target.value)} autoFocus />
    {err && <p className="text-coral">{err}</p>}<button className="btn-p w-full" disabled={!code || !nick}>Enter lobby</button></form></main>);
  const me = s.me || {};
  return (<main className="min-h-screen flex flex-col p-4 gap-4">
    <header className="flex justify-between text-mute"><span>{me.nick}</span><b className="text-lime">{me.score} pts</b></header>
    {s.state === 'lobby' && <Msg t="You're in!" sub="Watch the big screen. The host will start soon." />}
    {s.state === 'question' && (me.answered ? <Msg t="Answer locked" sub="Waiting for the others…" /> : <div className="flex-1 flex flex-col gap-4">
      <Timer endsAt={s.q.endsAt} time={s.q.time} /><div className="flex-1 grid grid-cols-2 gap-3">{s.q.options.map((o, k) => (
        <button key={k} onClick={() => answer(k)} className={`${ANS[k].bg} text-ink rounded-2xl p-3 font-bold text-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition`}>
          <span className="text-4xl">{ANS[k].glyph}</span><span className="text-sm leading-tight">{o}</span></button>))}</div></div>)}
    {s.state === 'reveal' && <Msg t={me.answered ? (me.correct ? 'Correct!' : 'Wrong') : 'Too slow'} sub={me.correct ? `+${me.gained} points` : 'Better luck next time'} tone={me.correct ? 'text-lime' : 'text-coral'} />}
    {s.state === 'leaderboard' && <Msg t={`#${me.rank}`} sub={`${me.score} points`} />}
    {s.state === 'finished' && <Msg t={`You finished #${me.rank}`} sub={`${me.score} points`} tone="text-lime" />}
  </main>);
}
const Msg = ({ t, sub, tone = '' }) => <div className="flex-1 grid place-content-center text-center animate-pop"><h2 className={`text-5xl font-extrabold ${tone}`}>{t}</h2><p className="text-mute text-xl mt-3">{sub}</p></div>;
