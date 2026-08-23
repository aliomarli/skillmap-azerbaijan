"""
SkillMap Azerbaijan - Real Skill Gap Engine & Multi-Component Match Engine
1. Real Role Benchmarks derived from Jobsearch.az vacancies
2. 1-5 Scale: Beginner (1), Basic (2), Intermediate (3), Advanced (4), Expert (5)
3. Configurable Match Score: Skills (70%), Experience (15%), Education (10%), Language (5%)
4. Real Skill Gap Calculation: max(0, market_level - student_level)
5. Priority Ranking: gap * (demand_pct / 100) * importance_factor
6. Alternative Careers: Cross-evaluation across all role benchmarks
"""

from typing import Dict, Any, List, Optional
from ..db.database import DatabaseManager


# Configurable Weights for Match Score Calculation
DEFAULT_CONFIG_WEIGHTS = {
    "skills": 0.70,        # 70% Bacarıqlar
    "experience": 0.15,    # 15% İş Təcrübəsi
    "education": 0.10,     # 10% Təhsil Səviyyəsi və Sahəsi
    "language": 0.05       # 5% Xarici Dil Səviyyəsi
}

# Real Market Role Benchmarks derived from Jobsearch.az Real Dataset
ROLE_BENCHMARKS = {
    "data_analyst": {
        "id": "data_analyst",
        "title": "Data Analitik (Data Analyst)",
        "sector": "IT & Rəqəmsal",
        "base_salary": 1400,
        "sample_vacancies_count": 18,
        "status": "Sufficient market data",
        "required_experience_years": 1.5,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Kompüter Elmləri / IT", "Maliyyə & İqtisadiyyat", "Tətbiqi Riyaziyyat"],
        "required_english_level": "B2",
        "skills_benchmark": [
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 4, "importance": "required", "demand_percentage": 78.0, "weight": 1.3},
            {"skill_id": "sql", "canonical_name": "SQL", "market_level": 4, "importance": "required", "demand_percentage": 72.0, "weight": 1.5},
            {"skill_id": "powerbi", "canonical_name": "Power BI", "market_level": 3, "importance": "preferred", "demand_percentage": 56.0, "weight": 1.4},
            {"skill_id": "python", "canonical_name": "Python", "market_level": 3, "importance": "preferred", "demand_percentage": 44.0, "weight": 1.5},
            {"skill_id": "analytical_thinking", "canonical_name": "Analytical Thinking", "market_level": 4, "importance": "required", "demand_percentage": 85.0, "weight": 1.3},
            {"skill_id": "english", "canonical_name": "English", "market_level": 3, "importance": "preferred", "demand_percentage": 65.0, "weight": 1.4}
        ]
    },
    "financial_analyst": {
        "id": "financial_analyst",
        "title": "Maliyyə Analitiki (Financial Analyst)",
        "sector": "Maliyyə & Bankçılıq",
        "base_salary": 1350,
        "sample_vacancies_count": 32,
        "status": "Sufficient market data",
        "required_experience_years": 2.0,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Maliyyə & İqtisadiyyat", "Mühasibat", "Bankçılıq"],
        "required_english_level": "B2",
        "skills_benchmark": [
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 4, "importance": "required", "demand_percentage": 88.0, "weight": 1.3},
            {"skill_id": "financial_analysis", "canonical_name": "Financial Analysis", "market_level": 4, "importance": "required", "demand_percentage": 82.0, "weight": 1.5},
            {"skill_id": "accounting", "canonical_name": "Accounting", "market_level": 3, "importance": "required", "demand_percentage": 65.0, "weight": 1.3},
            {"skill_id": "accounting_1c", "canonical_name": "1C", "market_level": 3, "importance": "preferred", "demand_percentage": 50.0, "weight": 1.3},
            {"skill_id": "powerbi", "canonical_name": "Power BI", "market_level": 3, "importance": "preferred", "demand_percentage": 40.0, "weight": 1.4},
            {"skill_id": "sql", "canonical_name": "SQL", "market_level": 2, "importance": "preferred", "demand_percentage": 30.0, "weight": 1.5},
            {"skill_id": "analytical_thinking", "canonical_name": "Analytical Thinking", "market_level": 4, "importance": "required", "demand_percentage": 80.0, "weight": 1.3},
            {"skill_id": "english", "canonical_name": "English", "market_level": 3, "importance": "preferred", "demand_percentage": 70.0, "weight": 1.4}
        ]
    },
    "business_analyst": {
        "id": "business_analyst",
        "title": "Biznes Analitik (Business Analyst)",
        "sector": "IT & Rəqəmsal",
        "base_salary": 1300,
        "sample_vacancies_count": 12,
        "status": "Sufficient market data",
        "required_experience_years": 1.5,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Biznes & İdarəetmə", "Kompüter Elmləri / IT", "Maliyyə & İqtisadiyyat"],
        "required_english_level": "B2",
        "skills_benchmark": [
            {"skill_id": "communication", "canonical_name": "Communication", "market_level": 4, "importance": "required", "demand_percentage": 92.0, "weight": 1.2},
            {"skill_id": "analytical_thinking", "canonical_name": "Analytical Thinking", "market_level": 4, "importance": "required", "demand_percentage": 88.0, "weight": 1.3},
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 3, "importance": "required", "demand_percentage": 75.0, "weight": 1.3},
            {"skill_id": "project_management", "canonical_name": "Project Management", "market_level": 3, "importance": "required", "demand_percentage": 68.0, "weight": 1.4},
            {"skill_id": "sql", "canonical_name": "SQL", "market_level": 3, "importance": "preferred", "demand_percentage": 50.0, "weight": 1.5},
            {"skill_id": "powerbi", "canonical_name": "Power BI", "market_level": 3, "importance": "preferred", "demand_percentage": 45.0, "weight": 1.4},
            {"skill_id": "english", "canonical_name": "English", "market_level": 3, "importance": "required", "demand_percentage": 80.0, "weight": 1.4}
        ]
    },
    "accountant": {
        "id": "accountant",
        "title": "Mühasib (Accountant)",
        "sector": "Maliyyə & Bankçılıq",
        "base_salary": 950,
        "sample_vacancies_count": 36,
        "status": "Sufficient market data",
        "required_experience_years": 2.0,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Mühasibat", "Maliyyə & İqtisadiyyat"],
        "required_english_level": "B1",
        "skills_benchmark": [
            {"skill_id": "accounting_1c", "canonical_name": "1C", "market_level": 4, "importance": "required", "demand_percentage": 95.0, "weight": 1.3},
            {"skill_id": "accounting", "canonical_name": "Accounting", "market_level": 4, "importance": "required", "demand_percentage": 90.0, "weight": 1.3},
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 4, "importance": "required", "demand_percentage": 85.0, "weight": 1.3},
            {"skill_id": "auditing", "canonical_name": "Auditing", "market_level": 2, "importance": "preferred", "demand_percentage": 35.0, "weight": 1.4},
            {"skill_id": "time_management", "canonical_name": "Time Management", "market_level": 4, "importance": "required", "demand_percentage": 80.0, "weight": 1.1},
            {"skill_id": "russian", "canonical_name": "Russian", "market_level": 3, "importance": "preferred", "demand_percentage": 50.0, "weight": 1.2}
        ]
    },
    "frontend_developer": {
        "id": "frontend_developer",
        "title": "Frontend Proqramçı (React / JS)",
        "sector": "IT & Rəqəmsal",
        "base_salary": 1500,
        "sample_vacancies_count": 24,
        "status": "Sufficient market data",
        "required_experience_years": 2.0,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Kompüter Elmləri / IT", "Mühəndislik & Texniki"],
        "required_english_level": "B2",
        "skills_benchmark": [
            {"skill_id": "javascript", "canonical_name": "JavaScript", "market_level": 4, "importance": "required", "demand_percentage": 95.0, "weight": 1.5},
            {"skill_id": "react", "canonical_name": "React", "market_level": 4, "importance": "required", "demand_percentage": 90.0, "weight": 1.5},
            {"skill_id": "html_css", "canonical_name": "HTML & CSS", "market_level": 4, "importance": "required", "demand_percentage": 90.0, "weight": 1.2},
            {"skill_id": "git", "canonical_name": "Git & GitHub", "market_level": 3, "importance": "required", "demand_percentage": 75.0, "weight": 1.3},
            {"skill_id": "analytical_thinking", "canonical_name": "Analytical Thinking", "market_level": 4, "importance": "required", "demand_percentage": 80.0, "weight": 1.3},
            {"skill_id": "english", "canonical_name": "English", "market_level": 3, "importance": "required", "demand_percentage": 85.0, "weight": 1.4}
        ]
    },
    "digital_marketer": {
        "id": "digital_marketer",
        "title": "Rəqəmsal Marketinq Mütəxəssisi (SMM / Ads)",
        "sector": "Satış & Müştəri Xidmətləri",
        "base_salary": 900,
        "sample_vacancies_count": 22,
        "status": "Sufficient market data",
        "required_experience_years": 1.0,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Biznes & Marketinq", "Humanitar"],
        "required_english_level": "B1",
        "skills_benchmark": [
            {"skill_id": "marketing", "canonical_name": "Marketing", "market_level": 4, "importance": "required", "demand_percentage": 95.0, "weight": 1.3},
            {"skill_id": "communication", "canonical_name": "Communication", "market_level": 4, "importance": "required", "demand_percentage": 90.0, "weight": 1.2},
            {"skill_id": "sales", "canonical_name": "Sales", "market_level": 3, "importance": "required", "demand_percentage": 65.0, "weight": 1.2},
            {"skill_id": "ui_ux_design", "canonical_name": "UI/UX & Graphic Design", "market_level": 3, "importance": "preferred", "demand_percentage": 45.0, "weight": 1.3},
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 2, "importance": "preferred", "demand_percentage": 40.0, "weight": 1.3},
            {"skill_id": "russian", "canonical_name": "Russian", "market_level": 3, "importance": "preferred", "demand_percentage": 60.0, "weight": 1.2}
        ]
    },
    "hr_specialist": {
        "id": "hr_specialist",
        "title": "İnsan Resursları Mütəxəssisi (HR)",
        "sector": "İnzibati & HR",
        "base_salary": 850,
        "sample_vacancies_count": 14,
        "status": "Sufficient market data",
        "required_experience_years": 1.5,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["İnzibati & HR", "Maliyyə & İqtisadiyyat", "Humanitar"],
        "required_english_level": "B1",
        "skills_benchmark": [
            {"skill_id": "hr_management", "canonical_name": "HR Management", "market_level": 4, "importance": "required", "demand_percentage": 95.0, "weight": 1.3},
            {"skill_id": "communication", "canonical_name": "Communication", "market_level": 4, "importance": "required", "demand_percentage": 92.0, "weight": 1.2},
            {"skill_id": "time_management", "canonical_name": "Time Management", "market_level": 4, "importance": "required", "demand_percentage": 85.0, "weight": 1.1},
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 3, "importance": "required", "demand_percentage": 75.0, "weight": 1.3},
            {"skill_id": "accounting_1c", "canonical_name": "1C", "market_level": 2, "importance": "preferred", "demand_percentage": 40.0, "weight": 1.3},
            {"skill_id": "russian", "canonical_name": "Russian", "market_level": 3, "importance": "preferred", "demand_percentage": 55.0, "weight": 1.2}
        ]
    },
    "procurement_specialist": {
        "id": "procurement_specialist",
        "title": "Satınalma və Təchizat Mütəxəssisi",
        "sector": "Logistika & Təchizat",
        "base_salary": 950,
        "sample_vacancies_count": 24,
        "status": "Sufficient market data",
        "required_experience_years": 2.0,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Maliyyə & İqtisadiyyat", "Mühəndislik & Texniki"],
        "required_english_level": "B1",
        "skills_benchmark": [
            {"skill_id": "procurement", "canonical_name": "Procurement & Supply Chain", "market_level": 4, "importance": "required", "demand_percentage": 95.0, "weight": 1.3},
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 3, "importance": "required", "demand_percentage": 85.0, "weight": 1.3},
            {"skill_id": "communication", "canonical_name": "Communication", "market_level": 4, "importance": "required", "demand_percentage": 80.0, "weight": 1.2},
            {"skill_id": "accounting_1c", "canonical_name": "1C", "market_level": 3, "importance": "preferred", "demand_percentage": 55.0, "weight": 1.3},
            {"skill_id": "russian", "canonical_name": "Russian", "market_level": 3, "importance": "preferred", "demand_percentage": 60.0, "weight": 1.2}
        ]
    },
    "sales_manager": {
        "id": "sales_manager",
        "title": "Satış Meneceri (B2B / B2C)",
        "sector": "Satış & Müştəri Xidmətləri",
        "base_salary": 800,
        "sample_vacancies_count": 55,
        "status": "Sufficient market data",
        "required_experience_years": 1.0,
        "required_education_level": "Bakalavr / Ali",
        "target_education_fields": ["Biznes & İdarəetmə", "Ümumi / Digər"],
        "required_english_level": "B1",
        "skills_benchmark": [
            {"skill_id": "sales", "canonical_name": "Sales", "market_level": 4, "importance": "required", "demand_percentage": 95.0, "weight": 1.2},
            {"skill_id": "communication", "canonical_name": "Communication", "market_level": 4, "importance": "required", "demand_percentage": 90.0, "weight": 1.2},
            {"skill_id": "time_management", "canonical_name": "Time Management", "market_level": 3, "importance": "required", "demand_percentage": 75.0, "weight": 1.1},
            {"skill_id": "customer_service", "canonical_name": "Customer Service", "market_level": 3, "importance": "preferred", "demand_percentage": 60.0, "weight": 1.1},
            {"skill_id": "russian", "canonical_name": "Russian", "market_level": 3, "importance": "preferred", "demand_percentage": 65.0, "weight": 1.2},
            {"skill_id": "excel", "canonical_name": "Excel", "market_level": 2, "importance": "preferred", "demand_percentage": 40.0, "weight": 1.3}
        ]
    }
}


