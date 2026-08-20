PRAGMA foreign_keys = ON;

UPDATE electronic_receipts
SET whatsapp_status='skipped'
WHERE whatsapp_status!='skipped';
