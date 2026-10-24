/** Shared frontend types for the three-scheme preliminary screening experience. */

export type SchemeCategory =
  | 'All'
  | 'Agriculture & Farmers'
  | 'Healthcare & Wellness'
  | 'Women & Child Development';

export type SchemeLevel = 'Central' | 'Centrally Sponsored' | 'State Specific';

export type BenefitType =
  | 'Direct Benefit Transfer (DBT)'
  | 'Cashless Health Cover'
  | 'Asset / Free Infrastructure';

export type SocialCategory = 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type TriState = 'yes' | 'no' | 'unknown';

export interface SchemeDocument {
  id: string;
  name: string;
  nameHindi?: string;
  mandatory: boolean;
  description: string;
}

export interface ApplicationStep {
  stepNumber: number;
  title: string;
  instruction: string;
  channel: 'Online Portal' | 'Common Service Centre (CSC)' | 'Gram Panchayat' | 'Bank Branch';
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  hindiName: string;
  ministry: string;
  ministryHindi?: string;
  tagline: string;
  summary: string;
  category: SchemeCategory;
  level: SchemeLevel;
  benefitAmountFormatted: string;
  benefitType: BenefitType;
  isDbtActive: boolean;
  applicationMode: 'Online & CSC' | 'Online Only' | 'Offline / Branch';
  deadlineNotice: string;
  officialUrl: string;
  helpline: string;
  eligibilityOverview: string[];
  documents: SchemeDocument[];
  applicationSteps: ApplicationStep[];
  faq: { question: string; answer: string }[];
}

export interface CitizenProfile {
  name?: string;
  age?: number;
  state?: string;
  gender?: Gender;
  socialCategory?: SocialCategory;
  annual_family_income?: number;
  occupation?: string;
  landholding_acres?: number;
  aadhaar_available?: TriState;
  landholding_status?: TriState;
  farmer_family_status?: TriState;
  institutional_landholder?: TriState;
  constitutional_officeholder?: TriState;
  public_representative?: TriState;
  government_employee?: TriState;
  government_employee_exempt?: TriState;
  pensioner?: TriState;
  pension_monthly_inr?: number;
  pensioner_exempt?: TriState;
  income_tax_payer?: TriState;
  registered_professional?: TriState;
  household_lpg_connection?: TriState;
  pmuy_eligibility_category?: string;
}

export type VerdictStatus =
  | 'likely_eligible'
  | 'needs_more_information'
  | 'likely_ineligible'
  | 'INFO'
  | 'PENDING'
  | 'VERIFIED';

export interface EligibilityResult {
  scheme_id: string;
  scheme_name: string;
  status: 'likely_eligible' | 'needs_more_information' | 'likely_ineligible';
  summary: string;
  matched_criteria: string[];
  failed_criteria: string[];
  missing_information: string[];
  benefit: string;
  required_documents: string[];
  official_sources: string[];
  limitations: string[];
}

export interface EligibilityResponse {
  results: EligibilityResult[];
  screening_notice: string;
}

export interface RequirementMatrixRow {
  parameter: string;
  parameterHindi?: string;
  userValue: string;
  schemeRequirement: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  note: string;
}

export interface SchemeEvaluation {
  scheme: Scheme;
  verdict: VerdictStatus;
  matchScore: number;
  failedCount: number;
  warningCount: number;
  matrix: RequirementMatrixRow[];
  eligibleSummary: string;
}

export interface TrackedApplication {
  id: string;
  schemeId: string;
  schemeName: string;
  appliedDate: string;
  applicationNumber: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'DISBURSED';
  stageDescription: string;
  updatedAt: string;
  notes: string;
}
