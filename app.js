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

// 3. Rute Generate Gambar Poster / Foto Produk AI
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Deskripsi gambar tidak boleh kosong.' });
    }

    const imageModels = ['gemini-2.5-flash-image', 'gemini-3.1-flash-lite-image'];
    let imagePart = null;
    let lastError = null;

    for (const modelName of imageModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        const parts = response?.candidates?.[0]?.content?.parts || [];
        imagePart = parts.find((p) => p.inlineData && p.inlineData.data);
        if (imagePart) {
          console.log(`Berhasil generate gambar menggunakan model: ${modelName}`);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model gambar ${modelName} gagal:`, err.message);
      }
    }

    if (!imagePart) {
      throw lastError || new Error('Model gambar tidak mengembalikan visual.');
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const base64Image = `data:${mimeType};base64,${imagePart.inlineData.data}`;
    res.json({ imageUrl: base64Image });
  } catch (error) {
    console.error('Detail Error Generate Image:', error.message || error);
    const msg = String(error.message || '');
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota');
    res.status(500).json({
      error: isQuota
        ? 'Server gambar sedang ramai (kuota gratis per menit penuh). Tunggu 1 menit lalu klik lagi!'
        : msg || 'Gagal membuat gambar poster.',
    });
  }
});

// 4. Jalankan Server (Port dinamis untuk Railway & lokal)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server UMKM Marketing Studio aktif di port ${PORT}`);
});