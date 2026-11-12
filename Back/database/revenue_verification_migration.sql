ALTER TABLE revenues
    ADD COLUMN status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'verified'
    AFTER receipt_date;
