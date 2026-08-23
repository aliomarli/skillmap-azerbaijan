"""
SkillMap Azerbaijan - Built-in Zero-Dependency REST API & Web Server
Serves static frontend (HTML, CSS, JS) and /api REST endpoints simultaneously.
"""

import json
import mimetypes
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional
from ..db.database import DatabaseManager
from .routes import ApiHandler

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class SkillMapApiServer(BaseHTTPRequestHandler):
    handler_instance: Optional[ApiHandler] = None

    def _set_cors_headers(self, status_code: int = 200, content_type: str = "application/json; charset=utf-8"):
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_cors_headers(204)

    def do_GET(self):
        clean_path = self.path.split("?")[0]

        # 1. API Route
        if clean_path.startswith("/api"):
            if not self.handler_instance:
                self._set_cors_headers(500)
                self.wfile.write(b'{"error": "Server not initialized"}')
                return

            status, response = self.handler_instance.handle_request("GET", self.path)
            self._set_cors_headers(status)
            self.wfile.write(json.dumps(response, ensure_ascii=False, indent=2).encode("utf-8"))
            return

        # 2. Static File Route
        if clean_path == "/" or clean_path == "":
            file_path = PROJECT_ROOT / "index.html"
        else:
            rel_path = clean_path.lstrip("/")
            file_path = (PROJECT_ROOT / rel_path).resolve()

        # Security check: ensure file is inside PROJECT_ROOT
        try:
            file_path.relative_to(PROJECT_ROOT)
        except ValueError:
            self._set_cors_headers(403, "text/plain")
            self.wfile.write(b"Forbidden")
            return

        if file_path.is_file():
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if not mime_type:
                mime_type = "application/octet-stream"
            if mime_type.startswith("text/") or mime_type in ["application/javascript", "application/json"]:
                mime_type += "; charset=utf-8"

            self._set_cors_headers(200, mime_type)
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self._set_cors_headers(404, "text/plain; charset=utf-8")
            self.wfile.write(b"404 - Fayl tapilmadi")

    def do_POST(self):
        clean_path = self.path.split("?")[0]
        if clean_path.startswith("/api"):
            if not self.handler_instance:
                self._set_cors_headers(500)
                self.wfile.write(b'{"error": "Server not initialized"}')
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = None
            if content_length > 0:
                raw_body = self.rfile.read(content_length).decode("utf-8")
                try:
                    body = json.loads(raw_body)
                except Exception as e:
                    self._set_cors_headers(400)
                    self.wfile.write(json.dumps({"error": "Invalid JSON", "details": str(e)}).encode("utf-8"))
                    return

            status, response = self.handler_instance.handle_request("POST", self.path, body)
            self._set_cors_headers(status)
            self.wfile.write(json.dumps(response, ensure_ascii=False, indent=2).encode("utf-8"))
        else:
            self._set_cors_headers(405, "text/plain")
            self.wfile.write(b"Method Not Allowed")

    def log_message(self, format, *args):
        pass


def run_api_server(host: str = "127.0.0.1", port: int = 8000, db: Optional[DatabaseManager] = None):
    db_manager = db or DatabaseManager()
    SkillMapApiServer.handler_instance = ApiHandler(db_manager)
    server_address = (host, port)
    httpd = HTTPServer(server_address, SkillMapApiServer)
    print(f"[OK] SkillMap Azerbaijan Web & API Server running at http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

