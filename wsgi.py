"""
WSGI-обёртка для деплоя на Render/Heroku.
Flask-приложение + gunicorn.

Запуск: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder="frontend", static_url_path="/")

# Import data functions
from data import list_aircrafts, get_aircraft_sections, get_aircraft_section


# ==================== API routes ====================

@app.route("/api/aircrafts")
def api_aircrafts():
    return jsonify(list_aircrafts())


@app.route("/api/sections/<aircraft_id>")
def api_sections(aircraft_id):
    sections = get_aircraft_sections(aircraft_id)
    if sections:
        return jsonify({"status": "ok", "data": sections})
    return jsonify({"status": "error", "message": "Aircraft not found"}), 404


@app.route("/api/section/<aircraft_id>/<section_id>")
def api_section(aircraft_id, section_id):
    section = get_aircraft_section(aircraft_id, section_id)
    if section:
        return jsonify({"status": "ok", "data": section})
    return jsonify({"status": "error", "message": "Section not found"}), 404


# ==================== Static files ====================

@app.route("/")
def index():
    return send_from_directory("frontend", "index.html")


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=True)
