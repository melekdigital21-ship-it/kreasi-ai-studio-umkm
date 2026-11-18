import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// 1. Rute Cek Status Server (Cepat, langsung mengubah lencana menjadi hijau)
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', text: 'SIAP' });
});

// 2. Rute Generate Teks (Riset, Buat, Jual, Ukur, Prompt Video & Lirik Jingle)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong.' });
    }

    const models = ['gemini-3.1-flash-lite', 'gemini-2.5-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });
        if (response && response.text) {
          console.log(`Berhasil generate teks menggunakan model: ${modelName}`);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model teks ${modelName} gagal:`, err.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Gagal menghasilkan teks dari Gemini.');
    }

    res.json({ result: response.text });
  } catch (error) {
    console.error('Detail Error Gemini API:', error.message || error);
    res.status(500).json({
      error: error.message || 'Gagal memproses permintaan AI.',
    });
  }
});

// 3. Rute Generate Gambar Poster / Foto Produk AI (Dengan Fallback Gratis Otomatis)
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Deskripsi gambar tidak boleh kosong.' });
    }

    // Langkah A: Coba dulu lewat model gambar Gemini
    const imageModels = ['gemini-2.5-flash-image', 'imagen-3.0-generate-002'];
    let imagePart = null;

    for (const modelName of imageModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        const parts = response?.candidates?.[0]?.content?.parts || [];
        imagePart = parts.find((p) => p.inlineData && p.inlineData.data);
        if (imagePart) {
          console.log(`Berhasil generate gambar menggunakan Gemini: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Kuota/model gambar Gemini ${modelName} tidak tersedia:`, err.message);
      }
    }

    if (imagePart) {
      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      const base64Image = `data:${mimeType};base64,${imagePart.inlineData.data}`;
      return res.json({ imageUrl: base64Image });
    }

    // Langkah B: Fallback otomatis ke generator gambar AI gratis jika kuota Gemini penuh
    console.log('Beralih ke mesin gambar AI cadangan gratis...');
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

    const imgResponse = await fetch(fallbackUrl);
    if (!imgResponse.ok) {
      throw new Error('Mesin gambar cadangan sedang sibuk, silakan coba klik sekali lagi.');
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64Fallback = Buffer.from(arrayBuffer).toString('base64');
    res.json({ imageUrl: `data:image/jpeg;base64,${base64Fallback}` });
  } catch (error) {
    console.error('Detail Error Generate Image:', error.message || error);
    res.status(500).json({
      error: error.message || 'Gagal membuat gambar poster.',
    });
  }
});
// 4. Jalankan Server (Port dinamis untuk Railway & lokal)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server UMKM Marketing Studio aktif di port ${PORT}`);
});