INSERT INTO event_editions (year, slug, title, theme, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, capacity_unlimited, ticket_amount, status, hero_image_url, map_embed_url)
VALUES
  (2026, 'collaboration-day-2026', 'Collaboration Day 2026', 'CODEVERSE: Connecting Minds in the Digital Universe', 'Collaboration Day 2026 dirancang untuk mempererat hubungan antarmahasiswa baru Informatika melalui rangkaian aktivitas interaktif, edukatif, dan kolaboratif.', 'UIN Prof. K.H. Saifuddin Zuhri Kampus 2 - Bumi Perkemahan Munjuluhur', '2026-09-05T07:00:00+07:00', '2026-09-06T17:00:00+07:00', '2026-08-15T00:00:00+07:00', '2026-09-04T23:59:59+07:00', 1, 1, 120000, 'published', NULL, 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.691828997639!2d109.34530077575124!3d-7.388388692621338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e655984c912db67%3A0x64008c3a52339c88!2sKampus%20II%20UIN%20Prof.%20K.H.%20Saifuddin%20Zuhri%20Saizu%20Purbalingga!5e0!3m2!1sid!2sid!4v1786810587304!5m2!1sid!2sid'),
  (2025, 'collaboration-day-2025', 'Collaboration Day 2025', 'Arsip Collaboration Day 2025', 'Dokumentasi kegiatan Collaboration Day Informatika tahun 2025.', 'Lokasi kegiatan 2025', '2025-08-30T07:00:00+07:00', '2025-08-31T17:00:00+07:00', '2025-08-01T00:00:00+07:00', '2025-08-29T23:59:59+07:00', 150, 0, 0, 'archived', NULL, NULL);

WITH group_names(name) AS (
  VALUES ('Horison'), ('Antares'), ('Phoenix'), ('Pegasus'),
    ('Kaldera'), ('Helios'), ('Cisco'), ('Euphoria'),
    ('Andromeda'), ('Apollo'), ('Pandora'), ('Elecra'),
    ('Galaxy'), ('Orion'), ('Altair'), ('Vega')
)
INSERT INTO participant_groups (edition_id, name)
SELECT e.id, group_names.name
FROM event_editions e CROSS JOIN group_names
WHERE e.slug='collaboration-day-2026'
  AND NOT EXISTS (
    SELECT 1 FROM participant_groups existing
    WHERE existing.edition_id=e.id AND existing.name=group_names.name
  );

INSERT INTO payment_methods (edition_id, type, label, qris_image_url, instructions, sort_order)
SELECT id, 'static_qris', 'QRIS Panitia', '/assets/demo-qris.svg', 'Pindai QRIS statis, masukkan nominal yang tertera, lalu unggah bukti.', 1 FROM event_editions WHERE slug='collaboration-day-2026';
INSERT INTO payment_methods (edition_id, type, label, account_name, account_number, bank_name, instructions, sort_order)
SELECT id, 'bank_transfer', 'Transfer Bank', 'GANTI NAMA PEMILIK', '0000000000', 'GANTI BANK', 'Data rekening ini placeholder dan wajib diganti sebelum production.', 2 FROM event_editions WHERE slug='collaboration-day-2026';

INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT e.id, b.title, b.description, b.sort_order
FROM event_editions e
CROSS JOIN (
  SELECT 'Kenal satu angkatan' title, 'Membangun relasi awal dengan teman-teman baru Informatika melalui aktivitas kelompok.' description, 1 sort_order
  UNION ALL SELECT 'Belajar berkolaborasi', 'Berlatih komunikasi, pembagian peran, dan penyelesaian masalah dalam suasana santai.', 2
  UNION ALL SELECT 'Punya titik mulai', 'Mengenal lingkungan program studi dan memulai perjalanan kuliah dengan support system.', 3
) b
WHERE e.slug='collaboration-day-2026';
