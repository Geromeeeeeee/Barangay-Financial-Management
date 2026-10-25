CREATE TABLE IF NOT EXISTS budget_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    percentage DECIMAL(5,2) NOT NULL,
    is_custom TINYINT(1) NOT NULL DEFAULT 0,
    allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS revenue_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    revenue_id BIGINT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_revenue_category (revenue_id, category_id),
    CONSTRAINT fk_revenue_allocations_revenue FOREIGN KEY (revenue_id) REFERENCES revenues(id) ON DELETE CASCADE,
    CONSTRAINT fk_revenue_allocations_category FOREIGN KEY (category_id) REFERENCES budget_categories(id)
);

CREATE TABLE IF NOT EXISTS budget_subcategories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_subcategory (category_id, name),
    CONSTRAINT fk_budget_subcategories_category FOREIGN KEY (category_id) REFERENCES budget_categories(id)
);

ALTER TABLE expenditures
    ADD COLUMN category_id INT UNSIGNED NULL,
    ADD COLUMN subcategory_id BIGINT UNSIGNED NULL;

ALTER TABLE revenues
    ADD COLUMN request_key CHAR(36) NULL,
    ADD UNIQUE KEY unique_revenue_request_key (request_key);

UPDATE budget_categories
SET name = CASE id
    WHEN 1 THEN 'Development Fund'
    WHEN 2 THEN 'SK'
    WHEN 3 THEN 'BDRRMF'
    WHEN 4 THEN 'GAD'
    WHEN 5 THEN 'SCPWD & BCPC'
    WHEN 6 THEN 'PSA'
    ELSE name
END,
percentage = CASE id
    WHEN 1 THEN 20.00
    WHEN 2 THEN 10.00
    WHEN 3 THEN 5.00
    WHEN 4 THEN 5.00
    WHEN 5 THEN 1.00
    WHEN 6 THEN 55.00
    ELSE percentage
END
WHERE id BETWEEN 1 AND 6;

INSERT INTO budget_categories (name, percentage)
VALUES
    ('Development Fund', 20.00), ('SK', 10.00), ('BDRRMF', 5.00),
    ('GAD', 5.00), ('SCPWD & BCPC', 1.00), ('PSA', 55.00)
ON DUPLICATE KEY UPDATE percentage = VALUES(percentage);
