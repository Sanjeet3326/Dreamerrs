Chatbot (Gemini 2.5 Flash) integration

This project includes a simple chat UI (`chat.html`) and a small server proxy (`server.js`) that forwards chat messages to Google's Generative AI model `gemini-2.5-flash`.

Important security note
- Do NOT put your API key into any client-side files. Keep the key on the server and never commit it to source control.

Setup (local)
1. Install dependencies (Node >= 16). From the project root:

```powershell
npm init -y
npm install express node-fetch
```

2. Set your Google API key in the environment. On Windows PowerShell:

```powershell
$env:GOOGLE_API_KEY = 'YOUR_API_KEY_HERE'
```

(Prefer creating a `.env` or use your OS credential manager — don't commit keys.)

3. Run the server:

```powershell
node server.js
```

4. Open `http://localhost:3000/chat.html` in your browser and try the chat.

How it works
- `chat.html` posts messages to `POST /api/chat` on the same host.
- `server.js` reads `process.env.GOOGLE_API_KEY` and calls the Generative API endpoint:
  `https://generative.googleapis.com/v1/models/gemini-2.5-flash:generate?key=API_KEY`.
- The server extracts the response text and returns it to the client.

Notes & troubleshooting
- The exact request/response fields of Google's Generative API can change; if the response doesn't return plain text, check the returned JSON in server logs and adapt `server.js` extraction logic.
- For production: use a service account + OAuth or restrict API key to specific IPs and enable quotas.
- Consider rate limiting the endpoint and enforcing user authentication before allowing chat access.

If you want, I can:
- Adapt the server to use Google Cloud client libraries (service account) for a more secure setup.
- Add streaming responses (so replies appear token-by-token in the UI).
- Add server-side usage logging and rate limiting.
