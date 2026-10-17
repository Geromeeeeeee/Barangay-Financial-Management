ALTER TABLE invite_codes
    ADD COLUMN recipient_email VARCHAR(255) NULL AFTER role,
    ADD COLUMN delivery_status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'sent' AFTER expires_at,
    ADD COLUMN sent_at DATETIME NULL AFTER delivery_status,
    ADD COLUMN failed_at DATETIME NULL AFTER sent_at;

ALTER TABLE invite_codes
    ADD KEY idx_invite_codes_recipient (recipient_email),
    ADD KEY idx_invite_codes_status (delivery_status, expires_at, used_by);
