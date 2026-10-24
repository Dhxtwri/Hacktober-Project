from copy import deepcopy

import pytest

from app import app


BASE_PROFILE = {
    "name": "Test Citizen",
    "age": 72,
    "state": "Uttar Pradesh",
    "gender": "female",
    "annual_family_income": 90000,
    "aadhaar_available": "yes",
    "landholding_status": "yes",
    "farmer_family_status": "yes",
    "institutional_landholder": "no",
    "constitutional_officeholder": "no",
    "public_representative": "no",
    "government_employee": "no",
    "pensioner": "no",
    "income_tax_payer": "no",
    "registered_professional": "no",
    "household_lpg_connection": "no",
    "pmuy_eligibility_category": "poor_household_declaration",
}


@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def post_profile(client, profile=None):
    return client.post("/api/eligibility", json={"profile": profile or BASE_PROFILE})


def result_map(response):
    return {item["scheme_id"]: item for item in response.get_json()["results"]}


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {
        "status": "ok",
        "service": "YojanaSaathi eligibility engine",
        "supported_scheme_count": 3,
    }


def test_eligibility_returns_three_consistent_results(client):
    response = post_profile(client)
    assert response.status_code == 200
    results = response.get_json()["results"]
    assert {item["scheme_id"] for item in results} == {"ab-pmjay-70-plus", "pm-kisan", "pmuy"}
    expected_keys = {
        "scheme_id", "scheme_name", "status", "summary", "matched_criteria",
        "failed_criteria", "missing_information", "benefit", "required_documents",
        "official_sources", "limitations",
    }
    assert all(set(item) == expected_keys for item in results)
    assert all(item["official_sources"] for item in results)


@pytest.mark.parametrize(
    ("age", "expected"),
    [(69, "likely_ineligible"), (70, "likely_eligible"), (85, "likely_eligible")],
)
def test_pmjay_senior_citizen_age_pathway(client, age, expected):
    profile = deepcopy(BASE_PROFILE)
    profile["age"] = age
    response = post_profile(client, profile)
    assert response.status_code == 200
    assert result_map(response)["ab-pmjay-70-plus"]["status"] == expected


def test_pmjay_income_does_not_change_70_plus_result(client):
    low_income = deepcopy(BASE_PROFILE)
    high_income = deepcopy(BASE_PROFILE)
    high_income["annual_family_income"] = 99999999
    assert result_map(post_profile(client, low_income))["ab-pmjay-70-plus"]["status"] == "likely_eligible"
    assert result_map(post_profile(client, high_income))["ab-pmjay-70-plus"]["status"] == "likely_eligible"


def test_pmjay_requires_aadhaar_availability(client):
    profile = deepcopy(BASE_PROFILE)
    profile["aadhaar_available"] = "unknown"
    result = result_map(post_profile(client, profile))["ab-pmjay-70-plus"]
    assert result["status"] == "needs_more_information"
    assert "whether Aadhaar-based e-KYC is available" in result["missing_information"]


@pytest.mark.parametrize(
    "field",
    [
        "institutional_landholder",
        "constitutional_officeholder",
        "public_representative",
        "income_tax_payer",
        "registered_professional",
    ],
)
def test_pm_kisan_each_direct_exclusion_is_ineligible(client, field):
    profile = deepcopy(BASE_PROFILE)
    profile[field] = "yes"
    assert result_map(post_profile(client, profile))["pm-kisan"]["status"] == "likely_ineligible"


def test_pm_kisan_landholding_and_family_status_are_required(client):
    profile = deepcopy(BASE_PROFILE)
    profile["landholding_status"] = "no"
    profile["farmer_family_status"] = "unknown"
    result = result_map(post_profile(client, profile))["pm-kisan"]
    assert result["status"] == "likely_ineligible"
    assert any("landholding" in item.lower() for item in result["failed_criteria"])
    assert "eligible farmer-family status" in result["missing_information"]


def test_pm_kisan_unknown_exclusion_is_not_treated_as_no(client):
    profile = deepcopy(BASE_PROFILE)
    profile["income_tax_payer"] = "unknown"
    result = result_map(post_profile(client, profile))["pm-kisan"]
    assert result["status"] == "needs_more_information"
    assert "income-tax payer status" in result["missing_information"]