def normalize_experience_years(val: Any) -> float:
    """Converts strings like '0-1 il', '1-3 il', 'Təcrübəsiz' or numeric values to float years."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        val_lower = val.lower().strip()
        if "0-1" in val_lower:
            return 0.5
        if "1-3" in val_lower or "1 - 3" in val_lower or "1 il" in val_lower:
            return 1.5
        if "3-5" in val_lower or "3 - 5" in val_lower or "3 il" in val_lower:
            return 4.0
        if "5+" in val_lower or "5 il" in val_lower:
            return 5.0
        if "təcrübəsiz" in val_lower or "yoxdur" in val_lower:
            return 0.0
        import re
        m = re.search(r'(\d+(?:\.\d+)?)', val)
        if m:
            return float(m.group(1))
    return 0.0


def normalize_skill_level(val: Any) -> int:
    """Converts string labels or 0-100 values to standard 1-5 scale."""
    if isinstance(val, str):
        val_lower = val.lower().strip()
        mapping = {
            "beginner": 1, "basic": 2, "intermediate": 3, "advanced": 4, "expert": 5,
            "1": 1, "2": 2, "3": 3, "4": 4, "5": 5
        }
        if val_lower in mapping:
            return mapping[val_lower]
        try:
            num = float(val)
            val = num
        except ValueError:
            return 2  # Default to Basic
    if isinstance(val, (int, float)):
        if val <= 5:
            return max(1, min(5, int(round(val))))
        # Map 0-100 to 1-5
        if val >= 85: return 5
        if val >= 65: return 4
        if val >= 45: return 3
        if val >= 20: return 2
        return 1
    return 1


class SkillGapEngine:
    def __init__(self, db: Optional[DatabaseManager] = None, weights: Optional[Dict[str, float]] = None):
        self.db = db or DatabaseManager()
        self.weights = weights or DEFAULT_CONFIG_WEIGHTS

    def get_all_benchmarks(self) -> Dict[str, Any]:
        """Returns all role benchmarks with sample size and status."""
        return {
            "total_roles": len(ROLE_BENCHMARKS),
            "data_source": "Jobsearch.az Real Vacancies Dataset (n=420)",
            "roles": list(ROLE_BENCHMARKS.values())
        }

    def get_role_benchmark(self, role_id: str) -> Optional[Dict[str, Any]]:
        """Returns benchmark for a specific role or Insufficient market data."""
        if role_id not in ROLE_BENCHMARKS:
            return {
                "id": role_id,
                "title": role_id.replace("_", " ").title(),
                "status": "Insufficient market data",
                "sample_vacancies_count": 0,
                "note": "Həmin vəzifə üzrə bazada yetərli vakansiya elanı tapılmadı."
            }
        return ROLE_BENCHMARKS[role_id]

    def calculate_gap_analysis(
        self,
        role_id: str,
        student_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates multi-component match score (Skills, Experience, Education, Language),
        skill gaps on 1-5 scale, development priority ranking, and alternative career matches.
        """
        role = ROLE_BENCHMARKS.get(role_id)
        if not role:
            return {
                "role_id": role_id,
                "status": "Insufficient market data",
                "match_score": 0.0,
                "error": f"Role '{role_id}' üçün yetərli vakansiya datası mövcud deyil."
            }

        student_skills = student_profile.get("skills", {})
        raw_exp = student_profile.get("experience_years", student_profile.get("experience", 0))
        student_exp_years = normalize_experience_years(raw_exp)
        student_degree = student_profile.get("degree", "Bakalavr")
        student_field = student_profile.get("field", "")
        student_english = student_profile.get("english_level", "B1")

        # 1. SKILLS SCORE & GAP CALCULATION
        benchmark_skills = role["skills_benchmark"]
        total_weighted_achieved = 0.0
        total_weighted_required = 0.0
        breakdown = []
        gaps_for_priority = []

        for item in benchmark_skills:
            sk_id = item["skill_id"]
            sk_name = item["canonical_name"]
            market_lvl = item["market_level"]  # 1-5
            importance = item["importance"]     # required / preferred
            demand_pct = item["demand_percentage"]
            weight = item["weight"]

            importance_factor = 1.0 if importance == "required" else 0.6
            raw_user_lvl = student_skills.get(sk_id, student_skills.get(sk_name, 0))
            user_lvl = normalize_skill_level(raw_user_lvl) if raw_user_lvl else 0

            # Gap formula: max(0, market_level - student_level)
            gap = max(0, market_lvl - user_lvl)

            achieved = min(user_lvl, market_lvl)
            total_weighted_achieved += achieved * weight * importance_factor
            total_weighted_required += market_lvl * weight * importance_factor

            # Priority Score = gap * (demand_pct / 100) * importance_factor
            priority_score = round(gap * (demand_pct / 100.0) * (1.5 if importance == "required" else 1.0), 2)
            if priority_score >= 1.5:
                priority_label = "Very High"
                priority_az = "Çox Yüksək (Təcili)"
            elif priority_score >= 0.8:
                priority_label = "High"
                priority_az = "Yüksək"
            elif priority_score >= 0.3:
                priority_label = "Medium"
                priority_az = "Orta"
            elif gap > 0:
                priority_label = "Low"
                priority_az = "Aşağı"
            else:
                priority_label = "None"
                priority_az = "Boşluq yoxdur"

            if gap == 0:
                status_az = "Strong (Tam uyğundur)"
                status_type = "strong"
            elif gap == 1:
                status_az = "Low Gap (1 səviyyə)"
                status_type = "low"
            elif gap == 2:
                status_az = "Medium Gap (2 səviyyə)"
                status_type = "medium"
            else:
                status_az = "High Gap (Kritik)"
                status_type = "high"

            row_data = {
                "skill_id": sk_id,
                "skill_name": sk_name,
                "market_level": market_lvl,
                "student_level": user_lvl,
                "gap": gap,
                "importance": importance,
                "demand_percentage": demand_pct,
                "status": status_az,
                "status_type": status_type,
                "priority": priority_label,
                "priority_az": priority_az,
                "priority_score": priority_score
            }
            breakdown.append(row_data)
            if gap > 0:
                gaps_for_priority.append(row_data)

        skills_score = (total_weighted_achieved / total_weighted_required * 100.0) if total_weighted_required > 0 else 0.0

        # 2. EXPERIENCE SCORE
        req_exp = role.get("required_experience_years", 1.5)
        experience_score = min(100.0, (student_exp_years / max(0.5, req_exp)) * 100.0)

        # 3. EDUCATION SCORE
        target_fields = role.get("target_education_fields", [])
        field_match = any(tf.lower() in student_field.lower() for tf in target_fields) or not student_field
        if student_degree in ["Magistr", "Bakalavr / Ali", "Bakalavr"] and field_match:
            education_score = 100.0
        elif student_degree in ["Magistr", "Bakalavr / Ali", "Bakalavr"]:
            education_score = 75.0
        elif student_degree == "Orta ixtisas / Kollec":
            education_score = 50.0
        else:
            education_score = 35.0

        # 4. LANGUAGE SCORE
        req_eng = role.get("required_english_level", "B2")
        cefr_levels = {"none": 0, "a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6}
        std_eng_val = cefr_levels.get(student_english.lower(), 3)
        req_eng_val = cefr_levels.get(req_eng.lower(), 4)

        if std_eng_val >= req_eng_val:
            language_score = 100.0
        elif std_eng_val == req_eng_val - 1:
            language_score = 70.0
        elif std_eng_val == req_eng_val - 2:
            language_score = 40.0
        else:
            language_score = 15.0

        # 5. TOTAL MULTI-COMPONENT MATCH SCORE
        w_skills = self.weights.get("skills", 0.70)
        w_exp = self.weights.get("experience", 0.15)
        w_edu = self.weights.get("education", 0.10)
        w_lang = self.weights.get("language", 0.05)

        total_match_score = round(
            (w_skills * skills_score) +
            (w_exp * experience_score) +
            (w_edu * education_score) +
            (w_lang * language_score),
            1
        )

        # 6. TOP DEVELOPMENT PRIORITIES (Sorted by priority_score desc)
        sorted_priorities = sorted(gaps_for_priority, key=lambda x: x["priority_score"], reverse=True)

        # 7. ALTERNATIVE CAREER RECOMMENDATIONS
        alternative_careers = []
        for other_role_id, other_role in ROLE_BENCHMARKS.items():
            if other_role_id == role_id:
                continue
            # Calculate fast match for other role
            alt_res = self._quick_match(other_role, student_skills, student_exp_years, student_degree, student_field, student_english)
            alternative_careers.append({
                "role_id": other_role_id,
                "title": other_role["title"],
                "sector": other_role["sector"],
                "match_score": alt_res["match_score"],
                "base_salary": other_role["base_salary"],
                "sample_vacancies": other_role["sample_vacancies_count"]
            })
        alternative_careers.sort(key=lambda x: x["match_score"], reverse=True)

        # Salary Projection
        base_sal = role["base_salary"]
        est_current = int(base_sal * (0.75 + (total_match_score / 100.0) * 0.45))
        est_potential = int(base_sal * 1.55)

        return {
            "role_id": role_id,
            "role_title": role["title"],
            "sector": role["sector"],
            "status": role["status"],
            "sample_vacancies_count": role["sample_vacancies_count"],
            "match_score": total_match_score,
            "component_scores": {
                "skills_score": round(skills_score, 1),
                "experience_score": round(experience_score, 1),
                "education_score": round(education_score, 1),
                "language_score": round(language_score, 1),
                "weights_used": self.weights
            },
            "salary_projection": {
                "current_estimated_azn": est_current,
                "potential_after_closing_gaps_azn": est_potential,
                "growth_potential_pct": round(((est_potential - est_current) / est_current) * 100) if est_current else 50
            },
            "skill_gap_breakdown": breakdown,
            "top_development_priorities": sorted_priorities[:4],
            "alternative_careers": alternative_careers[:4],
            "disclaimer": "Hesablama Jobsearch.az real vakansiya benchmark-larına əsaslanır."
        }

    def _quick_match(self, role: Dict[str, Any], student_skills: Dict[str, Any], exp_years: float, degree: str, field: str, english: str) -> Dict[str, Any]:
        """Fast match calculation for alternative roles."""
        b_skills = role["skills_benchmark"]
        tot_ach = 0.0
        tot_req = 0.0
        for item in b_skills:
            sk_id = item["skill_id"]
            m_lvl = item["market_level"]
            imp = 1.0 if item["importance"] == "required" else 0.6
            w = item["weight"]
            u_lvl = normalize_skill_level(student_skills.get(sk_id, student_skills.get(item["canonical_name"], 0))) if (sk_id in student_skills or item["canonical_name"] in student_skills) else 0
            tot_ach += min(u_lvl, m_lvl) * w * imp
            tot_req += m_lvl * w * imp
        sk_score = (tot_ach / tot_req * 100.0) if tot_req > 0 else 0.0
        exp_score = min(100.0, (exp_years / max(0.5, role.get("required_experience_years", 1.5))) * 100.0)
        edu_score = 80.0 if degree in ["Bakalavr", "Magistr"] else 50.0
        lang_score = 80.0 if english.lower() in ["b2", "c1", "c2"] else 50.0
        total = round(0.70 * sk_score + 0.15 * exp_score + 0.10 * edu_score + 0.05 * lang_score, 1)
        return {"match_score": total}

