# Prima Jaya Teknik

Website Prima Jaya Teknik, versi Indonesia dan English (`/en`). Backend pakai ASP.NET Core (.NET 10), datanya disimpan di SQLite.

## Yang dibutuhin

- [.NET 10 SDK](https://dotnet.microsoft.com/download)

## Cara jalanin

```bash
dotnet run
```

Buka alamat yang muncul di terminal (biasanya `http://localhost:5000`). Kalau mau port tertentu:

```bash
dotnet run --urls http://localhost:8000
```

Database (`App_Data/primajayateknik.db`) dibuat otomatis waktu pertama kali jalan.

## Setting email form kontak

Pesan dari form kontak selalu disimpan ke database. Supaya juga dikirim ke email, isi bagian `Smtp` di `appsettings.json`:

```json
"Smtp": {
  "User": "emailkamu@gmail.com",
  "Password": "app password gmail",
  "To": "teknikprimajayaa@gmail.com"
}
```

Password-nya pakai **App Password** Gmail (Google Account → Security → 2-Step Verification → App passwords), bukan password Gmail biasa. Jangan di-commit ke GitHub, mending taruh di `appsettings.Development.json` (sudah di-ignore) atau environment variable `Smtp__Password`.

Nomor HP, WhatsApp, dan email yang muncul waktu kontak diklik diatur di bagian `Contact`.

## Struktur

- `wwwroot/` – halaman, CSS, JS, gambar
- `Templates/` – template halaman pencarian dan 404
- `Services/` – katalog produk, pencarian, database, kirim email
- `Program.cs` – routing dan endpoint (`/contact-us`, `/leads/...`, `/find`)

## Catatan

Foto produk, logo, dan banner masih placeholder, ada di `wwwroot/images/placeholder/`.
