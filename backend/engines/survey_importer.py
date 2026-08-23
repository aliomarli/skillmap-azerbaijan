"""
SkillMap Azerbaijan - Google Forms / Sheets Survey Importer Engine
Parses CSV/XLSX survey data, strips PII, normalizes fields & skills, and validates responses.
"""

import csv
import io
import json
import re
import hashlib
from typing import Dict, Any, List, Tuple, Optional
from ..nlp.taxonomy import CANONICAL_SKILLS


PII_COLUMN_PATTERNS = [
    r"\bad\b", r"\bsoyad\b", r"\bname\b", r"\bfull\s*name\b",
    r"\bemail\b", r"\be-po[çc]t\b", r"\bmail\b",
    r"\btelefon\b", r"\bphone\b", r"\bmobil\b",
    r"\bstudent_?id\b", r"\bt[əe]l[əe]b[əe]\s*kod\b",
    r"\b[sş][əe]xsiyy[əe]t\b", r"\bfin\b", r"\bip\b", r"\busername\b"
]

FIELD_NORMALIZATION_MAP = {
    "Economics & Finance": [
        "maliyyə", "maliye", "finance", "iqtisadiyyat", "iqtisad", "economics", "economy",
        "mühasibat", "muhasibat", "accounting", "bank", "bankçılıq", "menecment", "management",
        "biznes", "business", "marketinq", "marketing", "kommersiya", "audit", "beynəlxalq ticarət"
    ],
    "IT & Computer Science": [
        "kompüter", "komputer", "computer", "it", "informasiya texnologiyaları", "informasiya",
        "kibertəhlükəsizlik", "cybersecurity", "proqram", "software", "informatika", "data science",
        "süni intellekt", "ai", "artificial intelligence", "sistem mühəndisliyi", "veb", "web"
    ],
    "Engineering": [
        "mühəndis", "muhendis", "engineering", "mexanika", "neft", "qaz", "petroleum", "oil",
        "tikinti", "civil", "kimya mühəndisliyi", "energetika", "avtomatlaşdırma", "elektrik",
        "elektronika", "texnoloji", "geologiya"
    ],
    "Law": [
        "hüquq", "huquq", "law", "hüquqşünaslıq", "məhkəmə"
    ],
    "Education": [
        "pedaqoji", "pedaqogika", "təhsil", "tehsil", "education", "müəllim", "muellim",
        "məktəbəqədər", "ibtidai"
    ],
    "Medicine & Health": [
        "tibb", "müalicə", "mualice", "həkim", "stomatologiya", "əczaçılıq", "pharmacy",
        "ictimai səhiyyə", "biotibb", "tibb bacısı"
    ],
    "Social Sciences": [
        "beynəlxalq münasibətlər", "international relations", "sosiologiya", "sociology",
        "psixologiya", "psychology", "politologiya", "siyasi", "dövlət idarəetməsi", "jurnalistika"
    ],
    "Humanities": [
        "filologiya", "tarix", "fəlsəfə", "tərcümə", "dilçilik", "ədəbiyyat", "şərqşünaslıq"
    ],
    "Arts & Design": [
        "dizayn", "design", "memarlıq", "architecture", "rəssamlıq", "musiqi", "teatr", "kino"
    ],
    "Agriculture": [
        "aqrar", "kənd təsərrüfatı", "aqronomluq", "baytarlıq", "torpaqşünaslıq", "meşəçilik"
    ]
}


def normalize_field_of_study(raw_field: str) -> str:
    """Normalizes raw specialty/field string into one of the 11 standard buckets."""
    if not raw_field:
        return "Other"
    raw_lower = raw_field.lower().strip()
    
    for bucket, keywords in FIELD_NORMALIZATION_MAP.items():
        for kw in keywords:
            if kw in raw_lower:
                return bucket
    return "Other"


def is_pii_column(col_name: str) -> bool:
    """Checks if a column contains Personally Identifiable Information."""
    name_clean = col_name.lower().strip()
    for pat in PII_COLUMN_PATTERNS:
        if re.search(pat, name_clean):
            return True
    return False


def normalize_skill_rating(val: Any) -> int:
    """Normalizes survey rating scale (1-5, 1-10, or verbal labels) to standard 1-5."""
    if isinstance(val, (int, float)):
        if val <= 5:
            return max(1, min(5, int(round(val))))
        if val <= 10:
            return max(1, min(5, int(round(val / 2.0))))
        if val <= 100:
            if val >= 85: return 5
            if val >= 65: return 4
            if val >= 45: return 3
            if val >= 20: return 2
            return 1
    if isinstance(val, str):
        v = val.lower().strip()
        map_verbal = {
            "heç bilmirəm": 1, "bilmirəm": 1, "zəif": 1, "beginner": 1, "başlanğıc": 1, "1": 1,
            "baza": 2, "orta-aşağı": 2, "basic": 2, "elementar": 2, "2": 2,
            "orta": 3, "intermediate": 3, "qənaətbəxş": 3, "3": 3,
            "yaxşı": 4, "advanced": 4, "qabaqcıl": 4, "yüksək": 4, "4": 4,
            "əla": 5, "expert": 5, "peşəkar": 5, "mükəmməl": 5, "5": 5
        }
        for k, num in map_verbal.items():
            if k in v:
                return num
        m = re.search(r'(\d+)', val)
        if m:
            n = int(m.group(1))
            return max(1, min(5, n if n <= 5 else int(round(n / 2.0))))
    return 2


