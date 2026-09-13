# 📘 PANDUAN OPERASIONAL LENGKAP: PETORA
**Sistem Manajemen Terpadu Petshop & Petcare**

---

## 🌟 1. Pengantar & Visi PETORA
**PETORA** adalah sistem digital all-in-one yang dirancang untuk mengelola seluruh operasional bisnis petshop dan petcare dalam satu platform. Sistem ini menggantikan pencatatan manual, mencegah kesalahan manusia (human error), memastikan stok selalu akurat, dan memberikan pengalaman terbaik bagi pelanggan.

**Manfaat Utama:**
- **Terintegrasi:** Data pelanggan, hewan, medis, inventaris, dan keuangan tersambung otomatis.
- **Real-time:** Stok berkurang saat terjadi penjualan, kamar hotel terupdate saat ada check-in.
- **Aman & Terkontrol:** Setiap tindakan dicatat, hak akses dibatasi sesuai peran, dan data keuangan terlindungi.
- **Ramah Pelanggan:** Portal mandiri untuk pelanggan agar bisa booking dan cek riwayat kapan saja.

---

## 👥 2. Panduan Peran Pengguna (Role-Based Guide)

Sistem PETORA membagi akses berdasarkan peran (role) untuk memastikan setiap pengguna hanya melihat dan melakukan apa yang menjadi tanggung jawabnya.

### 🏢 A. Pemilik Bisnis (OWNER)
*Fokus: Kontrol penuh, pengawasan keuangan, dan pengaturan strategis.*
- **Dashboard Eksekutif:** Melihat ringkasan pendapatan harian/bulanan, laba rugi, dan produk yang stoknya menipis dalam satu layar.
- **Manajemen Staf:** Membuat akun untuk Admin, Dokter, dan Kasir. Mengatur hak akses dan melakukan reset PIN jika staf lupa.
- **Laporan Keuangan:** Mengakses laporan Pendapatan, Laba Rugi (Profit & Loss), dan Valuasi Inventaris secara real-time.
- **Pengaturan Sistem:** Mengatur jam operasional klinik, format nomor faktur, aturan poin loyalitas, dan kategori pengeluaran.
- **Persetujuan Pengeluaran:** Menyetujui atau menolak pengajuan pengeluaran operasional yang diajukan oleh Admin.

### 📋 B. Manajer Operasional (ADMIN)
*Fokus: Kelancaran operasional harian, manajemen data, dan inventaris.*
- **Manajemen Pelanggan (CRM):** Mendaftarkan pelanggan baru, mencatat data hewan peliharaan (nama, spesies, ras, tanggal lahir, alergi, chip number), dan mengubah status pelanggan "tamu" menjadi "terdaftar".
- **Manajemen Inventaris:** Menambah produk baru, mencatat stok masuk (dari supplier) dan keluar, melakukan opname stok, serta membuat Purchase Order (PO) saat barang hampir habis.
- **Penjadwalan:** Mengatur jadwal shift dokter dan groomer, serta mengelola antrean harian.
- **Promosi & Engagement:** Membuat kode diskon, program *happy hour*, atau promo ulang tahun untuk meningkatkan penjualan.
- **Pet Hotel & Grooming:** Mengelola ketersediaan kamar, menerima booking, dan melakukan proses check-in/check-out.

### 🩺 C. Dokter Hewan (DOKTER)
*Fokus: Pelayanan medis, diagnosis, dan rekam kesehatan hewan.*
- **Antrean Pasien:** Melihat daftar hewan yang menunggu pemeriksaan (status *WAITING*) berdasarkan nomor antrean.
- **Proses Pemeriksaan:** Mengubah status menjadi *Sedang Diperiksa* (*IN_PROGRESS*).
- **Rekam Medis Digital:** Mengisi data pemeriksaan lengkap: keluhan utama, riwayat, hasil fisik (berat badan, suhu, detak jantung), diagnosis, resep obat, dan mengunggah foto hasil rontgen/lab.
- **Riwayat Hewan:** Melihat riwayat vaksin, penyakit, dan alergi hewan tersebut sebelum memberikan tindakan.
- **Penyelesaian:** Mengubah status menjadi *SELESAI* (*DONE*), yang secara otomatis memberi sinyal ke Kasir untuk membuat tagihan medis.

