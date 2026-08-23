"""
Jobsearch.az Data Adapter
"""
from typing import Dict, Any
from .base_adapter import BaseAdapter, StandardJobPost
from ..nlp.extractor import NLPExtractor


class JobsearchAdapter(BaseAdapter):
    def __init__(self):
        super().__init__("Jobsearch.az")
        self.extractor = NLPExtractor()

    def parse_raw_item(self, raw_item: Dict[str, Any]) -> StandardJobPost:
        vac_id = str(raw_item.get("id", f"vac_{abs(hash(raw_item.get('title', '')))}"))
        if not vac_id.startswith("vac_"):
            vac_id = f"vac_{vac_id}"

        title = raw_item.get("title", "Adsız Vəzifə").strip()
        company = raw_item.get("company", "Şirkət qeyd olunmayıb").strip()
        sector = raw_item.get("sector", "Digər").strip()
        location = raw_item.get("district", raw_item.get("location", "Azərbaycan")).strip()
        desc = raw_item.get("description", "").strip()
        salary_str = raw_item.get("salary", "Razılaşma yolu ilə")
        min_sal, max_sal = self.extract_salary_range(salary_str)
        exp = raw_item.get("experience", "Qeyd olunmayıb").strip()

        nlp_res = self.extractor.extract_all(f"{title} {desc}")
        if exp == "Qeyd olunmayıb" and nlp_res["experience"] != "Qeyd olunmayıb":
            exp = nlp_res["experience"]

        languages = [l.get("canonical_name", l.get("language", "")) for l in nlp_res.get("languages", [])]
        extracted_skills = nlp_res.get("technical", []) + nlp_res.get("business", []) + nlp_res.get("soft", [])

        return StandardJobPost(
            id=vac_id,
            title=title,
            company=company,
            sector=sector,
            location=location,
            education=nlp_res["education"],
            experience=exp,
            salary_min=min_sal,
            salary_max=max_sal,
            languages=languages,
            description=desc,
            source="Jobsearch.az",
            source_url=raw_item.get("applyUrl", raw_item.get("source_url", "https://jobsearch.az")),
            posted_date=raw_item.get("date", raw_item.get("posted_date", "")),
            extracted_skills=extracted_skills,
            is_demo=0
        )
