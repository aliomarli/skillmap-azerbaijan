-- SkillMap Azerbaijan - SQLite Verilənlər Bazası Sxemi
-- jobs, skills, job_skills, student_profiles, student_skills

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT DEFAULT 'Şirkət qeyd olunmayıb',
    sector TEXT DEFAULT 'Digər',
    location TEXT DEFAULT 'Azərbaycan',
    education TEXT DEFAULT 'Qeyd olunmayıb',
    experience TEXT DEFAULT 'Qeyd olunmayıb',
    salary_min INTEGER DEFAULT 0,
    salary_max INTEGER DEFAULT 0,
    languages TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    source TEXT DEFAULT 'Manual / API',
    source_url TEXT DEFAULT '',
    posted_date TEXT DEFAULT '',
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_demo INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK(category IN ('technical', 'business', 'soft', 'language')),
    weight_factor REAL DEFAULT 1.0,
    aliases TEXT NOT NULL -- JSON array of alias strings
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    importance REAL DEFAULT 1.0,
    confidence REAL DEFAULT 1.0,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_profiles (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT 'Tələbə / Məzun',
    university TEXT DEFAULT 'UNEC',
    degree TEXT DEFAULT 'Bakalavr',
    field TEXT DEFAULT 'Maliyyə və İqtisadiyyat',
    target_role TEXT DEFAULT 'data_analyst',
    english_level TEXT DEFAULT 'B2',
    experience TEXT DEFAULT '0-1 il',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_skills (
    student_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    level INTEGER NOT NULL CHECK(level >= 0 AND level <= 100),
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_sector ON jobs(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_job ON job_skills(job_id);

-- Google Forms Student Survey Responses Table
CREATE TABLE IF NOT EXISTS student_survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    respondent_id TEXT UNIQUE NOT NULL,
    university TEXT DEFAULT 'Qeyd olunmayıb',
    field_of_study TEXT DEFAULT 'Qeyd olunmayıb',
    field_normalized TEXT DEFAULT 'Other',
    education_level TEXT DEFAULT 'Bakalavr',
    age_group TEXT DEFAULT '18-22',
    employment_status TEXT DEFAULT 'İşləmir',
    work_experience TEXT DEFAULT 'Təcrübəsiz',
    work_experience_years REAL DEFAULT 0.0,
    job_search_status TEXT DEFAULT 'Aktiv iş axtarır',
    target_sector TEXT DEFAULT 'Digər',
    target_role TEXT DEFAULT 'Digər',
    english_level TEXT DEFAULT 'B1',
    russian_level TEXT DEFAULT 'A2',
    digital_skill_level TEXT DEFAULT 'Orta',
    skills_json TEXT DEFAULT '{}',
    soft_skill_scores TEXT DEFAULT '{}',
    career_alignment_score REAL DEFAULT 0.0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'google_forms',
    is_demo INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_survey_university ON student_survey_responses(university);
CREATE INDEX IF NOT EXISTS idx_survey_field_norm ON student_survey_responses(field_normalized);
CREATE INDEX IF NOT EXISTS idx_survey_target_role ON student_survey_responses(target_role);
CREATE INDEX IF NOT EXISTS idx_survey_is_demo ON student_survey_responses(is_demo);