# PulseQuiz
Requires Node 18+ and MongoDB (local, or set MONGO_URL).
    cd server && npm i && npm start      # :4000, seeds the Kazakh communication quiz
    cd client && npm i && npm run dev    # :5173 (proxies /api and /socket.io)
For phones, open the host page via your LAN IP (http://192.168.x.x:5173/host) so the QR code contains a reachable URL.
# quiiwd
