import { VerifiedProgramRecord } from './navigator.js';

export type SanctuaryCategoryFilter =
  | 'ALL'
  | 'COUNSELORS_THERAPY'
  | 'PREGNANCY_BABY'
  | 'HOSPITALS_LABS'
  | 'ALL_AGES_SENIORS_YOUTH'
  | 'HOUSING_HOMELESS'
  | 'SUBSIDIES_LEISURE'
  | 'PHYSICAL_BARRIERS'
  | 'MENTAL_HEALTH_CRISIS'
  | 'RECOVERY_12STEP'
  | 'LAW_FIRST_RESPONDERS'
  | 'LOCAL_SOCIETIES'
  | 'OPTIONS_PLUS'
  | 'SOURCES_BC'
  | 'SCHOOLS'
  | 'FOOD_PROGRAMS'
  | 'HANDS_ON_WORK';

export type PrimarySectionId =
  | 'COUNSELORS_THERAPY'
  | 'PREGNANCY_BABY'
  | 'HOSPITALS_LABS'
  | 'ALL_AGES_SENIORS_YOUTH'
  | 'HOUSING_HOMELESS'
  | 'SUBSIDIES_LEISURE'
  | 'PHYSICAL_BARRIERS'
  | 'MENTAL_HEALTH_CRISIS'
  | 'RECOVERY_12STEP'
  | 'LAW_FIRST_RESPONDERS'
  | 'FOOD_PROGRAMS'
  | 'LOCAL_SOCIETIES'
  | 'SCHOOLS'
  | 'HANDS_ON_WORK';

export interface SanctuarySectionMeta {
  id: PrimarySectionId;
  title: string;
  shortBadge: string;
  subtitle: string;
  saveLabel: string;
  savedLabel: string;
  badgeClasses: string;
}

