// api/berita.js - Handle CRUD berita + upload file ke Vercel Blob

import { neon } from '@neondatabase/serverless';
import { put, del } from '@vercel/blob';
import jwt from 'jsonwebtoken';
import multiparty from 'multiparty';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'syaloom_waimahu_secret_2026';

// Verifikasi JWT token dari header
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const config = {
  api: {
    bodyParser: false, // Diperlukan untuk multiparty (file upload)
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  // GET - Ambil semua berita (publik, tidak perlu login)
  if (req.method === 'GET') {
    try {
      const news = await sql`SELECT * FROM news ORDER BY created_at DESC`;
      return res.status(200).json({ status: 'success', data: news });
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ status: 'error', message: 'Gagal memuat berita.' });
    }
  }

  // POST - Upload berita baru (hanya admin)
  if (req.method === 'POST') {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const form = new multiparty.Form();

    return new Promise((resolve) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Gagal memproses form.' });
          return resolve();
        }

        const title = fields.title?.[0]?.trim();
        const content = fields.content?.[0]?.trim();

        if (!title || !content) {
          res.status(400).json({ status: 'error', message: 'Judul dan konten wajib diisi.' });
          return resolve();
        }

        let media_url = null;
        let media_type = null;

        const mediaFile = files.media?.[0];

        if (mediaFile && mediaFile.size > 0) {
          const allowedImages = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
          const allowedVideos = ['mp4', 'webm', 'ogg'];
          const ext = mediaFile.originalFilename.split('.').pop().toLowerCase();

          if (allowedImages.includes(ext)) {
            media_type = 'image';
          } else if (allowedVideos.includes(ext)) {
            media_type = 'video';
          } else {
            res.status(400).json({ status: 'error', message: 'Format file tidak didukung.' });
            return resolve();
          }

          try {
            const fileBuffer = fs.readFileSync(mediaFile.path);
            const blob = await put(mediaFile.originalFilename, fileBuffer, {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
            });
            media_url = blob.url;
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            res.status(500).json({ status: 'error', message: 'Gagal mengupload file.' });
            return resolve();
          }
        }

        try {
          await sql`
            INSERT INTO news (title, content, media_url, media_type)
            VALUES (${title}, ${content}, ${media_url}, ${media_type})
          `;
          res.status(200).json({ status: 'success', message: 'Berita berhasil ditambahkan.' });
        } catch (dbError) {
          console.error('DB error:', dbError);
          res.status(500).json({ status: 'error', message: 'Gagal menyimpan ke database.' });
        }
        resolve();
      });
    });
  }

  // DELETE - Hapus berita (hanya admin)
  if (req.method === 'DELETE') {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ status: 'error', message: 'ID tidak ditemukan.' });
    }

    try {
      const result = await sql`SELECT media_url FROM news WHERE id = ${id}`;
      const news = result[0];

      if (!news) {
        return res.status(404).json({ status: 'error', message: 'Berita tidak ditemukan.' });
      }

      // Hapus file dari Vercel Blob jika ada
      if (news.media_url) {
        try {
          await del(news.media_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
        } catch (delError) {
          console.error('Delete blob error:', delError);
          // Lanjutkan meskipun file blob gagal dihapus
        }
      }

      await sql`DELETE FROM news WHERE id = ${id}`;
      return res.status(200).json({ status: 'success', message: 'Berita berhasil dihapus.' });

    } catch (error) {
      console.error('DELETE error:', error);
      return res.status(500).json({ status: 'error', message: 'Gagal menghapus berita.' });
    }
  }

  res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
}
