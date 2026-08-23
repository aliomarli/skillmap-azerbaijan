"""
SkillMap Azerbaijan - Backend Server Launcher
Run with: py backend/run_server.py
"""

import sys
import os
from pathlib import Path

# Ensure root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.db.database import DatabaseManager
from backend.api.server import run_api_server


def main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("=" * 60)
    print("  [*] SkillMap Azerbaijan - Web & REST API Server")
    print("=" * 60)

    db = DatabaseManager()
    
    # Check if jobs are seeded
    with db.get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
    
    if count == 0:
        json_path = root_dir / "data.json.json"
        if not json_path.exists():
            json_path = root_dir / "data.json"
        
        if json_path.exists():
            print(f"[+] Seeding initial jobs from {json_path.name}...")
            db.seed_jobs_from_file(str(json_path))
        else:
            print("[!] Warning: data.json not found for automatic seeding.")
    else:
        print(f"[OK] Database ready. Active jobs in database: {count}")

    # Start API server on 127.0.0.1:8000
    run_api_server(host="127.0.0.1", port=8000, db=db)


if __name__ == "__main__":
    main()