"""
SkillMap Azerbaijan - Backend Automated Test Suite
Tests Database, NLP Normalizer, Adapters, Skill Gap Engine, and API Routes.
"""

import sys
import unittest
import json
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.nlp.normalizer import SkillNormalizer
from backend.nlp.extractor import NLPExtractor
from backend.adapters.jobsearch_adapter import JobsearchAdapter
from backend.db.database import DatabaseManager
from backend.engines.skill_gap import SkillGapEngine
from backend.engines.recommendation import RecommendationEngine
from backend.api.routes import ApiHandler


class TestSkillMapBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create test DB in memory
        cls.db = DatabaseManager(":memory:")
        json_path = root_dir / "data.json.json"
        if not json_path.exists():
            json_path = root_dir / "data.json"
        cls.db.seed_jobs_from_file(str(json_path))
        cls.api = ApiHandler(cls.db)

    def test_01_skill_normalizer(self):
        """Test skill normalization variations."""
        norm = SkillNormalizer()
        self.assertEqual(norm.get_canonical_name("MS Excel"), "Excel")
        self.assertEqual(norm.get_canonical_name("Microsoft Excel"), "Excel")
        self.assertEqual(norm.get_canonical_name("vlookup"), "Excel")
        self.assertEqual(norm.get_canonical_name("PostgreSQL"), "SQL")
        self.assertEqual(norm.get_canonical_name("powerbi"), "Power BI")
        self.assertEqual(norm.get_canonical_name("python3"), "Python")
        self.assertEqual(norm.get_canonical_name("1C Mühasibat"), "1C")

    def test_02_nlp_extractor(self):
        """Test extraction from vacancy descriptions."""
        extractor = NLPExtractor()
        sample_text = "Namizəddən güclü Excel, SQL və Power BI bilikləri, həmçinin İngilis dili C1 və 2 il iş təcrübəsi tələb olunur."
        res = extractor.extract_all(sample_text)
        
        tech_names = [t["canonical_name"] for t in res["technical"]]
        self.assertIn("Excel", tech_names)
        self.assertIn("SQL", tech_names)
        self.assertIn("Power BI", tech_names)
        self.assertIn("2 il", res["experience"])
        self.assertTrue(len(res["languages"]) > 0)

    def test_03_database_queries(self):
        """Test database jobs query and analytics."""
        jobs_res = self.db.get_jobs(limit=10)
        self.assertGreater(jobs_res["total"], 0)
        self.assertEqual(len(jobs_res["jobs"]), min(10, jobs_res["total"]))

        skills_analytics = self.db.get_skills_analytics()
        self.assertIn("skills", skills_analytics)
        self.assertGreater(len(skills_analytics["skills"]), 0)

        sectors_analytics = self.db.get_sectors_analytics()
        self.assertGreater(len(sectors_analytics), 0)

    def test_04_skill_gap_engine(self):
        """Test mathematical skill gap and match score."""
        gap_engine = SkillGapEngine(self.db)
        student_skills = {
            "sql": 70,
            "excel": 80,
            "powerbi": 40,
            "python": 30,
            "analytical_thinking": 85,
            "english": 75,
            "communication": 70
        }
        res = gap_engine.calculate_gap_analysis("data_analyst", student_skills)
        self.assertGreater(res["match_score"], 50)
        self.assertLessEqual(res["match_score"], 100)
        self.assertIn("breakdown", res)
        
        # Verify Gap = max(0, Required - Level)
        for b in res["breakdown"]:
            expected_gap = max(0, b["required_level"] - b["user_level"])
            self.assertEqual(b["gap"], expected_gap)

    def test_05_recommendation_engine(self):
        """Test prioritization of missing skills."""
        gap_engine = SkillGapEngine(self.db)
        rec_engine = RecommendationEngine(gap_engine)
        student_skills = {"sql": 20, "excel": 80, "powerbi": 10}
        rec = rec_engine.generate_recommendations("data_analyst", student_skills)
        
        self.assertIn("prioritized_gaps", rec)
        self.assertIn("action_plan", rec)
        self.assertGreater(len(rec["prioritized_gaps"]), 0)
        # Power BI and SQL should be high priority gaps
        top_skill_ids = [g["skill_id"] for g in rec["top_3_priorities"]]
        self.assertTrue("sql" in top_skill_ids or "powerbi" in top_skill_ids)

    def test_06_api_endpoints(self):
        """Test REST API handlers for all required endpoints."""
        # GET /api/jobs
        status, data = self.api.handle_request("GET", "/api/jobs?limit=5")
        self.assertEqual(status, 200)
        self.assertIn("jobs", data)

        # GET /api/skills
        status, data = self.api.handle_request("GET", "/api/skills")
        self.assertEqual(status, 200)
        self.assertIn("skills", data)

        # GET /api/analytics/skills
        status, data = self.api.handle_request("GET", "/api/analytics/skills")
        self.assertEqual(status, 200)
        self.assertIn("skills", data)

        # POST /api/student/skill-gap
        status, data = self.api.handle_request("POST", "/api/student/skill-gap", {
            "role_id": "data_analyst",
            "skills": {"sql": 80, "excel": 90}
        })
        self.assertEqual(status, 200)
        self.assertIn("match_score", data)

        # POST /api/nlp/extract-skills
        status, data = self.api.handle_request("POST", "/api/nlp/extract-skills", {
            "text": "Requires Python, Django, PostgreSQL, Docker and English B2"
        })
        self.assertEqual(status, 200)
        tech_skills = [t["canonical_name"] for t in data["technical"]]
        self.assertIn("Python", tech_skills)
        self.assertIn("SQL", tech_skills)


if __name__ == "__main__":
    unittest.main()