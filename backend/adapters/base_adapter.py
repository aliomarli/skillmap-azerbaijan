"""
SkillMap Azerbaijan - Base Data Source Adapter & Standard Job Model
Provides contract for ethical, standardized integration across all job data providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import re
from datetime import datetime


@dataclass
class StandardJobPost:
    id: str
    title: str
    company: str = "Şirkət qeyd olunmayıb"
    sector: str = "Digər"
    location: str = "Azərbaycan"
    education: str = "Qeyd olunmayıb"
    experience: str = "Qeyd olunmayıb"
    salary_min: int = 0
    salary_max: int = 0
    languages: List[str] = field(default_factory=list)
    description: str = ""
    source: str = "Generic"
    source_url: str = ""
    posted_date: str = ""
    collected_at: str = field(default_factory=lambda: datetime.now().isoformat())
    extracted_skills: List[Dict[str, Any]] = field(default_factory=list)
    is_demo: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BaseAdapter(ABC):
    def __init__(self, source_name: str):
        self.source_name = source_name

    @abstractmethod
    def parse_raw_item(self, raw_item: Dict[str, Any]) -> StandardJobPost:
        pass

    def parse_batch(self, raw_items: List[Dict[str, Any]]) -> List[StandardJobPost]:
        parsed = []
        for item in raw_items:
            try:
                job = self.parse_raw_item(item)
                if job:
                    parsed.append(job)
            except Exception as e:
                print(f"[Adapter Error - {self.source_name}] Failed to parse item: {e}")
        return parsed

    @staticmethod
    def extract_salary_range(salary_str: str) -> tuple[int, int]:
        if not salary_str:
            return (0, 0)
        
        cleaned = salary_str.replace(" ", "").replace("\u00a0", "").lower()
        if "razılaşma" in cleaned or "qeydolunmayıb" in cleaned:
            return (0, 0)

        range_match = re.search(r"(\d+)(?:-|—|dan|dək)(\d+)", cleaned)
        if range_match:
            return (int(range_match.group(1)), int(range_match.group(2)))

        single_match = re.search(r"(\d+)", cleaned)
        if single_match:
            val = int(single_match.group(1))
            return (val, val)

        return (0, 0)
