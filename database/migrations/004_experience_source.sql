ALTER TABLE experience
ADD COLUMN source_resume_id BIGINT;

ALTER TABLE experience
ADD CONSTRAINT fk_experience_source_resume
FOREIGN KEY (source_resume_id)
REFERENCES resumes(id)
ON DELETE SET NULL;

CREATE INDEX idx_experience_user_id
ON experience(user_id);

CREATE INDEX idx_experience_source_resume_id
ON experience(source_resume_id);ALTER TABLE experience
ADD COLUMN source_resume_id BIGINT;

ALTER TABLE experience
ADD CONSTRAINT fk_experience_source_resume
FOREIGN KEY (source_resume_id)
REFERENCES resumes(id)
ON DELETE SET NULL;

CREATE INDEX idx_experience_user_id
ON experience(user_id);

CREATE INDEX idx_experience_source_resume_id
ON experience(source_resume_id);