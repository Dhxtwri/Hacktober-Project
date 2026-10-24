import { CitizenProfile, Scheme } from '../types/scheme';

/** Display metadata only. Eligibility decisions come from the Flask rules engine. */
export const SCHEMES_DATABASE: Scheme[] = [
  {
    id: 'ab-pmjay-70-plus',
    code: 'AB-PMJAY 70+',
    name: 'Ayushman Bharat PM-JAY: Senior Citizen 70+ Pathway',
    hindiName: 'आयुष्मान भारत PM-JAY: 70+ वरिष्ठ नागरिक मार्ग',
    ministry: 'National Health Authority (NHA)',
    ministryHindi: 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
    tagline: 'Senior-citizen health cover pathway for applicants aged 70 and above',
    summary: 'A focused screening path for the PM-JAY senior-citizen expansion. Income is not used to reject the 70+ age pathway.',
    category: 'Healthcare & Wellness',
    level: 'Central',
    benefitAmountFormatted: 'Up to ₹5,00,000 family cover / year',
    benefitType: 'Cashless Health Cover',
    isDbtActive: false,
    applicationMode: 'Online & CSC',
    deadlineNotice: 'Check enrolment through the official NHA channel',
    officialUrl: 'https://nha.gov.in/img/resources/English_FAQs_related_to_the_benefits_for_senior_citizens_under_the_AB-PMJAY_scheme.pdf',
    helpline: '14555',
    eligibilityOverview: [
      'Applicant age must be 70 or older.',
      'Income is not used to reject this 70+ pathway.',
      'Aadhaar-based e-KYC is required for enrolment.',
    ],
    documents: [
      { id: 'aadhaar-ekyc', name: 'Aadhaar-based e-KYC', mandatory: true, description: 'Required for enrolment in this senior-citizen pathway.' },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Confirm the senior-citizen pathway', instruction: 'Verify that the applicant is 70 or older and use the official NHA channel.', channel: 'Online Portal' },
      { stepNumber: 2, title: 'Complete Aadhaar-based e-KYC', instruction: 'Complete the required e-KYC through the authorised enrolment channel.', channel: 'Common Service Centre (CSC)' },
      { stepNumber: 3, title: 'Await official verification', instruction: 'The authority confirms enrolment and card or coverage details.', channel: 'Online Portal' },
    ],
    faq: [
      { question: 'Does income disqualify a person from this 70+ pathway?', answer: 'The senior-citizen FAQ describes the 70+ expansion without using income to reject the age-based pathway.' },
      { question: 'Does this screen all PM-JAY pathways?', answer: 'No. It only screens the senior-citizen expansion for applicants aged 70 and above.' },
    ],
  },
  {
    id: 'pm-kisan',
    code: 'PM-KISAN',
    name: 'Pradhan Mantri Kisan Samman Nidhi',
    hindiName: 'प्रधानमंत्री किसान सम्मान निधि',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    ministryHindi: 'कृषि एवं किसान कल्याण मंत्रालय',
    tagline: '₹6,000 per year in three equal instalments for eligible landholding farmer families',
    summary: 'A preliminary screen for landholding farmer families and the official exclusion categories represented by the source rules.',
    category: 'Agriculture & Farmers',
    level: 'Central',
    benefitAmountFormatted: '₹6,000 / year in 3 instalments',
    benefitType: 'Direct Benefit Transfer (DBT)',
    isDbtActive: true,
    applicationMode: 'Online & CSC',
    deadlineNotice: 'Use the official PM-KISAN portal for registration and status',
    officialUrl: 'https://pmkisan.gov.in/',
    helpline: '155261',
    eligibilityOverview: [
      'Eligible landholding and farmer-family status must be confirmed.',
      'Institutional holders and specified public, tax, professional, employee, and pensioner exclusions are evaluated.',
      'No unsupported landholding cut-off or income limit is applied by this engine.',
    ],
    documents: [
      { id: 'land-record', name: 'Land ownership or land record', mandatory: true, description: 'The official record must support the farmer-family claim.' },
      { id: 'aadhaar', name: 'Aadhaar and e-KYC documents', mandatory: true, description: 'Required by the registration channel for official verification.' },
      { id: 'bank', name: 'Bank account details for DBT', mandatory: true, description: 'Use the details required by the official registration channel.' },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Prepare land and family records', instruction: 'Gather the official land record and farmer-family information.', channel: 'Gram Panchayat' },
      { stepNumber: 2, title: 'Review exclusion information', instruction: 'Confirm the applicable public office, employment, pension, tax, and professional details.', channel: 'Online Portal' },
      { stepNumber: 3, title: 'Submit through the official channel', instruction: 'Use PM-KISAN or an authorised CSC and await government verification.', channel: 'Common Service Centre (CSC)' },
    ],
    faq: [
      { question: 'Does selecting Farmer as an occupation prove eligibility?', answer: 'No. Landholding, family status, exclusions, and official verification still matter.' },
      { question: 'Does this engine use income or acreage cut-offs?', answer: 'No unsupported cut-off is applied. The engine reports missing or verified information instead.' },
    ],
  },
  {
    id: 'pmuy',
    code: 'PMUY',
    name: 'Pradhan Mantri Ujjwala Yojana',
    hindiName: 'प्रधानमंत्री उज्ज्वला योजना',
    ministry: 'Ministry of Petroleum and Natural Gas',
    ministryHindi: 'पेट्रोलियम और प्राकृतिक गैस मंत्रालय',
    tagline: 'LPG connection pathway for adult women in eligible households',
    summary: 'A preliminary screen for the adult-woman, no-existing-connection, and poor-household category or declaration requirements.',
    category: 'Women & Child Development',
    level: 'Central',
    benefitAmountFormatted: '₹1,600 / ₹1,150 connection support + first refill and stove',
    benefitType: 'Asset / Free Infrastructure',
    isDbtActive: false,
    applicationMode: 'Online & CSC',
    deadlineNotice: 'Apply through an authorised LPG distributor or official PMUY channel',
    officialUrl: 'https://www.pmuy.gov.in/ujjwala2.html',
    helpline: '1800-266-6696',
    eligibilityOverview: [
      'Applicant must be a woman aged 18 or older.',
      'The household must not already have a covered LPG connection.',
      'A qualifying poor-household category or declaration must be supplied and verified.',
    ],
    documents: [
      { id: 'kyc', name: 'KYC and Aadhaar documents', mandatory: true, description: 'For the adult woman applicant and household members as requested by the distributor.' },
      { id: 'address', name: 'Address proof where needed', mandatory: true, description: 'Needed when Aadhaar does not provide sufficient current address proof.' },
      { id: 'family', name: 'Ration card or family-composition document', mandatory: true, description: 'Used to verify the household and adult family members.' },
      { id: 'declaration', name: 'Poor-household deprivation declaration', mandatory: true, description: 'Required for the poor-household pathway under the PMUY FAQ.' },
      { id: 'bank', name: 'Bank account details', mandatory: false, description: 'Used for applicable assistance or subsidy processing.' },
    ],
    applicationSteps: [
      { stepNumber: 1, title: 'Confirm household information', instruction: 'Confirm that no covered family member already has an LPG connection.', channel: 'Online Portal' },
      { stepNumber: 2, title: 'Select the applicable category or declaration', instruction: 'Provide the poor-household declaration or supported PMUY category for verification.', channel: 'Common Service Centre (CSC)' },
      { stepNumber: 3, title: 'Apply through an authorised distributor', instruction: 'Submit the application and documents to the official LPG distributor channel.', channel: 'Online Portal' },
    ],
    faq: [
      { question: 'Is low income alone enough?', answer: 'No. The household must provide the applicable PMUY category or poor-household declaration and pass official verification.' },
      { question: 'What if household connection status is unknown?', answer: 'The engine asks for that information instead of assuming that the household has no connection.' },
    ],
  },
];

