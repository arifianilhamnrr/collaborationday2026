PRAGMA foreign_keys = ON;

UPDATE payment_methods
SET label='Transfer SeaBank', bank_name='SeaBank'
WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026)
  AND type='bank_transfer';
