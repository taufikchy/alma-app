-- SQL untuk membuat Super Admin pertama
-- Run ini di PostgreSQL (via Supabase Dashboard atau psql)

-- Password: AdminAlma123!
-- Hash bcrypt dengan cost factor 12

INSERT INTO "User" (id, username, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin_alma',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FQgM07p0U9T8X2',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);

-- Verifikasi
SELECT id, username, role, "createdAt" FROM "User" WHERE role = 'SUPER_ADMIN';