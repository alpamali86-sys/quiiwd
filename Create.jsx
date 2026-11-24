import { useState } from 'react'; import { useNavigate } from 'react-router-dom'; import { ANS } from '../socket';
const blank = () => ({ text: '', options: ['', '', '', ''], correct: 0, time: 20 });
export default function Create() {
  const nav = useNavigate(); const [title, setTitle] = useState(''); const [qs, setQs] = useState([blank()]); const [err, setErr] = useState('');
  const set = (i, f) => setQs(qs.map((q, k) => k === i ? { ...q, ...f } : q));
  async function save() {
    const r = await fetch('/api/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, questions: qs }) });
    r.ok ? nav('/host') : setErr('Fill in the title, every question and all 4 options.');
  }
  return (<main className="mx-auto max-w-3xl px-5 py-10 space-y-6">
    <h1 className="text-3xl font-extrabold">Create a quiz</h1>
    <input className="input text-xl" placeholder="Quiz title" value={title} onChange={e => setTitle(e.target.value)} />
    {qs.map((q, i) => (<section key={i} className="card space-y-3 animate-pop">
      <div className="flex justify-between items-center"><b className="text-lime">Question {i + 1}</b>
        {qs.length > 1 && <button className="text-mute hover:text-coral" onClick={() => setQs(qs.filter((_, k) => k !== i))}>Remove</button>}</div>
      <input className="input" placeholder="Question text" value={q.text} onChange={e => set(i, { text: e.target.value })} />
      {q.options.map((o, k) => (<div key={k} className="flex items-center gap-3">
        <span className={`${ANS[k].bg} text-ink w-10 h-10 rounded-lg grid place-items-center font-bold shrink-0`}>{ANS[k].glyph}</span>
        <input className="input" placeholder={`Option ${k + 1}`} value={o} onChange={e => set(i, { options: q.options.map((x, j) => j === k ? e.target.value : x) })} />
        <input type="radio" aria-label="Correct answer" className="accent-lime w-6 h-6 shrink-0" checked={q.correct === k} onChange={() => set(i, { correct: k })} />
      </div>))}
      <label className="flex items-center gap-3 text-mute">Timer
        <select className="input !w-auto" value={q.time} onChange={e => set(i, { time: +e.target.value })}>{[10, 20, 30, 60].map(t => <option key={t} value={t}>{t}s</option>)}</select></label>
    </section>))}
    {err && <p className="text-coral">{err}</p>}
    <div className="flex gap-3"><button className="btn-s" onClick={() => setQs([...qs, blank()])}>+ Add question</button><button className="btn-p" onClick={save}>Save quiz</button></div>
  </main>);
}
