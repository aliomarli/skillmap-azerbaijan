"""
SkillMap Azerbaijan - Database Seeding Utility
Run with: py backend/seed.py [path_to_json]
"""

import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.db.database import DatabaseManager


def main():
    json_path = sys.argv[1] if len(sys.argv) > 1 else str(root_dir / "data.json.json")
    if not os.path.exists(json_path):
        json_path = str(root_dir / "data.json")

    print(f"[*] Seeding database from: {json_path}")
    db = DatabaseManager()
    count = db.seed_jobs_from_file(json_path)
    print(f"[OK] Seeding completed: {count} jobs inserted.")


if __name__ == "__main__":
    main()