// Simple Express proxy to call Google Generative API (Gemini 2.5 Flash).
// IMPORTANT: Set your API key in the environment variable GOOGLE_API_KEY before running.
// Do NOT embed the API key in client-side code.

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // if using Node 18+ you can use global fetch instead
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Add CORS headers for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server missing GOOGLE_API_KEY env variable' });

  const userMessage = req.body?.message || '';
  if (!userMessage) return res.status(400).json({ error: 'No message provided' });

  try {
    // Try multiple endpoint variants in case the API path/version differs.
    const model = 'gemini-2.5-flash';
    const candidateEndpoints = [
      `https://generativelanguage.googleapis.com/v1/models/${model}:generate?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generate?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateText?key=${apiKey}`
    ];

    const body = {
      text: userMessage,
      temperature: 0.7,
      maxOutputTokens: 800
    };

    let lastError = null;
    let json = null;
    let usedEndpoint = null;

    for (const endpoint of candidateEndpoints) {
      try {
        console.log('Attempting endpoint:', endpoint);
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          timeout: 20000
        });

        const raw = await r.text();
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch (parseErr) {
          console.warn('Failed to parse JSON from endpoint', endpoint, 'status', r.status);
          console.warn('Raw response (truncated):', raw && raw.slice ? raw.slice(0, 1000) : raw);
          lastError = { type: 'parse', endpoint, status: r.status, raw };
          // try next endpoint
          continue;
        }

        if (!r.ok) {
          console.warn('Upstream API returned non-OK status', r.status, r.statusText, json);
          lastError = { type: 'status', endpoint, status: r.status, json };
          // try next endpoint
          continue;
        }

        // if we get here, we have a parsed JSON and OK status
        usedEndpoint = endpoint;
        break;
      } catch (err) {
        console.warn('Request failed for endpoint', endpoint, err && err.message);
        lastError = { type: 'fetch', endpoint, error: err };
        continue;
      }
    }

    if (!json) {
      console.error('All endpoint attempts failed. Last error:', lastError);
      // Provide helpful guidance based on lastError
      if (lastError && lastError.type === 'status' && lastError.status === 404) {
        return res.status(502).json({ error: 'Upstream API returned 404 Not Found. The model or endpoint path may be incorrect or not available for your API key.' });
      }
      return res.status(502).json({ error: 'Failed to get a valid JSON response from upstream API', details: lastError });
    }

    let reply = '';
    console.log('Using endpoint:', usedEndpoint);
    console.log('API Response (parsed):', json);

    if (json.text) {
      reply = json.text;
    } else if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      reply = json.candidates[0].content.parts[0].text;
    } else if (json.output && json.output[0] && json.output[0].content) {
      // some beta responses use output array
      try {
        reply = json.output[0].content.map(c => c.text || c).join('\n');
      } catch (e) { reply = String(json.output[0].content); }
    } else {
      console.error('Unexpected API response format:', json);
      return res.status(500).json({ error: 'Unexpected API response format', sample: json });
    }

    return res.json({ reply });
  } catch (err) {
    console.error('Chat proxy error', err);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));
