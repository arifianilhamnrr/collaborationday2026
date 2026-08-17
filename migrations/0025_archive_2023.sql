PRAGMA foreign_keys = ON;

INSERT INTO event_editions (year, slug, title, theme, description, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, capacity_unlimited, ticket_amount, status, hero_image_url)
VALUES (2023, 'collaboration-day-2023', 'Collaboration Day 2023', 'Arsip Collaboration Day 2023', 'Dokumentasi terkurasi dari kegiatan Collaboration Day Informatika tahun 2023.', 'Kebun Buah', '2023-12-03T07:00:00+07:00', '2023-12-03T17:00:00+07:00', '2023-11-01T00:00:00+07:00', '2023-12-02T23:59:59+07:00', 150, 0, 0, 'archived', '/media/archive/2023/3200/DSC_0427.webp');

INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0348.webp', 'Tiga peserta berpose bersama di pendopo Collaboration Day 2023', 'Kebersamaan peserta di sela kegiatan.', 'Dokumentasi Collaboration Day', 1, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0365.webp', 'Peserta Collaboration Day 2023 menyimak acara dari depan panggung', 'Suasana sesi utama di pendopo.', 'Dokumentasi Collaboration Day', 2, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0380.webp', 'Peserta mengikuti sesi Collaboration Day 2023 di dalam pendopo', 'Rangkaian acara bersama peserta.', 'Dokumentasi Collaboration Day', 3, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0427.webp', 'Potret bersama seluruh peserta Collaboration Day 2023', 'Satu angkatan dalam satu bingkai.', 'Dokumentasi Collaboration Day', 4, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0433.webp', 'Sekelompok peserta perempuan berpose di area kegiatan Collaboration Day 2023', 'Cerita bersama dari area kegiatan.', 'Dokumentasi Collaboration Day', 5, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0471.webp', 'Peserta berpose di depan penanda Kebun Buah pada Collaboration Day 2023', 'Momen kelompok di lokasi kegiatan.', 'Dokumentasi Collaboration Day', 6, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0481.webp', 'Peserta berkumpul untuk aktivitas kelompok di lapangan', 'Persiapan aktivitas luar ruang.', 'Dokumentasi Collaboration Day', 7, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0584.webp', 'Peserta membentuk lingkaran saat permainan Collaboration Day 2023', 'Kolaborasi dalam permainan kelompok.', 'Dokumentasi Collaboration Day', 8, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0595.webp', 'Peserta mengikuti permainan luar ruang di Collaboration Day 2023', 'Keseruan aktivitas di lapangan.', 'Dokumentasi Collaboration Day', 9, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0597.webp', 'Dua peserta mengikuti tantangan kelompok di lapangan', 'Tantangan ringan bersama teman baru.', 'Dokumentasi Collaboration Day', 10, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0608.webp', 'Dua peserta perempuan menjalani permainan luar ruang', 'Semangat peserta dalam permainan kelompok.', 'Dokumentasi Collaboration Day', 11, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0714.webp', 'Peserta berpose bersama pada malam Collaboration Day 2023', 'Kebersamaan setelah rangkaian kegiatan.', 'Dokumentasi Collaboration Day', 12, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0734.webp', 'Panitia menyerahkan penghargaan kepada peserta Collaboration Day 2023', 'Apresiasi untuk peserta kegiatan.', 'Dokumentasi Collaboration Day', 13, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3200/DSC_0789.webp', 'Panitia dan peserta berpose di depan panggung Collaboration Day 2023', 'Potret penutup di depan panggung.', 'Dokumentasi Collaboration Day', 14, 1 FROM event_editions WHERE year=2023;

INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0045.webp', 'Kelompok peserta berpose di area Kebun Buah pada Collaboration Day 2023', 'Potret kelompok di alam terbuka.', 'Dokumentasi Collaboration Day', 15, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0095.webp', 'Peserta duduk bersama mengikuti sesi di pendopo', 'Suasana peserta saat sesi berlangsung.', 'Dokumentasi Collaboration Day', 16, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0269.webp', 'Sekelompok peserta bersorak bersama di area terbuka', 'Energi peserta Collaboration Day 2023.', 'Dokumentasi Collaboration Day', 17, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0287.webp', 'Peserta berpose bersama di depan penanda Kebun Buah', 'Foto kelompok dari lokasi kegiatan.', 'Dokumentasi Collaboration Day', 18, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0387.webp', 'Peserta menikmati waktu makan bersama di Collaboration Day 2023', 'Jeda makan bersama peserta.', 'Dokumentasi Collaboration Day', 19, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0393.webp', 'Penyerahan penghargaan di panggung Collaboration Day 2023', 'Momen apresiasi di panggung.', 'Dokumentasi Collaboration Day', 20, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0409.webp', 'Peserta berdiri di depan banner Collaboration Day 2023', 'Potret peserta di depan panggung.', 'Dokumentasi Collaboration Day', 21, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0428.webp', 'Peserta memenuhi pendopo saat rangkaian Collaboration Day 2023', 'Suasana ramai di pendopo kegiatan.', 'Dokumentasi Collaboration Day', 22, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0463.webp', 'Peserta menjalani tantangan kelompok di lapangan', 'Permainan kelompok di area terbuka.', 'Dokumentasi Collaboration Day', 23, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0465.webp', 'Dua peserta berhadapan dalam permainan Collaboration Day 2023', 'Interaksi seru dalam tantangan kelompok.', 'Dokumentasi Collaboration Day', 24, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0466.webp', 'Peserta perempuan mengikuti permainan di dekat aliran air', 'Aktivitas kelompok di area Kebun Buah.', 'Dokumentasi Collaboration Day', 25, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0480.webp', 'Kelompok peserta mengikuti permainan di lapangan', 'Kerja sama peserta dalam aktivitas luar ruang.', 'Dokumentasi Collaboration Day', 26, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0481.webp', 'Peserta bergerak bersama dalam tantangan kelompok', 'Keseruan permainan Collaboration Day 2023.', 'Dokumentasi Collaboration Day', 27, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0483.webp', 'Peserta menjalani permainan sedotan di atas nampan', 'Konsentrasi dalam tantangan individu.', 'Dokumentasi Collaboration Day', 28, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0486.webp', 'Peserta perempuan mengikuti tantangan menggunakan sedotan', 'Salah satu permainan Collaboration Day 2023.', 'Dokumentasi Collaboration Day', 29, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0488.webp', 'Peserta laki-laki menjalani tantangan sedotan di lapangan', 'Aksi peserta dalam permainan individu.', 'Dokumentasi Collaboration Day', 30, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0494.webp', 'Peserta bersiap mengikuti permainan Collaboration Day 2023', 'Menunggu giliran dalam aktivitas kelompok.', 'Dokumentasi Collaboration Day', 31, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0500.webp', 'Peserta mengikuti permainan ringan di area kegiatan', 'Momen santai dalam rangkaian permainan.', 'Dokumentasi Collaboration Day', 32, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0615.webp', 'Peserta tertawa saat permainan di lapangan', 'Ekspresi seru selama aktivitas luar ruang.', 'Dokumentasi Collaboration Day', 33, 1 FROM event_editions WHERE year=2023;
INSERT INTO galleries (edition_id, image_url, alt_text, caption, photographer, sort_order, is_published)
SELECT id, '/media/archive/2023/3500/DSC_0692.webp', 'Panitia berpose bersama di depan banner Collaboration Day 2023', 'Potret tim di akhir rangkaian kegiatan.', 'Dokumentasi Collaboration Day', 34, 1 FROM event_editions WHERE year=2023;
