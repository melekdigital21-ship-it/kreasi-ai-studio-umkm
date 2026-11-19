// Server Express.js untuk Kreasi AI Studio UMKM (ES Module - Kompatibel Railway & Express 5)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    }

    const { prompt, mode, imageBase64, imageMimeType } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong.' });
    }

    if (mode === 'image') {
      const urlGambar = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
      const imageParts = [{ text: prompt }];
      if (imageBase64) {
        imageParts.push({
          inlineData: {
            mimeType: imageMimeType || 'image/png',
            data: imageBase64
          }
        });
      }
      const response = await fetch(urlGambar, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: imageParts }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '1:1' }
          }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data?.error?.message || 'Gagal membuat gambar AI.' });
      }
      const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part) {
        return res.status(500).json({ error: 'Gambar tidak dikembalikan oleh Gemini API.' });
      }
      return res.json({
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      });
    }

    // Mode Teks (Naskah Video, Copywriting & Promosi)
    const urlTeks = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const response = await fetch(urlTeks, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [{ text: 'Anda adalah pakar digital marketing UMKM Indonesia. Berikan hasil naskah yang praktis, persuasif, terstruktur rapi, dan siap langsung dipakai jualan.' }]
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Gagal memanggil Gemini API.' });
    }

    const hasilTeks = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ text: hasilTeks });
  } catch (err) {
    console.error('Error /api/gemini:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server.' });
  }
});

// Fallback ke index.html di dalam folder public (Kompatibel Express 4 & Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server Kreasi AI Studio UMKM berjalan di port ${PORT}`);
});