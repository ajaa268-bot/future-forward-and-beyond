import React, { useState } from 'react';
import {
  Phone,
  Bus,
  ShieldCheck,
  Pin,
  MessageSquare,
  HeartHandshake,
  Search,
  X,
  GraduationCap,
  Utensils,
  Sparkles,
  Volume2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
} from '../types/navigator.js';
import {
  SanctuaryCategoryFilter,
  CATEGORY_FILTER_PILLS,
  GROUPED_24_7_HELPLINES,
  getCategoryFilterRank,
  getCityMatchTier,
  getProgramSectionMeta,
  parseContactBadges
} from '../types/programGrouping.js';
import { RealWorldConnectionBridgeModal } from './RealWorldConnectionBridgeModal.js';

interface CoordinatorTriagePanelProps {
  session: ClientWorkbookSession;
  ddl: {
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  };
  onPatchSession: (patch: Partial<ClientWorkbookSession>) => void;
}

type PartnerFilter = SanctuaryCategoryFilter;

const AREA_OPTIONS = [
  { value: 'All', label: 'All Lower Mainland Areas (Every City)' },
  { value: 'Surrey', label: 'Surrey (Whalley, Newton, Guildford, Cloverdale)' },
  { value: 'White Rock / South Surrey', label: 'White Rock / South Surrey' },
  { value: 'Langley', label: 'Langley (City & Township)' },
  { value: 'Delta', label: 'Delta (North Delta, Ladner & Tsawwassen)' },
  { value: 'Burnaby', label: 'Burnaby (Metrotown, Edmonds & Brentwood)' },
  { value: 'New Westminster', label: 'New Westminster' },
  { value: 'Coquitlam', label: 'Coquitlam / Tri-Cities (Port Moody & PoCo)' },
  { value: 'Vancouver', label: 'Vancouver' },
  { value: 'Richmond', label: 'Richmond' }
];

const CONVERSATIONAL_MATRIX = [
  {
    id: 'everyday_learning',
    tier: 'Everyday Learning',
    question:
      '"When you want to learn how to make or fix something—like a meal or a bike—do you like watching someone do it in person, watching a short video, or reading steps?"',
    signal: 'Finds out if hands-on learning works best without asking awkward reading questions.',
    helpIncluded: 'Matches with 100% hands-on programs',
    isApplied: (s: ClientWorkbookSession) =>
      s.preferred_learning_modality === 'Kinesthetic_HandsOn' && s.text_admin_tolerance === 1,
    applyPatch: (): Partial<ClientWorkbookSession> => ({
      preferred_learning_modality: 'Kinesthetic_HandsOn',
      text_admin_tolerance: 1
    })
  },
  {
    id: 'paperwork_id',
    tier: 'Paperwork & ID Help',
    question:
      '"How do you feel about paperwork and forms? Would you rather have someone sit down with a coffee and help sort the annoying stuff together?"',
    signal: 'Spots when someone needs help filling out forms or starting without ID.',
    helpIncluded: 'Includes form helper + no-ID start',
    isApplied: (s: ClientWorkbookSession) =>
      s.coordinator_scribe_required &&
      s.active_barriers.includes('Paperwork / Scribe Help') &&
      s.active_barriers.includes('Replacement ID / SIN'),
    applyPatch: (s: ClientWorkbookSession): Partial<ClientWorkbookSession> => ({
      coordinator_scribe_required: true,
      active_barriers: Array.from(
        new Set([...s.active_barriers, 'Paperwork / Scribe Help', 'Replacement ID / SIN'])
      )
    })
  },
  {
    id: 'paid_handson',
    tier: 'Paid Hands-On Programs',
    question:
      '"If you could jump into a hands-on workshop that pays a training allowance or gives you free gear, what sounds best: cooking, fixing tech, audio/events, or outdoor work?"',
    signal: 'Finds what actually interests them while adding paid training support.',
    helpIncluded: 'Matches with paid training & gear',
    isApplied: (s: ClientWorkbookSession) =>
      s.current_readiness_tier === 2 && s.active_barriers.includes('Work Boots / Gear'),
    applyPatch: (s: ClientWorkbookSession): Partial<ClientWorkbookSession> => ({
      current_readiness_tier: 2,
      active_barriers: Array.from(new Set([...s.active_barriers, 'Work Boots / Gear']))
    })
  },
  {
    id: 'problem_solving',
    tier: 'Real-World Problem Solving',
    question:
      '"Think about a time things went sideways on a meal, a repair, or a project, and you figured out a way to make it work—what did you do?"',
    signal: 'Recognizes strong real-world problem solving for trades or hands-on careers.',
    helpIncluded: 'Matches with practical skill programs (no written tests)',
    isApplied: (s: ClientWorkbookSession) =>
      s.problem_solving_complexity === 5 && s.text_admin_tolerance <= 2,
    applyPatch: (s: ClientWorkbookSession): Partial<ClientWorkbookSession> => ({
      problem_solving_complexity: 5,
      text_admin_tolerance: Math.min(s.text_admin_tolerance, 2)
    })
  }
];

