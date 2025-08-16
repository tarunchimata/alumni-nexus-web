-- Database patch to fix missing columns and constraints
-- Apply this patch to align database with Prisma schema

-- Add missing column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_import_job_id INTEGER;

-- Make keycloak_id nullable 
ALTER TABLE users 
ALTER COLUMN keycloak_id DROP NOT NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_users_last_import_job_id ON users(last_import_job_id);

-- Add foreign key constraint for import job reference
ALTER TABLE users 
ADD CONSTRAINT fk_users_last_import_job 
FOREIGN KEY (last_import_job_id) 
REFERENCES import_jobs(id) 
ON DELETE SET NULL;

-- Verify changes
SELECT 'Database patch applied successfully' AS status;