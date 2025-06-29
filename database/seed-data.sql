
-- Seed data for My School Buddies platform
-- Insert sample data for development and testing

-- Insert sample schools
INSERT INTO schools (name, udise_code, school_type, management_type, address, contact_number) VALUES
('Delhi Public School', 'DPS001', 'Higher Secondary', 'Private', '123 Main Street, New Delhi, 110001', '+91-11-12345678'),
('Government Senior Secondary School', 'GSSS002', 'Higher Secondary', 'Government', '456 School Road, Mumbai, 400001', '+91-22-87654321'),
('St. Mary''s Convent School', 'SMCS003', 'Secondary', 'Private', '789 Church Lane, Bangalore, 560001', '+91-80-11111111'),
('Kendriya Vidyalaya', 'KV004', 'Higher Secondary', 'Government', '321 Central Avenue, Chennai, 600001', '+91-44-22222222');

-- Note: Users will be automatically created when they register through Keycloak
-- The keycloak_id will be populated from Keycloak user registration

-- Insert sample classes (after schools are created)
INSERT INTO classes (school_id, name, section, academic_year, description) VALUES
(1, 'Class 10', 'A', '2024-25', 'Mathematics and Science focus'),
(1, 'Class 10', 'B', '2024-25', 'Commerce focus'),
(1, 'Class 12', 'A', '2024-25', 'Science stream'),
(2, 'Class 9', 'A', '2024-25', 'General studies'),
(2, 'Class 11', 'A', '2024-25', 'Arts stream'),
(3, 'Class 8', 'A', '2024-25', 'Middle school'),
(4, 'Class 12', 'B', '2024-25', 'Commerce stream');

-- Insert a platform admin user (this should be done after Keycloak setup)
-- INSERT INTO users (keycloak_id, email, first_name, last_name, role) VALUES
-- ('admin-keycloak-id', 'admin@myschoolbuddies.com', 'Platform', 'Admin', 'platform_admin');
