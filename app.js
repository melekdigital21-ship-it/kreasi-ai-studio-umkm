// Server Express.js (ES Module) untuk Kreasi AI Studio UMKM
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint utama untuk menghubungi Gemini API memakai GEMINI_API_KEY dari environment server
app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum diatur di Environment Variables.' });
    }

    const { prompt, mode } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong.' });
    }

    // Mode pembuatan latar poster gambar AI
    if (mode === 'image') {
      const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
      const imgRes = await fetch(imgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '1:1' }
          }
        })
      });
      const imgData = await imgRes.json();
      if (!imgRes.ok) {
        return res.status(imgRes.status).json({ error: imgData?.error?.message || 'Gagal membuat gambar AI.' });
      }
      const part = imgData?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part) {
        return res.status(500).json({ error: 'Model tidak mengembalikan data gambar.' });
      }
      return res.json({
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      });
    }

    // Mode pembuatan naskah konten & copywriting teks
    const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const textRes = await fetch(textUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [{
            text: 'Anda adalah pakar digital marketing UMKM Indonesia. Berikan hasil naskah yang praktis, persuasif, terstruktur rapi, dan siap langsung dipakai jualan.'
          }]
        }
      })
    });
    const textData = await textRes.json();
    if (!textRes.ok) {
      return res.status(textRes.status).json({ error: textData?.error?.message || 'Gagal memanggil Gemini API.' });
    }
    const text = textData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server.' });
  }
});

// Fallback ke index.html di dalam folder public
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server Kreasi AI Studio UMKM berjalan di port ${PORT}`);
});