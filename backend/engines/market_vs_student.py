"""
SkillMap Azerbaijan - Market Demand vs Student Skills Availability Engine
Compares real Labour Market Demand (420 vacancies) with Student Survey Skill Availability.
Supports University-level filtering and threshold checks (default threshold = 30 respondents).
"""

import json
from typing import Dict, Any, List, Optional
from ..db.database import DatabaseManager


class MarketVsStudentEngine:
    def __init__(self, db: Optional[DatabaseManager] = None):
        self.db = db or DatabaseManager()

    def get_market_demand_map(self) -> Dict[str, Dict[str, Any]]:
        """
        Retrieves normalized skill demand percentages from Jobsearch.az vacancies in DB.
        """
        skills_analytics = self.db.get_skills_analytics()
        skills_list = skills_analytics.get("skills", [])
        
        demand_map = {}
        for s in skills_list:
            s_id = s.get("id", "").lower()
            demand_map[s_id] = {
                "skill_id": s_id,
                "canonical_name": s.get("canonical_name", s_id.title()),
                "category": s.get("category", "technical"),
                "demand_count": s.get("demand_count", 0),
                "demand_percentage": s.get("demand_percentage", 0.0),
                "required_count": s.get("required_count", 0),
                "preferred_count": s.get("preferred_count", 0)
            }
        return demand_map

    def get_student_skills_availability(self, university: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates skill availability percentages (respondents with level >= 3: Intermediate+)
        and average skill ratings (1-5) from survey responses.
        """
        stats = self.db.get_student_survey_skills(university=university)
        return stats

    def compare_market_vs_students(
        self,
        university: Optional[str] = None,
        min_threshold: int = 30
    ) -> Dict[str, Any]:
        """
        Computes side-by-side gap metrics between Labour Market Demand and Student Availability.
        """
        survey_stats = self.db.get_student_survey_stats(university=university)
        total_respondents = survey_stats.get("total_respondents", 0)
        is_sufficient = total_respondents >= min_threshold

        market_demand = self.get_market_demand_map()
        student_skills = self.get_student_skills_availability(university=university)
        student_skill_map = {s["skill_id"]: s for s in student_skills.get("skills", [])}

        comparison_list = []

        # Key skills to evaluate
        core_skills = [
            ("communication", "Communication", "soft"),
            ("time_management", "Time Management", "soft"),
            ("analytical_thinking", "Analytical Thinking", "soft"),
            ("excel", "Excel", "technical"),
            ("sales", "Sales", "business"),
            ("russian", "Russian", "language"),
            ("english", "English", "language"),
            ("teamwork", "Teamwork", "soft"),
            ("accounting_1c", "1C", "technical"),
            ("procurement", "Procurement & Supply Chain", "business"),
            ("accounting", "Accounting", "business"),
            ("marketing", "Marketing", "business"),
            ("hr_management", "HR Management", "business"),
            ("autocad", "AutoCAD", "technical"),
            ("sql", "SQL", "technical"),
            ("powerbi", "Power BI", "technical"),
            ("python", "Python", "technical"),
            ("javascript", "JavaScript", "technical")
        ]

        for s_id, s_name, s_cat in core_skills:
            m_info = market_demand.get(s_id, {
                "demand_percentage": 0.0,
                "demand_count": 0
            })
            st_info = student_skill_map.get(s_id, {
                "availability_percentage": 0.0,
                "avg_level": 1.0,
                "competent_count": 0
            })

            m_pct = m_info["demand_percentage"]
            st_pct = st_info.get("availability_percentage", 0.0)
            avg_lvl = st_info.get("avg_level", 1.0)

            # Gap = Market Demand % - Student Availability %
            gap_pct = round(m_pct - st_pct, 1)

            if not is_sufficient:
                supply_status = "Kifayət qədər data yoxdur"
                status_code = "insufficient_data"
            elif gap_pct > 15.0:
                supply_status = "Undersupplied (Kritik Çatışmazlıq)"
                status_code = "undersupplied"
            elif gap_pct >= -10.0:
                supply_status = "Balanced (Balanslaşdırılmış)"
                status_code = "balanced"
            else:
                supply_status = "Oversupplied (Təklif Tələbi Üstələyir)"
                status_code = "oversupplied"

            comparison_list.append({
                "skill_id": s_id,
                "skill_name": s_name,
                "category": s_cat,
                "market_demand_percentage": m_pct,
                "student_availability_percentage": st_pct,
                "student_avg_level": round(avg_lvl, 1),
                "gap_percentage": gap_pct,
                "supply_status": supply_status,
                "status_code": status_code
            })

        # Sort by gap descending (most critically undersupplied first)
        comparison_list.sort(key=lambda x: x["gap_percentage"], reverse=True)

        return {
            "university_filter": university or "Bütün Universitetlər",
            "sample_size_respondents": total_respondents,
            "min_threshold": min_threshold,
            "is_sufficient_sample": is_sufficient,
            "status": "Sufficient Data" if is_sufficient else "Insufficient data",
            "disclaimer": "Analitika Jobsearch.az vakansiyaları (n=420) və Google Forms tələbə sorğu bazasına əsaslanır." if is_sufficient else f"⚠️ Statistik nümunə kifayət deyil: Minimum {min_threshold} respondent tələb olunur (Hazırda: {total_respondents} respondent).",
            "market_sample_size": 420,
            "comparison": comparison_list,
            "top_undersupplied_skills": [s for s in comparison_list if s["status_code"] == "undersupplied"][:5],
            "top_balanced_skills": [s for s in comparison_list if s["status_code"] == "balanced"][:5],
            "top_oversupplied_skills": [s for s in comparison_list if s["status_code"] == "oversupplied"][:5]
        }
