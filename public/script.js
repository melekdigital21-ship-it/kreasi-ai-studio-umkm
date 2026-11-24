// Mengambil elemen-elemen halaman
const viewBeranda = document.getElementById('view-beranda');
const viewKreasi = document.getElementById('view-kreasi');
const viewDrama = document.getElementById('view-drama');
const btnBeranda = document.getElementById('btn-beranda');
const footerUtama = document.getElementById('footer-utama');

// Fungsi untuk membuka aplikasi sesuai tombol yang diklik
function bukaAplikasi(namaAplikasi) {
  // Sembunyikan halaman utama & footer
  viewBeranda.classList.add('hidden');
  footerUtama.classList.add('hidden');
  
  // Munculkan tombol kembali ke halaman utama di header
  btnBeranda.classList.remove('hidden');

  if (namaAplikasi === 'kreasi') {
    viewDrama.classList.add('hidden');
    viewKreasi.classList.remove('hidden');
    
    // Muat URL aplikasi hanya saat tombol diklik (hemat kuota & memori)
    const frameKreasi = document.getElementById('frame-kreasi');
    if (!frameKreasi.src) {
      frameKreasi.src = frameKreasi.getAttribute('data-src');
    }
  } else if (namaAplikasi === 'drama') {
    viewKreasi.classList.add('hidden');
    viewDrama.classList.remove('hidden');

    // Muat URL aplikasi hanya saat tombol diklik (hemat kuota & memori)
    const frameDrama = document.getElementById('frame-drama');
    if (!frameDrama.src) {
      frameDrama.src = frameDrama.getAttribute('data-src');
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fungsi untuk kembali ke halaman utama sapaan UMKM Limo
function tampilkanBeranda() {
  // Sembunyikan kedua aplikasi & tombol kembali
  viewKreasi.classList.add('hidden');
  viewDrama.classList.add('hidden');
  btnBeranda.classList.add('hidden');

  // Tampilkan kembali halaman utama & footer
  viewBeranda.classList.remove('hidden');
  footerUtama.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}