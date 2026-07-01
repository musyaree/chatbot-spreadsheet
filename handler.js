const { ss } = require("chatbot/ss");
const { parseKonfirmasi } = require("./parser.js");

// Header tab (8 kolom) sesuai struktur spreadsheet yang sudah ada.
const HEADER = [
  "Nomor OJS",
  "Nama Author",
  "Judul",
  "Nomor",
  "Progress",
  "Keterangan",
  "Reviewer",
  "Link",
];

const NAMA_BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Nama tab untuk bulan berjalan dalam WIB (UTC+7), mis. "Juli 2026".
function tabBulanIni() {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${NAMA_BULAN[wib.getUTCMonth() + 1]} ${wib.getUTCFullYear()}`;
}

// Pastikan tab bulan ini ada; kalau belum, buat + tulis baris header.
async function pastikanTab(nama) {
  const titles = await ss.getSheetTitles();
  if (!titles.includes(nama)) {
    await ss.addSheet(nama);
    await ss.addData(`${nama}!A1`, HEADER);
    console.log(`[INFO] Membuat tab baru: ${nama}`);
  }
}

// Dipanggil untuk setiap pesan teks masuk. Kalau pesan adalah form
// konfirmasi pembayaran yang valid, datanya di-append ke tab bulan ini.
async function handleMessage(sock, msg, text) {
  const data = parseKonfirmasi(text);
  if (!data) return; // bukan form konfirmasi atau data tidak lengkap

  if (!ss) {
    console.log("[SKIP] Spreadsheet tidak aktif (USE_SPREADSHEET != true).");
    return;
  }

  const noPengirim = msg.key.remoteJid.split("@")[0];

  // Urutan kolom: Nomor OJS | Nama Author | Judul | Nomor |
  //               Progress | Keterangan | Reviewer | Link
  const row = [
    data.nomorOjs,
    data.namaPembayar,
    "",         // Judul (diisi manual)
    "",         // Nomor (diisi manual)
    "Submit",   // Progress (status awal)
    data.ftReg, // Keterangan (Fast Track / Reguler)
    "",         // Reviewer (diisi manual)
    "",         // Link (diisi manual)
  ];

  try {
    const tab = tabBulanIni();
    await pastikanTab(tab);
    await ss.addData(`${tab}!A:H`, row);
    console.log(
      `[SUCCESS] OJS ${data.nomorOjs} (${data.namaPembayar}) tersimpan ke "${tab}" dari ${noPengirim}.`
    );
  } catch (err) {
    console.log(`[GOOGLE ERROR] Gagal menyimpan data: ${err.message}`);
  }
}

module.exports = { handleMessage };
