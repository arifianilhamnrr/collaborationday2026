PRAGMA foreign_keys = ON;

UPDATE participant_groups
SET whatsapp_invite_url=CASE
  WHEN whatsapp_invite_url IS NULL OR trim(whatsapp_invite_url)='' THEN NULL
  WHEN instr(whatsapp_invite_url,'?')>0 THEN substr(whatsapp_invite_url,1,instr(whatsapp_invite_url,'?')-1)
  ELSE whatsapp_invite_url
END;

CREATE UNIQUE INDEX participant_groups_unique_invite_idx
ON participant_groups(edition_id,whatsapp_invite_url)
WHERE whatsapp_invite_url IS NOT NULL;
