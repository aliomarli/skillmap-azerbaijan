"""
SkillMap Azerbaijan - Production Multi-Stage NLP Extraction & Normalization Pipeline
1. Text Cleaning
2. Language Detection
3. Skill Dictionary & Phrase Matching
4. Context & Importance Classification (required, preferred, mentioned)
5. Confidence Scoring
6. Experience Extraction (min/max years)
7. Language & Proficiency Extraction
8. Education & Field Extraction
9. Vacancy Data Quality Scoring (0-100)
"""

import re
import html
from typing import Dict, List, Any, Optional, Tuple
from .taxonomy import CANONICAL_SKILLS
from .normalizer import SkillNormalizer


def az_lower(text: str) -> str:
    """Correctly lowercases Azerbaijani characters, fixing Unicode combining dot on capital İ."""
    if not text:
        return ""
    return text.replace("İ", "i").replace("I", "ı").lower().replace("i\u0307", "i")


class NLPPipeline:
    def __init__(self):
        self.normalizer = SkillNormalizer()

        # Context keywords for Importance Classification
        self.preferred_keywords = [
            "üstünlükdür", "üstünlük", "üstünlük verilir", "üstünlük təşkil edir",
            "arzuolunandır", "arzu ediləndir", "arzu olunur", "müsbət qarşılanır",
            "plus", "preferred", "preferable", "nice to have", "good to have",
            "желательно", "будет плюсом", "преимуществом"
        ]

        self.required_keywords = [
            "mütləqdir", "tələb olunur", "tələblər", "namizədə tələblər", "tələb",
            "zəruridir", "vacibdir", "şərtdir", "vacib tələblər", "əsas tələblər",
            "must have", "required", "mandatory", "essential", "requirements",
            "обязательно", "требования", "должен знать", "необходимо"
        ]

        # Education degree patterns
        self.degree_patterns = [
            (r"\b(?:magistr|magistratura|master'?s?|magistratura dərəcəsi)\b", "Magistr"),
            (r"\b(?:bakalavr|bakalavriat|bachelor'?s?|bakalavr dərəcəsi)\b", "Bakalavr"),
            (r"\b(?:ali təhsil|ali təhsilli|yüksək təhsil|higher education)\b", "Ali təhsil"),
            (r"\b(?:orta ixtisas|kollec|texnikum|vocational)\b", "Orta ixtisas / Kollec"),
            (r"\b(?:orta təhsil)\b", "Orta təhsil")
        ]

        # Education field patterns
        self.edu_fields = [
            (r"\b(?:maliyyə|finance|maliyyə-kredit)\b", "Maliyyə"),
            (r"\b(?:iqtisadiyyat|iqtisadi|economics)\b", "İqtisadiyyat"),
            (r"\b(?:kompüter|informasiya texnologiyaları|it|computer science|proqramlaşdırma|tətbiqi riyaziyyat)\b", "Kompüter Elmləri / IT"),
            (r"\b(?:mühəndislik|engineering|texniki)\b", "Mühəndislik"),
            (r"\b(?:mühasibat|mühasibatlıq|accounting)\b", "Mühasibat"),
            (r"\b(?:marketinq|marketing|menecment|management|biznes idarəetməsi|business administration|mba)\b", "Biznes & Marketinq"),
            (r"\b(?:hüquq|hüquqşünaslıq|law)\b", "Hüquq"),
            (r"\b(?:filologiya|dilçilik|pedaqogika|tərcümə)\b", "Humanitar / Pedaqogika"),
            (r"\b(?:tibb|əczaçılıq|səhiyyə)\b", "Səhiyyə / Tibb"),
            (r"\b(?:memarlıq|dizayn|inşaat)\b", "Memarlıq & Tikinti")
        ]

    def clean_text(self, raw_text: str) -> str:
        """Cleans and standardizes raw job description text."""
        if not raw_text:
            return ""
        # Unescape HTML entities
        text = html.unescape(raw_text)
        # Strip HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        # Normalize non-breaking spaces and unusual whitespace
        text = text.replace(" ", " ").replace("​", " ").replace("	", " ")
        # Normalize multiple spaces and multiple newlines
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n", "\n", text)
        return text.strip()

    def detect_language(self, text: str) -> str:
        """Detects primary language of description."""
        if not text:
            return "az"
        lower = text.lower()
        # Azerbaijani specific characters
        az_chars = len(re.findall(r"[əğıöşüç]", lower))
        # Russian specific characters
        ru_chars = len(re.findall(r"[ыэъёжйцчшщюя]", lower))
        if az_chars > 2:
            return "az"
        elif ru_chars > 3:
            return "ru"
        else:
            return "en" if len(re.findall(r"(the|and|with|for|experience|skills|requirements)", lower)) > 2 else "az"

    def extract_skills_with_importance(self, text: str, title: str = "") -> List[Dict[str, Any]]:
        """
        Extracts technical, business, and soft skills with importance and confidence score.
        """
        combined_text = f"{title} | {text}"
        cleaned = self.clean_text(combined_text)
        lower_text = az_lower(cleaned)
        sentences = [az_lower(s.strip()) for s in re.split(r"[.\n|;•·-]", cleaned) if s.strip()]

        extracted_skills = []
        seen_canonical_ids = set()

        for skill in CANONICAL_SKILLS:
            # Skip languages here (handled in extract_languages)
            if skill["category"] == "language":
                continue

            skill_id = skill["id"]
            if skill_id in seen_canonical_ids:
                continue

            canonical_name = skill["canonical_name"]
            category = skill["category"]
            all_aliases = [az_lower(canonical_name)] + [az_lower(a) for a in skill.get("aliases", [])]

            matched_alias = None
            in_title = False
            matched_sentence = ""

            # Check title first
            lower_title = az_lower(title)
            for alias in all_aliases:
                pattern = rf"\b{re.escape(alias)}\b"
                if re.search(pattern, lower_title):
                    matched_alias = alias
                    in_title = True
                    break

            # If not in title, check description sentences
            if not matched_alias:
                for sent in sentences:
                    for alias in all_aliases:
                        # Ensure single letters or short words don't match inappropriately
                        if len(alias) <= 2 and alias not in ["1c", "js", "ts", "r", "ui", "ux", "c#", "c++", "it"]:
                            continue
                        pattern = rf"\b{re.escape(alias)}\b"
                        if re.search(pattern, sent):
                            matched_alias = alias
                            matched_sentence = sent
                            break
                    if matched_alias:
                        break

            if matched_alias:
                seen_canonical_ids.add(skill_id)

                # Classify Importance (required vs preferred vs mentioned)
                importance = "required"
                if in_title:
                    importance = "required"
                    confidence = 0.98
                else:
                    is_preferred = any(pk in matched_sentence for pk in self.preferred_keywords)
                    is_required = any(rk in matched_sentence for rk in self.required_keywords)

                    if is_preferred and not is_required:
                        importance = "preferred"
                        confidence = 0.92
                    elif is_required:
                        importance = "required"
                        confidence = 0.95
                    else:
                        importance = "required" if category == "technical" else "mentioned"
                        confidence = 0.88

                extracted_skills.append({
                    "skill": canonical_name,
                    "skill_id": skill_id,
                    "canonical_name": canonical_name,
                    "category": category,
                    "matched_term": matched_alias,
                    "importance": importance,
                    "confidence": round(confidence, 2),
                    "source": "title" if in_title else "description",
                    "nlp_detected": True
                })

        return extracted_skills

    def extract_experience(self, text: str) -> Dict[str, Any]:
        """Extracts min and max years of experience."""
        cleaned = self.clean_text(text)
        lower = az_lower(cleaned)

        # Check for 'no experience required'
        if re.search(r"\b(?:təcrübə tələb olunmur|təcrübəsiz|təcrübə vacib deyil|no experience|təcrübəsiz namizədlər)\b", lower):
            return {"min": 0, "max": 0, "raw": "Təcrübə tələb olunmur"}

        # Pattern: 1-3 il / 1 - 3 il / 1dən 3 ilə qədər
        range_match = re.search(r"(\d+)\s*(?:-|—|dən|dan|–)\s*(\d+)\s*(?:il|ilə qədər|illik)?\s*(?:iş\s*)?təcrübə", lower)
        if range_match:
            min_y = int(range_match.group(1))
            max_y = int(range_match.group(2))
            return {"min": min_y, "max": max_y, "raw": f"{min_y}-{max_y} il"}

        # Pattern: minimum X il / ən azı X il / X ildən artıq
        min_match = re.search(r"(?:minimum|ən azı|azı|ildən artıq|ildən yuxarı|azı)\s*(\d+)\s*il", lower)
        if min_match:
            min_y = int(min_match.group(1))
            return {"min": min_y, "max": None, "raw": f"Minimum {min_y} il"}

        # Pattern: X il iş təcrübəsi / X il təcrübə
        simple_match = re.search(r"(\d+)\s*il(?:lik)?\s*(?:iş\s*)?təcrübə", lower)
        if simple_match:
            min_y = int(simple_match.group(1))
            return {"min": min_y, "max": None, "raw": f"{min_y} il"}

        return {"min": None, "max": None, "raw": "Qeyd olunmayıb"}

    def extract_languages(self, text: str) -> List[Dict[str, Any]]:
        """Extracts required and preferred languages along with detected CEFR / fluency level."""
        cleaned = self.clean_text(text)
        lower = az_lower(cleaned)
        extracted_languages = []

        lang_configs = [
            {"id": "english", "canonical": "English", "name_az": "İngilis dili", "aliases": ["ingilis dili", "english", "ingilis", "ielts", "toefl"]},
            {"id": "russian", "canonical": "Russian", "name_az": "Rus dili", "aliases": ["rus dili", "russian", "rus", "rusca"]},
            {"id": "azerbaijani", "canonical": "Azerbaijani", "name_az": "Azərbaycan dili", "aliases": ["azərbaycan dili", "ana dili", "səlis azərbaycan"]},
            {"id": "turkish", "canonical": "Turkish", "name_az": "Türk dili", "aliases": ["türk dili", "turkish", "türk", "türkcə"]},
            {"id": "german", "canonical": "German", "name_az": "Alman dili", "aliases": ["alman dili", "german", "alman"]},
            {"id": "french", "canonical": "French", "name_az": "Fransız dili", "aliases": ["fransız dili", "french", "fransız"]}
        ]

        for cfg in lang_configs:
            matched = False
            matched_sentence = ""
            for alias in cfg["aliases"]:
                pattern = rf"\b{re.escape(az_lower(alias))}\b"
                match = re.search(pattern, lower)
                if match:
                    matched = True
                    start = max(0, match.start() - 50)
                    end = min(len(lower), match.end() + 50)
                    matched_sentence = lower[start:end]
                    break

            if matched:
                level = "Tələb / İşgüzar"
                if re.search(r"\b(c2|c1|səlis|əla|advanced|fluent)\b", matched_sentence):
                    level = "C1 / Səlis"
                elif re.search(r"\b(b2|upper[ -]?intermediate|yaxşı)\b", matched_sentence):
                    level = "B2 / Yaxşı"
                elif re.search(r"\b(b1|intermediate|orta)\b", matched_sentence):
                    level = "B1 / Orta"
                elif re.search(r"\b(a2|a1|baza|elementar|elementary)\b", matched_sentence):
                    level = "A2 / Baza"

                importance = "required"
                if any(pk in matched_sentence for pk in self.preferred_keywords):
                    importance = "preferred"

                extracted_languages.append({
                    "language": cfg["canonical"],
                    "canonical_name": cfg["canonical"],
                    "language_az": cfg["name_az"],
                    "level": level,
                    "importance": importance,
                    "confidence": 0.95
                })

        return extracted_languages

    def extract_education(self, text: str) -> Dict[str, Any]:
        """Extracts education degree and field of study."""
        cleaned = self.clean_text(text)
        lower = az_lower(cleaned)

        degree_found = "Qeyd olunmayıb"
        for pattern, deg in self.degree_patterns:
            if re.search(pattern, lower):
                degree_found = deg
                break

        field_found = "Müvafiq sahə"
        for pattern, fld in self.edu_fields:
            if re.search(pattern, lower):
                field_found = fld
                break

        return {
            "degree": degree_found,
            "field": field_found,
            "display": f"{degree_found} ({field_found})" if degree_found != "Qeyd olunmayıb" else "Qeyd olunmayıb"
        }

    def calculate_quality_score(self, job_dict: Dict[str, Any], nlp_res: Dict[str, Any]) -> int:
        """
        Calculates Data Quality Score (0-100):
        - description present (+20)
        - skills extracted (+20)
        - salary specified (+10)
        - experience specified (+10)
        - education specified (+10)
        - date present (+10)
        - company present (+10)
        - location present (+10)
        """
        score = 0
        desc = job_dict.get("description", "")
        if desc and len(desc.strip()) >= 20:
            score += 20

        if nlp_res.get("skills_count", 0) > 0:
            score += 20

        sal = job_dict.get("salary", "")
        if sal and ("azn" in str(sal).lower() or job_dict.get("salary_min", 0) > 0):
            score += 10
        elif sal and sal != "Razılaşma yolu ilə" and sal != "":
            score += 5

        exp = nlp_res.get("experience", {}).get("raw", "")
        if exp and exp != "Qeyd olunmayıb":
            score += 10
        elif job_dict.get("experience", "Qeyd olunmayıb") != "Qeyd olunmayıb":
            score += 10

        edu = nlp_res.get("education", {}).get("degree", "")
        if edu and edu != "Qeyd olunmayıb":
            score += 10
        elif job_dict.get("education", "Qeyd olunmayıb") != "Qeyd olunmayıb":
            score += 10

        if job_dict.get("date") or job_dict.get("posted_date"):
            score += 10

        comp = job_dict.get("company", "")
        if comp and comp != "Şirkət qeyd olunmayıb" and len(comp.strip()) > 1:
            score += 10

        loc = job_dict.get("district", job_dict.get("location", ""))
        if loc and loc != "Azərbaycan" and len(loc.strip()) > 1:
            score += 10
        elif loc:
            score += 5

        return min(100, score)

    def process_vacancy(self, job_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs the full NLP pipeline on a single vacancy record and enriches it.
        """
        title = job_dict.get("title", "")
        desc = job_dict.get("description", "")

        # 1. Clean Text
        cleaned_desc = self.clean_text(desc)

        # 2. Language Detection
        detected_lang = self.detect_language(f"{title} {cleaned_desc}")

        # 3-5. Skill Extraction with Importance & Confidence
        extracted_skills = self.extract_skills_with_importance(cleaned_desc, title=title)

        # Combine with any preexisting explicit skills
        preexisting_skills = job_dict.get("skills", [])
        if isinstance(preexisting_skills, list):
            for s in preexisting_skills:
                if isinstance(s, str) and s.strip():
                    norm = self.normalizer.normalize(s)
                    if norm:
                        c_name = norm["canonical_name"]
                        if not any(es["canonical_name"] == c_name for es in extracted_skills):
                            extracted_skills.append({
                                "skill": c_name,
                                "skill_id": norm["id"],
                                "canonical_name": c_name,
                                "category": norm["category"],
                                "matched_term": s,
                                "importance": "required",
                                "confidence": 0.99,
                                "source": "explicit_list",
                                "nlp_detected": False
                            })

        # 6. Experience
        exp_res = self.extract_experience(cleaned_desc)

        # 7. Languages
        lang_res = self.extract_languages(cleaned_desc)

        # 8. Education
        edu_res = self.extract_education(cleaned_desc)

        # Build categorized lists
        required_skills = [s["canonical_name"] for s in extracted_skills if s["importance"] == "required"]
        preferred_skills = [s["canonical_name"] for s in extracted_skills if s["importance"] == "preferred"]
        all_canonical_skill_names = list(dict.fromkeys([s["canonical_name"] for s in extracted_skills]))

        nlp_meta = {
            "primary_language": detected_lang,
            "skills_count": len(all_canonical_skill_names),
            "experience": exp_res,
            "languages": lang_res,
            "education": edu_res
        }

        # 9. Quality Score
        quality_score = self.calculate_quality_score(job_dict, nlp_meta)

        enriched_job = dict(job_dict)
        enriched_job["description"] = cleaned_desc
        enriched_job["skills"] = all_canonical_skill_names
        enriched_job["nlp_extracted_skills"] = extracted_skills
        enriched_job["required_skills"] = required_skills
        enriched_job["preferred_skills"] = preferred_skills
        enriched_job["extracted_languages"] = lang_res
        enriched_job["extracted_experience"] = exp_res
        enriched_job["extracted_education"] = edu_res
        enriched_job["data_quality_score"] = quality_score
        enriched_job["primary_language"] = detected_lang

        return enriched_job