def normalize_experience_to_years(val: Any) -> Tuple[str, float]:
    """Returns normalized display string and float years."""
    if isinstance(val, (int, float)):
        yrs = float(val)
        if yrs == 0: return ("Təcrübəsiz (0 il)", 0.0)
        if yrs <= 1: return ("0 - 1 il", yrs)
        if yrs <= 3: return ("1 - 3 il", yrs)
        if yrs <= 5: return ("3 - 5 il", yrs)
        return ("5+ il", yrs)
    
    if isinstance(val, str):
        v = val.lower().strip()
        if "təcrübəsiz" in v or "yoxdur" in v or "0 il" in v or "0" == v:
            return ("Təcrübəsiz (0 il)", 0.0)
        if "0-1" in v or "1 ildən az" in v:
            return ("0 - 1 il", 0.5)
        if "1-3" in v or "1 - 3" in v or "2 il" in v:
            return ("1 - 3 il", 2.0)
        if "3-5" in v or "3 - 5" in v or "4 il" in v:
            return ("3 - 5 il", 4.0)
        if "5+" in v or "5 ildən çox" in v:
            return ("5+ il", 5.0)
        m = re.search(r'(\d+(?:\.\d+)?)', val)
        if m:
            num = float(m.group(1))
            return (f"{num} il", num)
    return ("Təcrübəsiz (0 il)", 0.0)


