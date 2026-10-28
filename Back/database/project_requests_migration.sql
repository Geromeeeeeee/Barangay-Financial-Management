CREATE TABLE IF NOT EXISTS project_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_attachments_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

ALTER TABLE projects
    ADD COLUMN approved_subcategory_id BIGINT UNSIGNED NULL,
    ADD UNIQUE KEY unique_project_approved_subcategory (approved_subcategory_id),
    ADD CONSTRAINT fk_projects_approved_subcategory
        FOREIGN KEY (approved_subcategory_id) REFERENCES budget_subcategories(id);

ALTER TABLE projects
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';

UPDATE projects
SET status = 'declined'
WHERE status = 'rejected';
