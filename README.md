# Jurnal Bot

A WhatsApp bot that logs journal (OJS) payment confirmations straight into a Google Spreadsheet. Whenever a confirmation message arrives at the bot's number, the data is recorded automatically into that month's sheet, so there is no manual data entry. The bot only records messages and does not reply to the sender.

The WhatsApp side uses [Baileys](https://github.com/WhiskeySockets/Baileys), and the data is stored through the Google Sheets API.

## Message format

```
*Konfirmasi Pembayaran*
-Nomor OJS: 12345
-FT/Reg: fast track
-Nama Pembayar: Joko Widodo
```

From a message like this, the bot extracts the OJS number, the FT/Reg field, and the payer's name, then writes them to the tab for the current month (for example `Juli 2026`). If that month's tab does not exist yet, it is created automatically. The format is fairly forgiving about spacing and letter case, so it does not have to match exactly.

Two fields are required: the OJS number must contain digits, and the payer's name cannot be empty. Messages that are incomplete or not in the confirmation format are ignored. The FT/Reg value is also normalized automatically to either `Fast Track` or `Reguler`.

In the spreadsheet, the columns filled automatically are only Nomor OJS, Nama Author, Progress (set to `Submit`), and Keterangan (which holds the FT/Reg value). The remaining columns such as Judul and Reviewer are left blank on purpose, to be filled in manually.

## Setting up Google Sheets

This is the most tedious part, but you only need to do it once. The goal is to create a service account so the bot has permission to write to the spreadsheet.

1. Prepare the spreadsheet and note its ID from the URL, the `.../spreadsheets/d/<ID>/edit` part.
2. Go to the [Google Cloud Console](https://console.cloud.google.com) and create a new project.
3. Open APIs & Services, Enable APIs & Services, search for the Google Sheets API, then click Enable.
4. Go to Credentials, Create Credentials, choose Service account, and fill in the name until it is done.
5. Open that service account, go to the Keys tab, Add key, Create new key, then choose JSON. The file downloads right away.
6. Place that JSON file in the project root and name it `credentials.json`.

The step people forget most often: the spreadsheet has to be shared with the service account email (see `client_email` inside `credentials.json`) with the Editor role. If you skip it, you will get a 403 error even though the credentials are correct.

## Configuration

Copy `.env.example` to `.env`, then fill in the values.

```bash
cp .env.example .env
```

```
USE_SPREADSHEET=true
KEY_FILE_NAME=credentials.json
SHEET_ID=<YOUR_SPREADSHEET_ID>
```

`.env` and `credentials.json` are deliberately kept out of Git because they hold secrets.

## Running

Requires Node.js 20 or 22.

```bash
npm install
npm run bot
```

A QR code appears in the terminal. Scan it with the bot's number through WhatsApp, under Linked Devices, then Link a Device. Once you see the message "Bot tersambung ke WhatsApp", the bot is ready. The login session is stored in the `sessions/` folder, so you will not need to scan again on the next run.

## Tests

```bash
npm test
```

This runs the unit tests for the parser. The same tests also run automatically in GitHub Actions on every push or pull request to `main`.

## Notes

Baileys is an unofficial library, and automating WhatsApp this way violates its Terms of Service, so there is a chance the number gets banned. For that reason, use a dedicated number rather than a personal one, especially if you plan to run it continuously.

This project started as a fork of [fathb/chatbot-spreadsheet](https://github.com/fathb/chatbot-spreadsheet), but it has since been reworked considerably for logging journal payments.
