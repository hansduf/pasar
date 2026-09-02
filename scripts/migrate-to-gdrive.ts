import { createClient } from '@supabase/supabase-js';
import { uploadFileToDrive } from '../lib/gdrive';
import fs from 'fs';
import path from 'path';

// Read .env.local manually if running in standalone Node.js environment
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmjexhklcsuhefqihdcu.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_aM4qMQHU6grRDHyiDcYi_Q_gJrCKk8X';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('🚀 Memulai Skrip Migrasi Gambar ke Google Drive (Zero Data Loss)...');
  console.log(`📡 URL Supabase: ${supabaseUrl}`);

  // 1. Ambil data produk dari Supabase
  const { data: products, error } = await supabase.from('products').select('*');

  if (error) {
    console.error('❌ Gagal mengambil data produk dari Supabase:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('ℹ️ Tidak ada produk yang ditemukan di database Supabase.');
    return;
  }

  console.log(`📦 Ditemukan ${products.length} produk di database.`);

  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const product of products) {
    const currentUrl = product.image_url || '';

    // Periksa apakah gambar tersimpan di Supabase Storage
    const isSupabaseStorage = currentUrl.includes('supabase.co/storage') || currentUrl.includes('/storage/v1/object');

    if (!isSupabaseStorage) {
      console.log(`⏭️ [SKIP] Produk "${product.name}" (URL sudah di luar Supabase Storage / Drive / Unsplash)`);
      skippedCount++;
      continue;
    }

    console.log(`⏳ [MIGRASI] Mengunduh gambar untuk "${product.name}"...`);

    try {
      // Fetch file dari Supabase Storage
      const res = await fetch(currentUrl);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const mimeType = res.headers.get('content-type') || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpeg';
      const fileName = `migrated_${product.id}_${Date.now()}.${ext}`;

      // Upload ke Google Drive
      console.log(`⬆️ [MIGRASI] Mengunggah "${product.name}" ke Google Drive...`);
      const driveResult = await uploadFileToDrive(buffer, fileName, mimeType);

      // Update URL di Supabase DB (Tabel Products)
      const { error: updateErr } = await supabase
        .from('products')
        .update({ image_url: driveResult.directUrl })
        .eq('id', product.id);

      if (updateErr) {
        throw new Error(`Gagal memperbarui URL di DB Supabase: ${updateErr.message}`);
      }

      console.log(`✅ [SUKSES] Produk "${product.name}" -> ${driveResult.directUrl}`);
      migratedCount++;
    } catch (err: any) {
      console.error(`❌ [GAGAL] Produk "${product.name}":`, err.message || err);
      failedCount++;
    }
  }

  console.log('\n==================================================');
  console.log('🎉 REKAP MIGRASI SELESAI');
  console.log(`- Berhasil Di-migrasi ke Google Drive: ${migratedCount}`);
  console.log(`- Di-skip (Sudah bukan Supabase Storage): ${skippedCount}`);
  console.log(`- Gagal Di-migrasi: ${failedCount}`);
  console.log('- Total Record Terhapus: 0 (Database Utuh Aman)');
  console.log('==================================================\n');
}

runMigration();
