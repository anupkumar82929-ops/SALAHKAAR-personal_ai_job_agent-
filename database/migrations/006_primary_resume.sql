CREATE UNIQUE INDEX idx_one_primary_resume_per_user
ON resumes(user_id)
WHERE is_primary = TRUE;