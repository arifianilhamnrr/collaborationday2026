PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN display_name TEXT;

UPDATE users
SET display_name = COALESCE(
  (SELECT full_name FROM staff_profiles WHERE user_id=users.id),
  (SELECT full_name FROM participants WHERE user_id=users.id),
  SUBSTR(email, 1, INSTR(email, '@') - 1)
);
