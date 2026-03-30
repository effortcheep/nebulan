#!/usr/bin/env node
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import bcrypt from 'bcryptjs'
import * as schema from '../src/db/schema.js'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nebulan',
})

const db = drizzle(pool, { schema })

async function initDB() {
  console.log('Initializing database...')

  // 创建类型
  await pool.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
        CREATE TYPE platform_type AS ENUM ('ios', 'android');
      END IF;
    END $$;
  `)

  // 创建 apps 表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS apps (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      icon_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  // 创建 versions 表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS versions (
      id SERIAL PRIMARY KEY,
      app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      version VARCHAR(50) NOT NULL,
      platform platform_type NOT NULL,
      download_url VARCHAR(1000) NOT NULL,
      file_size INTEGER,
      changelog TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  // 创建 download_stats 表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS download_stats (
      id SERIAL PRIMARY KEY,
      version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  // 创建 users 表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'admin' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  // 创建索引
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_versions_app_id ON versions(app_id);
    CREATE INDEX IF NOT EXISTS idx_versions_platform ON versions(platform);
    CREATE INDEX IF NOT EXISTS idx_download_stats_version_id ON download_stats(version_id);
    CREATE INDEX IF NOT EXISTS idx_download_stats_downloaded_at ON download_stats(downloaded_at);
  `)

  // 创建默认管理员用户
  const existingAdmin = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    ['admin'],
  )

  if (existingAdmin.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      ['admin', hashedPassword, 'admin'],
    )
    console.log('Default admin user created:')
    console.log('  Username: admin')
    console.log('  Password: admin123')
  }

  console.log('Database initialized successfully!')
  await pool.end()
}

initDB().catch(console.error)
