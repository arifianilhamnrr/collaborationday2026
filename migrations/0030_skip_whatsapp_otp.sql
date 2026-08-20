PRAGMA foreign_keys = ON;

UPDATE participants
SET whatsapp_verified_at=COALESCE(whatsapp_verified_at, CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
WHERE phone IS NOT NULL AND phone!='';

UPDATE staff_profiles
SET whatsapp_verified_at=COALESCE(whatsapp_verified_at, CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
WHERE phone_e164 IS NOT NULL AND phone_e164!='';

DELETE FROM whatsapp_verification_challenges WHERE consumed_at IS NULL;
DELETE FROM request_rate_limits WHERE scope IN ('whatsapp-send','whatsapp-verify');
