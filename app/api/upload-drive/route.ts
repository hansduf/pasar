import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToDrive } from '@/lib/gdrive';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const result = await uploadFileToDrive(buffer, fileName, file.type || 'image/jpeg');

    return NextResponse.json({
      success: true,
      url: result.directUrl,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    });
  } catch (error: any) {
    console.error('Google Drive Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengunggah gambar ke Google Drive' },
      { status: 500 }
    );
  }
}
