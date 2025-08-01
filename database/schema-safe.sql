-- My School Buddies Database Schema - Safe Deployment Version
-- PostgreSQL Database Schema with safety checks and existing data protection
-- This version will NOT drop existing tables and data

-- Create backup timestamp for logging
SELECT now() as deployment_timestamp;

-- ===================================================================
-- SAFE SCHEMA DEPLOYMENT - CREATES ONLY IF NOT EXISTS
-- ===================================================================

-- Schools table with comprehensive structure for CSV import
CREATE TABLE IF NOT EXISTS schools (
    institution_id         VARCHAR(30) PRIMARY KEY, -- Generated: 'INC-IN-<state_code>-<number>'
    school_name            TEXT NOT NULL,
    udise_school_code      VARCHAR(20),             
    school_category        VARCHAR(50),             
    school_type            VARCHAR(20),             
    management             VARCHAR(100),            
    year_of_establishment  VARCHAR(10),             
    status                 VARCHAR(50),             
    location_type          VARCHAR(20),             
    class_from             VARCHAR(10),             
    class_to               VARCHAR(10),             
    aff_board_sec          VARCHAR(100),            
    aff_board_h_sec        VARCHAR(100),            
    state_name             VARCHAR(100) NOT NULL,
    district_name          VARCHAR(100),
    sub_district_name      VARCHAR(100),
    village_name           VARCHAR(100),
    pincode                VARCHAR(10),
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Legacy compatibility fields (kept for existing relations)
    id                     SERIAL UNIQUE NOT NULL,
    name                   VARCHAR(255),
    udise_code             VARCHAR(50),
    school_type_legacy     VARCHAR(50),
    management_type        VARCHAR(50),
    address               TEXT,
    contact_number        VARCHAR(20),
    is_active             BOOLEAN DEFAULT true
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    keycloak_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('platform_admin', 'school_admin', 'teacher', 'alumni', 'student')),
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    admission_year INTEGER,
    graduation_year INTEGER,
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10),
    academic_year VARCHAR(10) NOT NULL,
    class_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Class Groups mapping table
CREATE TABLE IF NOT EXISTS user_class_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    role_in_class VARCHAR(50) NOT NULL CHECK (role_in_class IN ('teacher', 'student', 'alumni', 'admin')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, class_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    attachment_url TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_by INTEGER REFERENCES users(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- SAFE INDEX CREATION - CREATES ONLY IF NOT EXISTS
-- ===================================================================

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_udise_code ON schools(udise_code);
CREATE INDEX IF NOT EXISTS idx_schools_institution_id ON schools(institution_id);
CREATE INDEX IF NOT EXISTS idx_schools_udise_school_code ON schools(udise_school_code);
CREATE INDEX IF NOT EXISTS idx_schools_state_name ON schools(state_name);
CREATE INDEX IF NOT EXISTS idx_schools_district_name ON schools(district_name);
CREATE INDEX IF NOT EXISTS idx_schools_school_name ON schools(school_name);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_user_class_groups_user_id ON user_class_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_class_groups_class_id ON user_class_groups(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_class_id ON messages(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Log completion
SELECT 'Schema deployment completed safely at ' || now() as completion_message;