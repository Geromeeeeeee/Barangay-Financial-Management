CREATE TABLE IF NOT EXISTS monthly_subcategory_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    revenue_id INT NOT NULL,
    subcategory_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    allocation_date DATE NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_monthly_allocations_revenue (revenue_id),
    KEY idx_monthly_allocations_subcategory (subcategory_id),
    CONSTRAINT fk_monthly_allocations_revenue
        FOREIGN KEY (revenue_id) REFERENCES revenues(id),
    CONSTRAINT fk_monthly_allocations_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES budget_subcategories(id),
    CONSTRAINT fk_monthly_allocations_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
