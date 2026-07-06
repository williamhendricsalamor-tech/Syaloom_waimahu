// api/auth.js - Handle admin login menggunakan JWT token

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'syaloom_waimahu_secret_2026';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'POST') {
    // Login
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi.' });
    }

    try {
      const result = await sql`SELECT * FROM admin_users WHERE username = ${username} LIMIT 1`;
      const user = result[0];

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ status: 'error', message: 'Username atau password salah.' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });

      return res.status(200).json({ status: 'success', message: 'Login berhasil.', token });

    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server.' });
    }

  } else if (req.method === 'GET') {
    // Verify token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Token tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      jwt.verify(token, JWT_SECRET);
      return res.status(200).json({ status: 'success', message: 'Authenticated' });
    } catch (error) {
      return res.status(401).json({ status: 'error', message: 'Token tidak valid atau sudah kadaluarsa.' });
    }

  } else {
    res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }
}
