"""
Boss.az Data Adapter
"""
from typing import Dict, Any
from .base_adapter import BaseAdapter, StandardJobPost
from ..nlp.extractor import NLPExtractor


class BossAzAdapter(BaseAdapter):
    def __init__(self):
        super().__init__("Boss.az")
        self.extractor = NLPExtractor()

    def parse_raw_item(self, raw_item: Dict[str, Any]) -> StandardJobPost:
        vac_id = f"boss_{raw_item.get('id', abs(hash(raw_item.get('title', ''))))}"
        title = raw_item.get("title", "Adsız Vəzifə").strip()
        company = raw_item.get("company", "Şirkət qeyd olunmayıb").strip()
        sector = raw_item.get("category", raw_item.get("sector", "Digər")).strip()
        location = raw_item.get("city", raw_item.get("location", "Bakı")).strip()
        desc = raw_item.get("requirements", raw_item.get("description", "")).strip()
        salary_str = str(raw_item.get("salary", "Razılaşma yolu ilə"))
        min_sal, max_sal = self.extract_salary_range(salary_str)

        nlp_res = self.extractor.extract_all(f"{title} {desc}")
        languages = [l["canonical_name"] for l in nlp_res["languages"]]
        extracted_skills = nlp_res["technical"] + nlp_res["soft"]

        return StandardJobPost(
            id=vac_id,
            title=title,
            company=company,
            sector=sector,
            location=location,
            education=nlp_res["education"],
            experience=raw_item.get("experience", nlp_res["experience"]),
            salary_min=min_sal,
            salary_max=max_sal,
            languages=languages,
            description=desc,
            source="Boss.az",
            source_url=raw_item.get("url", raw_item.get("source_url", "https://boss.az")),
            posted_date=raw_item.get("date", ""),
            extracted_skills=extracted_skills,
            is_demo=0
        )
