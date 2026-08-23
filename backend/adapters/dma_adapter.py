"""
State Employment Agency (DMA / MAS) Data Adapter
"""
from typing import Dict, Any
from .base_adapter import BaseAdapter, StandardJobPost
from ..nlp.extractor import NLPExtractor


class DMAAdapter(BaseAdapter):
    def __init__(self):
        super().__init__("DMA / MAS")
        self.extractor = NLPExtractor()

    def parse_raw_item(self, raw_item: Dict[str, Any]) -> StandardJobPost:
        vac_id = f"dma_{raw_item.get('code', abs(hash(raw_item.get('title', ''))))}"
        title = raw_item.get("title", raw_item.get("profession", "")).strip()
        desc = raw_item.get("requirements", raw_item.get("description", "")).strip()
        nlp_res = self.extractor.extract_all(f"{title} {desc}")

        return StandardJobPost(
            id=vac_id,
            title=title,
            company=raw_item.get("employer", "Dövlət / Özəl Müəssisə").strip(),
            sector=raw_item.get("economic_sector", "Dövlət Reyestri").strip(),
            location=raw_item.get("region", "Bakı").strip(),
            education=raw_item.get("education_level", nlp_res["education"]),
            experience=raw_item.get("experience_years", nlp_res["experience"]),
            salary_min=raw_item.get("wage_min", 0),
            salary_max=raw_item.get("wage_max", 0),
            languages=[l["canonical_name"] for l in nlp_res["languages"]],
            description=desc,
            source="Dövlət Məşğulluq Agentliyi",
            source_url="https://dma.gov.az",
            posted_date=raw_item.get("registration_date", ""),
            extracted_skills=nlp_res["technical"] + nlp_res["soft"],
            is_demo=0
        )
