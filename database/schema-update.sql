-- Add institutions table and related schema updates
-- Run this after the main schema.sql

-- Create institutions table
CREATE TABLE institutions (
  id SERIAL PRIMARY KEY,
  institution_code VARCHAR(10) UNIQUE NOT NULL,
  udise_code VARCHAR(20),
  affiliation_number VARCHAR(30),
  institution_name VARCHAR(255) NOT NULL,
  institution_category VARCHAR(50),
  management_type VARCHAR(100),
  institution_type VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  email VARCHAR(100),
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create institution requests table
CREATE TABLE institution_requests (
  id SERIAL PRIMARY KEY,
  institution_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  udise_code VARCHAR(20),
  additional_info TEXT,
  requester_email VARCHAR(255) NOT NULL,
  requester_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id)
);

-- Add phone_number and date_of_birth to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'inactive', 'suspended'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(institution_name);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city);
CREATE INDEX IF NOT EXISTS idx_institutions_state ON institutions(state);
CREATE INDEX IF NOT EXISTS idx_institutions_udise ON institutions(udise_code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institution_requests_status ON institution_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Insert some sample institutions for testing
INSERT INTO institutions (
  institution_code, institution_name, city, state, udise_code,
  institution_category, management_type, institution_type
) VALUES 
('STXAV001', 'St. Xavier Public School', 'Hyderabad', 'Telangana', '28010100101', 'Secondary', 'Private', 'School'),
('KENDR001', 'Kendriya Vidyalaya No. 1', 'Delhi', 'Delhi', '07010101101', 'Senior Secondary', 'Government', 'School'),
('IITD001', 'Indian Institute of Technology Delhi', 'New Delhi', 'Delhi', '07010201001', 'Higher Education', 'Government', 'Institute'),
('DPSBAN001', 'Delhi Public School Bangalore', 'Bangalore', 'Karnataka', '29010301101', 'Senior Secondary', 'Private', 'School'),
('LOYOLA001', 'Loyola College', 'Chennai', 'Tamil Nadu', '33010401201', 'Higher Education', 'Private', 'College');

-- Add trigger for institutions updated_at
CREATE TRIGGER update_institutions_updated_at 
  BEFORE UPDATE ON institutions 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();