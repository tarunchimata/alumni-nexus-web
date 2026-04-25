
-- Create schools table for institution search during registration
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT NOT NULL,
  city TEXT,
  district TEXT,
  state TEXT,
  udise_code TEXT,
  institution_type TEXT DEFAULT 'School',
  institution_category TEXT,
  management_type TEXT DEFAULT 'Private',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools are publicly readable (needed for registration search)
CREATE POLICY "Schools are viewable by everyone"
ON public.schools FOR SELECT
USING (true);

-- Only authenticated users can insert (for school requests)
CREATE POLICY "Authenticated users can request schools"
ON public.schools FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for search performance
CREATE INDEX idx_schools_name ON public.schools USING gin(to_tsvector('english', institution_name));
CREATE INDEX idx_schools_city ON public.schools(city);
CREATE INDEX idx_schools_state ON public.schools(state);
CREATE INDEX idx_schools_status ON public.schools(status);

-- Create school_requests table for "Request to Add School"
CREATE TABLE public.school_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  contact_info TEXT,
  additional_details TEXT,
  institution_type TEXT DEFAULT 'School',
  management_type TEXT DEFAULT 'Private',
  requested_by TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a school request (during registration, user isn't authenticated yet)
CREATE POLICY "Anyone can submit school requests"
ON public.school_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Insert sample school data
INSERT INTO public.schools (institution_name, city, district, state, udise_code, institution_type, management_type) VALUES
('Delhi Public School, R.K. Puram', 'New Delhi', 'South West Delhi', 'Delhi', 'DPS001', 'Higher Secondary', 'Private'),
('Delhi Public School, Vasant Kunj', 'New Delhi', 'South West Delhi', 'Delhi', 'DPS002', 'Higher Secondary', 'Private'),
('Kendriya Vidyalaya, JNU', 'New Delhi', 'South Delhi', 'Delhi', 'KV001', 'Higher Secondary', 'Government'),
('St. Columba''s School', 'New Delhi', 'Central Delhi', 'Delhi', 'SCS001', 'Higher Secondary', 'Private'),
('Modern School, Barakhamba', 'New Delhi', 'Central Delhi', 'Delhi', 'MS001', 'Higher Secondary', 'Private'),
('The Mother''s International School', 'New Delhi', 'South Delhi', 'Delhi', 'MIS001', 'Higher Secondary', 'Private'),
('Sanskriti School', 'New Delhi', 'South Delhi', 'Delhi', 'SS001', 'Higher Secondary', 'Private'),
('Springdales School, Pusa Road', 'New Delhi', 'Central Delhi', 'Delhi', 'SPR001', 'Higher Secondary', 'Private'),
('Government Senior Secondary School', 'Mumbai', 'Mumbai City', 'Maharashtra', 'GSSS001', 'Higher Secondary', 'Government'),
('St. Xavier''s High School', 'Mumbai', 'Mumbai City', 'Maharashtra', 'SXH001', 'Higher Secondary', 'Private'),
('Cathedral and John Connon School', 'Mumbai', 'Mumbai City', 'Maharashtra', 'CJC001', 'Higher Secondary', 'Private'),
('Don Bosco High School', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', 'DBH001', 'Higher Secondary', 'Private'),
('Bishop Cotton Boys'' School', 'Bangalore', 'Bangalore Urban', 'Karnataka', 'BCB001', 'Higher Secondary', 'Private'),
('National Public School, Indiranagar', 'Bangalore', 'Bangalore Urban', 'Karnataka', 'NPS001', 'Higher Secondary', 'Private'),
('St. Joseph''s Indian High School', 'Bangalore', 'Bangalore Urban', 'Karnataka', 'SJI001', 'Higher Secondary', 'Private'),
('Presidency School', 'Bangalore', 'Bangalore Urban', 'Karnataka', 'PS001', 'Higher Secondary', 'Private'),
('La Martiniere for Boys', 'Kolkata', 'Kolkata', 'West Bengal', 'LMB001', 'Higher Secondary', 'Private'),
('South Point School', 'Kolkata', 'Kolkata', 'West Bengal', 'SPS001', 'Higher Secondary', 'Private'),
('Loyola School', 'Chennai', 'Chennai', 'Tamil Nadu', 'LS001', 'Higher Secondary', 'Private'),
('DAV Public School', 'Chennai', 'Chennai', 'Tamil Nadu', 'DAV001', 'Higher Secondary', 'Private'),
('The Doon School', 'Dehradun', 'Dehradun', 'Uttarakhand', 'TDS001', 'Higher Secondary', 'Private'),
('Welham Boys'' School', 'Dehradun', 'Dehradun', 'Uttarakhand', 'WBS001', 'Higher Secondary', 'Private'),
('Mayo College', 'Ajmer', 'Ajmer', 'Rajasthan', 'MC001', 'Higher Secondary', 'Private'),
('Maharaja''s College', 'Jaipur', 'Jaipur', 'Rajasthan', 'MRC001', 'Higher Secondary', 'Government'),
('St. Paul''s School', 'Darjeeling', 'Darjeeling', 'West Bengal', 'STP001', 'Higher Secondary', 'Private');
