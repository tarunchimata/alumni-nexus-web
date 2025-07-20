
-- Add institutions table and related schema updates
-- Run this after the main schema.sql

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
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

-- Create institution_requests table for pending school additions
CREATE TABLE IF NOT EXISTS institution_requests (
  id SERIAL PRIMARY KEY,
  institution_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  requested_by VARCHAR(100) NOT NULL,
  contact_info TEXT,
  additional_details TEXT,
  institution_type VARCHAR(50),
  management_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  rejection_reason TEXT
);

-- Add phone_number and date_of_birth to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'inactive', 'suspended', 'rejected'));

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(institution_name);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city);
CREATE INDEX IF NOT EXISTS idx_institutions_state ON institutions(state);
CREATE INDEX IF NOT EXISTS idx_institutions_udise ON institutions(udise_code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_search ON institutions USING gin(to_tsvector('english', institution_name || ' ' || city || ' ' || state));

CREATE INDEX IF NOT EXISTS idx_institution_requests_status ON institution_requests(status);
CREATE INDEX IF NOT EXISTS idx_institution_requests_name ON institution_requests(institution_name);
CREATE INDEX IF NOT EXISTS idx_institution_requests_city ON institution_requests(city, state);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id, role);

-- Add trigger for institutions updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_institutions_updated_at 
  BEFORE UPDATE ON institutions 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert comprehensive sample institutions for testing
INSERT INTO institutions (
  institution_code, institution_name, city, district, state, udise_code,
  institution_category, management_type, institution_type
) VALUES 
-- Hyderabad Institutions
('HYD001', 'Delhi Public School Nacharam', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100101', 'Senior Secondary', 'Private', 'School'),
('HYD002', 'Hyderabad Public School Begumpet', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100102', 'Senior Secondary', 'Private', 'School'),
('HYD003', 'Kendriya Vidyalaya Secunderabad', 'Secunderabad', 'Hyderabad', 'Telangana', '28010100103', 'Senior Secondary', 'Government', 'School'),
('HYD004', 'St. Francis College for Women', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100104', 'Higher Education', 'Private', 'College'),
('HYD005', 'GITAM University Hyderabad', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100105', 'Higher Education', 'Private', 'University'),
('HYD006', 'International Institute of Information Technology', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100106', 'Higher Education', 'Government', 'Institute'),
('HYD007', 'Osmania University', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100107', 'Higher Education', 'Government', 'University'),
('HYD008', 'Chirec International School', 'Hyderabad', 'Hyderabad', 'Telangana', '28010100108', 'Senior Secondary', 'Private', 'School'),

-- Delhi Institutions  
('DEL001', 'Delhi Public School RK Puram', 'New Delhi', 'New Delhi', 'Delhi', '07010101101', 'Senior Secondary', 'Private', 'School'),
('DEL002', 'Kendriya Vidyalaya Andrews Ganj', 'New Delhi', 'New Delhi', 'Delhi', '07010101102', 'Senior Secondary', 'Government', 'School'),
('DEL003', 'Indian Institute of Technology Delhi', 'New Delhi', 'New Delhi', 'Delhi', '07010201001', 'Higher Education', 'Government', 'Institute'),
('DEL004', 'Jamia Millia Islamia University', 'New Delhi', 'New Delhi', 'Delhi', '07010201002', 'Higher Education', 'Government', 'University'),
('DEL005', 'St. Stephens College', 'New Delhi', 'New Delhi', 'Delhi', '07010201003', 'Higher Education', 'Government', 'College'),

-- Bangalore Institutions
('BLR001', 'Delhi Public School Bangalore North', 'Bangalore', 'Bangalore Urban', 'Karnataka', '29010301101', 'Senior Secondary', 'Private', 'School'),
('BLR002', 'Indian Institute of Science', 'Bangalore', 'Bangalore Urban', 'Karnataka', '29010301201', 'Higher Education', 'Government', 'Institute'),
('BLR003', 'Christ University', 'Bangalore', 'Bangalore Urban', 'Karnataka', '29010301202', 'Higher Education', 'Private', 'University'),
('BLR004', 'Kendriya Vidyalaya Hebbal', 'Bangalore', 'Bangalore Urban', 'Karnataka', '29010301103', 'Senior Secondary', 'Government', 'School'),

-- Chennai Institutions
('CHN001', 'Loyola College', 'Chennai', 'Chennai', 'Tamil Nadu', '33010401201', 'Higher Education', 'Private', 'College'),
('CHN002', 'Indian Institute of Technology Madras', 'Chennai', 'Chennai', 'Tamil Nadu', '33010401301', 'Higher Education', 'Government', 'Institute'),
('CHN003', 'DAV Boys Senior Secondary School', 'Chennai', 'Chennai', 'Tamil Nadu', '33010401101', 'Senior Secondary', 'Private', 'School'),
('CHN004', 'Anna University', 'Chennai', 'Chennai', 'Tamil Nadu', '33010401302', 'Higher Education', 'Government', 'University'),

-- Mumbai Institutions
('MUM001', 'Bombay Scottish School', 'Mumbai', 'Mumbai', 'Maharashtra', '27010501101', 'Senior Secondary', 'Private', 'School'),
('MUM002', 'Indian Institute of Technology Bombay', 'Mumbai', 'Mumbai', 'Maharashtra', '27010501301', 'Higher Education', 'Government', 'Institute'),
('MUM003', 'University of Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '27010501302', 'Higher Education', 'Government', 'University'),
('MUM004', 'St. Xaviers College', 'Mumbai', 'Mumbai', 'Maharashtra', '27010501201', 'Higher Education', 'Private', 'College')
ON CONFLICT (institution_code) DO NOTHING;

-- Add sample pending institution requests for testing
INSERT INTO institution_requests (
  institution_name, city, state, requested_by, contact_info, 
  additional_details, institution_type, management_type, status
) VALUES 
('Green Valley International School', 'Hyderabad', 'Telangana', 'admin@greenvalley.edu', 
 'Phone: +91-9876543210', 'New CBSE affiliated school opening in 2024', 'School', 'Private', 'pending'),
('Sunrise Engineering College', 'Bangalore', 'Karnataka', 'principal@sunrise.edu.in',
 'Phone: +91-9876543211', 'AICTE approved engineering college', 'College', 'Private', 'pending'),
('Rainbow Public School', 'Chennai', 'Tamil Nadu', 'info@rainbow.edu',
 'Phone: +91-9876543212', 'State board affiliated primary school', 'School', 'Private', 'under_review')
ON CONFLICT DO NOTHING;
