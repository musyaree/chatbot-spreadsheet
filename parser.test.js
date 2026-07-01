const { test } = require("node:test");
const assert = require("node:assert");
const { parseKonfirmasi, normalisasiFtReg } = require("./parser.js");

test("form standar valid", () => {
  const r = parseKonfirmasi(
    "*Konfirmasi Pembayaran*\n-Nomor OJS: 12345\n-FT/Reg: fast track\n-Nama Pembayar: Budi Santoso"
  );
  assert.deepStrictEqual(r, {
    nomorOjs: "12345",
    ftReg: "Fast Track",
    namaPembayar: "Budi Santoso",
  });
});

test("toleran spasi, huruf kecil, tanpa tanda hubung", () => {
  const r = parseKonfirmasi(
    "konfirmasi pembayaran\nNomor OJS : 67890\nFT / Reg:  reguler \nNama Pembayar:  Siti Aminah "
  );
  assert.strictEqual(r.nomorOjs, "67890");
  assert.strictEqual(r.ftReg, "Reguler");
  assert.strictEqual(r.namaPembayar, "Siti Aminah");
});

test("Nomor OJS boleh titik / garis miring (mengandung angka)", () => {
  assert.strictEqual(parseKonfirmasi("Nomor OJS: 12.345\nNama Pembayar: A").nomorOjs, "12.345");
  assert.strictEqual(parseKonfirmasi("Nomor OJS: 2024/07\nNama Pembayar: A").nomorOjs, "2024/07");
});

test("FT/Reg opsional -> string kosong", () => {
  const r = parseKonfirmasi("Nomor OJS: 777\nNama Pembayar: Citra");
  assert.strictEqual(r.ftReg, "");
});

test("FT/Reg nilai tak dikenal dipertahankan apa adanya", () => {
  const r = parseKonfirmasi("Nomor OJS: 1\nFT/Reg: xyz\nNama Pembayar: A");
  assert.strictEqual(r.ftReg, "xyz");
});

test("tolak: Nomor OJS tanpa angka", () => {
  assert.strictEqual(parseKonfirmasi("Nomor OJS: abc\nNama Pembayar: Andi"), null);
  assert.strictEqual(parseKonfirmasi("Nomor OJS: ---\nNama Pembayar: Andi"), null);
});

test("tolak: tanpa Nama Pembayar", () => {
  assert.strictEqual(parseKonfirmasi("Nomor OJS: 555\nFT/Reg: ft"), null);
});

test("tolak: pesan biasa (bukan form)", () => {
  assert.strictEqual(parseKonfirmasi("Halo admin, mau tanya jurnal dong."), null);
});

test("normalisasiFtReg memetakan varian ke label baku", () => {
  assert.strictEqual(normalisasiFtReg("fast track"), "Fast Track");
  assert.strictEqual(normalisasiFtReg("FT"), "Fast Track");
  assert.strictEqual(normalisasiFtReg("reguler"), "Reguler");
  assert.strictEqual(normalisasiFtReg("regular"), "Reguler");
});
