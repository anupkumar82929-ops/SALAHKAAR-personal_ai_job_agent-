-- ============================================
-- MIGRATION 002
-- RESUME INTELLIGENCE
-- ============================================


-- ============================================
-- RESUMES
-- ============================================

CREATE TABLE resumes (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_path TEXT,

    raw_text TEXT,

    parsed_data JSONB,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resume_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- EDUCATION
-- ============================================

CREATE TABLE education (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    institution VARCHAR(255),
    degree VARCHAR(150),
    field_of_study VARCHAR(150),

    start_date DATE,
    end_date DATE,

    grade VARCHAR(50),

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_education_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- EXPERIENCE
-- ============================================

CREATE TABLE experience (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    company VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,

    location VARCHAR(255),

    employment_type VARCHAR(50),

    start_date DATE,
    end_date DATE,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_experience_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    project_url TEXT,
    github_url TEXT,

    start_date DATE,
    end_date DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- PROJECT SKILLS
-- ============================================

CREATE TABLE project_skills (
    project_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,

    PRIMARY KEY (project_id, skill_id),

    CONSTRAINT fk_project_skill_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_skill_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
);


-- ============================================
-- CERTIFICATIONS
-- ============================================

CREATE TABLE certifications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),

    issue_date DATE,
    expiry_date DATE,

    credential_id VARCHAR(255),
    credential_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_certification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);