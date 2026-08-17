PRAGMA foreign_keys = ON;

DELETE FROM event_benefits WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026);

INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Relasi', NULL, 1 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'E-Sertifikat', NULL, 2 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Doorprize', NULL, 3 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Benefit 👀', NULL, 4 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, '3x Makan', NULL, 5 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Snack', NULL, 6 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Pengalaman', NULL, 7 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Dokumentasi', NULL, 8 FROM event_editions WHERE year=2026;
INSERT INTO event_benefits (edition_id, title, description, sort_order)
SELECT id, 'Jodoh bila beruntung', NULL, 9 FROM event_editions WHERE year=2026;
