# Quizzy — multiplayer quiz MVP

## Run locally
1. Install Node.js 18+
2. In this folder run: `npm install`
3. Run: `npm start`
4. Open http://localhost:3000

For phones on the same Wi-Fi, use your computer's local network IP instead of localhost.

## Publish online (no custom domain needed)
1. Push this folder to a GitHub repository.
2. Create a new **Web Service** on Render and connect that repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Render gives you a public URL such as `https://your-app.onrender.com`.
6. Share that URL; the in-game QR will point to the same public site.

Note: use a Node hosting service that supports persistent WebSocket connections. Render free instances may sleep when idle, so the first connection can take a little time.

## MVP notes
- Host creates a room and displays a QR.
- Players scan QR, enter a nickname, and join the live lobby.
- 15 supplied Kazakh questions are included.
- Host manually reveals answers and advances questions.
- Scores award 100 points per correct answer.
- This is a starter MVP, not a production anti-cheat platform.
