
-- Seed data for My School Buddies platform
-- Insert sample data for development and testing

-- Insert sample schools using new schema structure
INSERT INTO schools (institution_id, school_name, udise_school_code, school_category, school_type, management, state_name, district_name, village_name, pincode, status, name, udise_code, school_type_legacy, management_type, address, contact_number, is_active) VALUES
('INC-IN-DL-001', 'Delhi Public School', 'DPS001', 'Higher Secondary', 'Private', 'Private Unaided', 'Delhi', 'New Delhi', 'Central Delhi', '110001', 'active', 'Delhi Public School', 'DPS001', 'Higher Secondary', 'Private', '123 Main Street, New Delhi, 110001', '+91-11-12345678', true),
('INC-IN-MH-002', 'Government Senior Secondary School', 'GSSS002', 'Higher Secondary', 'Government', 'State Government', 'Maharashtra', 'Mumbai', 'Mumbai Central', '400001', 'active', 'Government Senior Secondary School', 'GSSS002', 'Higher Secondary', 'Government', '456 School Road, Mumbai, 400001', '+91-22-87654321', true),
('INC-IN-KA-003', 'St. Mary''s Convent School', 'SMCS003', 'Secondary', 'Private', 'Private Aided', 'Karnataka', 'Bangalore', 'Bangalore City', '560001', 'active', 'St. Mary''s Convent School', 'SMCS003', 'Secondary', 'Private', '789 Church Lane, Bangalore, 560001', '+91-80-11111111', true),
('INC-IN-TN-004', 'Kendriya Vidyalaya', 'KV004', 'Higher Secondary', 'Government', 'Central Government', 'Tamil Nadu', 'Chennai', 'Chennai Central', '600001', 'active', 'Kendriya Vidyalaya', 'KV004', 'Higher Secondary', 'Government', '321 Central Avenue, Chennai, 600001', '+91-44-22222222', true),
('INC-IN-UP-005', 'Bright Future Academy', 'BFA005', 'Senior Secondary', 'Private', 'Private Unaided', 'Uttar Pradesh', 'Lucknow', 'Gomti Nagar', '226010', 'active', 'Bright Future Academy', 'BFA005', 'Senior Secondary', 'Private', '456 Education Lane, Lucknow, 226010', '+91-522-4567890', true),
('INC-IN-RJ-006', 'Rajasthan Government School', 'RGS006', 'Primary', 'Government', 'State Government', 'Rajasthan', 'Jaipur', 'Pink City', '302001', 'active', 'Rajasthan Government School', 'RGS006', 'Primary', 'Government', '789 Government Road, Jaipur, 302001', '+91-141-2345678', true);

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
