# Super Maker 2D - Level & World Creator

Aplikasi pembuat level platformer 2D dan peta dunia (*overworld maker*) interaktif dengan fisika AABB presisi, audio synthesizer retro, dan dukungan kontrol virtual untuk PC, laptop, tablet, serta HP.

@created by. Pak GuruAI

---

## 🚀 Panduan Deploy ke Vercel melalui GitHub

Aplikasi ini sudah siap dan dikonfigurasi sepenuhnya untuk dideploy langsung ke **Vercel** menggunakan **GitHub**.

### Langkah 1: Upload / Push Kode ke GitHub

1. Buka terminal di folder project ini:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Super Maker 2D"
   ```

2. Buat repository baru di [GitHub](https://github.com/new) (misalnya: `super-maker-2d`).

3. Hubungkan repository lokal ke GitHub dan push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/super-maker-2d.git
   git push -u origin main
   ```

---

### Langkah 2: Hubungkan & Deploy di Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Pada bagian **"Import Git Repository"**, cari dan pilih repository `super-maker-2d` yang baru saja Anda push, lalu klik **"Import"**.
4. Vercel akan otomatis mendeteksi konfigurasi dari berkas `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klik tombol **"Deploy"**.
6. Tunggu sekitar 30–60 detik hingga proses build selesai. Web aplikasi Anda akan langsung aktif dengan domain gratis dari Vercel (contoh: `https://super-maker-2d.vercel.app`)!

---

### 🔄 Otomatisasi (CI/CD)
Setiap kali Anda melakukan commit atau update kode baru ke branch `main` di GitHub (`git push`), Vercel akan secara otomatis membangun ulang (*auto-redeploy*) versi terbaru dalam hitungan detik.

---

### 💻 Menjalankan di Lokal (Development)

```bash
# Install dependencies
npm install

# Jalankan server lokal
npm run dev
```
Akses di browser pada: `http://localhost:3000`