export const SANCTUARY_SECTIONS: SanctuarySectionMeta[] = [
  {
    id: 'COUNSELORS_THERAPY',
    title: 'Free & Low-Barrier Counselors & Talk Therapy',
    shortBadge: 'Free Counselor & Therapy',
    subtitle: 'Confidential individual, family, trauma & Indigenous Elder counseling (no doctor note needed)',
    saveLabel: 'Save Counselor to Phone',
    savedLabel: 'Saved Counselor',
    badgeClasses: 'bg-[#e4f6f3] text-[#13695e] border-[#b4e3db]'
  },
  {
    id: 'PREGNANCY_BABY',
    title: 'Pregnancy, Maternity, Newborns & Baby Care',
    shortBadge: 'Pregnancy & Baby Care',
    subtitle: 'Perinatal clinics, maternity housing, free infant formula, diapers, groceries & prenatal care',
    saveLabel: 'Save Pregnancy / Baby Hub',
    savedLabel: 'Saved Pregnancy Hub',
    badgeClasses: 'bg-[#fdf0ec] text-[#9c4132] border-[#f3c8bc]'
  },
  {
    id: 'HOSPITALS_LABS',
    title: 'Hospitals (24/7 ER), Walk-In UPCC Doctors & Medical Labs',
    shortBadge: 'Hospital, Doctor & Lab',
    subtitle: '24/7 Emergency Rooms, Hospital Social Workers, same-day UPCC walk-in doctors, LifeLabs & No-ID Street Nurses',
    saveLabel: 'Save Hospital / Lab to Phone',
    savedLabel: 'Saved Hospital / Lab',
    badgeClasses: 'bg-[#e6f2fa] text-[#185780] border-[#b8d8ee]'
  },
  {
    id: 'ALL_AGES_SENIORS_YOUTH',
    title: 'All Ages Sanctuary: Youth (12–24), Families & Seniors (55+ / 65+)',
    shortBadge: 'Youth, Families & Seniors',
    subtitle: 'Foundry youth clinics, child care subsidies ($1,250/mo), Jordan’s Principle, Seniors SAFER rent & Better at Home',
    saveLabel: 'Save Family / Age Support',
    savedLabel: 'Saved Age Support',
    badgeClasses: 'bg-[#f4efe4] text-[#6b4f28] border-[#dfd0b4]'
  },
  {
    id: 'HOUSING_HOMELESS',
    title: 'Homelessness Outreach & 24/7 Safe Shelters',
    shortBadge: 'Safe Shelter & Housing',
    subtitle: '24/7 shelter beds tonight, transitional housing, showers, laundry & street-to-home outreach',
    saveLabel: 'Save Shelter / Housing',
    savedLabel: 'Saved Shelter',
    badgeClasses: 'bg-[#e5f5f1] text-[#146358] border-[#b5e0d7]'
  },
  {
    id: 'SUBSIDIES_LEISURE',
    title: 'Rent Subsidies, Disability (PWD $1,500+/mo) & Free Leisure Passes',
    shortBadge: 'Subsidy, PWD & Leisure Pass',
    subtitle: 'BC Housing RAP/SAFER, BC Rent Bank, Disability (PWD), $52/yr Bus Pass & Free Pool/Gym/Shower Passes',
    saveLabel: 'Save Subsidy / Pass',
    savedLabel: 'Saved Subsidy',
    badgeClasses: 'bg-[#eaf6e8] text-[#266334] border-[#bfe0ba]'
  },
  {
    id: 'PHYSICAL_BARRIERS',
    title: 'Physical Barriers, Wheelchairs, Mobility & Adaptive Gear',
    shortBadge: 'Physical & Mobility Support',
    subtitle: 'Neil Squire assistive tech, wheelchair/equipment grants, HandyDART & inclusive employment',
    saveLabel: 'Save Mobility Support',
    savedLabel: 'Saved Mobility Hub',
    badgeClasses: 'bg-[#ebf3fb] text-[#1e5785] border-[#bfd8f0]'
  },
  {
    id: 'MENTAL_HEALTH_CRISIS',
    title: '24/7 Mental Health Crisis Lines, Mobile Teams & Clubhouses',
    shortBadge: 'Mental Health & 24/7 Crisis',
    subtitle: '9-8-8, Fraser Crisis, PACT peer response teams, CMHA & Stepping Stone Clubhouse',
    saveLabel: 'Save Crisis / Mental Health',
    savedLabel: 'Saved Mental Health',
    badgeClasses: 'bg-[#e8f4f8] text-[#1b5d73] border-[#bce0ec]'
  },
  {
    id: 'RECOVERY_12STEP',
    title: 'AA, NA, CA & CoDA Peer Recovery & Harm Reduction',
    shortBadge: 'AA / NA / CA / CoDA Recovery',
    subtitle: 'Free 24/7 anonymous peer recovery helplines, daily drop-in meetings & supportive recovery housing',
    saveLabel: 'Save Recovery Group',
    savedLabel: 'Saved Recovery Hub',
    badgeClasses: 'bg-[#e6f6f3] text-[#15695f] border-[#b6e4dc]'
  },
  {
    id: 'LAW_FIRST_RESPONDERS',
    title: 'Legal Aid, Tenant Eviction Defense & First Responders (Car 67/87 & Nurse 8-1-1)',
    shortBadge: 'Legal Aid & First Responders',
    subtitle: 'Free eviction/family/criminal lawyers, TRAC tenant law, Car 67/87 mental health teams, Fire Outreach & BCEHS',
    saveLabel: 'Save Legal / Responder',
    savedLabel: 'Saved Legal / Responder',
    badgeClasses: 'bg-[#edf2f8] text-[#284c73] border-[#c5d5e8]'
  },
  {
    id: 'FOOD_PROGRAMS',
    title: 'Local Food Banks, Community Kitchens & Daily Hot Meals',
    shortBadge: 'Food Bank & Hot Meals',
    subtitle: 'Same-day grocery hampers, hot lunches/suppers, halal/cultural hampers & low-cost markets',
    saveLabel: 'Save Food Bank to Phone',
    savedLabel: 'Saved Food Bank',
    badgeClasses: 'bg-[#eef8f0] text-[#216939] border-[#c2e4ca]'
  },
  {
    id: 'LOCAL_SOCIETIES',
    title: 'Options+, Sources BC & Local Multi-Service Community Societies',
    shortBadge: 'Community Society Hub',
    subtitle: 'DIVERSEcity, PICS, LCSS, Options+, Sources BC, Purpose Society, UGM, First United & Neighbourhood Houses',
    saveLabel: 'Save Society to Phone',
    savedLabel: 'Saved Society',
    badgeClasses: 'bg-[#f4f0e6] text-[#5c4827] border-[#dfd3bc]'
  },
  {
    id: 'SCHOOLS',
    title: 'Schools, Colleges & No-Written-Exam Trades Discovery (KPU, BCIT, VCC, Douglas, SD36)',
    shortBadge: 'School & College Trades',
    subtitle: 'Hands-on shop samplers, culinary, horticulture, adult upgrading & short certificates',
    saveLabel: 'Save School to Phone',
    savedLabel: 'Saved School',
    badgeClasses: 'bg-[#e8f3fa] text-[#1b5b82] border-[#bdd9ed]'
  },
  {
    id: 'HANDS_ON_WORK',
    title: 'Hands-On Makerspaces, Paid Training, Repair & Outdoor Crews',
    shortBadge: 'Hands-On Paid Training',
    subtitle: 'Practical workshops, computer/bike repair, stagehand, forestry, woodworking & paid job placements',
    saveLabel: 'Save Program to Phone',
    savedLabel: 'Saved Program',
    badgeClasses: 'bg-[#e4f7f4] text-[#146b60] border-[#b4e4dc]'
  }
];

