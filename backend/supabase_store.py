"""Small Supabase REST client used by the Flask API.

The browser never receives the Supabase service key. Persistence is best effort so
the eligibility engine remains usable when Supabase is not configured or is
temporarily unavailable.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


LOGGER = logging.getLogger(__name__)


def _load_local_env() -> None:
    """Load the project-root .env without adding a runtime dependency."""
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if not os.path.isfile(env_path):
        return

    try:
        with open(env_path, encoding="utf-8") as env_file:
            for line in env_file:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                name, value = line.split("=", 1)
                value = value.strip().strip('"').strip("'")
                os.environ.setdefault(name.strip(), value)
    except OSError as error:
        LOGGER.warning("Could not read local environment file: %s", error)


class SupabaseStore:
    def __init__(self) -> None:
        _load_local_env()
        self.url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    @property
    def configured(self) -> bool:
        return bool(self.url and self.key)

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _request(
        self,
        method: str,
        table: str,
        payload: Any = None,
        query: str = "",
        prefer: str = "return=representation",
    ) -> Any:
        if not self.configured:
            return None

        body = None if payload is None else json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.url}/rest/v1/{table}{query}",
            data=body,
            method=method,
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Prefer": prefer,
            },
        )

        try:
            with urlopen(request, timeout=8) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            detail = ""
            if isinstance(error, HTTPError):
                detail = error.read().decode("utf-8", errors="replace")[:500]
            LOGGER.warning("Supabase %s %s failed: %s %s", method, table, error, detail)
            raise RuntimeError("Supabase persistence request failed") from error

    def _ensure_session(self, client_session_id: str) -> None:
        self._request(
            "POST",
            "citizen_sessions",
            {
                "client_session_id": client_session_id,
                "last_seen_at": self._timestamp(),
            },
            prefer="resolution=merge-duplicates,return=minimal",
        )

    def save_eligibility(
        self,
        client_session_id: str,
        profile: dict[str, Any],
        results: list[dict[str, Any]],
    ) -> bool:
        if not self.configured or not client_session_id:
            return False

        self._ensure_session(client_session_id)
        submission = self._request(
            "POST",
            "eligibility_submissions",
            {
                "client_session_id": client_session_id,
                "profile": profile,
            },
        )
        submission_id = submission[0]["id"] if submission else None
        if not submission_id:
            raise RuntimeError("Supabase did not return an eligibility submission id")

        result_rows = [
            {
                "submission_id": submission_id,
                "client_session_id": client_session_id,
                "scheme_id": result["scheme_id"],
                "scheme_name": result["scheme_name"],
                "status": result["status"],
                "summary": result["summary"],
                "matched_criteria": result["matched_criteria"],
                "failed_criteria": result["failed_criteria"],
                "missing_information": result["missing_information"],
                "benefit": result["benefit"],
                "required_documents": result["required_documents"],
                "official_sources": result["official_sources"],
                "limitations": result["limitations"],
            }
            for result in results
        ]
        if result_rows:
            self._request("POST", "eligibility_results", result_rows, prefer="return=minimal")
        return True

    def list_applications(self, client_session_id: str) -> list[dict[str, Any]]:
        if not self.configured or not client_session_id:
            return []
        self._ensure_session(client_session_id)
        query = (
            f"?client_session_id=eq.{quote(client_session_id, safe='')}"
            "&order=created_at.asc"
        )
        return self._request("GET", "tracked_applications", query=query) or []

    def save_application(self, client_session_id: str, application: dict[str, Any]) -> bool:
        if not self.configured or not client_session_id:
            return False
        self._ensure_session(client_session_id)
        payload = {
            **application,
            "client_session_id": client_session_id,
            "updated_at": self._timestamp(),
        }
        self._request(
            "POST",
            "tracked_applications",
            payload,
            query="?on_conflict=id",
            prefer="resolution=merge-duplicates,return=minimal",
        )
        return True

    def delete_application(self, client_session_id: str, application_id: str) -> bool:
        if not self.configured or not client_session_id:
            return False
        query = (
            f"?id=eq.{quote(application_id, safe='')}"
            f"&client_session_id=eq.{quote(client_session_id, safe='')}"
        )
        self._request("DELETE", "tracked_applications", query=query, prefer="return=minimal")
        return True