### 💰 D. Kasir (KASIR)
*Fokus: Transaksi, pembayaran, dan pengelolaan uang tunai.*
- **Buka Shift:** Mencatat modal awal (*opening cash*) di awal shift kerja.
- **Point of Sale (POS):** Memindai barcode produk, menambahkan jasa (klinik, hotel, grooming) ke keranjang belanja, dan menerapkan diskon atau poin loyalitas pelanggan.
- **Pembayaran:** Menerima pembayaran melalui berbagai metode (Tunai, QRIS, Transfer, E-Wallet) dan mencetak struk/faktur.
- **Manajemen Faktur:** Membatalkan faktur (dengan alasan yang tercatat) atau mencatat pembayaran cicilan (*partial payment*).
- **Tutup Shift:** Mencocokkan uang fisik di laci dengan total transaksi sistem. Sistem akan otomatis menghitung selisih (kekurangan/kelebihan) untuk dilaporkan ke Owner/Admin.

### 🐾 E. Pelanggan (CUSTOMER)
*Fokus: Kemudahan layanan mandiri melalui Portal Pelanggan.*
- **Profil Hewan:** Melihat data hewan peliharaan, jadwal vaksin berikutnya, dan riwayat medis dasar.
- **Reservasi Mandiri:** Melakukan booking janji temu dokter, jadwal grooming, atau pemesanan kamar pet hotel secara online.
- **Pembayaran Tagihan:** Melihat daftar tagihan yang belum dibayar dan melakukan pembayaran online (via QRIS/Transfer).
- **Program Loyalitas:** Mengecek jumlah poin yang dimiliki dan menukarkannya dengan diskon saat berbelanja atau melakukan layanan.
- **Umpan Balik:** Memberikan rating dan ulasan setelah layanan selesai.

---

## ⚙️ 3. Alur Kerja Operasional Utama (Core Workflows)

Berikut adalah langkah-langkah nyata bagaimana PETORA bekerja dalam skenario sehari-hari:

### Skenario 1: Kunjungan Klinik Lengkap
1. **Kedatangan:** Pelanggan datang. Admin/Kasir mencari data pelanggan. Jika baru, Admin mendaftarkan pelanggan dan data hewan peliharaannya.
2. **Antrean:** Admin membuat janji temu (*appointment*) untuk hari itu. Hewan masuk daftar antrean dengan nomor urut.
3. **Pemeriksaan:** Dokter memanggil nomor antrean. Dokter membuka rekam medis, melakukan pemeriksaan, mengisi diagnosis & resep, lalu menandai status "Selesai".
4. **Pembayaran:** Kasir menerima notifikasi. Kasir membuka layar POS, item jasa klinik dan obat otomatis masuk ke keranjang. Kasir menerapkan diskon (jika ada), pelanggan membayar, dan poin loyalitas otomatis bertambah.

### Skenario 2: Inap di Pet Hotel (Check-in hingga Check-out)
1. **Booking:** Pelanggan memesan via Portal atau Admin membuatkan booking. Sistem mengecek ketersediaan kamar pada tanggal tersebut. Jika ada, kamar berstatus *Dipesan* (*RESERVED*).
2. **Check-in:** Saat hari H, Admin melakukan *Check-in*. Sistem mencatat waktu aktual dan mengubah status kamar menjadi *Terisi* (*OCCUPIED*).
3. **Selama Inap:** Staf dapat menambahkan "Log Harian" (misal: "Sudah makan", "Diberi obat", foto aktivitas) yang bisa dilihat pelanggan via Portal.
4. **Check-out:** Admin melakukan *Check-out*. Sistem otomatis menghitung total hari inap (termasuk tambahan jika lewat tengah malam), memperbarui total tagihan, dan mengubah status kamar menjadi *Tersedia tapi Perlu Dibersihkan* (*DIRTY*).
5. **Penagihan:** Item biaya inap otomatis masuk ke faktur pelanggan untuk dibayarkan di Kasir.

### Skenario 3: Restock Inventaris (Purchase Order)
1. **Pemicu:** Sistem memberi notifikasi bahwa stok "Makanan Anjing Brand A" sudah di bawah batas minimum.
2. **Pembuatan PO:** Admin membuat Purchase Order (PO) ke supplier yang berisi daftar barang dan jumlah yang dipesan. Status PO: *DRAFT*.
3. **Pengiriman:** Admin mengubah status PO menjadi *TERKIRIM* (*SENT*).
4. **Penerimaan Barang:** Barang tiba. Admin membuka PO, memasukkan jumlah barang yang *benar-benar diterima* (bisa kurang/lebih dari pesanan). 
5. **Update Stok:** Saat disimpan, stok di sistem otomatis bertambah, dan status PO berubah menjadi *DITERIMA* (*RECEIVED*).