export const CATEGORY_FILTER_PILLS: Array<{ id: SanctuaryCategoryFilter; label: string }> = [
  { id: 'ALL', label: 'All Sanctuary Options (78)' },
  { id: 'COUNSELORS_THERAPY', label: 'Free Counselors & Therapy' },
  { id: 'PREGNANCY_BABY', label: 'Pregnancy, Maternity & Baby Care' },
  { id: 'HOSPITALS_LABS', label: 'Hospitals, Walk-In Doctors & Labs' },
  { id: 'ALL_AGES_SENIORS_YOUTH', label: 'All Ages: Youth, Families & Seniors (55+)' },
  { id: 'HOUSING_HOMELESS', label: 'Homelessness & Safe Shelter' },
  { id: 'SUBSIDIES_LEISURE', label: 'Subsidies, PWD & Free Leisure Pass' },
  { id: 'PHYSICAL_BARRIERS', label: 'Physical Barriers & Mobility' },
  { id: 'MENTAL_HEALTH_CRISIS', label: 'Mental Health & 24/7 Crisis' },
  { id: 'RECOVERY_12STEP', label: 'AA / NA / CA / CoDA Recovery' },
  { id: 'LAW_FIRST_RESPONDERS', label: 'Law, Police, Fire & Ambulance' },
  { id: 'FOOD_PROGRAMS', label: 'Local Food Banks & Hot Meals' },
  { id: 'LOCAL_SOCIETIES', label: 'All Local Societies' },
  { id: 'OPTIONS_PLUS', label: 'Options+' },
  { id: 'SOURCES_BC', label: 'Sources BC' },
  { id: 'SCHOOLS', label: 'Schools & Colleges' },
  { id: 'HANDS_ON_WORK', label: 'Hands-On Work & Trades' }
];

/**
 * Deterministic mapping of every program ID to its Primary Section ID.
 * Prevents any accidental substring pollution across categories.
 */
