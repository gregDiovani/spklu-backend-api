# Prisma Refactor Starter

Ini starter rombakan modul payment ke Prisma untuk project Fastify kamu.

## Yang sudah dirapikan
- Prisma schema awal untuk schema `spklu`
- Refactor transaction repository ke Prisma
- Idempotency berbasis audit log
- Raw webhook disimpan ke DB dulu, baru queue ke Redis
- Worker fallback dari DB kalau Redis down
- Reconciler DB-based untuk payment `CREATED/PENDING`
- Status flow: `CREATED -> PENDING -> PAID/EXPIRED/FAILED`

## Yang masih perlu kamu cek manual
- Relasi DB lain yang belum lengkap di dump
- Tabel auth/user yang belum dipetakan penuh
- Beberapa enum status provider mungkin perlu penyesuaian
- Tabel `master_users` belum ada di schema dump snippet, jadi auth lama belum disentuh

## Cara pakai
1. Install dependency
   - `npm install`
2. Pull schema jika DB terbaru berubah
   - `npm run prisma:pull`
3. Generate Prisma client
   - `npm run prisma:generate`
4. Jalankan API/worker

## Catatan
Refactor ini fokus ke domain payment dulu supaya jalur bayar, webhook, dan reconcile lebih aman.
