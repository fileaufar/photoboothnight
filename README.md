# 📸 Photobooth Night Online

Photobooth berbasis browser — tidak ada server, tidak ada penyimpanan data, 100% privasi user.

## Fitur
- 🎥 Akses kamera (depan/belakang)
- ⏱️ Timer 5s (bisa pilih 3s / 5s / 10s)
- 🖼️ Layout: 1 foto, 2×2 grid, strip 3 foto
- 🎨 8 filter: normal, b&w, sepia, vivid, bright, neon, drama, matte
- 🖼️ 5 frame: classic, polaroid, floral, retro, birthday
- 🔄 Retake jika tidak suka hasilnya
- 🗂️ Session gallery (simpan beberapa foto sebelum download)
- 🔒 Foto TIDAK dikirim ke server — langsung download ke device user

## Cara Deploy

### 1. Clone / Fork repo ini
```bash
git clone https://github.com/USERNAME/photobooth.git
cd photobooth
```

### 2. Push ke GitHub
```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 3. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Klik **Add New Project**
3. Import repo GitHub kamu
4. Klik **Deploy** — selesai!

Vercel akan otomatis deploy setiap kali kamu push ke `main`.

## Cara Tambah Frame Custom

1. Edit `js/frames.js`, tambahkan renderer baru:

```js
namaFrame: (ctx, w, h) => {
  // gambar frame menggunakan Canvas API
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 20;
  ctx.strokeRect(0, 0, w, h);
},
```

2. Tambahkan tombol di `index.html`:

```html
<button class="frame-btn" data-frame="namaFrame">
  <div class="frame-thumb" style="background: red;"></div>
  <span>nama frame</span>
</button>
```

3. Push ke GitHub → Vercel otomatis update!

## Struktur Project
```
photobooth/
├── index.html          # halaman utama
├── vercel.json         # konfigurasi Vercel
├── css/
│   └── style.css       # styling
├── js/
│   ├── app.js          # logika utama
│   ├── filters.js      # daftar filter CSS
│   └── frames.js       # renderer frame canvas
└── README.md
```

## Privasi
Foto yang diambil **hanya tersimpan di memori browser** user selama sesi berlangsung.
Tidak ada data yang dikirim ke server. Developer tidak bisa melihat hasil foto apapun.