const PRIMARY_SECTION_BY_ID: Record<string, PrimarySectionId> = {
  // 1. Free Counselors & Talk Therapy
  'prog-counselors-moving-forward-48': 'COUNSELORS_THERAPY',
  'prog-counselors-options-sources-community-49': 'COUNSELORS_THERAPY',
  'prog-counselors-indigenous-wellness-fnha-50': 'COUNSELORS_THERAPY',
  'prog-counselors-fraser-vch-mhs-51': 'COUNSELORS_THERAPY',

  // 2. Pregnancy, Maternity & Baby Care
  'prog-pregnancy-maxxine-wright-atira-52': 'PREGNANCY_BABY',
  'prog-pregnancy-healthiest-babies-options-53': 'PREGNANCY_BABY',
  'prog-pregnancy-tiny-bundles-baby-food-bank-54': 'PREGNANCY_BABY',
  'prog-pregnancy-options-sexual-health-bc-womens-55': 'PREGNANCY_BABY',

  // 3. Hospitals, Walk-In UPCC Doctors & Medical Labs
  'prog-hospitals-fraser-south-smh-pah-lmh-dh-56': 'HOSPITALS_LABS',
  'prog-hospitals-whiterock-peace-arch-56b': 'HOSPITALS_LABS',
  'prog-hospitals-langley-memorial-56c': 'HOSPITALS_LABS',
  'prog-hospitals-delta-56d': 'HOSPITALS_LABS',
  'prog-hospitals-fraser-north-rch-bh-erh-57': 'HOSPITALS_LABS',
  'prog-hospitals-burnaby-57b': 'HOSPITALS_LABS',
  'prog-hospitals-coquitlam-eagle-ridge-57c': 'HOSPITALS_LABS',
  'prog-hospitals-vch-vgh-stpauls-womens-richmond-58': 'HOSPITALS_LABS',
  'prog-hospitals-richmond-58b': 'HOSPITALS_LABS',
  'prog-upcc-walkin-doctors-lower-mainland-59': 'HOSPITALS_LABS',
  'prog-labs-lifelabs-hospital-outpatient-imaging-60': 'HOSPITALS_LABS',
  'prog-labs-no-id-street-nurse-quibble-creek-61': 'HOSPITALS_LABS',

  // 4. All Ages: Youth (12–24), Children/Families & Seniors (55+/65+)
  'prog-all-ages-seniors-55-plus-62': 'ALL_AGES_SENIORS_YOUTH',
  'prog-all-ages-children-families-childcare-63': 'ALL_AGES_SENIORS_YOUTH',
  'prog-all-ages-youth-12-to-24-foundry-kidshelp-64': 'ALL_AGES_SENIORS_YOUTH',
  'prog-pcrs-covenant-youth-34': 'ALL_AGES_SENIORS_YOUTH',
  'prog-foundry-bc-37': 'ALL_AGES_SENIORS_YOUTH',

  // 5. Homelessness & 24/7 Safe Shelters
  'prog-lookout-shelter-27': 'HOUSING_HOMELESS',
  'prog-efry-atira-women-35': 'HOUSING_HOMELESS',
  'prog-phoenix-society-28': 'HOUSING_HOMELESS',
  'prog-raincity-peer-29': 'HOUSING_HOMELESS',
  'prog-options-outreach-03': 'HOUSING_HOMELESS',

  // 6. Rent Subsidies, Disability (PWD) & Free Leisure Passes
  'prog-bchousing-subsidy-24': 'SUBSIDIES_LEISURE',
  'prog-sdpr-pwd-crisis-25': 'SUBSIDIES_LEISURE',
  'prog-bcrentbank-26': 'SUBSIDIES_LEISURE',
  'prog-workbc-multibarrier-subsidy-36': 'SUBSIDIES_LEISURE',
  'prog-leisure-access-surrey-41': 'SUBSIDIES_LEISURE',
  'prog-leisure-access-metro-42': 'SUBSIDIES_LEISURE',

  // 7. Physical Barriers, Wheelchairs & Mobility
  'prog-neilsquire-physical-38': 'PHYSICAL_BARRIERS',
  'prog-scibc-dabc-physical-39': 'PHYSICAL_BARRIERS',
  'prog-uniti-semiahmoo-posabilities-40': 'PHYSICAL_BARRIERS',

  // 8. 24/7 Mental Health Crisis & Clubhouses
  'prog-fraser-crisis-cares-32': 'MENTAL_HEALTH_CRISIS',
  'prog-vch-pact-aac-33': 'MENTAL_HEALTH_CRISIS',
  'prog-cmha-ips-30': 'MENTAL_HEALTH_CRISIS',
  'prog-steppingstone-clubhouse-31': 'MENTAL_HEALTH_CRISIS',

  // 9. AA, NA, CA & CoDA 12-Step Recovery
  'prog-recovery-aa-na-ca-coda-43': 'RECOVERY_12STEP',

  // 10. Law, Legal Aid & First Responders (Police Car 67/87, Fire, Ambulance, Nurse 8-1-1)
  'prog-law-legalaid-tenant-46': 'LAW_FIRST_RESPONDERS',
  'prog-first-responders-police-fire-ambulance-47': 'LAW_FIRST_RESPONDERS',

  // 11. Local Food Banks & Daily Hot Meals
  'prog-surrey-foodbank-13': 'FOOD_PROGRAMS',
  'prog-surrey-relief-04': 'FOOD_PROGRAMS',
  'prog-sources-foodhub-04': 'FOOD_PROGRAMS',
  'prog-sources-langley-fb-20': 'FOOD_PROGRAMS',
  'prog-cloverdale-kitchen-21': 'FOOD_PROGRAMS',
  'prog-muslim-foodbank-22': 'FOOD_PROGRAMS',
  'prog-quest-markets-14': 'FOOD_PROGRAMS',
  'prog-gvfb-burnaby-15': 'FOOD_PROGRAMS',
  'prog-share-food-coq-16': 'FOOD_PROGRAMS',
  'prog-deltassist-food-17': 'FOOD_PROGRAMS',
  'prog-richmond-foodbank-18': 'FOOD_PROGRAMS',
  'prog-dontgohungry-nw-23': 'FOOD_PROGRAMS',

  // 12. Local Multi-Service Community Societies (Options+, Sources BC, DIVERSEcity, PICS, LCSS, Purpose, UGM)
  'prog-sources-advocacy-06': 'LOCAL_SOCIETIES',
  'prog-local-societies-surrey-fraser-44': 'LOCAL_SOCIETIES',
  'prog-local-societies-metro-ugm-purpose-45': 'LOCAL_SOCIETIES',

  // 13. Schools & Colleges (KPU, BCIT, VCC, Douglas, SD36)
  'prog-kpu-trades-07': 'SCHOOLS',
  'prog-kpu-langley-hort-08': 'SCHOOLS',
  'prog-bcit-burnaby-09': 'SCHOOLS',
  'prog-vcc-culinary-auto-10': 'SCHOOLS',
  'prog-douglas-training-11': 'SCHOOLS',
  'prog-sd36-adult-ed-12': 'SCHOOLS',

  // 14. Hands-On Work, Makerspaces & Paid Skill Bridges
  'prog-surrey-culinary-01': 'HANDS_ON_WORK',
  'prog-options-employment-02': 'HANDS_ON_WORK',
  'prog-sources-empowered-05': 'HANDS_ON_WORK',
  'prog-surrey-maker-02': 'HANDS_ON_WORK',
  'prog-van-stagehand-05': 'HANDS_ON_WORK',
  'prog-van-bike-06': 'HANDS_ON_WORK',
  'prog-coq-hort-07': 'HANDS_ON_WORK',
  'prog-delta-logistics-08': 'HANDS_ON_WORK',
  'prog-langley-equine-09': 'HANDS_ON_WORK',
  'prog-burnaby-print-10': 'HANDS_ON_WORK',
  'prog-richmond-marine-11': 'HANDS_ON_WORK',
  'prog-nw-woodwork-12': 'HANDS_ON_WORK'
};

