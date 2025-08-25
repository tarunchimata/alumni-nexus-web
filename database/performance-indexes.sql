-- Performance Indexes for My School Buddies Database
-- Apply these indexes to optimize query performance

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_school_role ON users(school_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- School table indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_institution_id ON schools(institution_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_name_search ON schools USING gin(to_tsvector('english', school_name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_location ON schools(state_name, district_name, village_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_active ON schools(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_udise ON schools(udise_code) WHERE udise_code IS NOT NULL;

-- Posts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_school_created ON posts(school_id, created_at DESC) WHERE school_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', content));

-- Messages table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, is_read, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Import jobs table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_import_jobs_uploader ON import_jobs(uploader_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_import_jobs_status ON import_jobs(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_import_jobs_batch ON import_jobs(import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Import rows table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_import_rows_job_status ON import_rows(import_job_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_import_rows_email ON import_rows USING gin((raw_data->>'email'));

-- Connections/Friends table indexes (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_connections_user1 ON user_connections(user1_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_connections_user2 ON user_connections(user2_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_connections_created ON user_connections(created_at DESC);

-- Analytics/Activity table indexes (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_date ON user_activities(user_id, activity_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type, activity_date DESC);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_school_active_created ON users(school_id, is_active, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_school_author_created ON posts(school_id, author_id, created_at DESC);

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_only ON users(id, email, first_name, last_name) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_active_only ON schools(id, school_name, state_name) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_only ON posts(id, title, created_at DESC) WHERE status = 'published';

-- Text search indexes for better search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_full_text ON schools USING gin(
  to_tsvector('english', coalesce(school_name, '') || ' ' || coalesce(village_name, '') || ' ' || coalesce(district_name, '') || ' ' || coalesce(state_name, ''))
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_full_text ON users USING gin(
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, ''))
);

-- Performance monitoring views
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_time DESC
LIMIT 20;

-- Index usage monitoring
CREATE OR REPLACE VIEW index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table statistics
CREATE OR REPLACE VIEW table_stats AS
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Update table statistics
ANALYZE;

-- Verify indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;