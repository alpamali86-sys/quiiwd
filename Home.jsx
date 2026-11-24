import { Link, useNavigate } from 'react-router-dom'; import { useState } from 'react';
export default function Home() {
  const nav = useNavigate(); const [code, setCode] = useState('');
  return (<main className="mx-auto max-w-5xl px-5 py-16 md:py-28 grid md:grid-cols-2 gap-12 items-center">
    <div className="animate-pop">
      <p className="text-lime font-bold tracking-widest text-sm mb-4">LIVE QUIZ ARENA</p>
      <h1 className="text-5xl md:text-7xl font-extrabold leading-none">Pulse<span className="text-lime">Quiz</span></h1>
      <p className="text-mute text-xl mt-5 max-w-md">Host on the big screen, answer on your phone, race for the podium.</p>
      <div className="flex gap-3 mt-8 flex-wrap"><Link to="/host" className="btn-p">Host a game</Link>
        <Link to="/create" className="btn-s">Create a quiz</Link></div>
    </div>
    <form className="card animate-pop" onSubmit={e => { e.preventDefault(); code && nav(`/join/${code.toUpperCase()}`); }}>
      <label htmlFor="c" className="font-bold text-xl">Join a game</label>
      <input id="c" className="input mt-4 text-center text-3xl tracking-[.3em] uppercase font-extrabold" maxLength={6}
        placeholder="CODE" value={code} onChange={e => setCode(e.target.value)} />
      <button className="btn-p w-full mt-4" disabled={code.length < 6}>Join</button>
    </form></main>);
}
