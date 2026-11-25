const DAFTAR_STUDIO = ['kreasi', 'drama', 'animasi', 'musik'];

function bukaAplikasiPortal(nama) {
  const beranda = document.getElementById('view-beranda');
  if (beranda) {
    beranda.classList.add('hidden');
  }

  DAFTAR_STUDIO.forEach((item) => {
    const section = document.getElementById(`view-${item}`);
    if (section) {
      section.classList.add('hidden');
      section.classList.remove('flex');
    }
  });

  const targetSection = document.getElementById(`view-${nama}`);
  const targetFrame = document.getElementById(`frame-${nama}`);

  if (targetFrame && !targetFrame.getAttribute('src') && targetFrame.dataset.src) {
    targetFrame.setAttribute('src', targetFrame.dataset.src);
  }

  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.classList.add('flex');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function kembaliKeBerandaPortal() {
  DAFTAR_STUDIO.forEach((item) => {
    const section = document.getElementById(`view-${item}`);
    if (section) {
      section.classList.add('hidden');
      section.classList.remove('flex');
    }
  });

  const beranda = document.getElementById('view-beranda');
  if (beranda) {
    beranda.classList.remove('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}