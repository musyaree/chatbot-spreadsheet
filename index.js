const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const P = require("pino");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const { handleMessage } = require("./handler.js");

async function connectToWhatsApp() {
  // Sesi login disimpan di folder ./sessions (persisten antar-restart).
  const { state, saveCreds } = await useMultiFileAuthState("sessions");

  // Ambil versi protokol WhatsApp Web terbaru agar tidak ditolak (405).
  const { version } = await fetchLatestBaileysVersion();
  console.log("Memakai versi WA Web:", version.join("."));

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["Jurnal Bot", "Safari", "3.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Tampilkan QR untuk scan saat belum login.
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(
        "Koneksi terputus:",
        lastDisconnect?.error?.message,
        "| reconnect:",
        !loggedOut
      );
      // Reconnect otomatis kecuali memang di-logout (perlu scan QR ulang).
      if (!loggedOut) connectToWhatsApp();
      else console.log("Sesi logout. Hapus folder sessions/ lalu jalankan ulang untuk scan QR baru.");
    } else if (connection === "open") {
      console.log("Bot tersambung ke WhatsApp. Siap menerima konfirmasi pembayaran.");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg?.message) return;
    if (msg.key.fromMe) return;
    if (msg.key.remoteJid === "status@broadcast") return;

    // Ambil teks baik dari pesan biasa maupun pesan dengan konteks/kutipan.
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";
    if (!text) return;

    try {
      await handleMessage(sock, msg, text);
    } catch (err) {
      console.log("[HANDLER ERROR]", err.message);
    }
  });
}

connectToWhatsApp();
