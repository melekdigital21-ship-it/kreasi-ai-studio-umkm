import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// 1. Rute Generate Teks (Riset, Buat, Jual, Ukur, Prompt Video & Lirik Lagu)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong.' });
    }

    const config = {
      systemInstruction:
        systemInstruction ||
        'Anda adalah konsultan Digital Marketing UMKM berbasis kerangka Riset, Buat, Jual, Ukur. Berikan jawaban dalam Bahasa Indonesia yang praktis, terstruktur, dan mudah dipraktikkan oleh pelaku UMKM.',
      temperature: 0.7,
    };

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });
        console.log(`Berhasil generate teks menggunakan model: ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model teks ${modelName} gagal (${err.status || err.message}), mencoba berikutnya...`);
      }
    }

    if (!response) {
      throw lastError;
    }

    res.json({ result: response.text });
  } catch (error) {
    console.error('Detail Error Gemini API:', error.message || error);
    res.status(500).json({ error: error.message || 'Gagal memproses permintaan ke Gemini API.' });
  }
});

// 2. Rute Generate Gambar Poster / Foto Produk AI
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Deskripsi gambar tidak boleh kosong.' });
    }

    const imageModelsToTry = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
    let imagePart = null;
    let lastError = null;

    for (const modelName of imageModelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseModalities: ['IMAGE'],
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        imagePart = parts.find((p) => p.inlineData);

        if (imagePart) {
          console.log(`Berhasil generate gambar menggunakan model: ${modelName}`);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model gambar ${modelName} gagal (${err.status || err.message}), mencoba berikutnya...`);
      }
    }

    if (!imagePart) {
      throw lastError || new Error('Model tidak mengembalikan data gambar.');
    }

    const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    res.json({ imageUrl: base64Image });
  } catch (error) {
    console.error('Detail Error Generate Image:', error.message || error);
    res.status(500).json({ error: error.message || 'Gagal membuat gambar produk.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server UMKM Marketing Studio aktif di http://localhost:${PORT}`);
});
