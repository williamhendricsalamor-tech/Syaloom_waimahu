// api/setup.js - Jalankan SEKALI untuk membuat tabel di Vercel Postgres
// Akses di browser: https://domain-anda/api/setup

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Buat tabel berita
    await sql`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        media_url TEXT,
        media_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Buat tabel admin
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `;

    // Cek apakah admin sudah ada
    const existingAdmin = await sql`SELECT COUNT(*) as count FROM admin_users`;
    const count = parseInt(existingAdmin[0].count);

    if (count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await sql`
        INSERT INTO admin_users (username, password) VALUES ('admin', ${hashedPassword})
      `;
    }

    res.status(200).json({
      status: 'success',
      message: 'Database berhasil diinisialisasi! Akun admin default: username=admin, password=admin123'
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
