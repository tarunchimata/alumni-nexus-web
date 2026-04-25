-- Populate sample schools for testing
-- This script adds sample school data that matches the current schema

-- First, truncate existing schools data (be careful in production!)
-- TRUNCATE TABLE schools CASCADE;

-- Insert sample schools using correct schema structure
INSERT INTO schools (
  institution_id, 
  school_name, 
  udise_school_code, 
  school_category, 
  school_type, 
  management, 
  state_name, 
  district_name, 
  village_name, 
  pincode, 
  status, 
  name, 
  udise_code, 
  school_type_legacy, 
  management_type, 
  address, 
  contact_number, 
  is_active
) VALUES
('INC-IN-DL-001', 'Delhi Public School Vasant Kunj', 'DPS001', 'Higher Secondary', 'Private', 'Private Unaided', 'Delhi', 'New Delhi', 'Vasant Kunj', '110070', 'active', 'Delhi Public School Vasant Kunj', 'DPS001', 'Higher Secondary', 'Private', '123 Sector C, Vasant Kunj, New Delhi, 110070', '+91-11-26895000', true),

('INC-IN-MH-002', 'Government Higher Secondary School Bandra', 'GSHS002', 'Higher Secondary', 'Government', 'State Government', 'Maharashtra', 'Mumbai', 'Bandra West', '400050', 'active', 'Government Higher Secondary School Bandra', 'GSHS002', 'Higher Secondary', 'Government', '456 Hill Road, Bandra West, Mumbai, 400050', '+91-22-26405000', true),

('INC-IN-KA-003', 'St. Josephs Boys High School', 'SJBHS003', 'Secondary', 'Private', 'Private Aided', 'Karnataka', 'Bangalore', 'Richmond Town', '560025', 'active', 'St. Josephs Boys High School', 'SJBHS003', 'Secondary', 'Private', '27 Museum Road, Richmond Town, Bangalore, 560025', '+91-80-22862500', true),

('INC-IN-TN-004', 'Kendriya Vidyalaya IIT Chennai', 'KV004', 'Higher Secondary', 'Central Government', 'Central Government', 'Tamil Nadu', 'Chennai', 'Guindy', '600036', 'active', 'Kendriya Vidyalaya IIT Chennai', 'KV004', 'Higher Secondary', 'Government', 'IIT Campus, Guindy, Chennai, 600036', '+91-44-22575000', true),

('INC-IN-UP-005', 'La Martiniere College Lucknow', 'LMC005', 'Senior Secondary', 'Private', 'Private Aided', 'Uttar Pradesh', 'Lucknow', 'Lucknow Cantonment', '226002', 'active', 'La Martiniere College Lucknow', 'LMC005', 'Senior Secondary', 'Private', 'Cantt Road, Lucknow, 226002', '+91-522-2623456', true),

('INC-IN-RJ-006', 'Mayo College Ajmer', 'MCA006', 'Senior Secondary', 'Private', 'Private Unaided', 'Rajasthan', 'Ajmer', 'Ajmer City', '305001', 'active', 'Mayo College Ajmer', 'MCA006', 'Senior Secondary', 'Private', 'Mayo College Road, Ajmer, 305001', '+91-145-2420777', true),

('INC-IN-WB-007', 'South Point High School', 'SPHS007', 'Higher Secondary', 'Private', 'Private Unaided', 'West Bengal', 'Kolkata', 'Ballygunge', '700029', 'active', 'South Point High School', 'SPHS007', 'Higher Secondary', 'Private', '54 Ballygunge Circular Road, Kolkata, 700029', '+91-33-24617890', true),

('INC-IN-GJ-008', 'Ahmedabad International School', 'AIS008', 'Senior Secondary', 'Private', 'Private Unaided', 'Gujarat', 'Ahmedabad', 'Bopal', '380058', 'active', 'Ahmedabad International School', 'AIS008', 'Senior Secondary', 'Private', 'Nr. YMCA Club, SG Highway, Bopal, Ahmedabad, 380058', '+91-79-40307000', true),

('INC-IN-PB-009', 'The Doon School Dehradun', 'TDS009', 'Senior Secondary', 'Private', 'Private Unaided', 'Punjab', 'Dehradun', 'Dehradun City', '248001', 'active', 'The Doon School Dehradun', 'TDS009', 'Senior Secondary', 'Private', 'Mall Road, Dehradun, 248001', '+91-135-2526400', true),

('INC-IN-AP-010', 'Narayana e-Techno School Hyderabad', 'NETS010', 'Higher Secondary', 'Private', 'Private Unaided', 'Andhra Pradesh', 'Hyderabad', 'Gachibowli', '500032', 'active', 'Narayana e-Techno School Hyderabad', 'NETS010', 'Higher Secondary', 'Private', 'Plot No 25, Gachibowli, Hyderabad, 500032', '+91-40-23000000', true),

('INC-IN-KL-011', 'Bhavans Vidya Mandir Elamakkara', 'BVME011', 'Higher Secondary', 'Private', 'Private Aided', 'Kerala', 'Kochi', 'Elamakkara', '682026', 'active', 'Bhavans Vidya Mandir Elamakkara', 'BVME011', 'Higher Secondary', 'Private', 'Elamakkara, Kochi, 682026', '+91-484-2345600', true),

('INC-IN-HR-012', 'DPS Gurgaon Sector 45', 'DPSG012', 'Senior Secondary', 'Private', 'Private Unaided', 'Haryana', 'Gurgaon', 'Sector 45', '122003', 'active', 'DPS Gurgaon Sector 45', 'DPSG012', 'Senior Secondary', 'Private', 'Sector 45, Gurgaon, 122003', '+91-124-4513000', true);

-- Update sequence if using serial IDs
-- SELECT setval('schools_id_seq', (SELECT MAX(id) FROM schools));

-- Verify the data
SELECT 
  institution_id,
  school_name,
  state_name,
  district_name,
  status,
  created_at
FROM schools 
ORDER BY created_at DESC
LIMIT 12;