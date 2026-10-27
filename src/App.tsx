import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Tablet,
  Smartphone,
  Columns,
  RotateCcw,
  Database,
  Sparkles,
  Sun,
  Waves,
  Wind,
  Search,
  Pin,
  Phone,
  X
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord,
  ModuleCode
} from './types/navigator.js';
import {
  CATEGORY_FILTER_PILLS,
  GROUPED_24_7_HELPLINES,
  SANCTUARY_SECTIONS,
  SanctuaryCategoryFilter,
  getCategoryFilterRank,
  getCityMatchTier,
  getProgramPrimarySectionId,
  getProgramSectionMeta,
  parseContactBadges
} from './types/programGrouping.js';
import { WorkbookModulesCanvas } from './components/WorkbookModulesCanvas.js';
import { CoordinatorTriagePanel } from './components/CoordinatorTriagePanel.js';
import { ClientCompanionPhone } from './components/ClientCompanionPhone.js';

type DeviceMode = 'split_copilot' | 'tablet_only' | 'phone_only' | 'architecture_ddl';
type DirectoryCategoryFilter = SanctuaryCategoryFilter;

export function App() {
  const [session, setSession] = useState<ClientWorkbookSession | null>(null);
  const [ddl, setDdl] = useState<{
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  } | null>(null);
  const [allPrograms, setAllPrograms] = useState<VerifiedProgramRecord[]>([]);
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [directoryCategory, setDirectoryCategory] =
    useState<DirectoryCategoryFilter>('ALL');
  const [directoryCity, setDirectoryCity] = useState<string>('All');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('split_copilot');
  const [enableThinking, setEnableThinking] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<{
    provider_used: string;
    endpoint_url: string;
    think_suppressed: boolean;
    latency_ms: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/session/A842')
      .then((r) => r.json())
      .then((data) => {
        setSession(data.session);
        setDdl(data.ddl);
      })
      .catch(console.error);

    fetch('/api/programs')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.programs)) {
          setAllPrograms(data.programs);
        }
      })
      .catch(console.error);

    const sock: Socket = io('/', {
      query: { sessionId: 'A842' }
    });

    sock.on('connect', () => setSocketConnected(true));
    sock.on('disconnect', () => setSocketConnected(false));
    sock.on('session:updated', (payload: any) => {
      if (payload.session) setSession(payload.session);
      if (payload.ddl) setDdl(payload.ddl);
      if (payload.synthesizer_telemetry) setTelemetry(payload.synthesizer_telemetry);
    });

    return () => {
      sock.disconnect();
    };
  }, []);

  const handlePatchSession = async (patch: Partial<ClientWorkbookSession>) => {
    if (!session) return;
    setSession({ ...session, ...patch });
    try {
      const res = await fetch(`/api/session/${session.session_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, _source: 'copilot_ui' })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setDdl(data.ddl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSynthesizeVoice = async (transcript: string) => {
    if (!session) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch(`/api/session/${session.session_id}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_transcript: transcript,
          enable_thinking: enableThinking
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setDdl(data.ddl);
        if (data.synthesis?.inference_telemetry) {
          setTelemetry(data.synthesis.inference_telemetry);
        }
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleResetDemo = async () => {
    if (!session) return;
    const res = await fetch(`/api/session/${session.session_id}/reset`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setDdl(data.ddl);
    }
  };

  if (!session || !ddl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5ede0] text-[#177a6e] font-medium text-sm">
        <div className="clinical-card border border-[#bfe6df] rounded-3xl px-7 py-5 flex items-center gap-3.5 shadow-lg">
          <Waves className="w-5 h-5 text-[#1ca796] animate-bounce" />
          <span>Opening Your Coastal Strengths &amp; Support Sanctuary...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Top Frosted Sea-Glass Header Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#d5ebe6] shadow-2xs px-4 lg:px-6 py-3">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl ocean-btn flex items-center justify-center text-white font-bold text-base tracking-tight relative overflow-hidden">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#12323b]">
                  Future Forward &amp; Beyond
                </h1>
                <span className="text-[11px] font-semibold px-3 py-0.5 rounded-full bg-gradient-to-r from-[#dff7f4] to-[#e4f2fb] text-[#146c61] border border-[#b4e4dc]">
                  Coastal Wellness &amp; Strengths Guide
                </span>
              </div>
              <p className="text-xs text-[#4b6a73]">
                Calm, simple real-world ways to connect your everyday strengths with local support
              </p>
            </div>
          </div>

          {/* Simple Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync Status Pill */}
            <div className="px-3.5 py-1.5 rounded-full bg-[#faf6ee] border border-[#e2d6c1] text-xs flex items-center gap-2 text-[#335059] shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-[#1ca796] animate-pulse' : 'bg-[#3b82a6]'
                }`}
              />
              <span className="font-medium">
                Welcome, <strong>{session.client_alias}</strong>
              </span>
            </div>

            {/* Response Speed Toggle */}
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              title="Switch between Quick Match and Detailed Match"
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                enableThinking
                  ? 'bg-[#e5f3fb] border-[#9cc9e4] text-[#195375]'
                  : 'bg-[#e3f7f4] border-[#ade3da] text-[#14695e]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {enableThinking ? 'Detailed Match' : 'Quick Match'}
            </button>

            {/* View Switcher */}
            <div className="flex bg-[#f3eadb] p-1 rounded-2xl border border-[#dfd2bc]">
              <button
                onClick={() => setDeviceMode('split_copilot')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'split_copilot'
                    ? 'ocean-btn text-white font-semibold'
                    : 'text-[#4c6770] hover:text-[#14343d]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" /> Side-by-Side
              </button>
              <button
                onClick={() => setDeviceMode('tablet_only')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'tablet_only'
                    ? 'ocean-btn text-white font-semibold'
                    : 'text-[#4c6770] hover:text-[#14343d]'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Main View
              </button>
              <button
                onClick={() => setDeviceMode('phone_only')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'phone_only'
                    ? 'ocean-btn text-white font-semibold'
                    : 'text-[#4c6770] hover:text-[#14343d]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Phone Card
              </button>
              <button
                onClick={() => setDeviceMode('architecture_ddl')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'architecture_ddl'
                    ? 'ocean-btn text-white font-semibold'
                    : 'text-[#4c6770] hover:text-[#14343d]'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> All Programs
              </button>
            </div>

            <button
              onClick={handleResetDemo}
              className="p-2 rounded-full bg-[#faf6ee] hover:bg-[#efe6d5] border border-[#e0d3bd] text-[#4a656d] cursor-pointer transition-colors"
              title="Start Fresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sunlit Beach & Ocean Shoreline Welcome Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#bcebe8]/80 via-[#daf5f2]/85 to-[#f5eee0] pt-5 pb-12 border-b border-[#e4d8c3]">
        {/* Warm Golden Beach Sun Glow */}
        <div className="pointer-events-none absolute -top-16 right-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#ffe299]/65 via-[#ffd180]/35 to-transparent blur-2xl animate-sun" />
        <div className="pointer-events-none absolute top-4 left-1/4 w-96 h-32 rounded-full bg-white/50 blur-2xl" />

        <div className="max-w-[1680px] mx-auto px-4 lg:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-[#b7e4de] text-xs font-semibold text-[#136f63] shadow-2xs">
                <Sun className="w-3.5 h-3.5 text-[#f4a261]" />
                <span>Take a Breath • A Calm Sanctuary for All Ages &amp; Walks of Life</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#103038] tracking-tight">
                Find Your Next Step at Your Own Easy Pace
              </h2>
              <p className="text-xs sm:text-sm text-[#355963] leading-relaxed">
                Whether you need a free counselor, pregnancy &amp; baby support, a walk-in doctor or lab, safe shelter, food, youth or seniors care, or hands-on training—just tap what feels natural. No resume or formal paperwork needed.
              </p>
            </div>

            {/* Quick-Step Shoreline Stones */}
            <div className="flex flex-wrap items-center gap-2 bg-white/75 backdrop-blur-md p-2.5 rounded-2xl border border-[#cce8e3] shadow-sm">
              {(
                [
                  { code: 'TROUBLESHOOTER', step: '1', name: 'Everyday Situations' },
                  { code: 'SPEC_SHEET', step: '2', name: 'Comfort Zone' },
                  { code: 'VOICE_BLUEPRINT', step: '3', name: 'Your Story' },
                  { code: 'LOADOUT_DECK', step: '4', name: 'Work You’d Enjoy' },
                  { code: 'PRESSURE_VALVE', step: '5', name: 'Help Today' }
                ] as Array<{ code: ModuleCode; step: string; name: string }>
              ).map((item) => {
                const active = session.active_module_on_canvas === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      setDeviceMode('split_copilot');
                      handlePatchSession({ active_module_on_canvas: item.code });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'ocean-btn text-white font-semibold'
                        : 'bg-[#fbf8f1] hover:bg-[#e6f7f5] text-[#2d535c] border border-[#e3d7c3]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        active ? 'bg-white/25 text-white' : 'bg-[#dff4f1] text-[#156e62]'
                      }`}
                    >
                      {item.step}
                    </span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Layered Ocean Tide & Seafoam Shoreline SVG Waves */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg
            className="w-[105%] h-10 sm:h-12 -ml-[2%] animate-tide-slow"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path
              fill="rgba(42, 168, 156, 0.16)"
              d="M0,38 C240,86 480,4 720,42 C960,80 1200,18 1440,48 L1440,100 L0,100 Z"
            />
          </svg>
          <svg
            className="w-[105%] h-8 sm:h-10 -ml-[2%] -mt-7 animate-tide"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path
              fill="rgba(255, 255, 255, 0.65)"
              d="M0,55 C320,12 600,88 920,38 C1180,2 1320,66 1440,44 L1440,100 L0,100 Z"
            />
          </svg>
          <svg
            className="w-full h-6 sm:h-8 -mt-5"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path
              fill="#f5ede0"
              d="M0,64 C380,96 760,24 1140,68 C1300,84 1390,58 1440,66 L1440,100 L0,100 Z"
            />
          </svg>
        </div>
      </section>

      {/* Friendly Banner if Story Was Updated */}
      {telemetry && (
        <div className="bg-[#e3f7f4] border-b border-[#b4e4dc] px-6 py-2 text-xs text-[#145e54] flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Wind className="w-3.5 h-3.5 text-[#1ca796]" />
            Updated your real-world strengths and matched open local programs
          </span>
          <span className="text-[11px] font-medium">
            Matched in {telemetry.latency_ms}ms
          </span>
        </div>
      )}

      {/* Main Content Workspace on Warm Sandy Shore */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-4 lg:p-6">
        {deviceMode === 'split_copilot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Shared Workbook Screen */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              <WorkbookModulesCanvas
                session={session}
                onPatchSession={handlePatchSession}
                onSynthesizeVoice={handleSynthesizeVoice}
                isSynthesizing={isSynthesizing}
              />
              <CoordinatorTriagePanel
                session={session}
                ddl={ddl}
                onPatchSession={handlePatchSession}
              />
            </div>

            {/* Right 4 Cols: Live Synced Client Companion Phone */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20">
              <div className="text-center mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#156e62] bg-white/85 backdrop-blur-md border border-[#b9e6de] px-3.5 py-1 rounded-full shadow-2xs">
                  Pocket Takeaway Phone View
                </span>
              </div>
              <ClientCompanionPhone
                session={session}
                ddl={ddl}
                onPatchSession={handlePatchSession}
              />
            </div>
          </div>
        )}

        {deviceMode === 'tablet_only' && (
          <div className="space-y-6">
            <WorkbookModulesCanvas
              session={session}
              onPatchSession={handlePatchSession}
              onSynthesizeVoice={handleSynthesizeVoice}
              isSynthesizing={isSynthesizing}
            />
            <CoordinatorTriagePanel
              session={session}
              ddl={ddl}
              onPatchSession={handlePatchSession}
            />
          </div>
        )}

        {deviceMode === 'phone_only' && (
          <div className="py-4">
            <ClientCompanionPhone
              session={session}
              ddl={ddl}
              onPatchSession={handlePatchSession}
            />
          </div>
        )}

        {deviceMode === 'architecture_ddl' && (
          <div className="space-y-6">
            <div className="clinical-card border border-[#cfe8e3] rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#14343d]">
                    Complete Lower Mainland Sanctuary Directory (78 Verified Programs Grouped by Category)
                  </h3>
                  <p className="text-xs text-[#4b6a73] mt-0.5">
                    Every program and phone number is grouped by its dedicated category—Hospitals &amp; Labs, Free Counselors, Pregnancy &amp; Baby Care, Shelters, Food Banks, Subsidies, Options+, Sources BC &amp; Schools.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-[#4a656d]">Filter City:</span>
                  <select
                    value={directoryCity}
                    onChange={(e) => setDirectoryCity(e.target.value)}
                    className="bg-[#f7f4ed] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#163038] cursor-pointer focus:outline-none focus:border-[#2a9d8f]"
                  >
                    <option value="All">All Lower Mainland Cities (78 Programs)</option>
                    <option value="Surrey">Surrey (Whalley, Newton, Guildford, Cloverdale)</option>
                    <option value="White Rock / South Surrey">White Rock / South Surrey</option>
                    <option value="Langley">Langley</option>
                    <option value="Delta">Delta</option>
                    <option value="Burnaby">Burnaby</option>
                    <option value="New Westminster">New Westminster</option>
                    <option value="Coquitlam">Coquitlam / Tri-Cities</option>
                    <option value="Vancouver">Vancouver</option>
                    <option value="Richmond">Richmond</option>
                  </select>
                  {(directoryCity !== 'All' || directoryCategory !== 'ALL' || directorySearch.trim() !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDirectoryCity('All');
                        setDirectoryCategory('ALL');
                        setDirectorySearch('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#e6f6f3] border border-[#bce5dd] text-xs font-semibold text-[#1b7a6e] cursor-pointer transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* 24/7 Grouped Sanctuary Helplines Bar */}
              <div className="bg-gradient-to-r from-[#e5f5f2] via-[#eaf4fa] to-[#f4f0e6] border border-[#b4dfd7] rounded-2xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#145e54] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#1ca796]" /> 24/7 Grouped Sanctuary Helplines — Organized by Need (Tap Any Number to Call)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                  {GROUPED_24_7_HELPLINES.map((group) => (
                    <div
                      key={`dir-${group.id}`}
                      className={`rounded-xl px-3 py-2 border space-y-1 ${group.badgeColor}`}
                    >
                      <div className="font-bold text-[#14343d]">{group.title}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.lines.map((item) => (
                          <a
                            key={`dir-${group.id}-${item.name}`}
                            href={`tel:${item.tel}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold transition-colors"
                            title={item.note}
                          >
                            <span className="text-[#35565f] font-medium">{item.name}:</span>
                            <span>{item.number}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Directory Search & Category Filter Bar */}
              {(() => {
                const rawList =
                  allPrograms.length > 0
                    ? allPrograms
                    : [...ddl.immediate_relief_matches, ...ddl.primary_matches];
                const seenIds = new Set<string>();
                const dedupedList = rawList.filter((p) => {
                  if (seenIds.has(p.program_id)) return false;
                  seenIds.add(p.program_id);
                  return true;
                });

                const matchesSearch = (p: VerifiedProgramRecord) => {
                  if (!directorySearch.trim()) return true;
                  const q = directorySearch.trim().toLowerCase();
                  const sectionMeta = getProgramSectionMeta(p);
                  const hay = [
                    p.program_name,
                    p.organization_name,
                    p.municipality,
                    p.street_address,
                    p.nearest_transit_stop,
                    p.contact_lead_name,
                    p.contact_phone_or_email,
                    p.highlight_note,
                    sectionMeta.title,
                    sectionMeta.shortBadge,
                    ...(p.hobby_tags || [])
                  ]
                    .join(' ')
                    .toLowerCase();
                  return hay.includes(q);
                };

                const cityAndSearchFiltered = dedupedList.filter(
                  (p) => getCityMatchTier(p, directoryCity) !== 'none' && matchesSearch(p)
                );

                const finalFiltered = cityAndSearchFiltered
                  .filter((p) => getCategoryFilterRank(p, directoryCategory) > 0)
                  .sort((a, b) => {
                    const tierA = getCityMatchTier(a, directoryCity) === 'exact' ? 0 : 1;
                    const tierB = getCityMatchTier(b, directoryCity) === 'exact' ? 0 : 1;
                    if (tierA !== tierB) return tierA - tierB;
                    const rankA = getCategoryFilterRank(a, directoryCategory);
                    const rankB = getCategoryFilterRank(b, directoryCategory);
                    if (rankA !== rankB) return rankA - rankB;
                    return a.program_name.localeCompare(b.program_name);
                  });

                // Group programs cleanly by their primary Sanctuary Section
                const orderedSections = [...SANCTUARY_SECTIONS].sort((a, b) => {
                  const aMatchesFilter = directoryCategory === a.id;
                  const bMatchesFilter = directoryCategory === b.id;
                  if (aMatchesFilter && !bMatchesFilter) return -1;
                  if (!aMatchesFilter && bMatchesFilter) return 1;
                  return 0;
                });

                const groupedSections = orderedSections
                  .map((sec) => ({
                    section: sec,
                    items: finalFiltered.filter(
                      (p) => getProgramPrimarySectionId(p) === sec.id
                    )
                  }))
                  .filter((g) => g.items.length > 0);

                return (
                  <>
                    <div className="linen-card border border-[#e3dccf] rounded-2xl p-3.5 space-y-2.5">
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#547078] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={directorySearch}
                          onChange={(e) => setDirectorySearch(e.target.value)}
                          placeholder="Search by program name, city, phone number, hospital, LifeLabs, counselor, pregnancy, shelter, Options+, Sources BC..."
                          className="w-full bg-white border border-[#dcd4c4] rounded-xl pl-9 pr-8 py-2 text-xs text-[#163038] placeholder:text-[#6c858d] focus:outline-none focus:border-[#2a9d8f]"
                        />
                        {directorySearch && (
                          <button
                            type="button"
                            onClick={() => setDirectorySearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#547078] hover:text-[#163038] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {CATEGORY_FILTER_PILLS.map((cat) => {
                          const count = cityAndSearchFiltered.filter(
                            (p) => getCategoryFilterRank(p, cat.id) > 0
                          ).length;
                          const active = directoryCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setDirectoryCategory(cat.id)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                active
                                  ? 'ocean-btn text-white shadow-2xs'
                                  : 'bg-white text-[#35565f] hover:bg-[#e6f6f3] border border-[#dcd4c4]'
                              }`}
                            >
                              <span>{cat.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  active
                                    ? 'bg-white/25 text-white'
                                    : 'bg-[#edf6f4] text-[#1b7a6e]'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Filter Summary Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#35565f]">
                      <div>
                        Showing <strong className="text-[#14343d]">{finalFiltered.length}</strong> verified programs in{' '}
                        <strong className="text-[#1b7a6e]">
                          {directoryCity === 'All' ? 'All Lower Mainland Cities' : directoryCity}
                        </strong>{' '}
                        grouped across <strong className="text-[#14343d]">{groupedSections.length}</strong> category{' '}
                        {groupedSections.length === 1 ? 'section' : 'sections'}.
                      </div>
                      {directoryCity !== 'All' && (
                        <div className="text-[11px] text-[#4b6a73]">
                          Includes programs located directly in <strong>{directoryCity}</strong> first, followed by regional lines serving {directoryCity}.
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#e2d6c1] bg-[#f8f2e7] text-[#45636b] font-semibold">
                            <th className="py-3 px-3.5 rounded-tl-xl">Program, Category &amp; Community Partner</th>
                            <th className="py-3 px-3.5">City &amp; Nearest Transit</th>
                            <th className="py-3 px-3.5">Contact Person &amp; Direct Numbers</th>
                            <th className="py-3 px-3.5">Access &amp; ID Rules</th>
                            <th className="py-3 px-3.5">Free Support Included</th>
                            <th className="py-3 px-3.5 rounded-tr-xl text-right">Save to Phone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebe1d1]">
                          {groupedSections.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 px-4 text-center">
                                <div className="text-sm font-bold text-[#14343d]">
                                  No programs matched that exact filter in {directoryCity}.
                                </div>
                                <p className="text-xs text-[#4b6a73] mt-1">
                                  Reset the city or category filter to browse all 78 verified Lower Mainland programs.
                                </p>
                              </td>
                            </tr>
                          )}
                          {groupedSections.map(({ section, items }) => (
                            <React.Fragment key={`section-${section.id}`}>
                              <tr className="bg-gradient-to-r from-[#e7f5f2] via-[#edf6fa] to-[#f7f2e7] border-y-2 border-[#bce5dd]">
                                <td colSpan={6} className="py-2.5 px-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${section.badgeClasses}`}
                                      >
                                        {section.shortBadge}
                                      </span>
                                      <span className="text-xs font-bold text-[#14343d]">
                                        {section.title}
                                      </span>
                                      <span className="text-[11px] text-[#4b6a73] hidden md:inline">
                                        — {section.subtitle}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-bold text-[#1b7a6e] bg-white px-2.5 py-0.5 rounded-full border border-[#bce5dd]">
                                      {items.length} {items.length === 1 ? 'Program' : 'Programs'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {items.map((p) => {
                                const isSavedMain = session.pinned_program_id === p.program_id;
                                const isSavedRelief = session.pinned_relief_program_id === p.program_id;
                                const isSaved = isSavedMain || isSavedRelief;
                                const sectionMeta = getProgramSectionMeta(p);
                                const contactBadges = parseContactBadges(p.contact_phone_or_email);
                                const cityTier = getCityMatchTier(p, directoryCity);
                                return (
                                  <tr key={p.program_id} className="hover:bg-[#eef9f7] transition-colors bg-white/90">
                                    <td className="py-3.5 px-3.5 max-w-md">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                        <span
                                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sectionMeta.badgeClasses}`}
                                        >
                                          {sectionMeta.shortBadge}
                                        </span>
                                        <span className="text-[11px] font-semibold text-[#1b7a6e]">
                                          {p.organization_name}
                                        </span>
                                      </div>
                                      <div className="font-bold text-[#14343d] text-xs">{p.program_name}</div>
                                      <div className="text-[11px] text-[#4e6b73] mt-0.5 leading-relaxed">
                                        {p.highlight_note}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3.5">
                                      <div className="font-bold text-[#14343d]">
                                        {p.municipality}
                                      </div>
                                      {directoryCity !== 'All' &&
                                        cityTier === 'regional' &&
                                        p.municipality !== directoryCity && (
                                          <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eef6fb] text-[#1e5678] border border-[#c5e0f0]">
                                            Serves {directoryCity}
                                          </span>
                                        )}
                                      <div className="text-[11px] text-[#4b6a73] mt-0.5">
                                        {p.nearest_transit_stop}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3.5">
                                      <div className="font-semibold text-[#14343d] mb-1">
                                        {p.contact_lead_name}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {contactBadges.map((b, bIdx) =>
                                          b.href ? (
                                            <a
                                              key={`${p.program_id}-dir-contact-${bIdx}`}
                                              href={b.href}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f2faf8] hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold text-[11px] transition-colors"
                                            >
                                              <Phone className="w-3 h-3 text-[#1ca796]" />
                                              {b.label !== 'Call' && b.label !== 'Email' ? `${b.label}: ` : ''}
                                              {b.value}
                                            </a>
                                          ) : (
                                            <span
                                              key={`${p.program_id}-dir-contact-${bIdx}`}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f8fafb] border border-[#dce7ec] text-[#2c525c] text-[11px]"
                                            >
                                              {b.value}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3.5">
                                      <div className="text-[#16796d] font-semibold">
                                        {p.supports_high_skill_low_text ? '✓ 100% Hands-On' : '✓ Calm Walk-In / Phone'}
                                      </div>
                                      <div className="text-[11px] text-[#1f6a8f]">
                                        {p.offers_oral_or_practical_testing ? '✓ No Written Test' : 'Standard'} •{' '}
                                        {!p.requires_government_id ? 'No ID Needed' : 'ID Needed'}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3.5 text-[#35535b]">
                                      {[
                                        p.provides_transit_tickets && 'Bus Tickets',
                                        p.provides_food_or_meals && 'Food / Hot Meals',
                                        p.provides_living_stipend && 'Money / Stipend',
                                        p.provides_gear_or_boots && 'Gear / Supplies'
                                      ]
                                        .filter(Boolean)
                                        .join(' • ') || 'Free Service'}
                                    </td>
                                    <td className="py-3.5 px-3.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (p.category === 'Survival_Relief') {
                                            handlePatchSession({
                                              pinned_relief_program_id: p.program_id
                                            });
                                          } else {
                                            handlePatchSession({
                                              pinned_program_id: p.program_id,
                                              next_micro_step_text: `Call ${p.contact_lead_name} (${p.contact_phone_or_email}) together for a friendly intro.`
                                            });
                                          }
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all ${
                                          isSaved
                                            ? 'bg-[#2a9d8f] text-white'
                                            : 'bg-white hover:bg-[#e6f6f3] text-[#1b7a6e] border border-[#bce5dd]'
                                        }`}
                                      >
                                        <Pin className="w-3.5 h-3.5" />
                                        {isSaved ? `✓ ${sectionMeta.savedLabel}` : sectionMeta.saveLabel}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Calm Sandy Beach Shoreline Footer */}
      <footer className="mt-8 border-t border-[#e2d4be] bg-gradient-to-b from-[#f3eadb] to-[#eadcc5] py-5 px-6 text-center text-xs text-[#546f76]">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium text-[#2c535c]">
            <Waves className="w-4 h-4 text-[#1ca796]" /> Future Forward &amp; Beyond — Calm, Practical Support Without the Paperwork Stress
          </span>
          <span>Lower Mainland &amp; Provincial Community Network</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
