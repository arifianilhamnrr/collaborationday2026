PRAGMA foreign_keys = ON;

INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2024/whatsapp-2024-01.webp', 'Dokumentasi tambahan Collaboration Day 2024', 'Dokumentasi pilihan dari Collaboration Day 2024.', 'Dokumentasi Collaboration Day', 12, 1
FROM event_editions
WHERE year=2024
  AND NOT EXISTS (SELECT 1 FROM galleries WHERE image_url='/media/archive/2024/whatsapp-2024-01.webp');

INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2024/whatsapp-2024-02.webp', 'Momen kebersamaan Collaboration Day 2024', 'Momen pilihan dari Collaboration Day 2024.', 'Dokumentasi Collaboration Day', 13, 1
FROM event_editions
WHERE year=2024
  AND NOT EXISTS (SELECT 1 FROM galleries WHERE image_url='/media/archive/2024/whatsapp-2024-02.webp');
