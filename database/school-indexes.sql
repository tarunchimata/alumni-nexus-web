-- School Management Performance Indexes
-- Phase 2 Extension: Enhanced school search and approval workflow

-- Primary indexes for school search and filtering
CREATE INDEX IF NOT EXISTS idx_schools_name_search ON schools USING gin(to_tsvector('english', school_name));
CREATE INDEX IF NOT EXISTS idx_schools_udise_code ON schools (udise_school_code);
CREATE INDEX IF NOT EXISTS idx_schools_location ON schools (state_name, district_name);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools (status);
CREATE INDEX IF NOT EXISTS idx_schools_institution_id ON schools (institution_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_schools_status_name ON schools (status, school_name);
CREATE INDEX IF NOT EXISTS idx_schools_location_status ON schools (state_name, district_name, status);
CREATE INDEX IF NOT EXISTS idx_schools_type_management ON schools (school_type, management_type);

-- Partial indexes for pending approvals and active schools
CREATE INDEX IF NOT EXISTS idx_schools_pending ON schools (created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_schools_approved ON schools (school_name) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_schools_active ON schools (school_name) WHERE status = 'active';

-- Full-text search index for comprehensive school search
CREATE INDEX IF NOT EXISTS idx_schools_fulltext ON schools USING gin(
  to_tsvector('english', 
    coalesce(school_name, '') || ' ' || 
    coalesce(district_name, '') || ' ' || 
    coalesce(state_name, '') || ' ' ||
    coalesce(udise_school_code, '')
  )
);

-- Deduplication support indexes for Phase 3
CREATE INDEX IF NOT EXISTS idx_schools_duplicate_check ON schools (
  lower(school_name), 
  lower(district_name), 
  lower(state_name)
) WHERE status IN ('pending', 'approved', 'active');

-- Performance monitoring
ANALYZE schools;

-- Verify indexes
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'schools' 
AND schemaname = 'public'
ORDER BY indexname;