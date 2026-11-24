import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

const TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash"
];
const IMAGE_MODELS = ["gemini-2.5-flash-image"];

function resolveApiKey(req) {
  const headerKey = (req.headers["x-gemini-api-key"] || "").trim();
  const bodyKey = (req.body && req.body.apiKey ? String(req.body.apiKey) : "").trim();
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
  return headerKey || bodyKey || envKey;
}

app.get("/api/status", (req, res) => {
  const hasEnvKey = Boolean((process.env.GEMINI_API_KEY || "").trim());
  res.json({
    ok: true,
    serverApiKeyActive: hasEnvKey
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY belum tersedia di server Railway maupun di browser."
      });
    }

    const prompt = (req.body && req.body.prompt ? String(req.body.prompt) : "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt tidak boleh kosong." });
    }

    let lastError = "Gagal memanggil Gemini API.";
    for (const model of TEXT_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (response.ok) {
        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("")
            .trim() || "";
        if (text) {
          return res.json({ text, model });
        }
      } else {
        lastError = data?.error?.message || `HTTP ${response.status} (${model})`;
      }
    }

    return res.status(502).json({ error: lastError });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Terjadi kesalahan pada server saat memproses AI."
    });
  }
});

app.post("/api/poster", async (req, res) => {
  try {
    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY belum tersedia di server Railway maupun di browser."
      });
    }

    const prompt = (req.body && req.body.prompt ? String(req.body.prompt) : "").trim();
    const photoDataUrl = (req.body && req.body.photoDataUrl ? String(req.body.photoDataUrl) : "").trim();

    if (!prompt) {
      return res.status(400).json({ error: "Instruksi poster tidak boleh kosong." });
    }

    const parts = [{ text: prompt }];
    if (photoDataUrl && photoDataUrl.includes(",")) {
      const [meta, base64Data] = photoDataUrl.split(",");
      const mimeMatch = meta.match(/data:(.*?);base64/);
      parts.push({
        inlineData: {
          mimeType: (mimeMatch && mimeMatch[1]) || "image/jpeg",
          data: base64Data
        }
      });
    }

    let lastError = "Gagal membuat poster AI.";
    for (const model of IMAGE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        })
      });

      const data = await response.json();
      if (response.ok) {
        const respParts = data?.candidates?.[0]?.content?.parts || [];
        let imageDataUrl = "";
        let notes = "";

        for (const p of respParts) {
          if (p.inlineData && p.inlineData.data) {
            imageDataUrl = `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}`;
          } else if (p.text) {
            notes += p.text + "\n";
          }
        }

        if (imageDataUrl || notes.trim()) {
          return res.json({
            imageDataUrl,
            notes: notes.trim(),
            model
          });
        }
      } else {
        lastError = data?.error?.message || `HTTP ${response.status} (${model})`;
      }
    }

    return res.status(502).json({ error: lastError });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Terjadi kesalahan server saat membuat poster."
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server Kreasi AI Studio UMKM berjalan di port ${PORT}`);
});