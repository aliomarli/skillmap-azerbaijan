"""
LinkedIn Open Talent Data Adapter
"""
from typing import Dict, Any
from .base_adapter import BaseAdapter, StandardJobPost
from ..nlp.extractor import NLPExtractor


class LinkedInAdapter(BaseAdapter):
    def __init__(self):
        super().__init__("LinkedIn")
        self.extractor = NLPExtractor()

    def parse_raw_item(self, raw_item: Dict[str, Any]) -> StandardJobPost:
        vac_id = f"li_{raw_item.get('job_id', abs(hash(raw_item.get('title', ''))))}"
        title = raw_item.get("title", "").strip()
        company = raw_item.get("company", "").strip()
        desc = raw_item.get("description", "").strip()
        nlp_res = self.extractor.extract_all(f"{title} {desc}")

        return StandardJobPost(
            id=vac_id,
            title=title,
            company=company,
            sector=raw_item.get("industry", "IT & Rəqəmsal"),
            location=raw_item.get("location", "Baku, Azerbaijan"),
            education=nlp_res["education"],
            experience=nlp_res["experience"],
            salary_min=raw_item.get("salary_min", 0),
            salary_max=raw_item.get("salary_max", 0),
            languages=[l["canonical_name"] for l in nlp_res["languages"]],
            description=desc,
            source="LinkedIn",
            source_url=raw_item.get("url", "https://linkedin.com"),
            posted_date=raw_item.get("posted_at", ""),
            extracted_skills=nlp_res["technical"] + nlp_res["soft"],
            is_demo=0
        )
