ALTER TABLE certifications
ADD COLUMN source_resume_id BIGINT;

ALTER TABLE certifications
ADD CONSTRAINT fk_certification_source_resume
FOREIGN KEY (source_resume_id)
REFERENCES resumes(id)
ON DELETE SET NULL;

CREATE INDEX idx_certifications_user_id
ON certifications(user_id);

CREATE INDEX idx_certifications_source_resume_id
ON certifications(source_resume_id);