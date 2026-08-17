PRAGMA foreign_keys = ON;

UPDATE payment_methods
SET label='Transfer SeaBank',
    bank_name='SeaBank',
    account_number='901859263330',
    account_name='Arkan Askhabal Kahfi',
    instructions='Transfer sesuai nominal pendaftaran ke rekening SeaBank yang tertera, lalu unggah bukti pembayaran.'
WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026)
  AND type='bank_transfer';
