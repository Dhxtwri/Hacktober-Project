import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, RotateCcw, Send, UserCheck } from 'lucide-react';
import { DEMO_PROFILES, INDIAN_STATES, OCCUPATIONS_LIST, SCHEMES_DATABASE } from '../data/schemes';
import { CitizenProfile, EligibilityResponse, EligibilityResult, Gender, TriState } from '../types/scheme';
import { requestEligibility } from '../utils/eligibilityApi';
import { RequirementMatrix } from './RequirementMatrix';
import { StatusBadge } from './StatusBadge';

interface EligibilityCheckerProps {
  onOpenSchemeDetails: (scheme: (typeof SCHEMES_DATABASE)[number]) => void;
  language: 'en' | 'hi';
}

const INITIAL_PROFILE: CitizenProfile = {
  name: '',
  age: 30,
  state: 'Uttar Pradesh',
  gender: 'female',
  occupation: 'Self Employed',
  annual_family_income: undefined,
  aadhaar_available: 'unknown',
  landholding_status: 'unknown',
  farmer_family_status: 'unknown',
  institutional_landholder: 'unknown',
  constitutional_officeholder: 'unknown',
  public_representative: 'unknown',
  government_employee: 'unknown',
  government_employee_exempt: 'unknown',
  pensioner: 'unknown',
  pension_monthly_inr: undefined,
  pensioner_exempt: 'unknown',
  income_tax_payer: 'unknown',
  registered_professional: 'unknown',
  household_lpg_connection: 'unknown',
  pmuy_eligibility_category: 'unknown',
};

const fieldClass = 'w-full min-h-11 px-3 rounded border border-[#94A3B8] bg-white text-sm text-[#0F172A] focus:ring-2 focus:ring-[#0F2942]';
const labelClass = 'block text-xs font-semibold text-[#0F172A] mb-1';

