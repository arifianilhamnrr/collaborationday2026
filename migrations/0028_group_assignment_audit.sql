PRAGMA foreign_keys = ON;

CREATE TRIGGER participant_group_membership_audit
AFTER INSERT ON participant_group_memberships
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id, metadata_json)
  SELECT COALESCE(NEW.assigned_by_user_id, p.user_id),
    CASE WHEN NEW.assigned_by_user_id IS NULL THEN 'participant_group.auto_assigned' ELSE 'participant_group.manually_assigned' END,
    'participant', CAST(NEW.participant_id AS TEXT),
    json_object('groupId', NEW.group_id, 'editionId', NEW.edition_id, 'gender', p.gender)
  FROM participants p
  WHERE p.id=NEW.participant_id;
END;
