function formatRupiah(angka) {
  // Format angka ke "Rp.1.000.000,-"
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);

  // Tambahkan titik setelah Rp dan ,-
  return formatted.replace('Rp', 'Rp.') + ',-';
}

// Ambil semua elemen dengan class 'rupiah'
const elements = document.querySelectorAll('.rupiah');

elements.forEach(el => {
  const raw = el.textContent;
  const cleaned = raw.replace(/[^\d]/g, ''); // hanya angka

  if (cleaned === '' || isNaN(Number(cleaned))) {
    el.textContent = 'Call';
  } else {
    el.textContent = formatRupiah(Number(cleaned));
  }
});