/**
 * Curated secondary filter memberships so multi-service hubs appear in relevant category tabs
 * ONLY when they genuinely provide that dedicated service, and always sorted AFTER primary hubs.
 */
const SECONDARY_FILTERS_BY_ID: Record<string, SanctuaryCategoryFilter[]> = {
  // Options+ programs
  'prog-surrey-culinary-01': ['OPTIONS_PLUS', 'LOCAL_SOCIETIES', 'FOOD_PROGRAMS'],
  'prog-options-employment-02': ['OPTIONS_PLUS', 'LOCAL_SOCIETIES'],
  'prog-options-outreach-03': ['OPTIONS_PLUS', 'LOCAL_SOCIETIES'],
  'prog-counselors-options-sources-community-49': ['OPTIONS_PLUS', 'SOURCES_BC', 'LOCAL_SOCIETIES'],
  'prog-pregnancy-healthiest-babies-options-53': ['OPTIONS_PLUS', 'ALL_AGES_SENIORS_YOUTH'],
  'prog-all-ages-children-families-childcare-63': ['OPTIONS_PLUS', 'SUBSIDIES_LEISURE'],

  // Sources BC programs
  'prog-sources-foodhub-04': ['SOURCES_BC', 'LOCAL_SOCIETIES'],
  'prog-sources-empowered-05': ['SOURCES_BC', 'LOCAL_SOCIETIES'],
  'prog-sources-advocacy-06': ['SOURCES_BC', 'SUBSIDIES_LEISURE'],
  'prog-sources-langley-fb-20': ['SOURCES_BC', 'LOCAL_SOCIETIES'],
  'prog-bcrentbank-26': ['SOURCES_BC', 'OPTIONS_PLUS', 'HOUSING_HOMELESS'],
  'prog-all-ages-seniors-55-plus-62': ['SOURCES_BC', 'SUBSIDIES_LEISURE'],

  // Housing & Homelessness crossovers
  'prog-bchousing-subsidy-24': ['HOUSING_HOMELESS'],
  'prog-pcrs-covenant-youth-34': ['HOUSING_HOMELESS', 'HANDS_ON_WORK'],
  'prog-local-societies-metro-ugm-purpose-45': ['HOUSING_HOMELESS', 'FOOD_PROGRAMS', 'RECOVERY_12STEP'],
  'prog-pregnancy-maxxine-wright-atira-52': ['HOUSING_HOMELESS', 'LOCAL_SOCIETIES'],
  'prog-lookout-shelter-27': ['LOCAL_SOCIETIES'],
  'prog-efry-atira-women-35': ['LOCAL_SOCIETIES'],
  'prog-phoenix-society-28': ['RECOVERY_12STEP', 'LOCAL_SOCIETIES', 'HANDS_ON_WORK'],
  'prog-raincity-peer-29': ['MENTAL_HEALTH_CRISIS', 'HANDS_ON_WORK'],

  // Mental health, counselors & youth crossovers
  'prog-counselors-fraser-vch-mhs-51': ['MENTAL_HEALTH_CRISIS'],
  'prog-foundry-bc-37': ['MENTAL_HEALTH_CRISIS', 'COUNSELORS_THERAPY', 'HOSPITALS_LABS'],
  'prog-all-ages-youth-12-to-24-foundry-kidshelp-64': ['MENTAL_HEALTH_CRISIS', 'COUNSELORS_THERAPY', 'HOUSING_HOMELESS'],
  'prog-cmha-ips-30': ['COUNSELORS_THERAPY', 'HANDS_ON_WORK', 'SUBSIDIES_LEISURE'],
  'prog-first-responders-police-fire-ambulance-47': ['MENTAL_HEALTH_CRISIS'],

  // Physical barriers & subsidies crossovers
  'prog-leisure-access-surrey-41': ['PHYSICAL_BARRIERS'],
  'prog-leisure-access-metro-42': ['PHYSICAL_BARRIERS'],
  'prog-neilsquire-physical-38': ['SUBSIDIES_LEISURE', 'HANDS_ON_WORK'],
  'prog-scibc-dabc-physical-39': ['SUBSIDIES_LEISURE'],
  'prog-uniti-semiahmoo-posabilities-40': ['LOCAL_SOCIETIES', 'HANDS_ON_WORK'],
  'prog-workbc-multibarrier-subsidy-36': ['HANDS_ON_WORK', 'PHYSICAL_BARRIERS'],

  // Pregnancy & Food Bank / Hospital crossovers
  'prog-pregnancy-tiny-bundles-baby-food-bank-54': ['FOOD_PROGRAMS'],
  'prog-pregnancy-options-sexual-health-bc-womens-55': ['HOSPITALS_LABS'],

  // Schools that also offer hands-on trades
  'prog-kpu-trades-07': ['HANDS_ON_WORK'],
  'prog-kpu-langley-hort-08': ['HANDS_ON_WORK'],
  'prog-bcit-burnaby-09': ['HANDS_ON_WORK'],
  'prog-vcc-culinary-auto-10': ['HANDS_ON_WORK'],
  'prog-douglas-training-11': ['HANDS_ON_WORK']
};