export const CoordinatorTriagePanel: React.FC<CoordinatorTriagePanelProps> = ({
  session,
  ddl,
  onPatchSession
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<PartnerFilter>('ALL');
  const [sameDayOnly, setSameDayOnly] = useState(false);
  const [bridgeModalOpen, setBridgeModalOpen] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllFoodHubs, setShowAllFoodHubs] = useState(false);

  const iq = session.problem_solving_complexity;
  const textTol = session.text_admin_tolerance;

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getStrengthStyle = () => {
    if (iq >= 3 && textTol <= 2) {
      return {
        tag: 'Hands-On Problem Solver',
        name: 'Great With Hands-On Work • Skip the Heavy Paperwork',
        route: 'Best fit: Options+ kitchens, KPU/BCIT/VCC trades shops, repair labs, and event setup (with practical checkouts instead of written tests).',
        badgeColor: 'bg-[#e6f6f3] text-[#1b7a6e] border-[#bce5dd]'
      };
    }
    if (iq >= 3 && textTol >= 3) {
      return {
        tag: 'Tech & Planning Builder',
        name: 'Strong Problem Solver • Comfortable With Guides & Checklists',
        route: 'Best fit: Computer & tech repair, Douglas College certificates, and step-by-step technical training.',
        badgeColor: 'bg-[#e8f3f9] text-[#23638a] border-[#c2dff0]'
      };
    }
    if (iq < 3 && textTol <= 2) {
      return {
        tag: 'Steady Hands-On Helper',
        name: 'Prefers Clear, Practical Tasks With a Friendly Group',
        route: 'Best fit: Community gardens, food bank teams, kitchen prep, and supportive hands-on workshops.',
        badgeColor: 'bg-[#eaf7f4] text-[#21766b] border-[#bce5dd]'
      };
    }
    return {
      tag: 'Organized & Steady',
      name: 'Likes Calm, Predictable Routines & Clear Checklists',
      route: 'Best fit: Inventory sorting, library/community supplies, and quiet indoor roles.',
      badgeColor: 'bg-[#edf5fa] text-[#2d6387] border-[#c8e0f0]'
    };
  };

  const strengthStyle = getStrengthStyle();

  const matchesSearchText = (prog: VerifiedProgramRecord) => {
    if (!searchQuery.trim()) return true;
    const haystack = [
      prog.program_name,
      prog.organization_name,
      prog.municipality,
      prog.street_address,
      prog.highlight_note,
      prog.noc_code,
      prog.contact_lead_name,
      prog.contact_phone_or_email,
      ...(prog.hobby_tags || [])
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  };

  const sortByCategoryAndCity = (list: VerifiedProgramRecord[], activeFilter: PartnerFilter) => {
    return [...list].sort((a, b) => {
      const rankA = getCategoryFilterRank(a, activeFilter) || 99;
      const rankB = getCategoryFilterRank(b, activeFilter) || 99;
      if (rankA !== rankB) return rankA - rankB;

      const cityA = getCityMatchTier(a, session.municipality);
      const cityB = getCityMatchTier(b, session.municipality);
      const cityScoreA = cityA === 'exact' ? 1 : cityA === 'regional' ? 2 : 3;
      const cityScoreB = cityB === 'exact' ? 1 : cityB === 'regional' ? 2 : 3;
      return cityScoreA - cityScoreB;
    });
  };

  const filterAndRankList = (list: VerifiedProgramRecord[], activeFilter: PartnerFilter) => {
    const filtered = list.filter((prog) => {
      if (!matchesSearchText(prog)) return false;
      if (sameDayOnly && (prog.intake_type !== 'Drop-In' || prog.waitlist_weeks_estimate > 0)) {
        return false;
      }
      const rank = getCategoryFilterRank(prog, activeFilter);
      if (rank === 0) return false;
      if (session.municipality && session.municipality !== 'All') {
        const cityFit = getCityMatchTier(prog, session.municipality);
        if (cityFit === 'none') return false;
      }
      return true;
    });
    return sortByCategoryAndCity(filtered, activeFilter);
  };

  // Deduplicate combined list when filtering by a specific category or search query
  const allCombinedUnique = Array.from(
    new Map(
      [...ddl.immediate_relief_matches, ...ddl.primary_matches].map((p) => [p.program_id, p])
    ).values()
  );

  const isFilteredView = partnerFilter !== 'ALL' || Boolean(searchQuery.trim());

  const filteredRelief = isFilteredView
    ? []
    : filterAndRankList(ddl.immediate_relief_matches, 'ALL');

  const filteredPrimary = isFilteredView
    ? filterAndRankList(allCombinedUnique, partnerFilter)
    : filterAndRankList(ddl.primary_matches, 'ALL');

  const activePillLabel =
    CATEGORY_FILTER_PILLS.find((p) => p.id === partnerFilter)?.label || 'Matching Sanctuary Programs';

  const visibleFoodHubs = showAllFoodHubs ? filteredRelief : filteredRelief.slice(0, 4);
  const visiblePrimaryPrograms = showAllPrograms ? filteredPrimary : filteredPrimary.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Real-World Strengths & Local Program Matches */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 5 Cols: Simple 4-Way Strengths Guide */}
        <div className="xl:col-span-5 clinical-card border border-[#dfe6dd] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2a9d8f]">
                How You Work Best
              </span>
              <span className={`text-xs font-semibold px-3 py-0.5 rounded-full border ${strengthStyle.badgeColor}`}>
                {strengthStyle.tag}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#163038]">
              Real-World Smarts Are Separate From Paperwork
            </h3>
            <p className="text-xs text-[#547078] mt-1">
              Hating forms or long reading never holds you back here—tap any box below or slide the bars to match how you like to work.
            </p>

            {/* Simple Interactive 2x2 Everyday Grid (Every Box is Clickable!) */}
            <div className="mt-4 relative linen-card border border-[#e3dccf] rounded-2xl p-4">
              <div className="text-center text-[11px] font-bold text-[#1b7a6e] mb-2.5">
                ▲ Loves Figuring Out Problems &amp; Fixing Things
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Box A */}
                <button
                  type="button"
                  onClick={() =>
                    onPatchSession({
                      problem_solving_complexity: 5,
                      text_admin_tolerance: 1,
                      preferred_learning_modality: 'Kinesthetic_HandsOn'
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    strengthStyle.tag === 'Hands-On Problem Solver'
                      ? 'bg-[#e6f6f3] border-[#2a9d8f] text-[#154d46] shadow-xs ring-2 ring-[#2a9d8f]/25'
                      : 'bg-white/85 hover:bg-[#f0faf8] border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1b7a6e]">
                      Hands-On Problem Solver
                    </span>
                    {strengthStyle.tag === 'Hands-On Problem Solver' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1b7a6e] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Great at cooking, fixing, or building things by hand—without long forms or written tests.
                  </p>
                </button>

                {/* Box B */}
                <button
                  type="button"
                  onClick={() =>
                    onPatchSession({
                      problem_solving_complexity: 4,
                      text_admin_tolerance: 4,
                      preferred_learning_modality: 'Visual_Blueprint'
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    strengthStyle.tag === 'Tech & Planning Builder'
                      ? 'bg-[#e8f3f9] border-[#3b82a6] text-[#164966] shadow-xs ring-2 ring-[#3b82a6]/25'
                      : 'bg-white/85 hover:bg-[#f0f7fc] border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#23638a]">
                      Tech &amp; Planning Builder
                    </span>
                    {strengthStyle.tag === 'Tech & Planning Builder' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#23638a] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Enjoys troubleshooting tech, setups, and projects using guides or checklists.
                  </p>
                </button>

                {/* Box C */}
                <button
                  type="button"
                  onClick={() =>
                    onPatchSession({
                      problem_solving_complexity: 2,
                      text_admin_tolerance: 1,
                      preferred_learning_modality: 'Verbal_Coaching'
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    strengthStyle.tag === 'Steady Hands-On Helper'
                      ? 'bg-[#eaf7f4] border-[#2a9d8f] text-[#154d46] shadow-xs ring-2 ring-[#2a9d8f]/25'
                      : 'bg-white/85 hover:bg-[#f0faf8] border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#21766b]">
                      Steady Hands-On Helper
                    </span>
                    {strengthStyle.tag === 'Steady Hands-On Helper' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#21766b] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Likes clear, active, everyday tasks with a friendly crew and zero paperwork.
                  </p>
                </button>

                {/* Box D */}
                <button
                  type="button"
                  onClick={() =>
                    onPatchSession({
                      problem_solving_complexity: 2,
                      text_admin_tolerance: 4,
                      preferred_learning_modality: 'Text_Manual'
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    strengthStyle.tag === 'Organized & Steady'
                      ? 'bg-[#edf5fa] border-[#3b82a6] text-[#164966] shadow-xs ring-2 ring-[#3b82a6]/25'
                      : 'bg-white/85 hover:bg-[#f0f7fc] border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2d6387]">
                      Organized &amp; Steady
                    </span>
                    {strengthStyle.tag === 'Organized & Steady' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6387] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Likes calm indoor spaces, sorting supplies, and following a simple daily checklist.
                  </p>
                </button>
              </div>

              <div className="flex justify-between text-[10px] font-semibold text-[#547078] mt-3 pt-2 border-t border-[#e5dfd2]">
                <span>◄ Skip the Paperwork</span>
                <span>Comfortable With Lists ►</span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#f1faf8] border border-[#cde8e2] text-xs text-[#1c4e47]">
              <strong className="text-[#15685d]">Matched Path:</strong> {strengthStyle.route}
            </div>
          </div>

          {/* Simple Sliders to Fine-Tune */}
          <div className="mt-4 pt-3.5 border-t border-[#eae4d8] grid grid-cols-2 gap-3">
            <div className="linen-card p-3 rounded-xl border border-[#e3dccf]">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#4a656d]">Hands-On Problem Solving:</span>
                <span className="text-[#1b7a6e] font-bold">{iq}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={iq}
                onChange={(e) =>
                  onPatchSession({ problem_solving_complexity: Number(e.target.value) })
                }
                className="w-full accent-[#2a9d8f] mt-1.5 cursor-pointer"
              />
            </div>
            <div className="linen-card p-3 rounded-xl border border-[#e3dccf]">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#4a656d]">Comfort With Forms:</span>
                <span className="text-[#2c6e9b] font-bold">{textTol}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={textTol}
                onChange={(e) =>
                  onPatchSession({ text_admin_tolerance: Number(e.target.value) })
                }
                className="w-full accent-[#2c6e9b] mt-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Best Local Programs, Search, Partners & Local Food Banks */}
        <div className="xl:col-span-7 clinical-card border border-[#dfe6dd] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eae4d8] pb-3.5">
            <div>
              <div className="text-xs font-semibold text-[#1b7a6e] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2a9d8f]" /> Personal Action Plan — {session.client_alias}
              </div>
              <h3 className="text-base font-bold text-[#163038] mt-0.5">
                Connect With Options+, Sources BC, Schools &amp; Local Food Banks
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBridgeModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#e3f7f4] hover:bg-[#cdeee9] border border-[#9ddbd1] text-[#0f5e53] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-[#1ca796]" />
                <span>Desk Card, Call Script &amp; Bus Helper</span>
              </button>
              <button
                type="button"
                onClick={() => setSameDayOnly(!sameDayOnly)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  sameDayOnly
                    ? 'ocean-btn text-white'
                    : 'bg-[#fff8e8] hover:bg-[#fcedc8] border-[#f2d28b] text-[#8a520d]'
                }`}
              >
                {sameDayOnly ? '✓ Walk-In Today Only' : 'Walk-In Today Only'}
              </button>
              <MapPin className="w-3.5 h-3.5 text-[#1ca796]" />
              <span className="text-xs font-medium text-[#4a656d]">City / Area:</span>
              <select
                value={session.municipality}
                onChange={(e) => onPatchSession({ municipality: e.target.value })}
                className="bg-[#f7f4ed] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#163038] cursor-pointer focus:outline-none focus:border-[#2a9d8f]"
              >
                {AREA_OPTIONS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 24/7 Emergency, Crisis, Shelter, Counselors, Pregnancy, Hospitals/Labs & AA/NA/CA/CoDA Quick Access */}
          <div className="bg-gradient-to-r from-[#e5f5f2] via-[#eaf4fa] to-[#f4f0e6] border border-[#b4dfd7] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#145e54] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1ca796]" /> 24/7 Grouped Sanctuary Helplines — Tap Any Number to Call
              </span>
              <button
                type="button"
                onClick={() =>
                  speakText(
                    '24/7 Free Support Lines for All Ages. Emergency Police, Fire, or Ambulance: call 9 1 1. Free 24/7 Nurse and Urgent Care info: call 8 1 1. Shelter beds tonight: call or text 2 1 1. Suicide and mental health crisis line: call or text 9 8 8, or Fraser Crisis 604-951-8855. Free Counseling in 25 languages at Moving Forward: 778-321-3054. Pregnancy and Maxxine Wright Clinic: 604-587-3800. LifeLabs and Outpatient Labs: 1-877-849-3637. Seniors Line: 1-877-952-3181. Kids Help Phone: 1-800-668-6868. Alcoholics Anonymous: 604-434-3933. Narcotics Anonymous: 604-873-1018.'
                  )
                }
                className="text-[11px] font-semibold text-[#1b7a6e] hover:text-[#12323b] bg-white px-2.5 py-1 rounded-lg border border-[#bce5dd] flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> Read Numbers Out Loud
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
              {GROUPED_24_7_HELPLINES.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-xl px-3 py-2.5 border space-y-1.5 ${group.badgeColor}`}
                >
                  <div className="font-bold text-[#14343d] text-[11px]">{group.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.lines.map((item) => (
                      <a
                        key={`${group.id}-${item.name}-${item.number}`}
                        href={`tel:${item.tel}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#dff3ee] border border-[#bce5dd] text-[#145e54] font-semibold transition-colors"
                        title={item.note ? `${item.name}: ${item.number} (${item.note})` : `${item.name}: ${item.number}`}
                      >
                        <span className="text-[#35565f] font-medium">{item.name}:</span>
                        <span className="font-bold text-[#0f5248]">{item.number}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar & Quick Partner Filter Buttons */}
          <div className="linen-card border border-[#e3dccf] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#547078] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by program name, city, phone number, hospital, counselor, shelter, Options+, Sources BC..."
                  className="w-full bg-white border border-[#dcd4c4] rounded-xl pl-9 pr-8 py-2 text-xs text-[#163038] placeholder:text-[#6c858d] focus:outline-none focus:border-[#2a9d8f]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#547078] hover:text-[#163038] cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {partnerFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setPartnerFilter('ALL')}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-[#e6f6f3] border border-[#dcd4c4] text-xs font-semibold text-[#1b7a6e] cursor-pointer transition-all"
                >
                  Reset Category Filter
                </button>
              )}
              {session.municipality !== 'All' && (
                <button
                  type="button"
                  onClick={() => onPatchSession({ municipality: 'All' })}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-[#e6f6f3] border border-[#dcd4c4] text-xs font-semibold text-[#1b7a6e] cursor-pointer transition-all"
                >
                  Show All Lower Mainland Cities
                </button>
              )}
            </div>

            {/* Partner & Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORY_FILTER_PILLS.map((pill) => {
                const active = partnerFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setPartnerFilter(pill.id);
                      if (pill.id !== 'ALL') {
                        setShowAllPrograms(true);
                        setShowAllFoodHubs(true);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      active
                        ? 'ocean-btn text-white shadow-2xs'
                        : 'bg-white text-[#35565f] hover:bg-[#e6f6f3] border border-[#dcd4c4]'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plain-Language Support Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="linen-card border border-[#e3dccf] rounded-xl p-3.5">
              <div className="text-[11px] font-semibold uppercase text-[#1b7a6e] mb-1">
                Why These Programs Fit You
              </div>
              <p className="text-xs text-[#37535b] leading-relaxed">
                {session.skill_blueprint_json.coordinator_private_notes}
              </p>
            </div>
            <div className="bg-[#f1f7f9] border border-[#cfe2ec] rounded-xl p-3.5">
              <div className="text-[11px] font-semibold uppercase text-[#1e5678] mb-1.5 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[#2a9d8f]" /> Practical Help Included for You
              </div>
              <div className="flex flex-wrap gap-1.5">
                {session.active_barriers.length > 0 ? (
                  session.active_barriers.map((b) => (
                    <span
                      key={b}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white text-[#1b7a6e] border border-[#bce5dd]"
                    >
                      ✓ {b}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#4a656d]">
                    Tap any extra support you need in Step 5 (bus tickets, meals, boots, shelter, counseling, or form help).
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Same-Day Care, Shelters, Food Banks & Immediate Relief Section */}
          {filteredRelief.length > 0 && (
            <div className="bg-[#eaf4fa] border border-[#b9d9ec] rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-[#1e5678] flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-[#1ca796]" /> Same-Day Support: Food Banks, Shelters, Urgent Care &amp; Drop-In Help ({filteredRelief.length} Matched)
                </span>
                {filteredRelief.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllFoodHubs(!showAllFoodHubs)}
                    className="text-xs font-semibold text-[#1b7a6e] hover:text-[#12323b] bg-white px-3 py-1 rounded-full border border-[#bce5dd] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showAllFoodHubs ? (
                      <>
                        Show Top 3 Same-Day Supports <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Show All {filteredRelief.length} Same-Day Supports <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {visibleFoodHubs.map((relief) => {
                  const isPinnedRelief =
                    (session.pinned_relief_program_id || ddl.immediate_relief_matches[0]?.program_id) ===
                    relief.program_id;
                  const sectionMeta = getProgramSectionMeta(relief);
                  const contactBadges = parseContactBadges(relief.contact_phone_or_email);
                  const cityTier = getCityMatchTier(relief, session.municipality);
                  return (
                    <div
                      key={relief.program_id}
                      className={`rounded-xl p-3.5 border transition-all ${
                        isPinnedRelief
                          ? 'bg-white border-[#2a9d8f] shadow-xs'
                          : 'bg-white/90 border-[#c5e0f0]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sectionMeta.badgeClasses}`}
                            >
                              {sectionMeta.shortBadge}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#e5f6f3] text-[#1b7a6e] border border-[#bce5dd]">
                              {relief.municipality}
                              {session.municipality !== 'All' &&
                                cityTier === 'regional' &&
                                relief.municipality !== session.municipality &&
                                ` (Serves ${session.municipality})`}
                            </span>
                            <span className="text-[11px] font-medium text-[#23638a]">
                              {relief.organization_name}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[#163038] mt-1">
                            {relief.program_name}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              speakText(
                                `${relief.program_name} in ${relief.municipality}. ${relief.highlight_note}. Transit stop: ${relief.nearest_transit_stop}. Contact: ${relief.contact_lead_name} at ${relief.contact_phone_or_email}.`
                              )
                            }
                            className="p-1.5 rounded-lg bg-[#f2f8fb] hover:bg-[#e2eff7] text-[#23638a] cursor-pointer"
                            title="Listen Out Loud"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onPatchSession({
                                pinned_relief_program_id: relief.program_id
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                              isPinnedRelief
                                ? 'bg-[#2a9d8f] text-white'
                                : 'bg-[#f4fbf9] hover:bg-[#e0f4f0] text-[#1b7a6e] border border-[#bce5dd]'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {isPinnedRelief ? `✓ ${sectionMeta.savedLabel}` : sectionMeta.saveLabel}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#436069] mt-1.5 leading-relaxed">
                        {relief.highlight_note}
                      </p>
                      <div className="mt-2 pt-2 border-t border-[#e5eff6] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-[#2c525c] font-medium flex items-center gap-1">
                          <Bus className="w-3.5 h-3.5 text-[#2c6e9b]" /> {relief.nearest_transit_stop}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[#1b5270] font-semibold">
                            {relief.contact_lead_name}:
                          </span>
                          {contactBadges.map((b, bIdx) =>
                            b.href ? (
                              <a
                                key={`${relief.program_id}-contact-${bIdx}`}
                                href={b.href}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f2faf8] hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold transition-colors"
                              >
                                <Phone className="w-3 h-3 text-[#1ca796]" />
                                {b.label !== 'Call' && b.label !== 'Email' ? `${b.label}: ` : ''}
                                {b.value}
                              </a>
                            ) : (
                              <span
                                key={`${relief.program_id}-contact-${bIdx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#dce7ec] text-[#2c525c] font-medium"
                              >
                                {b.value}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Local Program Matches (Options+, Sources BC, Schools & Hands-On Programs) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#4a656d] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#1ca796]" />{' '}
                {partnerFilter === 'ALL'
                  ? `Recommended Programs, Schools & Community Partners (${filteredPrimary.length} Found):`
                  : `${CATEGORY_FILTER_PILLS.find((p) => p.id === partnerFilter)?.label || 'Filtered Programs'} (${filteredPrimary.length} Verified Matches):`}
              </div>
              {filteredPrimary.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllPrograms(!showAllPrograms)}
                  className="text-xs font-semibold text-[#1b7a6e] hover:text-[#12323b] bg-[#f4fbf9] px-3 py-1 rounded-full border border-[#bce5dd] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showAllPrograms ? (
                    <>
                      Show Top 4 Matches <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Show All {filteredPrimary.length} Programs <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            {visiblePrimaryPrograms.length === 0 && (
              <div className="linen-card border border-[#e3dccf] rounded-2xl p-5 text-center space-y-2">
                <div className="text-sm font-bold text-[#163038]">
                  No programs matched that exact filter in {session.municipality}.
                </div>
                <p className="text-xs text-[#547078]">
                  Try clearing your search or switching to All Lower Mainland Areas to see all 78 verified programs across the region.
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPartnerFilter('ALL');
                      onPatchSession({ municipality: 'All' });
                    }}
                    className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-semibold cursor-pointer"
                  >
                    Show All 78 Lower Mainland Programs
                  </button>
                </div>
              </div>
            )}

            {visiblePrimaryPrograms.map((prog, index) => {
              const isPinned = session.pinned_program_id === prog.program_id;
              const sectionMeta = getProgramSectionMeta(prog);
              const contactBadges = parseContactBadges(prog.contact_phone_or_email);
              const cityTier = getCityMatchTier(prog, session.municipality);
              return (
                <div
                  key={prog.program_id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isPinned
                      ? 'bg-[#f1faf8] border-[#2a9d8f] shadow-sm'
                      : 'linen-card border-[#e3dccf]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${sectionMeta.badgeClasses}`}
                        >
                          {sectionMeta.shortBadge}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e5f6f3] text-[#1b7a6e] border border-[#bce5dd]">
                          Option #{index + 1} • {prog.municipality}
                          {session.municipality !== 'All' &&
                            cityTier === 'regional' &&
                            prog.municipality !== session.municipality &&
                            ` (Serves ${session.municipality})`}
                        </span>
                        <span className="text-xs font-medium text-[#2c6e9b]">
                          How to Join: {prog.intake_type.replace('_', ' ')} • Wait Time: ~{prog.waitlist_weeks_estimate === 0 ? 'Same Day / Walk-In' : `${prog.waitlist_weeks_estimate} wk`}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#163038] mt-1.5">
                        {prog.program_name} — <span className="text-[#547078] font-medium">{prog.organization_name}</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          speakText(
                            `${prog.program_name} with ${prog.organization_name} in ${prog.municipality}. ${prog.highlight_note}. Transit stop: ${prog.nearest_transit_stop}. Contact ${prog.contact_lead_name} at ${prog.contact_phone_or_email}.`
                          )
                        }
                        className="p-2 rounded-xl bg-white hover:bg-[#e6f6f3] text-[#23638a] border border-[#dcd4c4] cursor-pointer"
                        title="Listen Out Loud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onPatchSession({
                            pinned_program_id: prog.program_id,
                            next_micro_step_text: `Call ${prog.contact_lead_name} (${prog.contact_phone_or_email}) together for a friendly intro—we will help with the short sign-up sheet.`
                          })
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                          isPinned
                            ? 'bg-[#2a9d8f] text-white shadow-2xs'
                            : 'bg-white hover:bg-[#e6f6f3] text-[#284952] border border-[#dcd4c4]'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {isPinned ? `✓ ${sectionMeta.savedLabel}` : sectionMeta.saveLabel}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#3f5b63] mt-2 leading-relaxed">
                    {prog.highlight_note}
                  </p>

                  <div className="mt-2.5 pt-2.5 border-t border-[#e5dfd2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4a656d]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-[#2c525c]">
                        <Bus className="w-3.5 h-3.5 text-[#2c6e9b]" /> Transit: {prog.nearest_transit_stop}
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=${encodeURIComponent(
                          `${prog.street_address}, ${prog.municipality}, BC`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-[#e6f2fb] hover:bg-[#d2e7f7] border border-[#abd2ee] text-[#154c70] text-[11px] font-bold"
                      >
                        1-Tap Bus Route →
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#1b5270]">
                        {prog.contact_lead_name}:
                      </span>
                      {contactBadges.map((b, bIdx) =>
                        b.href ? (
                          <a
                            key={`${prog.program_id}-contact-${bIdx}`}
                            href={b.href}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#e5f6f3] border border-[#bce5dd] text-[#0f5248] font-semibold transition-colors"
                          >
                            <Phone className="w-3 h-3 text-[#1ca796]" />
                            {b.label !== 'Call' && b.label !== 'Email' ? `${b.label}: ` : ''}
                            {b.value}
                          </a>
                        ) : (
                          <span
                            key={`${prog.program_id}-contact-${bIdx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#dce7ec] text-[#2c525c] font-medium"
                          >
                            {b.value}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {prog.supports_high_skill_low_text && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ 100% Hands-On
                      </span>
                    )}
                    {prog.offers_oral_or_practical_testing && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#23638a] border border-[#c7e0f0]">
                        ✓ No Written Exams
                      </span>
                    )}
                    {prog.scribe_or_reader_available && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#2c6e9b] border border-[#c7e0f0]">
                        ✓ Staff Helps With Forms
                      </span>
                    )}
                    {!prog.requires_government_id && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ No ID Needed to Start
                      </span>
                    )}
                    {prog.provides_transit_tickets && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ Free Bus Tickets
                      </span>
                    )}
                    {prog.provides_food_or_meals && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ Free Food / Meals
                      </span>
                    )}
                    {prog.provides_gear_or_boots && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#23638a] border border-[#c7e0f0]">
                        ✓ Free Work Boots / Gear
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simple Everyday Conversation Starters */}
      <div className="clinical-card border border-[#dfe6dd] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Friendly Chat Questions (If You Prefer Just Talking)
            </div>
            <h3 className="text-sm font-bold text-[#163038] mt-0.5">
              Simple Everyday Questions to Find What Helps Most
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CONVERSATIONAL_MATRIX.map((item) => {
            const active = item.isApplied(session);
            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 flex flex-col justify-between gap-3 border transition-all ${
                  active
                    ? 'bg-[#f1faf8] border-[#2a9d8f] shadow-2xs'
                    : 'linen-card border-[#e3dccf]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#e8f3f9] text-[#23638a] border border-[#c5e0f0]">
                      {item.tier}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(item.question)}
                      className="text-[#547078] hover:text-[#1b7a6e] p-1 rounded-lg cursor-pointer"
                      title="Read Question Out Loud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#1f3b44] italic mt-2.5 leading-relaxed">
                    {item.question}
                  </p>
                  <div className="text-[11px] text-[#547078] mt-2">
                    <strong className="text-[#2c4a52]">Why we ask:</strong> {item.signal}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#1b7a6e] mb-2">
                    ✓ {item.helpIncluded}
                  </div>
                  <button
                    type="button"
                    onClick={() => onPatchSession(item.applyPatch(session))}
                    className={`w-full py-2 px-3 rounded-xl text-xs transition-all cursor-pointer font-semibold shadow-2xs flex items-center justify-center gap-1.5 ${
                      active
                        ? 'bg-[#2a9d8f] text-white'
                        : 'bg-white hover:bg-[#2a9d8f] hover:text-white border border-[#d6cfc0] hover:border-[#2a9d8f] text-[#24424b]'
                    }`}
                  >
                    {active ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> ✓ Preference Applied
                      </>
                    ) : (
                      'Use This Preference'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RealWorldConnectionBridgeModal
        isOpen={bridgeModalOpen}
        onClose={() => setBridgeModalOpen(false)}
        session={session}
        primaryProgram={
          allCombinedUnique.find((p) => p.program_id === session.pinned_program_id) ||
          ddl.primary_matches[0] ||
          null
        }
        reliefProgram={
          allCombinedUnique.find((p) => p.program_id === session.pinned_relief_program_id) ||
          ddl.immediate_relief_matches[0] ||
          null
        }
      />
    </div>
  );
};
