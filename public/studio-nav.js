// Riwayat tab internal per halaman agar tombol Kembali bisa mundur bertahap
const riwayatPanelStudio = [];

function aktifkanPanelStudio(targetId, simpanRiwayat = true) {
  const panels = document.querySelectorAll('.studio-panel');
  const buttons = document.querySelectorAll('.nav-btn[data-panel]');

  if (!panels.length) return;

  const panelAktifSekarang = document.querySelector('.studio-panel:not([hidden])');
  if (simpanRiwayat && panelAktifSekarang && panelAktifSekarang.id !== targetId) {
    riwayatPanelStudio.push(panelAktifSekarang.id);
  }

  panels.forEach((panel) => {
    panel.hidden = panel.id !== targetId;
  });

  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.panel === targetId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function kembaliHalaman(halamanTujuan = 'index.html') {
  // 1. Jika user baru saja berpindah menu/kolom di dalam studio yang sama, kembali ke kolom sebelumnya
  if (riwayatPanelStudio.length > 0) {
    const panelSebelumnya = riwayatPanelStudio.pop();
    aktifkanPanelStudio(panelSebelumnya, false);
    return;
  }

  // 2. Jika halaman dibuka di dalam iframe portal utama, minta portal kembali ke beranda
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ action: 'kembali-portal', fallback: halamanTujuan }, '*');
  }

  // 3. Arahkan ke halaman tujuan (misal beranda portal atau dashboard studio)
  window.location.href = halamanTujuan;
}

document.addEventListener('DOMContentLoaded', () => {
  // Pasang klik otomatis ke semua tombol menu sidebar
  document.querySelectorAll('.nav-btn[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      aktifkanPanelStudio(btn.dataset.panel, true);
    });
  });

  // Pasang klik otomatis ke semua tombol dengan atribut data-back
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kembaliHalaman(btn.dataset.back || 'index.html');
    });
  });
});