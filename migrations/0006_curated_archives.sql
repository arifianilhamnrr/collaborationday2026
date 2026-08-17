PRAGMA foreign_keys = ON;

INSERT INTO event_editions (year, slug, title, theme, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, capacity_unlimited, ticket_amount, status, hero_image_url)
VALUES (2024, 'collaboration-day-2024', 'Collaboration Day 2024', 'Arsip Collaboration Day 2024', 'Dokumentasi terkurasi dari kegiatan Collaboration Day Informatika tahun 2024.', 'Lokasi kegiatan 2024', '2024-08-31T07:00:00+07:00', '2024-09-01T17:00:00+07:00', '2024-08-01T00:00:00+07:00', '2024-08-30T23:59:59+07:00', 150, 0, 0, 'archived', '/archive/2024/20240901_073038.webp');

UPDATE event_editions SET hero_image_url='/archive/2025/IMG_20250830_093844.webp' WHERE year=2025;

INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_073038.webp', 'Dokumentasi Collaboration Day 2024 pada pagi hari', 'Pagi kedua Collaboration Day 2024.', 'Dokumentasi Collaboration Day', 1, 1 FROM event_editions WHERE year=2024;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_080308.webp', 'Peserta mengikuti kegiatan Collaboration Day 2024', 'Aktivitas peserta di hari kedua.', 'Dokumentasi Collaboration Day', 2, 1 FROM event_editions WHERE year=2024;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_082014.webp', 'Suasana kegiatan kelompok Collaboration Day 2024', 'Sesi kolaboratif bersama peserta.', 'Dokumentasi Collaboration Day', 3, 1 FROM event_editions WHERE year=2024;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_095225.webp', 'Dokumentasi aktivitas Collaboration Day 2024', 'Catatan kegiatan menjelang siang.', 'Dokumentasi Collaboration Day', 4, 1 FROM event_editions WHERE year=2024;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_095943.webp', 'Peserta berkolaborasi pada Collaboration Day 2024', 'Satu kegiatan, banyak cerita.', 'Dokumentasi Collaboration Day', 5, 1 FROM event_editions WHERE year=2024;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_100953.webp', 'Momen peserta Collaboration Day 2024', 'Momen pilihan dari arsip 2024.', 'Dokumentasi Collaboration Day', 6, 1 FROM event_editions WHERE year=2024;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2024/20240901_101001.webp', 'Kebersamaan peserta Collaboration Day 2024', 'Penutup contact sheet 2024.', 'Dokumentasi Collaboration Day', 7, 1 FROM event_editions WHERE year=2024;

INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250830_093844.webp', 'Dokumentasi hari pertama Collaboration Day 2025', 'Hari pertama, sesi pagi.', 'Dokumentasi Collaboration Day', 1, 1 FROM event_editions WHERE year=2025;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250830_093926.webp', 'Peserta mengikuti aktivitas Collaboration Day 2025', 'Rangkaian aktivitas hari pertama.', 'Dokumentasi Collaboration Day', 2, 1 FROM event_editions WHERE year=2025;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250830_094002.webp', 'Suasana kolaboratif Collaboration Day 2025', 'Kolaborasi di hari pertama.', 'Dokumentasi Collaboration Day', 3, 1 FROM event_editions WHERE year=2025;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250831_064601.webp', 'Dokumentasi hari kedua Collaboration Day 2025', 'Hari kedua dimulai.', 'Dokumentasi Collaboration Day', 4, 1 FROM event_editions WHERE year=2025;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250831_070648.webp', 'Aktivitas kelompok pada Collaboration Day 2025', 'Aktivitas kelompok hari kedua.', 'Dokumentasi Collaboration Day', 5, 1 FROM event_editions WHERE year=2025;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250831_092100.webp', 'Momen peserta pada Collaboration Day 2025', 'Momen pilihan dari hari kedua.', 'Dokumentasi Collaboration Day', 6, 1 FROM event_editions WHERE year=2025;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/archive/2025/IMG_20250831_092430.webp', 'Kebersamaan peserta Collaboration Day 2025', 'Penutup contact sheet 2025.', 'Dokumentasi Collaboration Day', 7, 1 FROM event_editions WHERE year=2025;
