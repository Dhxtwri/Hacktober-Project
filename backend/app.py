"""Flask API for the YojanaSaathi preliminary eligibility engine."""

from __future__ import annotations

import os

from flask import Flask, jsonify, request

from rules_engine import evaluate_all, scheme_metadata, validate_profile
from supabase_store import SupabaseStore


app = Flask(__name__)
store = SupabaseStore()


def client_session_id() -> str:
    """Return the anonymous browser session identifier used for persistence."""
    value = request.headers.get("X-Client-Session", "").strip()
    return value[:128]


def application_payload(payload: object) -> dict[str, str] | None:
    if not isinstance(payload, dict):
        return None

    fields = (
        "id",
        "scheme_id",
        "scheme_name",
        "applied_date",
        "application_number",
        "status",
        "stage_description",
        "notes",
    )
    if any(not isinstance(payload.get(field), str) for field in fields):
        return None
    if payload["status"] not in {"DRAFT", "SUBMITTED", "UNDER_VERIFICATION", "APPROVED", "DISBURSED"}:
        return None
    return {field: payload[field] for field in fields}


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Client-Session"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "YojanaSaathi eligibility engine",
        "supported_scheme_count": len(scheme_metadata()),
    })


@app.get("/api/schemes")
def schemes():
    return jsonify({"schemes": list(scheme_metadata().values())})


@app.post("/api/eligibility")
def eligibility():
    if not request.is_json:
        return jsonify({
            "error": {
                "code": "invalid_content_type",
                "message": "Send a JSON request with Content-Type: application/json.",
            }
        }), 400

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or "profile" not in payload:
        return jsonify({
            "error": {
                "code": "invalid_request",
                "message": "Request body must be an object containing a profile object.",
            }
        }), 400

    profile = payload["profile"]
    errors = validate_profile(profile)
    if errors:
        return jsonify({
            "error": {
                "code": "validation_error",
                "message": "The profile contains invalid values.",
                "fields": errors,
            }
        }), 400

    results = evaluate_all(profile)
    try:
        store.save_eligibility(client_session_id(), profile, results)
    except RuntimeError:
        # Persistence should not make the rules engine unavailable.
        pass

    return jsonify({
        "results": results,
        "screening_notice": "These are preliminary screening outcomes, not official government decisions.",
    })


@app.get("/api/applications")
def applications():
    try:
        records = store.list_applications(client_session_id())
    except RuntimeError:
        records = []
    return jsonify({"applications": records})


@app.post("/api/applications")
def create_application():
    application = application_payload(request.get_json(silent=True))
    if application is None:
        return jsonify({
            "error": {
                "code": "validation_error",
                "message": "Application data is incomplete or contains an unsupported status.",
            }
        }), 400
    try:
        store.save_application(client_session_id(), application)
    except RuntimeError:
        pass
    return jsonify({"application": application}), 201


@app.patch("/api/applications/<application_id>")
def update_application(application_id: str):
    payload = request.get_json(silent=True)
    if isinstance(payload, dict):
        payload = {**payload, "id": application_id}
    else:
        payload = {"id": application_id}
    application = application_payload(payload)
    if application is None:
        return jsonify({
            "error": {
                "code": "validation_error",
                "message": "Application data is incomplete or contains an unsupported status.",
            }
        }), 400
    try:
        store.save_application(client_session_id(), application)
    except RuntimeError:
        pass
    return jsonify({"application": application})


@app.delete("/api/applications/<application_id>")
def remove_application(application_id: str):
    try:
        store.delete_application(client_session_id(), application_id)
    except RuntimeError:
        pass
    return jsonify({"deleted": True})


@app.errorhandler(404)
def not_found(_error):
    return jsonify({
        "error": {
            "code": "not_found",
            "message": "The requested API route was not found.",
        }
    }), 404


@app.errorhandler(405)
def method_not_allowed(_error):
    return jsonify({
        "error": {
            "code": "method_not_allowed",
            "message": "The HTTP method is not supported for this API route.",
        }
    }), 405


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
