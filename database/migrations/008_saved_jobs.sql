CREATE TABLE saved_jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_job_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_job_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_saved_job
        UNIQUE (user_id, job_id)
);

CREATE INDEX idx_saved_jobs_user_id
ON saved_jobs(user_id);

CREATE INDEX idx_saved_jobs_job_id
ON saved_jobs(job_id);