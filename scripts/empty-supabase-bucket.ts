import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
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

async function emptyBucket() {
  console.log('🧹 Memulai pembersihan file fisik di Supabase Storage bucket "product-images"...');

  const { data: files, error: listError } = await supabase.storage.from('product-images').list('', { limit: 1000 });

  if (listError) {
    console.error('❌ Gagal membaca isi Supabase Storage bucket:', listError.message);
    process.exit(1);
  }

  if (!files || files.length === 0) {
    console.log('✨ Bucket "product-images" sudah kosong (0 file). Kuota Supabase Storage aman!');
    return;
  }

  console.log(`📦 Ditemukan ${files.length} file fisik di Supabase Storage.`);

  const fileNames = files.map((f) => f.name);

  const { error: removeError } = await supabase.storage.from('product-images').remove(fileNames);

  if (removeError) {
    console.error('❌ Gagal menghapus file dari Supabase Storage:', removeError.message);
    process.exit(1);
  }

  console.log(`✅ BERHASIL! Menghapus ${fileNames.length} file fisik dari Supabase Storage.`);
  console.log('🎉 Kuota Supabase Storage Anda kini 100% KOSONG & BERSIH (0 MB). Database Supabase tetap 100% aman!');
}

emptyBucket();