export const DEMO_PROFILES: { id: string; label: string; profile: CitizenProfile }[] = [
  {
    id: 'senior-citizen',
    label: 'Shashi Kant · age 72 · Aadhaar e-KYC available',
    profile: {
      name: 'Shashi Kant Sharma', age: 72, state: 'Delhi', gender: 'male', annual_family_income: 75000,
      aadhaar_available: 'yes', landholding_status: 'unknown', farmer_family_status: 'unknown',
      institutional_landholder: 'no', constitutional_officeholder: 'no', public_representative: 'no',
      government_employee: 'no', pensioner: 'no', income_tax_payer: 'no', registered_professional: 'no',
      household_lpg_connection: 'unknown', pmuy_eligibility_category: 'unknown',
    },
  },
  {
    id: 'landholding-farmer',
    label: 'Ramesh Patel · landholding farmer · no known exclusions',
    profile: {
      name: 'Ramesh Patel', age: 44, state: 'Uttar Pradesh', gender: 'male', occupation: 'Farmer',
      annual_family_income: 140000, aadhaar_available: 'yes', landholding_status: 'yes', farmer_family_status: 'yes',
      institutional_landholder: 'no', constitutional_officeholder: 'no', public_representative: 'no',
      government_employee: 'no', pensioner: 'no', income_tax_payer: 'no', registered_professional: 'no',
      household_lpg_connection: 'unknown', pmuy_eligibility_category: 'unknown',
    },
  },
  {
    id: 'pmuy-applicant',
    label: 'Sunita Devi · adult woman · qualifying declaration',
    profile: {
      name: 'Sunita Devi', age: 30, state: 'Bihar', gender: 'female', annual_family_income: 90000,
      aadhaar_available: 'yes', landholding_status: 'unknown', farmer_family_status: 'unknown',
      institutional_landholder: 'no', constitutional_officeholder: 'no', public_representative: 'no',
      government_employee: 'no', pensioner: 'no', income_tax_payer: 'no', registered_professional: 'no',
      household_lpg_connection: 'no', pmuy_eligibility_category: 'poor_household_declaration',
    },
  },
];

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const OCCUPATIONS_LIST: string[] = [
  'Farmer', 'Artisan', 'Small Business / Shopkeeper', 'Self Employed', 'Daily Wage Worker',
  'Student', 'Salaried Employee', 'Senior Citizen / Retired', 'Unemployed',
];
