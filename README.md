# Portofolio + Dashboard

Website portofolio gelap-editorial (Next.js 15 + Supabase) yang seluruh isinya bisa diubah dari dashboard `/admin`.

## Fitur
**Halaman publik**
- Hero dengan nama besar, foto, teks peran yang berganti-ganti, dan badge berputar
- Teks berjalan (marquee) berisi bidang keahlian
- Seksi karya fleksibel, tiap seksi pilih gaya:
  - **Carousel** — galeri berjalan otomatis (2 baris berlawanan arah jika > 7 karya), klik untuk lightbox
  - **Grid** — susunan masonry
  - **Video** — thumbnail 16:9, tombol play, label platform (YouTube/TikTok/IG) otomatis dari link
  - **Website** — screenshot dalam bingkai browser yang bergulir saat disorot + tombol kunjungi
- Bagian Tentang, Kontak, tautan media sosial
- Animasi muncul saat scroll, hormat pada setting “reduce motion”

**Dashboard**
- Profil: foto, nama, peran, teks berganti, headline, bio, lokasi, kontak & sosmed, link CV, status “terbuka untuk proyek”, warna aksen
- Bidang: tambah/ubah/hapus/urutkan
- Karya: buat seksi apa pun, tambah karya (gambar, judul, deskripsi, link, info, tag), sembunyikan, urutkan, pindah seksi
- **Upload banyak gambar sekaligus** untuk seksi carousel/grid
- Gambar otomatis dikompres ke WebP (maks 2000px) sebelum diunggah
- Halaman publik langsung ter-update setelah menyimpan

## Setup (± 10 menit)

### 1. Supabase
1. Buat proyek baru di supabase.com.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, **ganti `kamu@email.com`** dengan email kamu, lalu **Run**.
3. **Authentication → Users → Add user** → buat akun dengan email yang sama + kata sandi (centang *Auto confirm*).
4. **Authentication → Sign In / Providers** → matikan *Allow new users to sign up* (agar orang lain tidak bisa daftar).

### 2. Jalankan lokal
```bash
cp .env.local.example .env.local   # isi URL, anon key, dan ADMIN_EMAIL
npm install
npm run dev
```
Buka `http://localhost:3000/admin` → masuk → isi konten → lihat `http://localhost:3000`.

### 3. Deploy ke Vercel
1. Push ke GitHub, import di Vercel.
2. Tambahkan 3 environment variable yang sama seperti `.env.local`.
3. Deploy. Tambahkan domain sendiri di Vercel → Settings → Domains bila perlu.

## Keamanan
- Penulisan data & upload dijaga di dua lapis: middleware (`ADMIN_EMAIL`) dan RLS Supabase (tabel `admin_emails`).
- Mengganti email admin: ubah `ADMIN_EMAIL` di env **dan** baris di tabel `admin_emails`.

## Tips konten
- Foto profil: rasio 4:5.
- Thumbnail video: 16:9.
- Website: pakai screenshot **full page** (panjang) supaya efek gulir terlihat.
- Nama seksi dua kata, misalnya “Design Grafis” — kata kedua tampil miring berwarna aksen.
