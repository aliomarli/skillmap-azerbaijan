"""
SkillMap Azerbaijan - Skill Normalizer
Normalizes raw strings ("MS Excel", "SQL Server", "React.js") into canonical skills ("Excel", "SQL", "React").
"""

import re
from typing import Optional, Dict, List
from .taxonomy import CANONICAL_SKILLS


class SkillNormalizer:
    def __init__(self):
        self.skills_by_id = {s["id"]: s for s in CANONICAL_SKILLS}
        self.alias_to_skill_map: Dict[str, Dict] = {}
        self._build_index()

    def _build_index(self):
        for skill in CANONICAL_SKILLS:
            self.alias_to_skill_map[skill["canonical_name"].lower()] = skill
            self.alias_to_skill_map[skill["id"].lower()] = skill
            for alias in skill.get("aliases", []):
                self.alias_to_skill_map[alias.lower()] = skill

    def normalize(self, raw_name: str) -> Optional[Dict]:
        if not raw_name:
            return None
        cleaned = raw_name.strip().lower()
        if cleaned in self.alias_to_skill_map:
            return self.alias_to_skill_map[cleaned]

        for alias, skill in self.alias_to_skill_map.items():
            pattern = rf"\b{re.escape(alias)}\b"
            if re.search(pattern, cleaned):
                return skill

        return None

    def get_canonical_name(self, raw_name: str) -> str:
        matched = self.normalize(raw_name)
        return matched["canonical_name"] if matched else raw_name.strip()

    def get_canonical_id(self, raw_name: str) -> Optional[str]:
        matched = self.normalize(raw_name)
        return matched["id"] if matched else None

    def get_all_skills(self) -> List[Dict]:
        return CANONICAL_SKILLS
