-- ============================================
-- PERSONAL AI JOB AGENT
-- Database Schema
-- ============================================

-- USERS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- USER PROFILES
CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,

    headline VARCHAR(255),
    summary TEXT,

    years_of_experience NUMERIC(4,1) DEFAULT 0,

    current_location VARCHAR(150),
    preferred_locations TEXT,
    preferred_work_mode VARCHAR(30),

    expected_salary_min NUMERIC(12,2),
    expected_salary_max NUMERIC(12,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);