def test_pm_kisan_government_employee_exception_is_preserved(client):
    profile = deepcopy(BASE_PROFILE)
    profile["government_employee"] = "yes"
    profile["government_employee_exempt"] = "yes"
    assert result_map(post_profile(client, profile))["pm-kisan"]["status"] == "likely_eligible"

    profile["government_employee_exempt"] = "no"
    assert result_map(post_profile(client, profile))["pm-kisan"]["status"] == "likely_ineligible"


def test_pm_kisan_pensioner_threshold_and_exception_are_evaluated(client):
    profile = deepcopy(BASE_PROFILE)
    profile["pensioner"] = "yes"
    profile["pension_monthly_inr"] = 9000
    assert result_map(post_profile(client, profile))["pm-kisan"]["status"] == "likely_eligible"

    profile["pension_monthly_inr"] = 12000
    profile["pensioner_exempt"] = "yes"
    assert result_map(post_profile(client, profile))["pm-kisan"]["status"] == "likely_eligible"

    profile["pensioner_exempt"] = "no"
    assert result_map(post_profile(client, profile))["pm-kisan"]["status"] == "likely_ineligible"


def test_pmuy_under_18_is_ineligible(client):
    profile = deepcopy(BASE_PROFILE)
    profile["age"] = 17
    assert result_map(post_profile(client, profile))["pmuy"]["status"] == "likely_ineligible"


def test_pmuy_qualifying_adult_woman_is_likely_eligible(client):
    profile = deepcopy(BASE_PROFILE)
    profile["age"] = 30
    assert result_map(post_profile(client, profile))["pmuy"]["status"] == "likely_eligible"


def test_pmuy_existing_connection_is_ineligible(client):
    profile = deepcopy(BASE_PROFILE)
    profile["age"] = 30
    profile["household_lpg_connection"] = "yes"
    assert result_map(post_profile(client, profile))["pmuy"]["status"] == "likely_ineligible"


def test_pmuy_missing_declaration_needs_more_information(client):
    profile = deepcopy(BASE_PROFILE)
    profile["age"] = 30
    profile["pmuy_eligibility_category"] = "unknown"
    result = result_map(post_profile(client, profile))["pmuy"]
    assert result["status"] == "needs_more_information"
    assert "PMUY poor-household eligibility category or declaration" in result["missing_information"]


def test_missing_optional_fields_do_not_crash_and_unrelated_fields_do_not_change_pmjay(client):
    profile = {"age": 72, "aadhaar_available": "yes"}
    first = result_map(post_profile(client, profile))["ab-pmjay-70-plus"]
    profile["occupation"] = "Student"
    profile["annual_family_income"] = 1
    second = result_map(post_profile(client, profile))["ab-pmjay-70-plus"]
    assert first["status"] == second["status"] == "likely_eligible"


def test_malformed_requests_and_invalid_values_are_safe(client):
    assert client.post("/api/eligibility", json={}).status_code == 400
    assert client.post("/api/eligibility", data="{bad", content_type="application/json").status_code == 400

    response = post_profile(client, {"age": "seventy"})
    assert response.status_code == 400
    body = response.get_json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["fields"]["age"]

    response = post_profile(client, {"age": 30, "state": "Atlantis"})
    assert response.status_code == 400
    assert response.get_json()["error"]["fields"]["state"]


def test_sensitive_identifiers_are_rejected(client):
    profile = {"age": 70, "aadhaar_number": "1234"}
    response = post_profile(client, profile)
    assert response.status_code == 400
    assert "sensitive_identifiers" in response.get_json()["error"]["fields"]


def test_unsupported_tri_state_and_category_types_are_validation_errors(client):
    response = post_profile(client, {"aadhaar_available": [], "pmuy_eligibility_category": {}})
    assert response.status_code == 400
    fields = response.get_json()["error"]["fields"]
    assert "aadhaar_available" in fields
    assert "pmuy_eligibility_category" in fields
