CREATE TABLE IF NOT EXISTS expenditure_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expenditure_id INT UNSIGNED NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expenditure_attachments_expenditure
        FOREIGN KEY (expenditure_id) REFERENCES expenditures(id) ON DELETE CASCADE
);
