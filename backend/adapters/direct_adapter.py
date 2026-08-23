"""
Direct Employer Upload Adapter (Partner Companies)
"""
from typing import Dict, Any
from .base_adapter import BaseAdapter, StandardJobPost
from ..nlp.extractor import NLPExtractor


class DirectEmployerAdapter(BaseAdapter):
    def __init__(self):
        super().__init__("Direct Partner Upload")
        self.extractor = NLPExtractor()

    def parse_raw_item(self, raw_item: Dict[str, Any]) -> StandardJobPost:
        vac_id = f"partner_{raw_item.get('id', abs(hash(raw_item.get('title', ''))))}"
        title = raw_item.get("title", "").strip()
        company = raw_item.get("company", "Tərəfdaş Şirkət").strip()
        desc = raw_item.get("description", "").strip()
        nlp_res = self.extractor.extract_all(f"{title} {desc}")

        explicit_skills = raw_item.get("skills", [])
        extracted = nlp_res["technical"] + nlp_res["soft"]
        for s in explicit_skills:
            if isinstance(s, str):
                extracted.append({"id": s.lower(), "canonical_name": s.title(), "category": "technical"})

        return StandardJobPost(
            id=vac_id,
            title=title,
            company=company,
            sector=raw_item.get("sector", "Biznes & IT"),
            location=raw_item.get("location", "Bakı"),
            education=raw_item.get("education", nlp_res["education"]),
            experience=raw_item.get("experience", nlp_res["experience"]),
            salary_min=raw_item.get("salary_min", 0),
            salary_max=raw_item.get("salary_max", 0),
            languages=[l["canonical_name"] for l in nlp_res["languages"]],
            description=desc,
            source="Tərəfdaş Şirkət (Doğrudan Yükləmə)",
            source_url=raw_item.get("apply_url", "#"),
            posted_date=raw_item.get("date", ""),
            extracted_skills=extracted,
            is_demo=0
        )