export function getProgramPrimarySectionId(prog: VerifiedProgramRecord): PrimarySectionId {
  const mapped = PRIMARY_SECTION_BY_ID[prog.program_id];
  if (mapped) return mapped;
  if (prog.category === 'Survival_Relief') return 'FOOD_PROGRAMS';
  return 'HANDS_ON_WORK';
}

export function getProgramSectionMeta(prog: VerifiedProgramRecord): SanctuarySectionMeta {
  const secId = getProgramPrimarySectionId(prog);
  return SANCTUARY_SECTIONS.find((s) => s.id === secId) || SANCTUARY_SECTIONS[0];
}

/**
 * Returns whether a program belongs to a selected category filter, and whether it is a Primary (1) or Secondary (2) match.
 */
export function getCategoryFilterRank(
  prog: VerifiedProgramRecord,
  filter: SanctuaryCategoryFilter
): 0 | 1 | 2 {
  if (filter === 'ALL') return 1;
  const primarySection = getProgramPrimarySectionId(prog);
  if (primarySection === filter) return 1;
  const secondaries = SECONDARY_FILTERS_BY_ID[prog.program_id] || [];
  if (secondaries.includes(filter)) return 2;
  return 0;
}

/**
 * Regional/Multi-City programs that genuinely operate branches or toll-free lines serving multiple cities.
 */
