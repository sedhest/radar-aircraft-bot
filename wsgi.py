"""
WSGI-обёртка для деплоя на Render/Heroku.
Использует gunicorn для запуска HTTPServer-приложения.

Запуск: gunicorn wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
"""

import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from server import Handler


def application(environ, start_response):
    """Простое WSGI-приложение для gunicorn."""
    from io import BytesIO
    
    path = environ.get('PATH_INFO', '/')
    
    # API routes
    if path == '/api/aircrafts':
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
        from data import list_aircrafts
        body = str.encode(str(list_aircrafts()))
        status = '200 OK'
        headers = [('Content-Type', 'application/json; charset=utf-8')]
    elif path.startswith('/api/sections/'):
        aircraft_id = path.split('/')[3] if len(path.split('/')) > 3 else ""
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
        from data import get_aircraft_sections
        sections = get_aircraft_sections(aircraft_id)
        if sections:
            body = str.encode(str({"status": "ok", "data": sections}))
        else:
            body = str.encode(str({"status": "error", "message": "Not found"}))
            status = '404 Not Found'
        headers = [('Content-Type', 'application/json; charset=utf-8')]
    elif path.startswith('/api/section/'):
        parts = path.split('/')
        aircraft_id = parts[3] if len(parts) > 3 else ""
        section_id = parts[4] if len(parts) > 4 else ""
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
        from data import get_aircraft_section
        section = get_aircraft_section(aircraft_id, section_id)
        if section:
            body = str.encode(str({"status": "ok", "data": section}))
        else:
            body = str.encode(str({"status": "error", "message": "Not found"}))
            status = '404 Not Found'
        headers = [('Content-Type', 'application/json; charset=utf-8')]
    else:
        # Static files from frontend/
        frontend_dir = Path(__file__).parent / "frontend"
        file_path = frontend_dir / (path.lstrip('/') or 'index.html')
        
        if file_path.exists() and file_path.is_file():
            with open(file_path, 'rb') as f:
                body = f.read()
            
            # Set correct content type based on file extension
            ext = file_path.suffix.lower()
            content_types = {
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
            }
            ct = content_types.get(ext, 'application/octet-stream')
            headers = [('Content-Type', ct)]
        else:
            body = b'{"error": "Not found"}'
            status = '404 Not Found'
            headers = [('Content-Type', 'application/json; charset=utf-8')]
    
    start_response(status, headers)
    return [body]


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"🚀 Запуск на порту {port}")
    server.serve_forever()
