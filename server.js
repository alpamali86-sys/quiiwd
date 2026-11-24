const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, "public")));

const QUESTIONS = [{"question": "Қарым-қатынас дегеніміз не?", "options": ["Адамның жеке дамуы", "Адамдардың өзара байланыс орнатып, ақпарат алмасуы", "Тек жазбаша сөйлесу", "Адамның демалуы"], "answer": 1}, {"question": "Г.М. Андреева бойынша қарым-қатынас құрылымы неше компоненттен тұрады?", "options": ["2", "4", "3", "5"], "answer": 2}, {"question": "Ақпарат, пікір және білім алмасу қарым-қатынастың қай құрылымына жатады?", "options": ["Перцептивтік", "Интерактивтік", "Коммуникативтік", "Эмоционалдық"], "answer": 2}, {"question": "Бірлескен әрекет пен міндеттерді бөлуді білдіретін компонент қайсы?", "options": ["Интерактивтік", "Перцептивтік", "Коммуникативтік", "Танымдық"], "answer": 0}, {"question": "Вербалды коммуникацияның негізгі құралы қандай?", "options": ["Дене қимылы", "Мимика", "Кеңістік", "Тіл мен сөз"], "answer": 3}, {"question": "Адамның мимикасы, ым-ишарасы және дене қимылы қалай аталады?", "options": ["Проксемика", "Кинесика", "Хронемика", "Такесика"], "answer": 1}, {"question": "Адамдар арасындағы кеңістік пен арақашықтықты зерттейтін бағыт:", "options": ["Такесика", "Кинесика", "Проксемика", "Паралингвистика"], "answer": 2}, {"question": "Басқа адамның сезімін түсіну және онымен ортақтасу қалай аталады?", "options": ["Рефлексия", "Эмпатия", "Стереотиптеу", "Идентификация"], "answer": 1}, {"question": "Өзін басқа адамның орнына қойып көру механизмі:", "options": ["Аттракция", "Каузалды атрибуция", "Идентификация", "Рефлексия"], "answer": 2}, {"question": "Өз әрекеті мен оның басқа адамға әсерін талдау қалай аталады?", "options": ["Рефлексия", "Эмпатия", "Аттракция", "Стереотиптеу"], "answer": 0}, {"question": "Белсенді тыңдау дегеніміз не?", "options": ["Әңгімелесушінің сөзін бөлу", "Өз пікіріңді ғана айту", "Сөзді бөлмей, назар қойып тыңдау", "Әңгімеден қашу"], "answer": 2}, {"question": "Сөздер мен ұғымдарды әртүрлі түсінуден туындайтын кедергі:", "options": ["Техникалық", "Семантикалық", "Әлеуметтік", "Психологиялық"], "answer": 1}, {"question": "Екі тарапқа да тиімді ортақ шешім іздеу қақтығысты шешудің қай тәсіліне жатады?", "options": ["Бәсекелестік", "Жалтару", "Бейімделу", "Ынтымақтастық"], "answer": 3}, {"question": "Цифрлық коммуникацияның негізгі қиындықтарының бірі қандай?", "options": ["Ақпаратты жылдам тарату", "Қашықтан байланыс орнату", "Хабарламаны қате түсіну", "Бірлескен онлайн жұмыс"], "answer": 2}, {"question": "Тиімді қарым-қатынастың маңызды дағдыларының бірі қайсы?", "options": ["Әңгімелесушіні елемеу", "Өз пікірін мәжбүрлеп қабылдату", "Басқаның сөзін бөлу", "Эмпатия және кері байланыс"], "answer": 3}];
const rooms = new Map();
const makeCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

io.on("connection", socket => {
  socket.on("host:create", (_, cb) => {
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();
    rooms.set(code, { host: socket.id, players: new Map(), index: -1, status: "lobby", answers: new Map() });
    socket.join(code);
    cb({ code, total: QUESTIONS.length });
  });

  socket.on("player:join", ({ code, name }, cb) => {
    code = String(code || "").toUpperCase();
    const room = rooms.get(code);
    if (!room || room.status === "finished") return cb({ ok:false, error:"Бөлме табылмады немесе ойын аяқталған." });
    const nickname = String(name || "").trim().slice(0, 18);
    if (!nickname) return cb({ ok:false, error:"Атыңды енгіз." });
    const id = socket.id;
    room.players.set(id, { id, name:nickname, score:0 });
    socket.join(code);
    io.to(code).emit("lobby:update", [...room.players.values()]);
    cb({ ok:true, name:nickname });
  });

  socket.on("host:start", ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    room.status = "playing";
    room.index = 0;
    room.answers.clear();
    io.to(code).emit("game:question", { index:0, total:QUESTIONS.length, question:QUESTIONS[0].question, options:QUESTIONS[0].options, duration:20 });
  });

  socket.on("player:answer", ({ code, choice }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing" || room.answers.has(socket.id)) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const correct = Number(choice) === QUESTIONS[room.index].answer;
    if (correct) player.score += 100;
    room.answers.set(socket.id, { correct });
    io.to(room.host).emit("host:answercount", { answered:room.answers.size, total:room.players.size });
    socket.emit("player:answerresult", { correct });
  });

  socket.on("host:reveal", ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id || room.status !== "playing") return;
    io.to(code).emit("game:reveal", { correct:QUESTIONS[room.index].answer, leaderboard:[...room.players.values()].sort((a,b)=>b.score-a.score) });
  });

  socket.on("host:next", ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id || room.status !== "playing") return;
    room.index++;
    if (room.index >= QUESTIONS.length) {
      room.status = "finished";
      io.to(code).emit("game:finished", [...room.players.values()].sort((a,b)=>b.score-a.score));
      return;
    }
    room.answers.clear();
    io.to(code).emit("game:question", { index:room.index, total:QUESTIONS.length, question:QUESTIONS[room.index].question, options:QUESTIONS[room.index].options, duration:20 });
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      if (room.host === socket.id) {
        io.to(code).emit("room:closed");
        rooms.delete(code);
      } else if (room.players.delete(socket.id)) {
        io.to(code).emit("lobby:update", [...room.players.values()]);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Quizzy running on ${PORT}`));
