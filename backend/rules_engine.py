"""Deterministic preliminary eligibility rules for the three supported schemes."""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any


SCHEMES_PATH = Path(__file__).with_name("scheme_data.json")

STATES_AND_UNION_TERRITORIES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
]

TRI_STATE_FIELDS = {
    "aadhaar_available",
    "landholding_status",
    "farmer_family_status",
    "institutional_landholder",
    "constitutional_officeholder",
    "public_representative",
    "government_employee",
    "government_employee_exempt",
    "pensioner",
    "pensioner_exempt",
    "income_tax_payer",
    "registered_professional",
    "household_lpg_connection",
}
TRI_STATE_VALUES = {True, False, "yes", "no", "unknown", "not_sure", "not sure"}
UNKNOWN_VALUES = {None, "", "unknown", "not_sure", "not sure"}
SUPPORTED_GENDERS = {"male", "female", "other", "unknown"}
PMUY_CATEGORIES = {
    "poor_household_declaration",
    "sc_st",
    "pmay_g",
    "aay",
    "most_backward_class",
    "tea_ex_tea_garden_tribe",
    "forest_dweller",
    "island_river_island_resident",
    "secc_household",
    "unknown",
    "not_sure",
    "not sure",
    "not_eligible",
}


@lru_cache(maxsize=1)
def scheme_metadata() -> dict[str, dict[str, Any]]:
    with SCHEMES_PATH.open(encoding="utf-8") as file:
        payload = json.load(file)
    return {scheme["scheme_id"]: scheme for scheme in payload["schemes"]}


def _is_unknown(value: Any) -> bool:
    return value in UNKNOWN_VALUES


def _tri_state(value: Any) -> bool | None:
    if value is True or value == "yes":
        return True
    if value is False or value == "no":
        return False
    if _is_unknown(value):
        return None
    return None


def _result(scheme_id: str) -> dict[str, Any]:
    metadata = scheme_metadata()[scheme_id]
    return {
        "scheme_id": metadata["scheme_id"],
        "scheme_name": metadata["scheme_name"],
        "status": "needs_more_information",
        "summary": "More information is needed for preliminary screening.",
        "matched_criteria": [],
        "failed_criteria": [],
        "missing_information": [],
        "benefit": metadata["benefit"],
        "required_documents": metadata["required_documents"],
        "official_sources": metadata["official_sources"],
        "limitations": metadata["limitations"],
    }


def _finish(result: dict[str, Any], success_summary: str, missing_summary: str, failure_summary: str) -> dict[str, Any]:
    if result["failed_criteria"]:
        result["status"] = "likely_ineligible"
        result["summary"] = failure_summary
    elif result["missing_information"]:
        result["status"] = "needs_more_information"
        result["summary"] = missing_summary
    else:
        result["status"] = "likely_eligible"
        result["summary"] = success_summary
    return result


def evaluate_pmjay(profile: dict[str, Any]) -> dict[str, Any]:
    result = _result("ab-pmjay-70-plus")
    age = profile.get("age")
    if age is None:
        result["missing_information"].append("age")
    elif age >= 70:
        result["matched_criteria"].append(
            f"Age criterion met: applicant is {age}; this pathway starts at age 70."
        )
    else:
        result["failed_criteria"].append(
            f"Age criterion not met: applicant is {age}; this senior-citizen pathway requires age 70 or older."
        )

    aadhaar = _tri_state(profile.get("aadhaar_available"))
    if aadhaar is True:
        result["matched_criteria"].append("Aadhaar-based e-KYC is reported as available for enrolment.")
    elif aadhaar is False:
        result["failed_criteria"].append("Aadhaar-based e-KYC is required for enrolment and is reported unavailable.")
    else:
        result["missing_information"].append("whether Aadhaar-based e-KYC is available")

    return _finish(
        result,
        "The applicant meets the age-70+ pathway criteria represented here. Income is not used to reject this pathway.",
        "Confirm the applicant's age and Aadhaar-based e-KYC availability before using this pathway for screening.",
        "At least one confirmed requirement for the age-70+ pathway is not met.",
    )


