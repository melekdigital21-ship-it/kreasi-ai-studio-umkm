import fs from "fs";
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


app.use(express.json({ limit: "6mb" }));

const DATA_DIR = path.join(__dirname, "data");
const PRODUK_FILE = path.join(DATA_DIR, "marketplace-limo.json");

const produkBawaan = [
  {
    id: "limo-1",
    kelurahan: "Limo",
    kategori: "Kebersihan & Botani",
    namaProduk: "Sabun Cuci Piring Lerak Segar",
    namaToko: "UMKM Limo Bersih",
    harga: 15000,
    wa: "6281200000001",
    deskripsi: "Bersih kesat angkat minyak harian, aroma segar, ramah untuk keluarga sekitar Kelurahan Limo.",
    foto: ""
  },
  {
    id: "meruyung-1",
    kelurahan: "Meruyung",
    kategori: "Kuliner & Minuman",
    namaProduk: "Bubur Sumsum & Jajanan Segar",
    namaToko: "Dapur Meruyung",
    harga: 12000,
    wa: "6281200000002",
    deskripsi: "Dibuat segar setiap hari di wilayah Meruyung, tekstur lembut dan rasa pas di lidah.",
    foto: ""
  },
  {
    id: "grogol-1",
    kelurahan: "Grogol",
    kategori: "Kuliner & Minuman",
    namaProduk: "Sambal Rumahan & Lauk Siap Santap",
    namaToko: "Warung Grogol",
    harga: 22000,
    wa: "6281200000003",
    deskripsi: "Racikan bumbu rumahan khas Grogol, cocok jadi teman makan harian di rumah.",
    foto: ""
  },
  {
    id: "krukut-1",
    kelurahan: "Krukut",
    kategori: "Jasa & Kebutuhan Harian",
    namaProduk: "Paket Kebutuhan Harian Keluarga Krukut",
    namaToko: "Mitra Krukut Mandiri",
    harga: 35000,
    wa: "6281200000004",
    deskripsi: "Paket hemat kebutuhan rumah tangga dan minuman segar area Krukut dan sekitarnya.",
    foto: ""
  }
];

function bacaProdukServer() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PRODUK_FILE)) {
      fs.writeFileSync(PRODUK_FILE, JSON.stringify(produkBawaan, null, 2), "utf8");
      return produkBawaan.slice();
    }
    const raw = fs.readFileSync(PRODUK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : produkBawaan.slice();
  } catch (_) {
    return produkBawaan.slice();
  }
}

function tulisProdukServer(daftar) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PRODUK_FILE, JSON.stringify(daftar, null, 2), "utf8");
}

app.get("/api/marketplace-produk", (req, res) => {
  res.json({ produk: bacaProdukServer() });
});

app.post("/api/marketplace-produk", (req, res) => {
  const body = req.body || {};
  const namaProduk = String(body.namaProduk || "").trim();
  if (!namaProduk) {
    return res.status(400).json({ error: "Nama produk wajib diisi." });
  }

  const produkBaru = {
    id: String(body.id || "umkm-" + Date.now()),
    kelurahan: String(body.kelurahan || "Limo").trim(),
    kategori: String(body.kategori || "Kuliner & Minuman").trim(),
    namaProduk,
    namaToko: String(body.namaToko || "UMKM Kecamatan Limo").trim(),
    harga: Math.max(0, Number(body.harga || 0)),
    wa: String(body.wa || "6281200000001").replace(/\D/g, ""),
    deskripsi: String(body.deskripsi || "Produk lokal Kecamatan Limo.").trim(),
    foto: typeof body.foto === "string" ? body.foto : ""
  };

  const daftar = bacaProdukServer();
  daftar.unshift(produkBaru);
  tulisProdukServer(daftar);

  res.status(201).json({ produk: produkBaru, semuaProduk: daftar });
});
import fs from "fs";
import path from "path";

const MARKETPLACE_FILE = path.resolve("data/marketplace-limo.json");

const PRODUK_BAWAAN_LIMO = [
  {
    id: "limo-1",
    kelurahan: "Limo",
    kategori: "Kebersihan & Botani",
    namaProduk: "Sabun Cuci Piring Lerak Segar",
    namaToko: "UMKM Limo Bersih",
    harga: 15000,
    wa: "083811782111",
    deskripsi: "Bersih kesat angkat minyak harian, ramah lingkungan untuk rumah tangga.",
    foto: ""
  },
  {
    id: "limo-2",
    kelurahan: "Limo",
    kategori: "Kebersihan & Botani",
    namaProduk: "sabun lerak botol praktis 500 ml",
    namaToko: "SAPIRCling Limo",
    harga: 18000,
    wa: "628120000002",
    deskripsi: "Kemasan botol 500 ml praktis untuk cuci piring dan perlengkapan dapur.",
    foto: ""
  }
];

function bacaProdukMarketplace() {
  try {
    if (!fs.existsSync(MARKETPLACE_FILE)) {
      fs.mkdirSync(path.dirname(MARKETPLACE_FILE), { recursive: true });
      fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(PRODUK_BAWAAN_LIMO, null, 2), "utf8");
      return [...PRODUK_BAWAAN_LIMO];
    }
    const raw = fs.readFileSync(MARKETPLACE_FILE, "utf8").trim();
    if (!raw) return [...PRODUK_BAWAAN_LIMO];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...PRODUK_BAWAAN_LIMO];
  } catch (err) {
    console.error("Gagal membaca data marketplace:", err);
    return [...PRODUK_BAWAAN_LIMO];
  }
}

function simpanProdukMarketplace(daftar) {
  fs.mkdirSync(path.dirname(MARKETPLACE_FILE), { recursive: true });
  fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(daftar, null, 2), "utf8");
}

app.get("/api/marketplace-produk", (req, res) => {
  const produk = bacaProdukMarketplace();
  res.json({ ok: true, produk, data: produk });
});

app.post("/api/marketplace-produk", (req, res) => {
  const body = req.body || {};
  const namaProduk = String(body.namaProduk || "").trim();
  const namaToko = String(body.namaToko || "").trim();

  if (!namaProduk || !namaToko) {
    return res.status(400).json({
      ok: false,
      error: "Nama produk dan nama usaha/penjual wajib diisi."
    });
  }

  const produkBaru = {
    id: String(body.id || `limo-${Date.now()}`),
    kelurahan: String(body.kelurahan || "Limo").trim(),
    kategori: String(body.kategori || "Kuliner & Minuman").trim(),
    namaProduk,
    namaToko,
    harga: Number(body.harga) || 0,
    wa: String(body.wa || "").replace(/\D/g, ""),
    deskripsi: String(body.deskripsi || "").trim(),
    foto: String(body.foto || "").trim()
  };

  const daftar = bacaProdukMarketplace();
  daftar.unshift(produkBaru);
  simpanProdukMarketplace(daftar);

  return res.status(201).json({
    ok: true,
    produk: produkBaru,
    data: daftar
  });
});
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});