ALTER TABLE education
ADD COLUMN source_resume_id BIGINT;

ALTER TABLE education
ADD CONSTRAINT fk_education_source_resume
FOREIGN KEY (source_resume_id)
REFERENCES resumes(id)
ON DELETE SET NULL;

CREATE INDEX idx_education_user_id
ON education(user_id);

CREATE INDEX idx_education_source_resume_id
ON education(source_resume_id);