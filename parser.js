// Parser pesan "Konfirmasi Pembayaran" jurnal.
// Format pesan yang diharapkan (label boleh beda spasi / huruf besar-kecil):
//   *Konfirmasi Pembayaran*
//   -Nomor OJS: 12345
//   -FT/Reg: fast track
//   -Nama Pembayar: Budi Santoso

// Seragamkan nilai FT/Reg menjadi "Fast Track" atau "Reguler".
function normalisasiFtReg(nilai) {
  const v = nilai.toLowerCase();
  if (v.includes("ft") || v.includes("fast")) return "Fast Track";
  if (v.includes("reg")) return "Reguler";
  return nilai.trim();
}

// Ekstrak data dari teks pesan.
// Mengembalikan objek {nomorOjs, ftReg, namaPembayar} bila valid,
// atau null bila pesan bukan form konfirmasi / data wajib tidak lengkap.
function parseKonfirmasi(text) {
  const ambil = (pattern) => {
    const m = text.match(pattern);
    return m ? m[1].trim() : "";
  };

  const nomorOjs = ambil(/Nomor\s*OJS\s*:\s*(\d+)/i);
  const ftRegRaw = ambil(/FT\s*\/\s*Reg\s*:\s*(.+)/i);
  const namaPembayar = ambil(/Nama\s*Pembayar\s*:\s*(.+)/i);

  // Wajib: minimal Nomor OJS (harus angka) dan Nama Pembayar terisi.
  if (!nomorOjs || !namaPembayar) return null;

  return {
    nomorOjs,
    ftReg: ftRegRaw ? normalisasiFtReg(ftRegRaw) : "",
    namaPembayar,
  };
}

module.exports = { parseKonfirmasi, normalisasiFtReg };
