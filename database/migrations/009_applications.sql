CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'saved',

    applied_at TIMESTAMPTZ,
    interview_at TIMESTAMPTZ,
    offer_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_job_application
        UNIQUE (user_id, job_id),

    CONSTRAINT valid_application_status
        CHECK (
            status IN (
                'saved',
                'applied',
                'interview',
                'offer',
                'rejected',
                'withdrawn'
            )
        )
);

CREATE INDEX idx_applications_user_id
ON applications(user_id);

CREATE INDEX idx_applications_job_id
ON applications(job_id);

CREATE INDEX idx_applications_status
ON applications(status);