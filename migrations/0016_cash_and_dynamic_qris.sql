PRAGMA foreign_keys = OFF;

CREATE TABLE payment_methods_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('static_qris', 'bank_transfer', 'cash')),
  label TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT,
  bank_name TEXT,
  qris_image_url TEXT,
  qris_payload TEXT,
  instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  CHECK (
    (type = 'static_qris' AND (qris_payload IS NOT NULL OR qris_image_url IS NOT NULL)) OR
    (type = 'bank_transfer' AND account_name IS NOT NULL AND account_number IS NOT NULL AND bank_name IS NOT NULL) OR
    type = 'cash'
  )
);

INSERT INTO payment_methods_new (id,edition_id,type,label,account_name,account_number,bank_name,qris_image_url,instructions,sort_order,is_active)
SELECT id,edition_id,type,label,account_name,account_number,bank_name,qris_image_url,instructions,sort_order,is_active FROM payment_methods;

CREATE TABLE payment_submissions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE RESTRICT,
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods_new(id) ON DELETE RESTRICT,
  proof_object_key TEXT UNIQUE,
  original_filename TEXT,
  content_type TEXT,
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewed_by TEXT,
  CHECK (status != 'rejected' OR rejection_reason IS NOT NULL)
);

INSERT INTO payment_submissions_new SELECT * FROM payment_submissions;
DROP TABLE payment_submissions;
DROP TABLE payment_methods;
ALTER TABLE payment_methods_new RENAME TO payment_methods;
ALTER TABLE payment_submissions_new RENAME TO payment_submissions;
CREATE INDEX payment_submissions_status_idx ON payment_submissions(status,submitted_at);

UPDATE payment_methods SET qris_payload='00020101021126610014COM.GO-JEK.WWW01189360091438473797550210G8473797550303UMI51440014ID.CO.QRIS.WWW0215ID10265704879870303UMI5204549953033605802ID5921Arkan_Store, SIRAMPOG6006BREBES61055227262070703A01630483ED', qris_image_url=NULL, label='QRIS Otomatis', instructions='Scan QRIS. Nominal pembayaran sudah terisi otomatis sesuai biaya pendaftaran.' WHERE edition_id=(SELECT id FROM event_editions WHERE year=2026) AND type='static_qris';

INSERT INTO payment_methods (edition_id,type,label,instructions,sort_order,is_active)
SELECT id,'cash','Pembayaran Tunai','Serahkan pembayaran tunai kepada panitia. Status dikonfirmasi setelah admin menerima pembayaran.',3,1 FROM event_editions WHERE year=2026 AND NOT EXISTS (SELECT 1 FROM payment_methods WHERE edition_id=event_editions.id AND type='cash');

PRAGMA foreign_keys = ON;
