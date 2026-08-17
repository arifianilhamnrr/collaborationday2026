PRAGMA foreign_keys = ON;

UPDATE payment_methods
SET label = CASE
  WHEN type = 'bank_transfer' THEN 'Transfer ' || TRIM(bank_name)
  WHEN type = 'static_qris' THEN 'QRIS'
  WHEN type = 'cash' THEN 'Tunai'
  ELSE label
END
WHERE type IN ('bank_transfer', 'static_qris', 'cash')
  AND (type != 'bank_transfer' OR TRIM(COALESCE(bank_name, '')) != '');