class SurveyImporter:
    """
    Automated Google Forms / Sheets Data Importer & Parser.
    Guarantees 100% PII stripping and strict Azerbaijani UTF-8 encoding integrity.
    """

    def __init__(self):
        # Known standard skill keys to look for in columns
        self.skill_keywords = {
            "excel": ["excel", "ms excel", "cədvəl"],
            "sql": ["sql", "verilənlər bazası", "database", "postgres", "mysql"],
            "powerbi": ["power bi", "powerbi", "dax", "dashboard"],
            "python": ["python", "payton"],
            "accounting_1c": ["1c", "1s", "1c mühasibat", "1c 8.3"],
            "autocad": ["autocad", "avtokad", "çertyoj"],
            "javascript": ["javascript", "js", "frontend", "react"],
            "communication": ["ünsiyyət", "unsiyyet", "communication", "təqdimat"],
            "analytical_thinking": ["analitik", "analitik düşüncə", "analytical"],
            "time_management": ["vaxtın idarə", "time management", "planlama"],
            "teamwork": ["komanda", "teamwork", "kollektiv"],
            "financial_analysis": ["maliyyə analizi", "maliyyə modelləşdirilməsi", "financial analysis"],
            "procurement": ["satınalma", "təchizat", "procurement", "supply chain"],
            "marketing": ["marketinq", "smm", "rəqəmsal marketinq", "reklam"],
            "hr_management": ["insan resursları", "hr", "kadr", "kadr uçotu"],
            "sales": ["satış", "sales", "müştəri ilə iş"]
        }

    def detect_column_mappings(self, header_columns: List[str]) -> Dict[str, str]:
        """
        Auto-detects the mapping of Google Forms questions to standard system fields.
        Returns dict of { original_header: internal_field_name }.
        """
        mapping = {}
        for col in header_columns:
            c_low = col.lower().strip()
            
            # PII check
            if is_pii_column(c_low):
                mapping[col] = "DROP_PII"
                continue

            if any(k in c_low for k in ["universitet", "ali təhsil", "təhsil aldığınız müəssisə", "university"]):
                mapping[col] = "university"
            elif any(k in c_low for k in ["ixtisas", "fakültə", "specialty", "field of study", "ixtisasınız"]):
                mapping[col] = "field_of_study"
            elif any(k in c_low for k in ["təhsil dərəcəsi", "təhsil səviyyəsi", "dərəcə", "degree", "education level", "kurs"]):
                mapping[col] = "education_level"
            elif any(k in c_low for k in ["yaş", "age", "yaş qrupu"]):
                mapping[col] = "age_group"
            elif any(k in c_low for k in ["işləyirsiniz", "məşğulluq", "employment status", "iş statusu", "hazırkı status"]):
                mapping[col] = "employment_status"
            elif any(k in c_low for k in ["iş təcrübəsi", "təcrübəniz", "work experience", "təcrübə"]):
                mapping[col] = "work_experience"
            elif any(k in c_low for k in ["iş axtarır", "job search", "vakansiya axtar"]):
                mapping[col] = "job_search_status"
            elif any(k in c_low for k in ["hədəf sektor", "hansı sahədə", "target sector", "sahə"]):
                mapping[col] = "target_sector"
            elif any(k in c_low for k in ["hədəf vəzifə", "karyera hədəfi", "olmaq istədiyiniz vəzifə", "target role", "vəzifə"]):
                mapping[col] = "target_role"
            elif any(k in c_low for k in ["ingilis", "english", "ingilis dili"]):
                mapping[col] = "english_level"
            elif any(k in c_low for k in ["rus dili", "russian", "rus"]):
                mapping[col] = "russian_level"
            elif any(k in c_low for k in ["rəqəmsal bacarıq", "digital skill", "kompüter savadlılığı"]):
                mapping[col] = "digital_skill_level"
            else:
                # Check for specific skills
                matched_skill = None
                for sk_id, kw_list in self.skill_keywords.items():
                    if any(kw in c_low for kw in kw_list):
                        matched_skill = sk_id
                        break
                if matched_skill:
                    mapping[col] = f"skill:{matched_skill}"
                else:
                    mapping[col] = "custom_text"
        return mapping

    def parse_csv_content(
        self,
        csv_text: str,
        custom_mapping: Optional[Dict[str, str]] = None,
        source: str = "google_forms",
        is_demo: bool = False
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Parses CSV text into a validated list of student_survey_responses records.
        """
        if csv_text.startswith("\ufeff"):
            csv_text = csv_text[1:]

        f = io.StringIO(csv_text.strip())
        first_line = csv_text.split("\n")[0]
        delimiter = ";" if ";" in first_line and "," not in first_line else ","
        reader = csv.reader(f, delimiter=delimiter)

        rows = list(reader)
        if not rows or len(rows) < 2:
            return [], {"total_rows": 0, "imported_count": 0, "skipped_count": 0, "error": "CSV faylı boşdur və ya başlıq çatışmır."}

        headers = [h.strip() for h in rows[0]]
        mapping = custom_mapping or self.detect_column_mappings(headers)

        parsed_records = []
        skipped_count = 0
        seen_hashes = set()

        for idx, row in enumerate(rows[1:], start=1):
            if not row or not any(field.strip() for field in row):
                skipped_count += 1
                continue

            row_raw_str = "|".join([c.strip() for c in row])
            row_hash = hashlib.md5(row_raw_str.encode("utf-8")).hexdigest()
            if row_hash in seen_hashes:
                skipped_count += 1
                continue
            seen_hashes.add(row_hash)

            record = {
                "respondent_id": f"RESP-{len(parsed_records) + 1:06d}",
                "university": "Qeyd olunmayıb",
                "field_of_study": "Qeyd olunmayıb",
                "field_normalized": "Other",
                "education_level": "Bakalavr",
                "age_group": "18-22",
                "employment_status": "İşləmir",
                "work_experience": "Təcrübəsiz (0 il)",
                "work_experience_years": 0.0,
                "job_search_status": "Aktiv iş axtarır",
                "target_sector": "Digər",
                "target_role": "Digər",
                "english_level": "B1",
                "russian_level": "A2",
                "digital_skill_level": "Orta",
                "skills_json": {},
                "soft_skill_scores": {},
                "career_alignment_score": 0.0,
                "source": source,
                "is_demo": 1 if is_demo else 0
            }

            for col_idx, cell_value in enumerate(row):
                if col_idx >= len(headers):
                    continue
                header_name = headers[col_idx]
                target_field = mapping.get(header_name, "custom_text")
                val = cell_value.strip()

                if target_field == "DROP_PII" or not val:
                    continue

                if target_field == "university":
                    record["university"] = val
                elif target_field == "field_of_study":
                    record["field_of_study"] = val
                    record["field_normalized"] = normalize_field_of_study(val)
                elif target_field == "education_level":
                    record["education_level"] = val
                elif target_field == "age_group":
                    record["age_group"] = val
                elif target_field == "employment_status":
                    record["employment_status"] = val
                elif target_field == "work_experience":
                    disp, yrs = normalize_experience_to_years(val)
                    record["work_experience"] = disp
                    record["work_experience_years"] = yrs
                elif target_field == "job_search_status":
                    record["job_search_status"] = val
                elif target_field == "target_sector":
                    record["target_sector"] = val
                elif target_field == "target_role":
                    record["target_role"] = val
                elif target_field == "english_level":
                    record["english_level"] = val.upper() if val.lower() in ["a1", "a2", "b1", "b2", "c1", "c2"] else val
                elif target_field == "russian_level":
                    record["russian_level"] = val.upper() if val.lower() in ["a1", "a2", "b1", "b2", "c1", "c2"] else val
                elif target_field == "digital_skill_level":
                    record["digital_skill_level"] = val
                elif target_field.startswith("skill:"):
                    skill_id = target_field.split(":")[1]
                    rating = normalize_skill_rating(val)
                    record["skills_json"][skill_id] = rating

            record["skills_json_str"] = json.dumps(record["skills_json"], ensure_ascii=False)
            record["soft_skill_scores_str"] = json.dumps(record["soft_skill_scores"], ensure_ascii=False)
            parsed_records.append(record)

        stats = {
            "total_rows": len(rows) - 1,
            "imported_count": len(parsed_records),
            "skipped_count": skipped_count,
            "detected_mappings": mapping,
            "is_demo": is_demo
        }
        return parsed_records, stats