def _check_tri_state(
    profile: dict[str, Any],
    result: dict[str, Any],
    field: str,
    label: str,
    fail_when_true: bool = False,
) -> bool | None:
    value = _tri_state(profile.get(field))
    if value is None:
        result["missing_information"].append(label)
    elif fail_when_true and value:
        result["failed_criteria"].append(f"Confirmed exclusion: {label}.")
    elif fail_when_true:
        result["matched_criteria"].append(f"No exclusion reported for {label}.")
    elif value:
        result["matched_criteria"].append(f"Confirmed: {label}.")
    else:
        result["failed_criteria"].append(f"Required condition not met: {label}.")
    return value


def evaluate_pm_kisan(profile: dict[str, Any]) -> dict[str, Any]:
    result = _result("pm-kisan")

    aadhaar = _tri_state(profile.get("aadhaar_available"))
    if aadhaar is True:
        result["matched_criteria"].append("Aadhaar-based e-KYC is reported as available for PM-KISAN registration.")
    elif aadhaar is False:
        result["failed_criteria"].append("Aadhaar-based e-KYC is required for PM-KISAN registration and is reported unavailable.")
    else:
        result["missing_information"].append("whether Aadhaar-based e-KYC is available for PM-KISAN registration")

    _check_tri_state(profile, result, "landholding_status", "eligible landholding or land ownership")
    _check_tri_state(profile, result, "farmer_family_status", "eligible farmer-family status")

    for field, label in (
        ("institutional_landholder", "institutional landholder status"),
        ("constitutional_officeholder", "constitutional officeholder status"),
        ("public_representative", "specified public representative status"),
        ("income_tax_payer", "income-tax payer status"),
        ("registered_professional", "registered professional status"),
    ):
        _check_tri_state(profile, result, field, label, fail_when_true=True)

    government_employee = _tri_state(profile.get("government_employee"))
    if government_employee is None:
        result["missing_information"].append("government employee status")
    elif government_employee is False:
        result["matched_criteria"].append("Applicant is not reported as a government employee in an excluded category.")
    else:
        employee_exempt = _tri_state(profile.get("government_employee_exempt"))
        if employee_exempt is True:
            result["matched_criteria"].append("Government employee exception reported: Multi-Tasking Staff/Class IV/Group D category.")
        elif employee_exempt is False:
            result["failed_criteria"].append("Confirmed exclusion: government employee outside the stated exception.")
        else:
            result["missing_information"].append("whether the government employee falls within the stated exception")

    pensioner = _tri_state(profile.get("pensioner"))
    if pensioner is None:
        result["missing_information"].append("pensioner status")
    elif pensioner is False:
        result["matched_criteria"].append("Applicant is not reported as a pensioner in an excluded category.")
    else:
        pension = profile.get("pension_monthly_inr")
        if pension is None:
            result["missing_information"].append("monthly pension amount")
        elif pension >= 10000:
            pension_exempt = _tri_state(profile.get("pensioner_exempt"))
            if pension_exempt is True:
                result["matched_criteria"].append("Pensioner exception reported: Multi-Tasking Staff/Class IV/Group D category.")
            elif pension_exempt is False:
                result["failed_criteria"].append("Confirmed exclusion: pensioner receiving ₹10,000 or more per month outside the stated exception.")
            else:
                result["missing_information"].append("whether the pensioner falls within the stated exception")
        else:
            result["matched_criteria"].append("Monthly pension is below the ₹10,000 exclusion threshold represented here.")

    return _finish(
        result,
        "The known landholding, farmer-family, and PM-KISAN exclusion criteria are satisfied. Official land-record and government verification remain necessary.",
        "Provide the missing landholding, farmer-family, exclusion, or exception information for a useful preliminary PM-KISAN screen.",
        "At least one confirmed PM-KISAN landholding or exclusion criterion is not met.",
    )


