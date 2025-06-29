
-- My School Buddies Database Schema
-- PostgreSQL Database Schema for the complete platform

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_class_groups CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- Schools table
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    udise_code VARCHAR(50) UNIQUE NOT NULL,
    school_type VARCHAR(50) NOT NULL CHECK (school_type IN ('Primary', 'Secondary', 'Higher Secondary')),
    management_type VARCHAR(50) NOT NULL CHECK (management_type IN ('Government', 'Private')),
    address TEXT NOT NULL,
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
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
CREATE TABLE classes (
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
CREATE TABLE user_class_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    role_in_class VARCHAR(50) NOT NULL CHECK (role_in_class IN ('teacher', 'student', 'alumni', 'admin')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, class_id)
);

-- Messages table
CREATE TABLE messages (
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

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_schools_udise_code ON schools(udise_code);
CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_user_class_groups_user_id ON user_class_groups(user_id);
CREATE INDEX idx_user_class_groups_class_id ON user_class_groups(class_id);
CREATE INDEX idx_messages_class_id ON messages(class_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