const MULTI_CITY_COVERAGE_BY_ID: Record<string, string[] | 'ALL_CITIES'> = {
  'prog-counselors-moving-forward-48': 'ALL_CITIES',
  'prog-counselors-indigenous-wellness-fnha-50': 'ALL_CITIES',
  'prog-counselors-fraser-vch-mhs-51': 'ALL_CITIES',
  'prog-counselors-options-sources-community-49': ['Surrey', 'White Rock / South Surrey', 'Delta', 'Langley'],
  'prog-pregnancy-healthiest-babies-options-53': 'ALL_CITIES',
  'prog-pregnancy-tiny-bundles-baby-food-bank-54': 'ALL_CITIES',
  'prog-pregnancy-options-sexual-health-bc-womens-55': 'ALL_CITIES',
  'prog-upcc-walkin-doctors-lower-mainland-59': 'ALL_CITIES',
  'prog-labs-lifelabs-hospital-outpatient-imaging-60': 'ALL_CITIES',
  'prog-labs-no-id-street-nurse-quibble-creek-61': ['Surrey', 'New Westminster', 'Vancouver', 'Burnaby', 'Langley'],
  'prog-all-ages-seniors-55-plus-62': 'ALL_CITIES',
  'prog-all-ages-children-families-childcare-63': 'ALL_CITIES',
  'prog-all-ages-youth-12-to-24-foundry-kidshelp-64': 'ALL_CITIES',
  'prog-bchousing-subsidy-24': 'ALL_CITIES',
  'prog-sdpr-pwd-crisis-25': 'ALL_CITIES',
  'prog-bcrentbank-26': 'ALL_CITIES',
  'prog-lookout-shelter-27': ['Surrey', 'White Rock / South Surrey', 'New Westminster', 'Burnaby', 'Vancouver', 'Coquitlam'],
  'prog-efry-atira-women-35': ['New Westminster', 'Surrey', 'White Rock / South Surrey', 'Burnaby', 'Vancouver', 'Langley'],
  'prog-workbc-multibarrier-subsidy-36': 'ALL_CITIES',
  'prog-foundry-bc-37': ['Langley', 'Surrey', 'Vancouver', 'Richmond', 'Coquitlam'],
  'prog-neilsquire-physical-38': 'ALL_CITIES',
  'prog-scibc-dabc-physical-39': 'ALL_CITIES',
  'prog-leisure-access-metro-42': ['Vancouver', 'Burnaby', 'New Westminster', 'Coquitlam', 'Langley', 'Delta', 'Richmond'],
  'prog-leisure-access-surrey-41': ['Surrey', 'White Rock / South Surrey'],
  'prog-recovery-aa-na-ca-coda-43': 'ALL_CITIES',
  'prog-local-societies-surrey-fraser-44': ['Surrey', 'White Rock / South Surrey', 'Langley', 'Delta'],
  'prog-local-societies-metro-ugm-purpose-45': ['New Westminster', 'Burnaby', 'Vancouver'],
  'prog-law-legalaid-tenant-46': 'ALL_CITIES',
  'prog-first-responders-police-fire-ambulance-47': 'ALL_CITIES',
  'prog-fraser-crisis-cares-32': ['Surrey', 'White Rock / South Surrey', 'Langley', 'Delta', 'Burnaby', 'New Westminster', 'Coquitlam'],
  'prog-vch-pact-aac-33': ['Vancouver', 'Richmond']
};

export function getCityMatchTier(
  prog: VerifiedProgramRecord,
  selectedCity?: string
): 'exact' | 'regional' | 'none' {
  if (!selectedCity || selectedCity === 'All') return 'exact';
  if (prog.municipality.toLowerCase() === selectedCity.toLowerCase()) {
    return 'exact';
  }
  const multi = MULTI_CITY_COVERAGE_BY_ID[prog.program_id];
  if (multi === 'ALL_CITIES') return 'regional';
  if (Array.isArray(multi) && multi.some((c) => c.toLowerCase() === selectedCity.toLowerCase())) {
    return 'regional';
  }
  return 'none';
}

export interface ParsedContactBadge {
  label?: string;
  value: string;
  href?: string;
  kind: 'phone' | 'email' | 'web' | 'text';
}

/**
 * Parses a multi-number / email contact string into clean, structured, clickable badges.
 */
export function parseContactBadges(raw: string): ParsedContactBadge[] {
  if (!raw) return [];
  const parts = raw
    .split(/\s*[•|/]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const badges: ParsedContactBadge[] = [];

  for (const part of parts) {
    // Email check
    const emailMatch = part.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      badges.push({
        value: emailMatch[1],
        href: `mailto:${emailMatch[1]}`,
        kind: 'email'
      });
      continue;
    }

    // Check for Label: Number pattern (e.g., "Surrey Memorial 24/7 ER: 604-581-2211" or "Emergency: 9-1-1")
    const colonIdx = part.indexOf(':');
    let label: string | undefined;
    let remainder = part;
    if (colonIdx !== -1) {
      label = part.slice(0, colonIdx).trim();
      remainder = part.slice(colonIdx + 1).trim();
    }

    // Phone or 3-digit helpline check (9-1-1, 8-1-1, 2-1-1, 9-8-8, 3-1-1, 310-6789, 1-800-..., 604-..., 778-...)
    const phoneMatch = remainder.match(
      /(\b(?:1-\d{3}-\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|310-\d{4}|[2389]-1-1|9-8-8|686868)\b)/
    );
    if (phoneMatch) {
      const digits = phoneMatch[1].replace(/[^0-9]/g, '');
      badges.push({
        label,
        value: remainder,
        href: `tel:${digits}`,
        kind: 'phone'
      });
      continue;
    }

    // Domain check
    if (/\b[a-z0-9-]+\.(ca|org|com|bc\.ca|help)\b/i.test(remainder)) {
      const cleanUrl = remainder.startsWith('http') ? remainder : `https://${remainder}`;
      badges.push({
        label,
        value: remainder,
        href: cleanUrl,
        kind: 'web'
      });
      continue;
    }

    badges.push({
      label,
      value: part,
      kind: 'text'
    });
  }

  return badges;
}