def evaluate_pmuy(profile: dict[str, Any]) -> dict[str, Any]:
    result = _result("pmuy")

    aadhaar = _tri_state(profile.get("aadhaar_available"))
    if aadhaar is True:
        result["matched_criteria"].append("Biometric Aadhaar e-KYC is reported as available for PMUY processing.")
    elif aadhaar is False:
        result["failed_criteria"].append("Biometric Aadhaar e-KYC is mandatory for PMUY processing and is reported unavailable.")
    else:
        result["missing_information"].append("whether Aadhaar-based e-KYC is available for PMUY processing")

    gender = profile.get("gender")
    if gender in (None, "unknown"):
        result["missing_information"].append("applicant gender")
    elif gender == "female":
        result["matched_criteria"].append("Applicant is a woman, as required for the PMUY connection applicant.")
    else:
        result["failed_criteria"].append("PMUY requires the connection applicant to be a woman.")

    age = profile.get("age")
    if age is None:
        result["missing_information"].append("age")
    elif age >= 18:
        result["matched_criteria"].append(f"Age criterion met: applicant is {age}; minimum age is 18.")
    else:
        result["failed_criteria"].append(f"Age criterion not met: applicant is {age}; PMUY requires an adult applicant aged 18 or older.")

    household_lpg = _tri_state(profile.get("household_lpg_connection"))
    if household_lpg is True:
        result["failed_criteria"].append("The household already has an LPG connection registered to a covered family member.")
    elif household_lpg is False:
        result["matched_criteria"].append("No existing household LPG connection is reported.")
    else:
        result["missing_information"].append("whether the household already has an LPG connection")

    category = profile.get("pmuy_eligibility_category")
    if category in UNKNOWN_VALUES or category is None:
        result["missing_information"].append("PMUY poor-household eligibility category or declaration")
    elif category == "not_eligible":
        result["failed_criteria"].append("The supplied PMUY category/declaration does not establish a qualifying poor-household pathway.")
    else:
        result["matched_criteria"].append("A PMUY eligibility category or poor-household declaration is supplied for verification.")

    return _finish(
        result,
        "The known PMUY applicant, household-connection, and eligibility-category conditions are satisfied for preliminary screening.",
        "Confirm the household LPG connection status and PMUY poor-household eligibility category or declaration.",
        "At least one confirmed PMUY condition is not met.",
    )


def evaluate_all(profile: dict[str, Any]) -> list[dict[str, Any]]:
    results = [evaluate_pmjay(profile), evaluate_pm_kisan(profile), evaluate_pmuy(profile)]
    priority = {"likely_eligible": 0, "needs_more_information": 1, "likely_ineligible": 2}
    return sorted(results, key=lambda result: priority[result["status"]])


def validate_profile(profile: Any) -> dict[str, str]:
    errors: dict[str, str] = {}
    if not isinstance(profile, dict):
        return {"profile": "profile must be a JSON object"}

    if "aadhaar_number" in profile or "bank_account_number" in profile:
        errors["sensitive_identifiers"] = "Do not submit Aadhaar numbers or bank account numbers; submit availability only."

    for field in ("age", "annual_family_income", "landholding_acres", "pension_monthly_inr"):
        if field in profile and profile[field] is not None:
            value = profile[field]
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                errors[field] = "must be a finite number"
            elif value < 0:
                errors[field] = "must be zero or greater"

    if "age" in profile and profile["age"] is not None and isinstance(profile["age"], (int, float)):
        if profile["age"] > 120:
            errors["age"] = "must be 120 or younger"

    if profile.get("state") is not None and profile.get("state") not in STATES_AND_UNION_TERRITORIES:
        errors["state"] = "must be one of the 28 states or 8 Union Territories"

    gender = profile.get("gender")
    if gender is not None and (not isinstance(gender, str) or gender not in SUPPORTED_GENDERS):
        errors["gender"] = "must be male, female, other, or unknown"

    for field in TRI_STATE_FIELDS:
        value = profile.get(field)
        if field in profile and value is not None and (
            not isinstance(value, (bool, str)) or value not in TRI_STATE_VALUES
        ):
            errors[field] = "must be yes, no, or unknown"

    pmuy_category = profile.get("pmuy_eligibility_category")
    pmuy_category_is_unknown = pmuy_category is None or (
        isinstance(pmuy_category, str) and pmuy_category in UNKNOWN_VALUES
    )
    if "pmuy_eligibility_category" in profile and not pmuy_category_is_unknown and (
        not isinstance(pmuy_category, str) or pmuy_category not in PMUY_CATEGORIES
    ):
        errors["pmuy_eligibility_category"] = "must be a supported PMUY category or unknown"

    for field in ("name", "occupation"):
        if field in profile and profile[field] is not None and not isinstance(profile[field], str):
            errors[field] = "must be a string"

    return errors
