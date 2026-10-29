CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_logs_user_read (user_id, is_read, created_at),
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @audit_logs_has_is_read = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
      AND column_name = 'is_read'
);

SET @audit_logs_add_is_read = IF(
    @audit_logs_has_is_read = 0,
    'ALTER TABLE audit_logs ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER details',
    'SELECT 1'
);

PREPARE audit_logs_add_is_read_statement FROM @audit_logs_add_is_read;
EXECUTE audit_logs_add_is_read_statement;
DEALLOCATE PREPARE audit_logs_add_is_read_statement;
