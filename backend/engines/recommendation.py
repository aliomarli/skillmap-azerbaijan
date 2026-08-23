"""
SkillMap Azerbaijan - Recommendation Engine
Ranks skill gaps by priority (High / Medium / Low) and provides tailored educational sprints.
"""

from typing import Dict, Any, List
from .skill_gap import SkillGapEngine, ROLE_BENCHMARKS


RECOMMENDED_RESOURCES = {
    "sql": {"title": "SQL & PostgreSQL Masterclass", "provider": "Kaggle / SQLBolt", "url": "https://sqlbolt.com"},
    "excel": {"title": "Advanced Excel & Financial Modeling", "provider": "Microsoft Learn / Coursera", "url": "https://learn.microsoft.com"},
    "powerbi": {"title": "Power BI & DAX Data Visualization", "provider": "Microsoft Learn", "url": "https://learn.microsoft.com"},
    "python": {"title": "Python for Data Analysis & Pandas", "provider": "Kaggle Learn", "url": "https://kaggle.com/learn"},
    "financial_modeling": {"title": "Corporate Finance & DCF Modeling", "provider": "CFI / Coursera", "url": "https://corporatefinanceinstitute.com"},
    "accounting_1c": {"title": "1C 8.3 Mühasibat və Vergi Uçotu", "provider": "Praktiki Təlim Mərkəzi", "url": "https://dma.gov.az"},
    "javascript": {"title": "Modern JavaScript & TypeScript", "provider": "JavaScript.info", "url": "https://javascript.info"},
    "react": {"title": "React 19 & Next.js Architecture", "provider": "React Official Docs", "url": "https://react.dev"},
    "digital_marketing": {"title": "Google Ads & Meta Performance Marketing", "provider": "Google Digital Garage", "url": "https://skillshop.withgoogle.com"},
    "hr_management": {"title": "AR Əmək Qanunvericiliyi və Kadr İşi", "provider": "Dövlət Məşğulluq Agentliyi", "url": "https://dma.gov.az"},
    "project_management": {"title": "Agile & Scrum Fundamentals (Jira)", "provider": "Atlassian University", "url": "https://atlassian.com/university"},
    "cyber_security": {"title": "SOC & Network Security Fundamentals", "provider": "TryHackMe / Cybrary", "url": "https://tryhackme.com"}
}


class RecommendationEngine:
    def __init__(self, gap_engine: SkillGapEngine):
        self.gap_engine = gap_engine

    def generate_recommendations(self, role_id: str, student_skills: Dict[str, int]) -> Dict[str, Any]:
        gap_res = self.gap_engine.calculate_gap_analysis(role_id, student_skills)
        breakdown = gap_res["breakdown"]

        gaps_with_impact = [item for item in breakdown if item["gap"] > 0]
        gaps_with_impact.sort(key=lambda x: (x["weight"] * x["gap"]), reverse=True)

        prioritized = []
        for g in gaps_with_impact:
            priority = "Yüksək Prioritet" if g["gap"] >= 30 and g["weight"] >= 1.3 else ("Orta Prioritet" if g["gap"] >= 15 else "Aşağı Prioritet")
            res_info = RECOMMENDED_RESOURCES.get(g["skill_id"], {
                "title": f"{g['skill_name']} üzrə Praktiki Təlim",
                "provider": "Açıq Təhsil Resursları",
                "url": "https://google.com"
            })

            prioritized.append({
                "skill_id": g["skill_id"],
                "skill_name": g["skill_name"],
                "gap_percentage": g["gap"],
                "priority": priority,
                "importance_weight": g["weight"],
                "recommended_resource": res_info["title"],
                "provider": res_info["provider"],
                "action_advice": f"Bazar tələbini ödəmək üçün bu bacarığı +{g['gap']}% artırmaq lazımdır."
            })

        action_plan = [
            {"month": "1-ci Ay", "focus": "Baza Boşluqları", "task": f"Ən kritik bacarıqları ({', '.join([p['skill_name'] for p in prioritized[:2]]) if prioritized else 'SQL və Excel'}) öyrənmək və 1 praktiki tapşırıq həll etmək."},
            {"month": "2-ci Ay", "focus": "Real Portfel Layihəsi", "task": "2 real case study qurmaq və GitHub / portfolio linkinə əlavə etmək."},
            {"month": "3-cü Ay", "focus": "Müsahibə & Müraciət", "task": "SkillMap-da qeyd olunan canlı vakansiyalara fərdi CV ilə müraciət etmək."}
        ]

        return {
            "role_title": gap_res["role_title"],
            "overall_match_score": gap_res["match_score"],
            "prioritized_gaps": prioritized,
            "top_3_priorities": prioritized[:3],
            "action_plan": action_plan
        }
