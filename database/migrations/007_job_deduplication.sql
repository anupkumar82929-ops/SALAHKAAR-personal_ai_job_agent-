CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE jobs
ADD COLUMN deduplication_key TEXT;

UPDATE jobs
SET deduplication_key =
    encode(
        digest(
            CASE
                WHEN external_id IS NOT NULL
                    THEN lower(trim(source)) || '|' || lower(trim(external_id))
                ELSE
                    lower(trim(source)) || '|'
                    || lower(trim(company)) || '|'
                    || lower(trim(title)) || '|'
                    || lower(trim(application_url))
            END,
            'sha256'
        ),
        'hex'
    );

ALTER TABLE jobs
ALTER COLUMN deduplication_key SET NOT NULL;

CREATE UNIQUE INDEX idx_jobs_deduplication_key
ON jobs(deduplication_key);