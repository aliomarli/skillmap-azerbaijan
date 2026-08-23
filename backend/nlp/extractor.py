"""
SkillMap Azerbaijan - NLP Extractor Wrapper
"""

from typing import Dict, Any
from .pipeline import NLPPipeline
from .taxonomy import CANONICAL_SKILLS
from .normalizer import SkillNormalizer


class NLPExtractor:
    def __init__(self):
        self.pipeline = NLPPipeline()
        self.normalizer = SkillNormalizer()

    def extract_all(self, text: str, title: str = "") -> Dict[str, Any]:
        cleaned = self.pipeline.clean_text(text)
        skills = self.pipeline.extract_skills_with_importance(cleaned, title=title)
        exp = self.pipeline.extract_experience(cleaned)
        langs = self.pipeline.extract_languages(cleaned)
        edu = self.pipeline.extract_education(cleaned)

        tech = [s for s in skills if s["category"] == "technical"]
        business = [s for s in skills if s["category"] == "business"]
        soft = [s for s in skills if s["category"] == "soft"]

        return {
            "technical": tech,
            "business": business,
            "soft": soft,
            "all_skills": skills,
            "languages": langs,
            "education": edu["display"],
            "education_details": edu,
            "experience": exp["raw"],
            "experience_details": exp,
            "extracted_count": len(skills),
            "confidence": 0.95 if len(skills) > 0 else 0.0
        }
