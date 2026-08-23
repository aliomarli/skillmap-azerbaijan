"""
SkillMap Azerbaijan - Central SQLite Database Manager & Repository
Manages database initialization, migrations, CRUD operations, and analytical queries.
"""

import sqlite3
import json
import os
import io
import csv
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..nlp.taxonomy import CANONICAL_SKILLS
from ..adapters import JobsearchAdapter


class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            base_dir = Path(__file__).resolve().parent
            self.db_path = str(base_dir / "skillmap.db")
        else:
            self.db_path = db_path
        
        self.schema_path = str(Path(__file__).resolve().parent / "schema.sql")
        self._is_memory = (self.db_path == ":memory:")
        self._shared_conn = None
        if self._is_memory:
            self._shared_conn = sqlite3.connect(":memory:")
            self._shared_conn.row_factory = sqlite3.Row
            self._shared_conn.execute("PRAGMA foreign_keys = ON")
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        if self._is_memory and self._shared_conn:
            return self._shared_conn
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            with open(self.schema_path, "r", encoding="utf-8") as f:
                conn.executescript(f.read())

            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM skills")
            if cur.fetchone()[0] == 0:
                for s in CANONICAL_SKILLS:
                    cur.execute(
                        "INSERT INTO skills (id, canonical_name, category, weight_factor, aliases) VALUES (?, ?, ?, ?, ?)",
                        (s["id"], s["canonical_name"], s["category"], s["weight_factor"], json.dumps(s["aliases"], ensure_ascii=False))
                    )
                conn.commit()

    def seed_jobs_from_file(self, json_file_path: str) -> int:
        if not os.path.exists(json_file_path):
            return 0

        with open(json_file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        raw_vacancies = raw_data.get("liveVacancies", []) if isinstance(raw_data, dict) else raw_data
        adapter = JobsearchAdapter()
        parsed_jobs = adapter.parse_batch(raw_vacancies)

        inserted_count = 0
        with self.get_connection() as conn:
            cur = conn.cursor()
            for job in parsed_jobs:
                cur.execute("""
                    INSERT OR REPLACE INTO jobs (
                        id, title, company, sector, location, education, experience,
                        salary_min, salary_max, languages, description, source,
                        source_url, posted_date, collected_at, is_demo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    job.id, job.title, job.company, job.sector, job.location,
                    job.education, job.experience, job.salary_min, job.salary_max,
                    json.dumps(job.languages, ensure_ascii=False), job.description,
                    job.source, job.source_url, job.posted_date, job.collected_at, job.is_demo
                ))

                for sk in job.extracted_skills:
                    skill_id = sk.get("id")
                    if skill_id:
                        cur.execute("""
                            INSERT OR REPLACE INTO job_skills (job_id, skill_id, importance, confidence)
                            VALUES (?, ?, ?, ?)
                        """, (job.id, skill_id, 1.0, 0.9))

                inserted_count += 1
            conn.commit()

        return inserted_count

    def get_jobs(self, limit: int = 50, offset: int = 0, search: str = "", sector: str = "", skill: str = "") -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            query = """
                SELECT DISTINCT j.* 
                FROM jobs j
                LEFT JOIN job_skills js ON j.id = js.job_id
                WHERE 1=1
            """
            params = []

            if search:
                query += " AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)"
                search_param = f"%{search}%"
                params.extend([search_param, search_param, search_param])

            if sector:
                query += " AND j.sector = ?"
                params.append(sector)

            if skill:
                query += " AND js.skill_id = ?"
                params.append(skill)

            count_query = f"SELECT COUNT(*) FROM ({query})"
            cur.execute(count_query, params)
            total_count = cur.fetchone()[0]

            query += " ORDER BY j.collected_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            cur.execute(query, params)
            rows = cur.fetchall()

            jobs_list = []
            for row in rows:
                job_dict = dict(row)
                job_dict["languages"] = json.loads(job_dict.get("languages") or "[]")
                cur.execute("SELECT skill_id FROM job_skills WHERE job_id = ?", (job_dict["id"],))
                job_dict["skills"] = [r[0] for r in cur.fetchall()]
                jobs_list.append(job_dict)

            return {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "jobs": jobs_list
            }

    def get_job_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
            row = cur.fetchone()
            if not row:
                return None

            job_dict = dict(row)
            job_dict["languages"] = json.loads(job_dict.get("languages") or "[]")
            
            cur.execute("""
                SELECT s.id, s.canonical_name, s.category, js.importance, js.confidence
                FROM job_skills js
                JOIN skills s ON js.skill_id = s.id
                WHERE js.job_id = ?
            """, (job_id,))
            job_dict["skills"] = [dict(r) for r in cur.fetchall()]
            return job_dict

    def get_all_skills(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM skills ORDER BY category, canonical_name")
            skills = []
            for r in cur.fetchall():
                d = dict(r)
                d["aliases"] = json.loads(d["aliases"])
                skills.append(d)
            return skills

    def get_overview_analytics(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM jobs")
            total_vacancies = cur.fetchone()[0] or 0
            
            cur.execute("SELECT COUNT(DISTINCT job_id) FROM job_skills")
            with_skills = cur.fetchone()[0] or 0
            
            cur.execute("SELECT COUNT(*) FROM jobs WHERE salary_min > 0 OR salary_max > 0")
            with_salary = cur.fetchone()[0] or 0
            
            cur.execute("SELECT COUNT(*) FROM jobs WHERE location IS NOT NULL AND location NOT IN ('Azərbaycan', 'Qeyd olunmayıb', '')")
            with_location = cur.fetchone()[0] or 0
            
            cur.execute("SELECT AVG(data_quality_score) FROM jobs")
            avg_q = round(cur.fetchone()[0] or 50.0, 1)

            return {
                "total_vacancies": total_vacancies,
                "active_vacancies": total_vacancies,
                "vacancies_with_skills_count": with_skills,
                "vacancies_with_skills_percentage": round((with_skills / max(1, total_vacancies)) * 100, 1),
                "vacancies_with_salary_count": with_salary,
                "vacancies_with_salary_percentage": round((with_salary / max(1, total_vacancies)) * 100, 1),
                "vacancies_with_location_count": with_location,
                "average_data_quality_score": avg_q,
                "data_source": "Jobsearch.az Açıq Vakansiya Bazası",
                "disclaimer": "Analitika hazırda toplanmış Jobsearch.az vakansiya datasına əsaslanır."
            }

    def get_skills_analytics(self, category: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM jobs")
            total_jobs = cur.fetchone()[0] or 1

            query = """
                SELECT s.id, s.canonical_name, s.category, s.weight_factor,
                       COUNT(js.job_id) as demand_count,
                       SUM(CASE WHEN js.importance = 'required' OR js.importance >= 1.0 THEN 1 ELSE 0 END) as required_count,
                       SUM(CASE WHEN js.importance = 'preferred' OR (js.importance < 1.0 AND js.importance > 0) THEN 1 ELSE 0 END) as preferred_count
                FROM skills s
                LEFT JOIN job_skills js ON s.id = js.skill_id
            """
            params = []
            if category:
                query += " WHERE s.category = ?"
                params.append(category)

            query += " GROUP BY s.id ORDER BY demand_count DESC LIMIT ?"
            params.append(limit)

            cur.execute(query, params)
            
            skills_stats = []
            for r in cur.fetchall():
                cnt = r["demand_count"] or 0
                pct = round((cnt / total_jobs) * 100, 1)
                skills_stats.append({
                    "skill": r["canonical_name"],
                    "id": r["id"],
                    "canonical_name": r["canonical_name"],
                    "category": r["category"],
                    "demand_count": cnt,
                    "demand_percentage": pct,
                    "required_count": r["required_count"] or 0,
                    "preferred_count": r["preferred_count"] or 0,
                    "market_weight": round(r["weight_factor"] * (1 + (pct / 100)), 2)
                })

            return {
                "total_jobs_analyzed": total_jobs,
                "disclaimer": "Analitika hazırda toplanmış Jobsearch.az vakansiya datasına əsaslanır.",
                "skills": skills_stats
            }

    def get_sectors_analytics(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM jobs")
            total_jobs = cur.fetchone()[0] or 1

            cur.execute("""
                SELECT sector, COUNT(*) as count,
                       AVG(CASE WHEN salary_min > 0 THEN salary_min ELSE NULL END) as avg_min_salary,
                       AVG(CASE WHEN salary_max > 0 THEN salary_max ELSE NULL END) as avg_max_salary
                FROM jobs
                GROUP BY sector
                ORDER BY count DESC
            """)
            sectors = []
            for r in cur.fetchall():
                cnt = r["count"]
                avg_min = round(r["avg_min_salary"]) if r["avg_min_salary"] else 0
                avg_max = round(r["avg_max_salary"]) if r["avg_max_salary"] else 0
                sectors.append({
                    "sector": r["sector"],
                    "vacancy_count": cnt,
                    "count": cnt,
                    "share": round((cnt / total_jobs) * 100, 1),
                    "avg_salary_min": avg_min,
                    "avg_salary_max": avg_max,
                    "avg_salary_display": f"{avg_min} - {avg_max} AZN" if avg_min and avg_max else "Razılaşma yolu ilə"
                })
            return sectors

    def get_languages_analytics(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM jobs")
            total_jobs = cur.fetchone()[0] or 1

            cur.execute("""
                SELECT s.canonical_name as language, COUNT(js.job_id) as count
                FROM skills s
                JOIN job_skills js ON s.id = js.skill_id
                WHERE s.category = 'language'
                GROUP BY s.id
                ORDER BY count DESC
            """)
            langs = []
            for r in cur.fetchall():
                cnt = r["count"]
                langs.append({
                    "language": r["language"],
                    "count": cnt,
                    "percentage": round((cnt / total_jobs) * 100, 1)
                })
            return langs

    def get_experience_analytics(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM jobs")
            total_jobs = cur.fetchone()[0] or 1

            cur.execute("""
                SELECT experience, COUNT(*) as count
                FROM jobs
                GROUP BY experience
                ORDER BY count DESC
            """)
            exp_list = []
            for r in cur.fetchall():
                cnt = r["count"]
                exp_list.append({
                    "level": r["experience"] or "Qeyd olunmayıb",
                    "count": cnt,
                    "percentage": round((cnt / total_jobs) * 100, 1)
                })
            return exp_list

    def get_salary_analytics(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM jobs")
            total_jobs = cur.fetchone()[0] or 1

            cur.execute("""
                SELECT salary_min, salary_max
                FROM jobs
                WHERE salary_min > 0 OR salary_max > 0
            """)
            salaries = []
            for r in cur.fetchall():
                s_min = r["salary_min"] or 0
                s_max = r["salary_max"] or s_min
                if s_min > 0 or s_max > 0:
                    salaries.append((s_min + s_max) / 2.0)

            if salaries:
                min_s = int(min(salaries))
                max_s = int(max(salaries))
                avg_s = int(sum(salaries) / len(salaries))
                sorted_s = sorted(salaries)
                median_s = int(sorted_s[len(sorted_s) // 2])

                r1 = len([s for s in salaries if s < 600])
                r2 = len([s for s in salaries if 600 <= s <= 1000])
                r3 = len([s for s in salaries if 1000 < s <= 2000])
                r4 = len([s for s in salaries if s > 2000])
                ranges = [
                    {"range": "< 600 AZN", "count": r1, "percentage": round((r1 / len(salaries)) * 100, 1)},
                    {"range": "600 - 1000 AZN", "count": r2, "percentage": round((r2 / len(salaries)) * 100, 1)},
                    {"range": "1000 - 2000 AZN", "count": r3, "percentage": round((r3 / len(salaries)) * 100, 1)},
                    {"range": "2000+ AZN", "count": r4, "percentage": round((r4 / len(salaries)) * 100, 1)}
                ]
            else:
                min_s = max_s = avg_s = median_s = 0
                ranges = []

            return {
                "vacancies_with_salary_count": len(salaries),
                "percentage_with_salary": round((len(salaries) / total_jobs) * 100, 1),
                "min_salary": min_s,
                "max_salary": max_s,
                "avg_salary": avg_s,
                "median_salary": median_s,
                "currency": "AZN",
                "salary_ranges": ranges,
                "disclaimer": "Analitika yalnız əməkhaqqı rəqəmsal göstərilən elanlar üzrə hesablanmışdır."
            }

    def get_locations_analytics(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT location, COUNT(*) as count,
                       AVG(CASE WHEN salary_min > 0 THEN salary_min ELSE NULL END) as avg_salary
                FROM jobs
                GROUP BY location
                ORDER BY count DESC
            """)
            locs = []
            for r in cur.fetchall():
                cnt = r["count"]
                avg_s = f"{round(r['avg_salary'])} AZN" if r["avg_salary"] else "Məlumat mövcud deyil"
                locs.append({
                    "name": r["location"] or "Qeyd olunmayıb",
                    "vacancies_count": cnt,
                    "avg_salary": avg_s
                })
            return locs

    def save_student_profile(self, profile: Dict[str, Any], skills: Dict[str, int]) -> Dict[str, Any]:
        student_id = profile.get("id", "demo_student_01")
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT OR REPLACE INTO student_profiles (
                    id, name, university, degree, field, target_role, english_level, experience, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                student_id,
                profile.get("name", "Nurlan Əliyev"),
                profile.get("university", "UNEC"),
                profile.get("degree", "Bakalavr"),
                profile.get("field", "Maliyyə və Rəqəmsal İqtisadiyyat"),
                profile.get("target_role", "data_analyst"),
                profile.get("english_level", "B2"),
                profile.get("experience", "0-1 il")
            ))

            cur.execute("DELETE FROM student_skills WHERE student_id = ?", (student_id,))
            for skill_id, lvl in skills.items():
                cur.execute("""
                    INSERT INTO student_skills (student_id, skill_id, level)
                    VALUES (?, ?, ?)
                """, (student_id, skill_id, max(0, min(100, int(lvl)))))

            conn.commit()

        return {"status": "success", "student_id": student_id}

    def get_student_profile(self, student_id: str = "demo_student_01") -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM student_profiles WHERE id = ?", (student_id,))
            p_row = cur.fetchone()
            if not p_row:
                return None

            profile = dict(p_row)
            cur.execute("SELECT skill_id, level FROM student_skills WHERE student_id = ?", (student_id,))
            profile["skills"] = {r["skill_id"]: r["level"] for r in cur.fetchall()}
            return profile

    # ----------------------------------------------------
    # GOOGLE FORMS STUDENT SURVEY DATA REPOSITORY
    # ----------------------------------------------------

    def save_survey_responses(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Saves parsed student survey responses from Google Forms / Sheets into SQLite."""
        if not responses:
            return {"imported_count": 0, "skipped_count": 0}

        imported = 0
        skipped = 0

        with self.get_connection() as conn:
            cur = conn.cursor()
            for r in responses:
                resp_id = r.get("respondent_id")
                # Check duplicate
                cur.execute("SELECT id FROM student_survey_responses WHERE respondent_id = ?", (resp_id,))
                if cur.fetchone():
                    skipped += 1
                    continue

                cur.execute("""
                    INSERT INTO student_survey_responses (
                        respondent_id, university, field_of_study, field_normalized, education_level,
                        age_group, employment_status, work_experience, work_experience_years,
                        job_search_status, target_sector, target_role, english_level, russian_level,
                        digital_skill_level, skills_json, soft_skill_scores, career_alignment_score,
                        source, is_demo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    resp_id,
                    r.get("university", "Qeyd olunmayıb"),
                    r.get("field_of_study", "Qeyd olunmayıb"),
                    r.get("field_normalized", "Other"),
                    r.get("education_level", "Bakalavr"),
                    r.get("age_group", "18-22"),
                    r.get("employment_status", "İşləmir"),
                    r.get("work_experience", "Təcrübəsiz (0 il)"),
                    r.get("work_experience_years", 0.0),
                    r.get("job_search_status", "Aktiv iş axtarır"),
                    r.get("target_sector", "Digər"),
                    r.get("target_role", "Digər"),
                    r.get("english_level", "B1"),
                    r.get("russian_level", "A2"),
                    r.get("digital_skill_level", "Orta"),
                    r.get("skills_json_str", json.dumps(r.get("skills_json", {}), ensure_ascii=False)),
                    r.get("soft_skill_scores_str", json.dumps(r.get("soft_skill_scores", {}), ensure_ascii=False)),
                    r.get("career_alignment_score", 0.0),
                    r.get("source", "google_forms"),
                    r.get("is_demo", 0)
                ))
                imported += 1
            conn.commit()

        return {
            "status": "success",
            "imported_count": imported,
            "skipped_count": skipped,
            "total_survey_responses": self.get_total_survey_responses_count()
        }

    def get_total_survey_responses_count(self) -> int:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM student_survey_responses")
            return cur.fetchone()[0]

    def get_student_survey_stats(self, university: Optional[str] = None) -> Dict[str, Any]:
        """Calculates general statistical distributions over student survey respondents."""
        with self.get_connection() as conn:
            cur = conn.cursor()
            where_sql = "WHERE LOWER(university) = LOWER(?)" if university else ""
            params = (university,) if university else ()

            cur.execute(f"SELECT COUNT(*) FROM student_survey_responses {where_sql}", params)
            total = cur.fetchone()[0]

            if total == 0:
                return {
                    "total_respondents": 0,
                    "status": "No survey responses found",
                    "employment_status_distribution": [],
                    "job_search_distribution": [],
                    "education_level_distribution": [],
                    "english_level_distribution": [],
                    "digital_skill_distribution": []
                }

            # Employment Status
            cur.execute(f"""
                SELECT employment_status, COUNT(*) as count
                FROM student_survey_responses {where_sql}
                GROUP BY employment_status ORDER BY count DESC
            """, params)
            emp_dist = [{"status": r["employment_status"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            # Job Search Status
            cur.execute(f"""
                SELECT job_search_status, COUNT(*) as count
                FROM student_survey_responses {where_sql}
                GROUP BY job_search_status ORDER BY count DESC
            """, params)
            search_dist = [{"status": r["job_search_status"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            # Education Level
            cur.execute(f"""
                SELECT education_level, COUNT(*) as count
                FROM student_survey_responses {where_sql}
                GROUP BY education_level ORDER BY count DESC
            """, params)
            edu_dist = [{"level": r["education_level"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            # English Level
            cur.execute(f"""
                SELECT english_level, COUNT(*) as count
                FROM student_survey_responses {where_sql}
                GROUP BY english_level ORDER BY count DESC
            """, params)
            eng_dist = [{"level": r["english_level"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            # Digital Skill Level
            cur.execute(f"""
                SELECT digital_skill_level, COUNT(*) as count
                FROM student_survey_responses {where_sql}
                GROUP BY digital_skill_level ORDER BY count DESC
            """, params)
            dig_dist = [{"level": r["digital_skill_level"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            return {
                "total_respondents": total,
                "university_filter": university or "Bütün Universitetlər",
                "employment_status_distribution": emp_dist,
                "job_search_distribution": search_dist,
                "education_level_distribution": edu_dist,
                "english_level_distribution": eng_dist,
                "digital_skill_distribution": dig_dist
            }

    def get_student_survey_skills(self, university: Optional[str] = None) -> Dict[str, Any]:
        """Aggregates surveyed skills ratings (1-5) across respondents."""
        with self.get_connection() as conn:
            cur = conn.cursor()
            where_sql = "WHERE LOWER(university) = LOWER(?)" if university else ""
            params = (university,) if university else ()

            cur.execute(f"SELECT skills_json FROM student_survey_responses {where_sql}", params)
            rows = cur.fetchall()
            total_resp = len(rows)

            if total_resp == 0:
                return {"total_respondents": 0, "skills": []}

            skill_totals = {}
            skill_competent_counts = {}  # rating >= 3 (Intermediate or higher)

            for r in rows:
                raw_json = r["skills_json"]
                try:
                    s_dict = json.loads(raw_json) if raw_json else {}
                except Exception:
                    s_dict = {}

                for s_id, rating in s_dict.items():
                    r_val = float(rating)
                    if s_id not in skill_totals:
                        skill_totals[s_id] = []
                        skill_competent_counts[s_id] = 0
                    skill_totals[s_id].append(r_val)
                    if r_val >= 3:
                        skill_competent_counts[s_id] += 1

            skills_summary = []
            for s_id, ratings in skill_totals.items():
                avg_lvl = sum(ratings) / len(ratings) if ratings else 0.0
                comp_cnt = skill_competent_counts.get(s_id, 0)
                avail_pct = round((comp_cnt / total_resp) * 100, 1)
                skills_summary.append({
                    "skill_id": s_id,
                    "canonical_name": s_id.replace("_", " ").title(),
                    "respondents_evaluated": len(ratings),
                    "competent_count": comp_cnt,
                    "availability_percentage": avail_pct,
                    "avg_level": round(avg_lvl, 2)
                })

            skills_summary.sort(key=lambda x: x["availability_percentage"], reverse=True)
            return {
                "total_respondents": total_resp,
                "university_filter": university or "Bütün Universitetlər",
                "skills": skills_summary
            }

    def get_student_survey_universities(self) -> List[Dict[str, Any]]:
        """Returns respondent counts and proportions grouped by university."""
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM student_survey_responses")
            total = cur.fetchone()[0]
            if total == 0:
                return []

            cur.execute("""
                SELECT university, COUNT(*) as count,
                       AVG(work_experience_years) as avg_exp
                FROM student_survey_responses
                GROUP BY university
                ORDER BY count DESC
            """)
            unis = []
            for r in cur.fetchall():
                unis.append({
                    "university": r["university"],
                    "respondent_count": r["count"],
                    "share_percentage": round((r["count"] / total) * 100, 1),
                    "avg_experience_years": round(r["avg_exp"] or 0, 1),
                    "is_statistically_sufficient": r["count"] >= 30
                })
            return unis

    def get_student_survey_fields(self) -> Dict[str, Any]:
        """Returns field of study distribution (both normalized 11 buckets and raw)."""
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM student_survey_responses")
            total = cur.fetchone()[0]
            if total == 0:
                return {"total_respondents": 0, "normalized_fields": [], "raw_fields": []}

            # Normalized buckets
            cur.execute("""
                SELECT field_normalized, COUNT(*) as count
                FROM student_survey_responses
                GROUP BY field_normalized
                ORDER BY count DESC
            """)
            norm_fields = [{"field": r["field_normalized"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            # Raw fields
            cur.execute("""
                SELECT field_of_study, field_normalized, COUNT(*) as count
                FROM student_survey_responses
                GROUP BY field_of_study
                ORDER BY count DESC
                LIMIT 20
            """)
            raw_fields = [{"field": r["field_of_study"], "normalized": r["field_normalized"], "count": r["count"]} for r in cur.fetchall()]

            return {
                "total_respondents": total,
                "normalized_fields": norm_fields,
                "top_raw_fields": raw_fields
            }

    def get_student_survey_career_goals(self) -> Dict[str, Any]:
        """Returns target sectors and target roles desired by students."""
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM student_survey_responses")
            total = cur.fetchone()[0]
            if total == 0:
                return {"total_respondents": 0, "target_sectors": [], "target_roles": []}

            cur.execute("""
                SELECT target_sector, COUNT(*) as count
                FROM student_survey_responses
                GROUP BY target_sector
                ORDER BY count DESC
            """)
            sectors = [{"sector": r["target_sector"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            cur.execute("""
                SELECT target_role, COUNT(*) as count
                FROM student_survey_responses
                GROUP BY target_role
                ORDER BY count DESC
                LIMIT 15
            """)
            roles = [{"role": r["target_role"], "count": r["count"], "percentage": round((r["count"] / total) * 100, 1)} for r in cur.fetchall()]

            return {
                "total_respondents": total,
                "target_sectors": sectors,
                "target_roles": roles
            }

    def export_survey_analytics_csv(self, university: Optional[str] = None) -> str:
        """Generates an anonymous analytical CSV report without PII."""
        with self.get_connection() as conn:
            cur = conn.cursor()
            where_sql = "WHERE LOWER(university) = LOWER(?)" if university else ""
            params = (university,) if university else ()

            cur.execute(f"""
                SELECT respondent_id, university, field_normalized, education_level,
                       employment_status, work_experience, english_level, digital_skill_level,
                       target_sector, target_role, submitted_at
                FROM student_survey_responses {where_sql}
                ORDER BY id ASC
            """, params)
            rows = cur.fetchall()

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                "Respondent ID", "Universitet", "İxtisas Qrupu", "Təhsil Səviyyəsi",
                "Məşğulluq Statusu", "İş Təcrübəsi", "İngilis Dili", "Rəqəmsal Bacarıq",
                "Hədəf Sektor", "Hədəf Vəzifə", "Tarix"
            ])
            for r in rows:
                writer.writerow([
                    r["respondent_id"], r["university"], r["field_normalized"], r["education_level"],
                    r["employment_status"], r["work_experience"], r["english_level"], r["digital_skill_level"],
                    r["target_sector"], r["target_role"], r["submitted_at"]
                ])
            return output.getvalue()