export interface HelplineGroupCard {
  id: string;
  title: string;
  badgeColor: string;
  lines: Array<{
    name: string;
    number: string;
    tel: string;
    note?: string;
  }>;
}

export const GROUPED_24_7_HELPLINES: HelplineGroupCard[] = [
  {
    id: 'emergency-shelter',
    title: '1. Emergency, 24/7 Nurse & Shelter Tonight',
    badgeColor: 'border-[#bce5dd] bg-[#f2fbf9]',
    lines: [
      { name: 'Police / Fire / Ambulance', number: '9-1-1', tel: '911', note: '24/7 Emergency' },
      { name: 'Registered Nurse & HealthLink', number: '8-1-1', tel: '811', note: '24/7 Free Nurse' },
      { name: 'Shelter Beds & Street Help', number: '2-1-1', tel: '211', note: 'Call or Text 24/7' }
    ]
  },
  {
    id: 'mental-health-crisis',
    title: '2. 24/7 Mental Health Crisis & Mobile Teams',
    badgeColor: 'border-[#bdd9ed] bg-[#f2f8fc]',
    lines: [
      { name: 'Suicide & Crisis Lifeline', number: '9-8-8', tel: '988', note: 'Call or Text 24/7' },
      { name: 'Fraser Health Crisis Line', number: '604-951-8855', tel: '6049518855', note: 'Or 310-6789' },
      { name: 'Surrey Car 67 / Van Car 87', number: '604-599-0502', tel: '6045990502', note: 'Van: 604-675-3700' }
    ]
  },
  {
    id: 'free-counselors',
    title: '3. Free Counselors & Indigenous Wellness',
    badgeColor: 'border-[#c2e4ca] bg-[#f3faf5]',
    lines: [
      { name: 'Moving Forward (25+ Languages)', number: '778-321-3054', tel: '7783213054', note: 'Call or Text' },
      { name: 'Options+ / Sources Counseling', number: '604-596-4321', tel: '6045964321', note: 'Sources: 604-538-2522' },
      { name: 'KUU-US Indigenous 24/7 Line', number: '1-800-588-8717', tel: '18005888717', note: 'Elders & Healing' }
    ]
  },
  {
    id: 'pregnancy-baby',
    title: '4. Pregnancy, Maternity & Baby Care',
    badgeColor: 'border-[#f0cfc5] bg-[#fdf5f2]',
    lines: [
      { name: 'Maxxine Wright Clinic & Moms', number: '604-587-3800', tel: '6045873800', note: 'Shelter: 604-588-1697' },
      { name: 'Healthiest Babies Possible', number: '604-584-4940', tel: '6045844940', note: 'Free Groceries/Vitamins' },
      { name: 'Tiny Bundles Formula & Diapers', number: '604-581-5443', tel: '6045815443', note: 'Sex Sense: 1-800-739-7367' }
    ]
  },
  {
    id: 'hospitals-labs',
    title: '5. Hospitals, Walk-In UPCC Doctors & Labs',
    badgeColor: 'border-[#c2d9ec] bg-[#f3f8fc]',
    lines: [
      { name: 'Surrey Memorial / Jim Pattison', number: '604-581-2211', tel: '6045812211', note: 'Peace Arch: 604-531-5512' },
      { name: 'Whalley Walk-In UPCC Doctor', number: '604-585-5660', tel: '6045855660', note: 'Newton: 604-592-2728' },
      { name: 'No-ID Street Nurse Lab / LifeLabs', number: '604-587-3750', tel: '6045873750', note: 'LifeLabs: 1-877-849-3637' }
    ]
  },
  {
    id: 'all-ages-recovery-legal',
    title: '6. Youth, Seniors (55+), AA/NA & Legal Aid',
    badgeColor: 'border-[#dfd2bc] bg-[#faf6ee]',
    lines: [
      { name: 'Youth 12–24 (Foundry / Kids Help)', number: '1-800-668-6868', tel: '18006686868', note: 'Foundry: 604-592-6200' },
      { name: 'Seniors 55+ / PWD Assistance', number: '1-877-952-3181', tel: '18779523181', note: 'PWD: 1-866-866-0800' },
      { name: 'AA / NA / CA / CoDA & Legal Aid', number: '604-434-3933', tel: '6044343933', note: 'NA: 604-873-1018 • Legal: 604-408-2172' }
    ]
  }
];
