const { ss } = require("chatbot/ss");
const { parseKonfirmasi } = require("./parser.js");

// Nama tab/sheet tujuan di spreadsheet.
const NAMA_SHEET = "Data Jurnal";

// Timestamp WIB (UTC+7) dalam format "YYYY-MM-DD HH:MM:SS".
function timestampWIB() {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 19).replace("T", " ");
}

// Dipanggil untuk setiap pesan teks masuk. Kalau pesan adalah form
// konfirmasi pembayaran yang valid, datanya di-append ke spreadsheet.
async function handleMessage(sock, msg, text) {
  const data = parseKonfirmasi(text);
  if (!data) return; // bukan form konfirmasi atau data tidak lengkap

  if (!ss) {
    console.log("[SKIP] Spreadsheet tidak aktif (useSpreadsheet=false di config).");
    return;
  }

  const noPengirim = msg.key.remoteJid.split("@")[0];

  // Urutan kolom: Timestamp | Nomor OJS | Nama Author | Judul | Nomor |
  //               Progress | Keterangan | Reviewer | Link
  const row = [
    timestampWIB(),
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
    await ss.addData(`${NAMA_SHEET}!A:I`, row);
    console.log(
      `[SUCCESS] OJS ${data.nomorOjs} (${data.namaPembayar}) tersimpan dari ${noPengirim}.`
    );
  } catch (err) {
    console.log(`[GOOGLE ERROR] Gagal menyimpan data: ${err.message}`);
  }
}

module.exports = { handleMessage };
