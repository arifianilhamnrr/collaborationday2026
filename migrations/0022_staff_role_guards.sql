PRAGMA foreign_keys = ON;

CREATE TRIGGER participant_groups_require_pendamping_insert
BEFORE INSERT ON participant_groups
FOR EACH ROW
WHEN COALESCE((SELECT role FROM staff_profiles WHERE user_id=NEW.pendamping_user_id), '') != 'pendamping'
BEGIN
  SELECT RAISE(ABORT, 'participant group owner must be pendamping');
END;

CREATE TRIGGER participant_groups_require_pendamping_update
BEFORE UPDATE OF pendamping_user_id ON participant_groups
FOR EACH ROW
WHEN COALESCE((SELECT role FROM staff_profiles WHERE user_id=NEW.pendamping_user_id), '') != 'pendamping'
BEGIN
  SELECT RAISE(ABORT, 'participant group owner must be pendamping');
END;

CREATE TRIGGER staff_profiles_keep_assigned_pendamping_role
BEFORE UPDATE OF role ON staff_profiles
FOR EACH ROW
WHEN OLD.role='pendamping'
  AND NEW.role!='pendamping'
  AND EXISTS(SELECT 1 FROM participant_groups WHERE pendamping_user_id=OLD.user_id)
BEGIN
  SELECT RAISE(ABORT, 'assigned pendamping role cannot be changed');
END;

CREATE TRIGGER staff_profiles_keep_assigned_pendamping
BEFORE DELETE ON staff_profiles
FOR EACH ROW
WHEN OLD.role='pendamping'
  AND EXISTS(SELECT 1 FROM participant_groups WHERE pendamping_user_id=OLD.user_id)
BEGIN
  SELECT RAISE(ABORT, 'assigned pendamping profile cannot be deleted');
END;
