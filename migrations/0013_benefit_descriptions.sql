PRAGMA foreign_keys = ON;

UPDATE event_benefits SET description='Kenal lebih dekat dengan teman satu angkatan dan mulai membangun support system sejak hari pertama.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Relasi';
UPDATE event_benefits SET description='Bukti partisipasi digital yang dapat disimpan untuk dokumentasi perjalanan akademikmu.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='E-Sertifikat';
UPDATE event_benefits SET description='Kesempatan membawa pulang hadiah pilihan dari rangkaian aktivitas selama kegiatan.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Doorprize';
UPDATE event_benefits SET title='Benefit Rahasia', description='Ada kejutan tambahan yang baru akan dibuka bersama saat Collaboration Day berlangsung.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Benefit 👀';
UPDATE event_benefits SET description='Konsumsi utama disiapkan tiga kali agar energimu tetap terjaga sepanjang kegiatan.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='3x Makan';
UPDATE event_benefits SET description='Camilan untuk menemani jeda, obrolan, dan sesi santai bersama teman baru.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Snack';
UPDATE event_benefits SET description='Dua hari berisi permainan, tantangan kelompok, dan cerita yang tidak didapat di ruang kelas.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Pengalaman';
UPDATE event_benefits SET description='Momen terbaik angkatanmu diabadikan oleh tim dokumentasi selama kegiatan.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Dokumentasi';
UPDATE event_benefits SET description='Setidaknya pulang membawa teman baru. Untuk sisanya, biarkan semesta Codeverse bekerja.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND title='Jodoh bila beruntung';
