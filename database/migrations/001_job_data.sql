-- ============================================
-- MIGRATION 001
-- JOB DATA MODEL
-- ============================================

-- ============================================
-- SKILLS
-- ============================================

CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- USER SKILLS
-- ============================================

CREATE TABLE user_skills (
    user_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,

    proficiency VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, skill_id),

    CONSTRAINT fk_user_skills_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
);


-- ============================================
-- JOBS
-- ============================================

CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,

    source VARCHAR(100) NOT NULL,
    external_id VARCHAR(255),

    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,

    location VARCHAR(255),
    work_mode VARCHAR(30),
    employment_type VARCHAR(50),

    experience_min NUMERIC(4,1),
    experience_max NUMERIC(4,1),

    salary_min NUMERIC(12,2),
    salary_max NUMERIC(12,2),
    salary_currency VARCHAR(10),

    description TEXT NOT NULL,
    application_url TEXT NOT NULL,

    posted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_job_source
        UNIQUE (source, external_id)
);


-- ============================================
-- JOB SKILLS
-- ============================================

CREATE TABLE job_skills (
    job_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,

    required BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (job_id, skill_id),

    CONSTRAINT fk_job_skills_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_job_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
);