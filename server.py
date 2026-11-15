"""
Сервер для Web App + API.
Запуск локально: python server.py
Для продакшена (Render/Heroku): gunicorn wsgi:application

Открывает http://localhost:8080 — это URL для WEB_APP_URL в bot.py
"""

import json
import os
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Import data module
sys_path = os.path.join(os.path.dirname(__file__), "backend")
if sys_path not in __import__("sys").path:
    __import__("sys").path.insert(0, sys_path)

from data import list_aircrafts, get_aircraft_sections, get_aircraft_section

FRONTEND_DIR = Path(__file__).parent / "frontend"


class Handler(SimpleHTTPRequestHandler):
    """HTTP-обработчик с API-роутами."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    # ---------- API routes ----------

    def do_GET(self):
        if self.path == "/api/aircrafts":
            return self._json_response(list_aircrafts())
        elif self.path.startswith("/api/sections/"):
            parts = self.path.split("/")  # ['', 'api', 'sections', '<id>']
            aircraft_id = parts[3] if len(parts) > 3 else ""
            sections = get_aircraft_sections(aircraft_id)
            if sections:
                return self._json_response({"status": "ok", "data": sections})
            return self._json_response({"status": "error", "message": "Не найдено"}, 404)
        elif self.path.startswith("/api/section/"):
            parts = self.path.split("/")  # ['', 'api', 'section', '<ac>', '<sec>']
            aircraft_id = parts[3] if len(parts) > 3 else ""
            section_id = parts[4] if len(parts) > 4 else ""
            section = get_aircraft_section(aircraft_id, section_id)
            if section:
                return self._json_response({"status": "ok", "data": section})
            return self._json_response({"status": "error", "message": "Не найдено"}, 404)
        else:
            # Serve static files from frontend/
            super().do_GET()

    def _json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # Override to disable logging for static files (optional)
    def log_message(self, format, *args):
        pass  # Suppress default logging


def main():
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"🚀 Сервер запущен: http://localhost:{port}")
    print(f"   Web App URL: http://localhost:{port}/")
    print(f"   API:         http://localhost:{port}/api/aircrafts")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен.")
        server.server_close()


if __name__ == "__main__":
    main()
