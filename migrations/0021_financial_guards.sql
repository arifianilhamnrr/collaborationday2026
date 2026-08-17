PRAGMA foreign_keys = ON;

ALTER TABLE payment_submissions ADD COLUMN cash_registration_id INTEGER REFERENCES registrations(id) ON DELETE RESTRICT;

UPDATE payment_submissions
SET cash_registration_id = registration_id
WHERE id IN (
  SELECT MIN(ps.id)
  FROM payment_submissions ps
  JOIN payment_methods pm ON pm.id = ps.payment_method_id
  WHERE pm.type = 'cash'
  GROUP BY ps.registration_id
);

UPDATE payment_submissions
SET status='rejected',
    rejection_reason='Pengajuan tunai duplikat dinonaktifkan saat migrasi.',
    reviewed_at=CURRENT_TIMESTAMP,
    reviewed_by='system:migration-0021'
WHERE status='pending'
  AND id IN (
    SELECT ps.id
    FROM payment_submissions ps
    JOIN payment_methods pm ON pm.id=ps.payment_method_id
    WHERE pm.type='cash'
      AND ps.cash_registration_id IS NULL
  );

CREATE UNIQUE INDEX payment_submissions_one_cash_request_idx
ON payment_submissions(cash_registration_id)
WHERE cash_registration_id IS NOT NULL;

UPDATE social_follow_proofs
SET status='verified', reviewed_at=CURRENT_TIMESTAMP
WHERE status='pending'
  AND reviewed_at IS NULL
  AND participant_id IN (SELECT participant_id FROM registrations);