function TriStateSelect({
  value,
  onChange,
  label,
}: {
  value?: TriState;
  onChange: (value: TriState) => void;
  label: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select className={fieldClass} value={value || 'unknown'} onChange={(event) => onChange(event.target.value as TriState)}>
        <option value="unknown">Not sure / unknown</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}

function resultMatrix(result: EligibilityResult) {
  return [
    ...result.matched_criteria.map((criterion) => ({
      parameter: 'Matched criterion', userValue: 'Confirmed', schemeRequirement: criterion, status: 'pass' as const, note: criterion,
    })),
    ...result.failed_criteria.map((criterion) => ({
      parameter: 'Failed criterion', userValue: 'Confirmed failure', schemeRequirement: criterion, status: 'fail' as const, note: criterion,
    })),
    ...result.missing_information.map((criterion) => ({
      parameter: 'Information still needed', userValue: 'Unknown / not provided', schemeRequirement: criterion, status: 'warn' as const, note: 'Answer this question to improve the preliminary screen.',
    })),
  ];
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({ onOpenSchemeDetails, language }) => {
  const [profile, setProfile] = useState<CitizenProfile>(INITIAL_PROFILE);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = <K extends keyof CitizenProfile>(key: K, value: CitizenProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setResults(null);
    setError(null);
  };

  const handlePreset = (preset: CitizenProfile) => {
    setProfile(preset);
    setResults(null);
    setError(null);
  };

  const handleReset = () => handlePreset(INITIAL_PROFILE);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setResults(null);
    setError(null);
    try {
      const payload: EligibilityResponse = await requestEligibility(profile);
      setResults(payload.results);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The eligibility service is unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => ({
    eligible: results?.filter((item) => item.status === 'likely_eligible').length || 0,
    needs: results?.filter((item) => item.status === 'needs_more_information').length || 0,
    ineligible: results?.filter((item) => item.status === 'likely_ineligible').length || 0,
  }), [results]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#CBD5E1] rounded-lg p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-[#EFF6FF] text-[#0F2942] border border-[#BFDBFE]"><UserCheck className="w-5 h-5" /></span>
              <h2 className="text-xl font-bold text-[#0F172A]">{language === 'hi' ? 'नागरिक पात्रता जांच' : 'Citizen Eligibility Screening'}</h2>
            </div>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">Enter the information relevant to the three supported schemes. The Flask backend is the only place where eligibility rules are evaluated.</p>
          </div>
          <button type="button" onClick={handleReset} className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-[#0F2942] border border-[#CBD5E1] hover:bg-[#F1F5F9]">
            <RotateCcw className="w-3.5 h-3.5" /> Reset form
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#0F2942] uppercase tracking-wide mb-2">Try a realistic profile</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_PROFILES.map((demo) => (
              <button key={demo.id} type="button" onClick={() => handlePreset(demo.profile)} className="text-left p-2.5 rounded border text-xs bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:bg-[#E2E8F0]">
                <span className="font-bold block truncate">{demo.profile.name}</span>
                <span className="text-[11px] block mt-0.5 text-[#64748B]">{demo.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white border border-[#CBD5E1] rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#0F2942] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Applicant information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block sm:col-span-2"><span className={labelClass}>Full name (optional)</span><input className={fieldClass} value={profile.name || ''} onChange={(event) => updateProfile('name', event.target.value)} /></label>
            <label className="block"><span className={labelClass}>Age</span><input className={fieldClass} type="number" min="0" max="120" value={profile.age ?? ''} onChange={(event) => updateProfile('age', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block"><span className={labelClass}>Gender</span><select className={fieldClass} value={profile.gender || 'unknown'} onChange={(event) => updateProfile('gender', event.target.value as Gender)}><option value="unknown">Not sure / unknown</option><option value="female">Woman</option><option value="male">Man</option><option value="other">Other</option></select></label>
            <label className="block"><span className={labelClass}>State / Union Territory</span><select className={fieldClass} value={profile.state || ''} onChange={(event) => updateProfile('state', event.target.value)}><option value="">Not provided</option>{INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block"><span className={labelClass}>Occupation (optional)</span><select className={fieldClass} value={profile.occupation || ''} onChange={(event) => updateProfile('occupation', event.target.value)}><option value="">Not provided</option>{OCCUPATIONS_LIST.map((occupation) => <option key={occupation} value={occupation}>{occupation}</option>)}</select></label>
            <label className="block"><span className={labelClass}>Annual family income (optional)</span><input className={fieldClass} type="number" min="0" value={profile.annual_family_income ?? ''} onChange={(event) => updateProfile('annual_family_income', event.target.value === '' ? undefined : Number(event.target.value))} placeholder="₹ amount" /></label>
          </div>

          <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
            <p className="text-xs font-bold text-[#0F2942] uppercase tracking-wider">Cross-scheme document and farmer questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TriStateSelect label="Aadhaar-based e-KYC available" value={profile.aadhaar_available} onChange={(value) => updateProfile('aadhaar_available', value)} />
              <TriStateSelect label="Eligible landholding / ownership" value={profile.landholding_status} onChange={(value) => updateProfile('landholding_status', value)} />
              <TriStateSelect label="Eligible farmer-family status" value={profile.farmer_family_status} onChange={(value) => updateProfile('farmer_family_status', value)} />
              <TriStateSelect label="Institutional landholder" value={profile.institutional_landholder} onChange={(value) => updateProfile('institutional_landholder', value)} />
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
            <p className="text-xs font-bold text-[#0F2942] uppercase tracking-wider">PM-KISAN exclusion questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TriStateSelect label="Constitutional officeholder" value={profile.constitutional_officeholder} onChange={(value) => updateProfile('constitutional_officeholder', value)} />
              <TriStateSelect label="Specified public representative" value={profile.public_representative} onChange={(value) => updateProfile('public_representative', value)} />
              <TriStateSelect label="Government employee" value={profile.government_employee} onChange={(value) => updateProfile('government_employee', value)} />
              <TriStateSelect label="Government employee exception" value={profile.government_employee_exempt} onChange={(value) => updateProfile('government_employee_exempt', value)} />
              <TriStateSelect label="Pensioner" value={profile.pensioner} onChange={(value) => updateProfile('pensioner', value)} />
              <label className="block"><span className={labelClass}>Monthly pension (optional)</span><input className={fieldClass} type="number" min="0" value={profile.pension_monthly_inr ?? ''} onChange={(event) => updateProfile('pension_monthly_inr', event.target.value === '' ? undefined : Number(event.target.value))} placeholder="₹ amount" /></label>
              <TriStateSelect label="Pensioner exception" value={profile.pensioner_exempt} onChange={(value) => updateProfile('pensioner_exempt', value)} />
              <TriStateSelect label="Income-tax payer" value={profile.income_tax_payer} onChange={(value) => updateProfile('income_tax_payer', value)} />
              <TriStateSelect label="Registered professional" value={profile.registered_professional} onChange={(value) => updateProfile('registered_professional', value)} />
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
            <p className="text-xs font-bold text-[#0F2942] uppercase tracking-wider">PMUY household questions</p>
            <TriStateSelect label="Household already has an LPG connection" value={profile.household_lpg_connection} onChange={(value) => updateProfile('household_lpg_connection', value)} />
            <label className="block"><span className={labelClass}>PMUY eligibility category or declaration</span><select className={fieldClass} value={profile.pmuy_eligibility_category || 'unknown'} onChange={(event) => updateProfile('pmuy_eligibility_category', event.target.value)}><option value="unknown">Not sure / unknown</option><option value="poor_household_declaration">Poor-household declaration</option><option value="sc_st">SC / ST household</option><option value="pmay_g">PMAY-G household</option><option value="aay">AAY household</option><option value="most_backward_class">Most Backward Class</option><option value="tea_ex_tea_garden_tribe">Tea or ex-tea garden tribe</option><option value="forest_dweller">Forest dweller</option><option value="island_river_island_resident">Island or river-island resident</option><option value="secc_household">SECC household</option><option value="not_eligible">No qualifying category</option></select></label>
          </div>

          <button type="submit" disabled={isLoading} className="w-full min-h-11 rounded bg-[#B45309] text-white font-semibold text-sm hover:bg-[#9B4500] disabled:opacity-60 inline-flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#0F2942]">
            <Send className="w-4 h-4" /> {isLoading ? 'Checking…' : 'Check all three schemes'}
          </button>
          <p className="text-[11px] text-[#64748B]">Do not enter Aadhaar numbers, bank account numbers, or other sensitive identifiers.</p>
        </section>

        <section className="lg:col-span-7 space-y-4" aria-live="polite">
          {error && <div className="p-4 rounded border border-[#FECDD3] bg-[#FFF1F2] text-[#9F1239] flex items-start gap-2 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" /><div><p className="font-semibold">Backend unavailable or request rejected</p><p className="mt-1">{error}</p></div></div>}

          {results && <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-[#A7F3D0] rounded-lg p-3 text-center"><span className="text-[11px] font-semibold text-[#065F46] uppercase block">Likely eligible</span><span className="text-2xl font-bold text-[#047857] block">{stats.eligible}</span></div>
              <div className="bg-white border border-[#FDE68A] rounded-lg p-3 text-center"><span className="text-[11px] font-semibold text-[#92400E] uppercase block">Needs info</span><span className="text-2xl font-bold text-[#B45309] block">{stats.needs}</span></div>
              <div className="bg-white border border-[#FECDD3] rounded-lg p-3 text-center"><span className="text-[11px] font-semibold text-[#9F1239] uppercase block">Likely ineligible</span><span className="text-2xl font-bold text-[#BE123C] block">{stats.ineligible}</span></div>
            </div>
            <div className="p-3 rounded border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] text-xs">These are preliminary screening outcomes, not official government decisions.</div>

            {results.map((result) => {
              const scheme = SCHEMES_DATABASE.find((item) => item.id === result.scheme_id);
              if (!scheme) return null;
              return <article key={result.scheme_id} className="bg-white border border-[#CBD5E1] rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div><div className="flex items-center gap-2 mb-2"><StatusBadge status={result.status} size="sm" /><span className="text-[11px] text-[#64748B]">Preliminary screen</span></div><h3 className="text-base font-bold text-[#0F172A]">{scheme.name}</h3><p className="text-xs text-[#B45309] font-semibold mt-1">{scheme.benefitAmountFormatted}</p></div>
                  <button type="button" onClick={() => onOpenSchemeDetails(scheme)} className="px-3 py-1.5 rounded bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Full guide</button>
                </div>
                <div className="p-4 space-y-3"><p className="text-sm text-[#334155] leading-relaxed">{result.summary}</p><RequirementMatrix matrix={resultMatrix(result)} language={language} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"><div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]"><p className="font-semibold text-[#0F2942] mb-1">Required documents</p><ul className="list-disc pl-4 space-y-1 text-[#475569]">{result.required_documents.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]"><p className="font-semibold text-[#0F2942] mb-1">Limitations</p><ul className="list-disc pl-4 space-y-1 text-[#475569]">{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
                  <div className="flex flex-wrap gap-2 text-xs">{result.official_sources.map((source) => <a key={source} href={source} target="_blank" rel="noopener noreferrer" className="text-[#1E3A8A] underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Official source</a>)}</div>
                </div>
              </article>;
            })}
          </>}

          {!results && !error && <div className="min-h-64 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-lg flex flex-col items-center justify-center text-center p-6"><CheckCircle2 className="w-10 h-10 text-[#94A3B8] mb-2" /><h3 className="font-semibold text-[#334155]">Your three-scheme results will appear here</h3><p className="text-sm text-[#64748B] mt-1 max-w-md">Submit the current profile to receive actual API results with matched criteria, failures, missing information, documents, sources, and limitations.</p></div>}
        </section>
      </form>
    </div>
  );
};
