PRAGMA foreign_keys = ON;

UPDATE galleries SET image_url=replace(image_url, '/archive/', '/media/archive/') WHERE image_url LIKE '/archive/%';
UPDATE event_editions SET hero_image_url=replace(hero_image_url, '/archive/', '/media/archive/') WHERE hero_image_url LIKE '/archive/%';
