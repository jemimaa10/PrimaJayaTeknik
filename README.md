# Prima Jaya Teknik

Website Prima Jaya Teknik, versi Indonesia dan English (`/en`).

## Cara jalanin

Link di web ini pakai path dari root (`/products/`, `/contact-us/`, dst), jadi harus dibuka lewat server. Kalau file `index.html` langsung di-double click, link dan CSS-nya nggak jalan.

Pakai Python:

```bash
python -m http.server 8000
```

Atau pakai Node:

```bash
npx serve .
```

Lalu buka `http://localhost:8000` (untuk `npx serve` biasanya `http://localhost:3000`).

## Catatan

- Foto produk, logo, dan banner masih placeholder, ada di `images/placeholder/`.
- Form kontak dan pencarian belum jalan karena butuh backend.
