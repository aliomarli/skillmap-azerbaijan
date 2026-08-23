"""
SkillMap Azerbaijan - API Route Handlers
Implements all required REST API endpoints for jobs, skills, analytics, student profile, and NLP.
"""

import json
from typing import Dict, Any, Tuple, Optional
from urllib.parse import urlparse, parse_qs
from ..db.database import DatabaseManager
from ..nlp.extractor import NLPExtractor
from ..engines.skill_gap import SkillGapEngine
from ..engines.recommendation import RecommendationEngine
from ..engines.survey_importer import SurveyImporter
from ..engines.market_vs_student import MarketVsStudentEngine


class ApiHandler:
    def __init__(self, db: DatabaseManager):
        self.db = db
        self.nlp = NLPExtractor()
        self.gap_engine = SkillGapEngine(self.db)
        self.rec_engine = RecommendationEngine(self.gap_engine)
        self.importer = SurveyImporter()
        self.market_vs_student = MarketVsStudentEngine(self.db)

    def handle_request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Tuple[int, Dict[str, Any]]:
        parsed_url = urlparse(path)
        clean_path = parsed_url.path.rstrip("/")
        query_params = parse_qs(parsed_url.query)

        def get_param(name: str, default: str = "") -> str:
            return query_params.get(name, [default])[0]

        if clean_path == "/api/health" or clean_path == "/api":
            return 200, {
                "status": "healthy",
                "service": "SkillMap Azerbaijan Backend API",
                "version": "v1.0-pilot",
                "timestamp": "2026-08-21"
            }

        if method == "GET" and clean_path == "/api/jobs":
            limit = int(get_param("limit", "50"))
            offset = int(get_param("offset", "0"))
            sector = get_param("sector", "")
            location = get_param("location", "")
            search = get_param("search", "")
            jobs = self.db.get_jobs(limit=limit, offset=offset, sector=sector, location=location, search=search)
            total = self.db.get_total_jobs_count()
            return 200, {"total": total, "count": len(jobs), "jobs": jobs}

        if method == "GET" and clean_path.startswith("/api/jobs/"):
            job_id = clean_path.split("/")[-1]
            job = self.db.get_job_by_id(job_id)
            if job:
                return 200, job
            return 404, {"error": "Vakansiya tapılmadı", "job_id": job_id}

        if method == "GET" and clean_path == "/api/skills":
            category = get_param("category", "")
            skills = self.db.get_skills(category=category)
            return 200, {"count": len(skills), "skills": skills}

        # --- ANALYTICS ENDPOINTS ---
        if method == "GET" and clean_path == "/api/analytics/overview":
            overview = self.db.get_overview_analytics()
            return 200, overview

        if method == "GET" and clean_path == "/api/analytics/skills":
            category = get_param("category", "")
            limit = int(get_param("limit", "20"))
            skills_analytics = self.db.get_skills_analytics(category=category, limit=limit)
            return 200, skills_analytics

        if method == "GET" and clean_path == "/api/analytics/sectors":
            sectors = self.db.get_sectors_analytics()
            return 200, {"total_sectors": len(sectors), "sectors": sectors}

        if method == "GET" and clean_path == "/api/analytics/languages":
            languages = self.db.get_languages_analytics()
            return 200, languages

        if method == "GET" and clean_path == "/api/analytics/experience":
            exp = self.db.get_experience_analytics()
            return 200, exp

        if method == "GET" and clean_path == "/api/analytics/salary":
            salary = self.db.get_salary_analytics()
            return 200, salary

        if method == "GET" and clean_path == "/api/analytics/locations":
            locations = self.db.get_locations_analytics()
            return 200, {"total_locations": len(locations), "locations": locations}

        if method == "GET" and clean_path == "/api/analytics/skills/gaps":
            gaps_analytics = self.db.get_skill_gaps_analytics()
            return 200, gaps_analytics

        # --- GOOGLE FORMS STUDENT SURVEY & IMPORT ENDPOINTS ---
        if method == "POST" and clean_path == "/api/student/import":
            if not body:
                return 400, {"error": "JSON body tələb olunur (csv_text və ya records)"}
            csv_text = body.get("csv_text", "")
            custom_mapping = body.get("custom_mapping", None)
            is_demo = bool(body.get("is_demo", False))

            if csv_text:
                parsed_records, import_stats = self.importer.parse_csv_content(
                    csv_text=csv_text,
                    custom_mapping=custom_mapping,
                    source=body.get("source", "google_forms"),
                    is_demo=is_demo
                )
                save_res = self.db.save_survey_responses(parsed_records)
                return 200, {
                    "status": "success",
                    "parse_stats": import_stats,
                    "db_result": save_res
                }
            elif "records" in body:
                save_res = self.db.save_survey_responses(body["records"])
                return 200, save_res
            return 400, {"error": "'csv_text' və ya 'records' sahəsi tələb olunur"}

        if method == "GET" and clean_path == "/api/student/stats":
            university = get_param("university", "")
            stats = self.db.get_student_survey_stats(university=university if university else None)
            return 200, stats

        if method == "GET" and clean_path == "/api/student/skills":
            university = get_param("university", "")
            skills_res = self.db.get_student_survey_skills(university=university if university else None)
            return 200, skills_res

        if method == "GET" and clean_path == "/api/student/universities":
            unis = self.db.get_student_survey_universities()
            return 200, {"total_universities": len(unis), "universities": unis}

        if method == "GET" and clean_path == "/api/student/fields":
            fields_data = self.db.get_student_survey_fields()
            return 200, fields_data

        if method == "GET" and clean_path == "/api/student/career-goals":
            goals_data = self.db.get_student_survey_career_goals()
            return 200, goals_data

        if method == "GET" and clean_path == "/api/student/export":
            university = get_param("university", "")
            csv_str = self.db.export_survey_analytics_csv(university=university if university else None)
            return 200, {"csv_data": csv_str, "filename": f"skillmap_student_survey_export_{university or 'all'}.csv"}

        # --- MARKET VS STUDENT COMPARISON ENDPOINTS ---
        if method == "GET" and clean_path == "/api/analytics/market-vs-student":
            university = get_param("university", "")
            min_threshold = int(get_param("min_threshold", "30"))
            comparison = self.market_vs_student.compare_market_vs_students(
                university=university if university else None,
                min_threshold=min_threshold
            )
            return 200, comparison

        if method == "GET" and clean_path.startswith("/api/analytics/university/"):
            uni_id = clean_path.split("/")[-1]
            min_threshold = int(get_param("min_threshold", "30"))
            comparison = self.market_vs_student.compare_market_vs_students(
                university=uni_id,
                min_threshold=min_threshold
            )
            return 200, comparison

        # --- INDIVIDUAL STUDENT & ROLE BENCHMARK ENDPOINTS ---
        if method == "POST" and clean_path == "/api/student/profile":
            if not body:
                return 400, {"error": "JSON body tələb olunur"}
            profile_data = body.get("profile", body)
            skills_data = body.get("skills", profile_data.get("skills", {}))
            res = self.db.save_student_profile(profile_data, skills_data)
            return 200, res

        if method == "GET" and clean_path.startswith("/api/student/profile/"):
            student_id = clean_path.split("/")[-1]
            profile = self.db.get_student_profile(student_id)
            if profile:
                return 200, profile
            return 404, {"error": "Tələbə profili tapılmadı", "student_id": student_id}

        if method == "POST" and clean_path == "/api/student/skill-gap":
            if not body:
                return 400, {"error": "JSON body tələb olunur"}
            role_id = body.get("role_id", body.get("target_role", "data_analyst"))
            profile = body.get("profile", body)
            gap_res = self.gap_engine.calculate_gap_analysis(role_id, profile)
            return 200, gap_res

        if method == "GET" and clean_path.startswith("/api/student/recommendations/"):
            student_id = clean_path.split("/")[-1]
            role_id = get_param("role_id", "")
            profile = self.db.get_student_profile(student_id)
            if not profile:
                return 404, {"error": "Tələbə profili tapılmadı", "student_id": student_id}
            target_role = role_id if role_id else profile.get("target_role", "data_analyst")
            gap_res = self.gap_engine.calculate_gap_analysis(target_role, profile)
            return 200, {
                "student_id": student_id,
                "target_role": target_role,
                "recommendations": gap_res.get("top_development_priorities", []),
                "alternative_careers": gap_res.get("alternative_careers", []),
                "salary_projection": gap_res.get("salary_projection", {})
            }

        if method == "GET" and clean_path == "/api/roles/benchmarks":
            benchmarks = self.gap_engine.get_all_benchmarks()
            return 200, benchmarks

        if method == "GET" and clean_path.startswith("/api/roles/") and clean_path.endswith("/skills"):
            parts = clean_path.split("/")
            role_id = parts[3]
            role_info = self.gap_engine.get_role_benchmark(role_id)
            if not role_info or role_info.get("status") == "Insufficient market data":
                return 200, {"role_id": role_id, "status": "Insufficient market data", "skills": []}
            return 200, {
                "role_id": role_id,
                "role_title": role_info["title"],
                "status": role_info["status"],
                "sample_vacancies": role_info["sample_vacancies_count"],
                "skills": role_info["skills_benchmark"]
            }

        if method == "POST" and clean_path == "/api/nlp/extract-skills":
            if not body or "text" not in body:
                return 400, {"error": "'text' sahəsi daxil edilməlidir"}
            extracted = self.nlp.extract_all(body["text"])
            return 200, extracted

        return 404, {"error": "Endpoint tapılmadı", "path": clean_path}