---

## 🎁 4. Fitur Pendukung & Aturan Operasional

### A. Program Loyalitas (Loyalty Program)
- **Cara Kerja:** Setiap pembelian senilai Rp10.000 akan mendapatkan 1 poin (dapat dikalikan sesuai tier pelanggan: Bronze, Silver, Gold).
- **Penukaran:** 1 Poin = Potongan Rp100. Pelanggan bisa menukarkan poin saat checkout di Kasir atau via Portal.
- **Upgrade Tier:** Jika total belanja atau poin pelanggan mencapai batas tertentu, sistem otomatis menaikkan tier mereka dan mengirim notifikasi selamat.

### B. Notifikasi Otomatis
- **Pengingat Vaksin:** Sistem otomatis mengirim notifikasi (WhatsApp/Email) H-14 sebelum jadwal vaksin berikutnya.
- **Pengingat Janji Temu:** Notifikasi H-1 sebelum jadwal pemeriksaan atau grooming.
- **Pembayaran Berhasil:** Notifikasi instan ke pelanggan setelah faktur lunas.

### C. Kebijakan & Keamanan Sistem
- **Pencegahan Stok Negatif:** Sistem akan **menolak** transaksi penjualan jika stok tidak mencukupi, mencegah terjadinya *overselling*.
- **Pencegahan Double Booking:** Sistem tidak akan mengizinkan dua booking untuk kamar pet hotel atau slot waktu groomer yang sama.
- **Audit Trail:** Setiap perubahan data penting (misal: penghapusan produk, perubahan harga, pembatalan faktur) akan mencatat *siapa* yang melakukannya dan *kapan*, sehingga akuntabilitas terjaga.
- **Kunci Akun Otomatis:** Jika staf salah memasukkan PIN sebanyak 5 kali berturut-turut, akun akan terkunci selama 15 menit untuk keamanan.

---

## ❓ 5. Pertanyaan Umum Operasional (FAQ)

**Q: Apa yang terjadi jika pelanggan membatalkan janji temu?**
A: Jika dibatalkan oleh pelanggan via portal atau oleh Admin, status berubah menjadi *DIBATALKAN* (*CANCELLED*). Slot waktu tersebut otomatis terbuka kembali untuk pelanggan lain.

**Q: Bisakah faktur yang sudah dibayar dibatalkan?**
A: Pembatalan faktur yang sudah *PAID* hanya bisa dilakukan oleh Owner/Admin. Jika dibatalkan, sistem akan otomatis mengembalikan stok produk ke gudang, membatalkan poin loyalitas yang diberikan, dan mencatat alasan pembatalan untuk audit.

**Q: Bagaimana jika ada selisih uang di akhir shift kasir?**
A: Saat "Tutup Shift", Kasir wajib memasukkan jumlah uang fisik di laci. Sistem akan membandingkannya dengan total transaksi tunai. Jika ada selisih (minus/plus), data akan disimpan dan ditandai untuk ditinjau oleh Owner/Admin.

**Q: Apakah pelanggan bisa melihat harga beli (modal) produk?**
A: Tidak. Harga beli (*purchase price*) hanya dapat dilihat oleh Owner dan Admin. Pelanggan dan Kasir hanya melihat harga jual (*selling price*).

**Q: Bagaimana jika internet mati saat transaksi di Kasir?**
A: *(Catatan: Tergantung konfigurasi)* Sistem dirancang untuk memberikan peringatan jika koneksi terputus. Untuk operasional terbaik, pastikan perangkat Kasir memiliki koneksi internet yang stabil. 

---

## 🚀 6. Penutup
PETORA bukan sekadar aplikasi pencatat, melainkan **mitra operasional digital** Anda. Dengan mengikuti panduan alur kerja ini, seluruh tim (Owner, Admin, Dokter, Kasir) dapat bekerja secara sinkron, mengurangi kesalahan, mempercepat layanan, dan pada akhirnya meningkatkan kepuasan pelanggan serta profitabilitas bisnis.

*Untuk bantuan teknis lebih lanjut atau pelatihan penggunaan fitur tertentu, silakan hubungi tim dukungan sistem PETORA.*
