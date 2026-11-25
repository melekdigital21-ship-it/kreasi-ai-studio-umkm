import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const TEXT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function resolveApiKey(req) {
  const headerKey = req.headers["x-goog-api-key"] || req.headers["x-api-key"] || "";
  const bodyKey = req.body && req.body.apiKey ? String(req.body.apiKey).trim() : "";
  const envKey = process.env.GEMINI_API_KEY ? String(process.env.GEMINI_API_KEY).trim() : "";
  return String(headerKey).trim() || bodyKey || envKey;
}

app.get("/api/status", (req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim());
  res.json({
    ok: true,
    serverApiKeyActive: hasEnvKey,
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY belum tersedia di server Railway maupun diinput.",
      });
    }

    const prompt = req.body && req.body.prompt ? String(req.body.prompt).trim() : "";
    if (!prompt) {
      return res.status(400).json({
        error: "Prompt tidak boleh kosong.",
      });
    }

    let lastError = "Gagal memanggil Gemini API.";

    for (const model of TEXT_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim() || "";

        return res.json({
          ok: true,
          model,
          text,
        });
      }

      lastError = data?.error?.message || `HTTP ${response.status} dari model ${model}`;
    }

    return res.status(502).json({
      ok: false,
      error: lastError,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Terjadi kesalahan pada server.",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});