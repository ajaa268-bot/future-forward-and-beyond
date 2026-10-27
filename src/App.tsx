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
  X,
  RefreshCw,
  KeyRound,
  UserPlus,
  Compass
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord,
  ModuleCode,
  DailySyncState,
  PublicClientProfileSummary,
  ClientRegistrationPayload
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
import { DailySyncModal } from './components/DailySyncModal.js';
import {
  LandingAndOnboardingView,
  renderAvatarIcon
} from './components/LandingAndOnboardingView.js';
import { GuestSanctuaryView } from './components/GuestSanctuaryView.js';

type DeviceMode =
  | 'landing_auth'
  | 'guest_sanctuary'
  | 'split_copilot'
  | 'tablet_only'
  | 'phone_only'
  | 'architecture_ddl';
type DirectoryCategoryFilter = SanctuaryCategoryFilter;

const LOCAL_PROFILES_STORAGE_KEY = 'ffb_client_profiles_v4';
const LOCAL_SESSIONS_STORAGE_KEY = 'ffb_client_sessions_v4';

const DEFAULT_FALLBACK_SESSION: ClientWorkbookSession = {
  session_id: 'A842',
  client_alias: 'Stratus',
  pin_code: '1234',
  pin_recovery_hint: 'Easy demo PIN: 1-2-3-4 (or ask Marcus)',
  avatar_icon: 'Waves',
  age_group: 'Adult (25–54)',
  is_guest: false,
  coordinator_name: 'Marcus V. (Navigator)',
  municipality: 'Surrey',
  problem_solving_complexity: 4,
  text_admin_tolerance: 1,
  preferred_learning_modality: 'Visual_Hands_On',
  autonomy_preference: 4,
  current_readiness_tier: 3,
  active_module_on_canvas: 'MOD_A_HOBBY_ARCHAEOLOGY',
  selected_hobbies: [
    'Tinkering & Fixing Engines/Bikes',
    'Cooking & Feeding People',
    'Building & Carpentry'
  ],
  voice_transcript:
    'I rebuild small 2-stroke engines and fix bicycle brakes from scratch by ear and feel, and I can run a busy kitchen line, but heavy paperwork and long written forms shut me down.',
  active_barriers: [
    'Paperwork / Scribe Help',
    'Transit Pass / Compass',
    'Work Boots / Gear'
  ],
  skill_blueprint_json: [
    {
      plain_language_strength: 'Mechanical Troubleshooting & Hands-On Assembly',
      clinical_noc_code: 'NOC 72400 / 73200 — Mechanical & Trades Foundations',
      evidence_from_client: 'Rebuilds 2-stroke engines and bike brakes without manuals'
    },
    {
      plain_language_strength: 'High-Pace Production & Food Prep Workflow',
      clinical_noc_code: 'NOC 63200 — Culinary & Commissary Operations',
      evidence_from_client: 'Runs busy kitchen line under pressure'
    }
  ],
  pinned_program_id: 'prog-picc-culinary-01',
  pinned_relief_program_id: 'prog-surrey-urban-mission-01',
  next_micro_step_text:
    'Warm Handoff to Chef Sonja (604-588-9595) at Pacific Community Resources Society — Culinary & Trades Foundations',
  updated_at: new Date().toISOString()
};

const DEFAULT_FALLBACK_PROFILES: PublicClientProfileSummary[] = [
  {
    session_id: 'A842',
    client_alias: 'Stratus',
    municipality: 'Surrey',
    avatar_icon: 'Waves',
    age_group: 'Adult (25–54)',
    pin_recovery_hint: 'Easy demo PIN: 1-2-3-4 (or ask Marcus)',
    is_guest: false,
    updated_at: new Date().toISOString()
  },
  {
    session_id: 'C640',
    client_alias: 'River',
    municipality: 'Coquitlam',
    avatar_icon: 'Trees',
    age_group: 'Youth & Young Adult (Under 25)',
    pin_recovery_hint: 'Even numbers 2-4-6-8',
    is_guest: false,
    updated_at: new Date().toISOString()
  }
];

async function safeFetchJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtmlFallback?: boolean;
}> {
  try {
    const res = await fetch(url, init);
    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<')
    ) {
      return {
        ok: false,
        status: res.status,
        data: null,
        isHtmlFallback: true,
        error: `Endpoint ${url} returned an HTML fallback instead of JSON.`
      };
    }

    if (!trimmed) {
      return {
        ok: res.ok,
        status: res.status,
        data: null
      };
    }

    const parsed = JSON.parse(trimmed) as T;
    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      error: !res.ok ? (parsed as any)?.error || `Request failed (${res.status})` : undefined
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network request failed'
    };
  }
}

function loadLocalSessionsMap(): Record<string, ClientWorkbookSession> {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  return {
    A842: DEFAULT_FALLBACK_SESSION,
    C640: {
      ...DEFAULT_FALLBACK_SESSION,
      session_id: 'C640',
      client_alias: 'River',
      pin_code: '2468',
      pin_recovery_hint: 'Even numbers 2-4-6-8',
      municipality: 'Coquitlam',
      avatar_icon: 'Trees',
      age_group: 'Youth & Young Adult (Under 25)'
    }
  };
}

function saveLocalSession(sess: ClientWorkbookSession) {
  try {
    const map = loadLocalSessionsMap();
    map[sess.session_id] = sess;
    localStorage.setItem(LOCAL_SESSIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function App() {
  const [session, setSession] = useState<ClientWorkbookSession | null>(null);
  const [ddl, setDdl] = useState<{
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  } | null>(null);
  const [allPrograms, setAllPrograms] = useState<VerifiedProgramRecord[]>([]);
  const [profiles, setProfiles] = useState<PublicClientProfileSummary[]>(DEFAULT_FALLBACK_PROFILES);
  const [landingInitialTab, setLandingInitialTab] = useState<'login' | 'register'>('login');
  const [upgradeFromGuestId, setUpgradeFromGuestId] = useState<string | undefined>(undefined);
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [directoryCategory, setDirectoryCategory] =
    useState<DirectoryCategoryFilter>('ALL');
  const [directoryCity, setDirectoryCity] = useState<string>('All');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('landing_auth');
  const [enableThinking, setEnableThinking] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<{
    provider_used: string;
    endpoint_url: string;
    think_suppressed: boolean;
    latency_ms: number;
  } | null>(null);
  const [syncState, setSyncState] = useState<DailySyncState | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  const computeClientFallbackDdl = (
    targetSession: ClientWorkbookSession,
    programsList: VerifiedProgramRecord[]
  ) => {
    const activePrograms = programsList.filter((p) => p.operational_status === 'Active');
    const sorted = [...activePrograms].sort((a, b) => {
      const tierA = getCityMatchTier(a.municipality, targetSession.municipality);
      const tierB = getCityMatchTier(b.municipality, targetSession.municipality);
      return tierA - tierB;
    });
    const primary = sorted
      .filter((p) => p.category !== 'Survival_Relief')
      .slice(0, 6);
    const relief = sorted
      .filter((p) => p.category === 'Survival_Relief')
      .slice(0, 6);
    return {
      sql_executed: `-- Client-Side Verified Fallback Query for ${targetSession.municipality} (Session #${targetSession.session_id})`,
      primary_matches: primary.length > 0 ? primary : sorted.slice(0, 5),
      immediate_relief_matches: relief.length > 0 ? relief : sorted.slice(0, 5)
    };
  };

  useEffect(() => {
    safeFetchJson<{
      session: ClientWorkbookSession;
      ddl: {
        sql_executed: string;
        primary_matches: VerifiedProgramRecord[];
        immediate_relief_matches: VerifiedProgramRecord[];
      };
    }>('/api/session/A842').then((res) => {
      if (res.ok && res.data?.session && res.data?.ddl) {
        setSession(res.data.session);
        setDdl(res.data.ddl);
        saveLocalSession(res.data.session);
      } else {
        setSession((prev) => prev || DEFAULT_FALLBACK_SESSION);
        setDdl(
          (prev) =>
            prev || {
              sql_executed: '-- Local Fallback Session Ready',
              primary_matches: [],
              immediate_relief_matches: []
            }
        );
      }
    });

    safeFetchJson<{ profiles: PublicClientProfileSummary[] }>('/api/auth/profiles').then(
      (res) => {
        if (res.ok && Array.isArray(res.data?.profiles) && res.data.profiles.length > 0) {
          setProfiles(res.data.profiles);
          try {
            localStorage.setItem(
              LOCAL_PROFILES_STORAGE_KEY,
              JSON.stringify(res.data.profiles)
            );
          } catch {
            // ignore
          }
        } else {
          try {
            const cached = localStorage.getItem(LOCAL_PROFILES_STORAGE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProfiles(parsed);
              }
            }
          } catch {
            // ignore
          }
        }
      }
    );

    safeFetchJson<{ programs: VerifiedProgramRecord[] }>('/api/programs').then((res) => {
      if (res.ok && Array.isArray(res.data?.programs)) {
        setAllPrograms(res.data.programs);
        setDdl((prev) => {
          if (prev && prev.primary_matches.length === 0 && res.data?.programs?.length) {
            return computeClientFallbackDdl(
              session || DEFAULT_FALLBACK_SESSION,
              res.data.programs
            );
          }
          return prev;
        });
      }
    });

    safeFetchJson<{ sync_state: DailySyncState }>('/api/sync/status').then((res) => {
      if (res.ok && res.data?.sync_state) {
        setSyncState(res.data.sync_state);
      }
    });
  }, []);

  useEffect(() => {
    const activeId = session?.session_id || 'A842';
    const sock: Socket = io('/', {
      query: { sessionId: activeId }
    });

    sock.on('connect', () => setSocketConnected(true));
    sock.on('disconnect', () => setSocketConnected(false));
    sock.on('session:updated', (payload: any) => {
      if (payload.session) setSession(payload.session);
      if (payload.ddl) setDdl(payload.ddl);
      if (payload.synthesizer_telemetry) setTelemetry(payload.synthesizer_telemetry);
    });
    sock.on('programs:synced', (payload: any) => {
      if (payload.sync_state) setSyncState(payload.sync_state);
      if (Array.isArray(payload.programs)) setAllPrograms(payload.programs);
      if (payload.ddl) setDdl(payload.ddl);
    });

    return () => {
      sock.disconnect();
    };
  }, [session?.session_id]);

  const handleLoginWithPin = async (
    identifier: string,
    pinCode: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await safeFetchJson<{
      session: ClientWorkbookSession;
      ddl: any;
      profiles: PublicClientProfileSummary[];
      error?: string;
    }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, pin_code: pinCode })
    });

    if (res.ok && res.data?.session) {
      setSession(res.data.session);
      saveLocalSession(res.data.session);
      if (res.data.ddl) setDdl(res.data.ddl);
      if (Array.isArray(res.data.profiles)) setProfiles(res.data.profiles);
      setUpgradeFromGuestId(undefined);
      setDeviceMode('split_copilot');
      return { ok: true };
    }

    // If the server returned an HTML fallback or 404 (e.g., stale backend process), authenticate locally
    if (res.isHtmlFallback || res.status === 404 || res.status === 0) {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPin = pinCode.replace(/\D/g, '');
      const localMap = loadLocalSessionsMap();
      const matched = Object.values(localMap).find(
        (s) =>
          (s.client_alias.toLowerCase() === cleanId ||
            s.session_id.toLowerCase() === cleanId) &&
          (s.pin_code || '1234') === cleanPin
      );

      if (matched) {
        setSession(matched);
        setDdl(computeClientFallbackDdl(matched, allPrograms));
        setUpgradeFromGuestId(undefined);
        setDeviceMode('split_copilot');
        return { ok: true };
      }
      return {
        ok: false,
        error: 'That 4-digit PIN did not match. Try 1234 for Stratus, or continue as Guest.'
      };
    }

    return {
      ok: false,
      error: res.error || 'Could not sign in with that PIN.'
    };
  };

  const handleRegisterWithPin = async (
    payload: ClientRegistrationPayload
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await safeFetchJson<{
      session: ClientWorkbookSession;
      ddl: any;
      profiles: PublicClientProfileSummary[];
      error?: string;
    }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok && res.data?.session) {
      setSession(res.data.session);
      saveLocalSession(res.data.session);
      if (res.data.ddl) setDdl(res.data.ddl);
      if (Array.isArray(res.data.profiles)) {
        setProfiles(res.data.profiles);
        try {
          localStorage.setItem(
            LOCAL_PROFILES_STORAGE_KEY,
            JSON.stringify(res.data.profiles)
          );
        } catch {
          // ignore
        }
      }
      setUpgradeFromGuestId(undefined);
      setDeviceMode('split_copilot');
      return { ok: true };
    }

    // Seamless client-side PIN registration fallback if server endpoint returned HTML/404
    if (res.isHtmlFallback || res.status === 404 || res.status === 0) {
      const cleanAlias = payload.client_alias.trim() || 'Navigator Guest';
      const cleanPin = payload.pin_code.replace(/\D/g, '').slice(0, 4) || '1234';
      const prefix = cleanAlias.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1) || 'C';
      const randomNum = Math.floor(100 + Math.random() * 899);
      const newSessionId = `${prefix}${randomNum}`;
      const createdSession: ClientWorkbookSession = {
        ...DEFAULT_FALLBACK_SESSION,
        session_id: newSessionId,
        client_alias: cleanAlias,
        pin_code: cleanPin,
        pin_recovery_hint:
          payload.pin_recovery_hint?.trim() || 'Check your pocket card or ask your coordinator',
        municipality: payload.municipality || 'Surrey',
        avatar_icon: payload.avatar_icon || 'Waves',
        age_group: payload.age_group || 'Adult (25–54)',
        is_guest: false,
        active_barriers:
          payload.active_barriers && payload.active_barriers.length > 0
            ? payload.active_barriers
            : DEFAULT_FALLBACK_SESSION.active_barriers,
        preferred_learning_modality:
          payload.preferred_learning_modality || 'Visual_Hands_On',
        updated_at: new Date().toISOString()
      };

      saveLocalSession(createdSession);
      const newProfile: PublicClientProfileSummary = {
        session_id: createdSession.session_id,
        client_alias: createdSession.client_alias,
        municipality: createdSession.municipality,
        avatar_icon: createdSession.avatar_icon || 'Waves',
        age_group: createdSession.age_group || 'Adult (25–54)',
        pin_recovery_hint: createdSession.pin_recovery_hint || '',
        is_guest: false,
        updated_at: createdSession.updated_at
      };
      const nextProfiles = [
        newProfile,
        ...profiles.filter((p) => p.session_id !== newProfile.session_id)
      ];
      setProfiles(nextProfiles);
      try {
        localStorage.setItem(LOCAL_PROFILES_STORAGE_KEY, JSON.stringify(nextProfiles));
      } catch {
        // ignore
      }
      setSession(createdSession);
      setDdl(computeClientFallbackDdl(createdSession, allPrograms));
      setUpgradeFromGuestId(undefined);
      setDeviceMode('split_copilot');
      return { ok: true };
    }

    return {
      ok: false,
      error: res.error || 'Could not create PIN profile.'
    };
  };

  const handleContinueAsGuest = async (municipality?: string) => {
    const res = await safeFetchJson<{
      session: ClientWorkbookSession;
      ddl: any;
    }>('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipality })
    });

    if (res.ok && res.data?.session) {
      setSession(res.data.session);
      if (res.data.ddl) setDdl(res.data.ddl);
    } else if (session) {
      const guestFallback: ClientWorkbookSession = {
        ...session,
        session_id: 'GUEST',
        client_alias: 'Coastal Guest',
        municipality: municipality || session.municipality || 'Surrey',
        is_guest: true,
        updated_at: new Date().toISOString()
      };
      setSession(guestFallback);
      setDdl(computeClientFallbackDdl(guestFallback, allPrograms));
    }
    setUpgradeFromGuestId(undefined);
    setDeviceMode('guest_sanctuary');
  };

  const handleRunDailySyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await safeFetchJson<{
        sync_state: DailySyncState;
        programs: VerifiedProgramRecord[];
        ddl: any;
      }>('/api/sync/run', { method: 'POST' });
      if (res.ok && res.data) {
        if (res.data.sync_state) setSyncState(res.data.sync_state);
        if (Array.isArray(res.data.programs)) setAllPrograms(res.data.programs);
        if (res.data.ddl) setDdl(res.data.ddl);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSyncSchedule = async (enabled: boolean, intervalHours: number) => {
    const res = await safeFetchJson<{ sync_state: DailySyncState }>('/api/sync/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auto_daily_enabled: enabled,
        interval_hours: intervalHours
      })
    });
    if (res.ok && res.data?.sync_state) {
      setSyncState(res.data.sync_state);
    }
  };

  const handleImportServices = async (payload: any, sourceName: string) => {
    setIsSyncing(true);
    try {
      const res = await safeFetchJson<{
        state?: DailySyncState;
        programs?: VerifiedProgramRecord[];
        ddl?: any;
        added_count?: number;
        updated_count?: number;
        verified_unchanged_count?: number;
      }>('/api/sync/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, source_name: sourceName })
      });
      if (res.ok && res.data) {
        if (res.data.state) setSyncState(res.data.state);
        if (Array.isArray(res.data.programs)) setAllPrograms(res.data.programs);
        if (res.data.ddl) setDdl(res.data.ddl);
        return {
          added_count: res.data.added_count ?? 0,
          updated_count: res.data.updated_count ?? 0,
          verified_unchanged_count: res.data.verified_unchanged_count ?? 0
        };
      }
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePatchSession = async (patch: Partial<ClientWorkbookSession>) => {
    if (!session) return;
    const optimistic = { ...session, ...patch };
    setSession(optimistic);
    saveLocalSession(optimistic);
    const res = await safeFetchJson<{ session: ClientWorkbookSession; ddl: any }>(
      `/api/session/${session.session_id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, _source: 'copilot_ui' })
      }
    );
    if (res.ok && res.data?.session) {
      setSession(res.data.session);
      saveLocalSession(res.data.session);
      if (res.data.ddl) setDdl(res.data.ddl);
    } else {
      setDdl(computeClientFallbackDdl(optimistic, allPrograms));
    }
  };

  const handleSynthesizeVoice = async (transcript: string) => {
    if (!session) return;
    setIsSynthesizing(true);
    try {
      const res = await safeFetchJson<{
        session: ClientWorkbookSession;
        ddl: any;
        synthesis?: { inference_telemetry?: any };
      }>(`/api/session/${session.session_id}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_transcript: transcript,
          enable_thinking: enableThinking
        })
      });
      if (res.ok && res.data?.session) {
        setSession(res.data.session);
        saveLocalSession(res.data.session);
        if (res.data.ddl) setDdl(res.data.ddl);
        if (res.data.synthesis?.inference_telemetry) {
          setTelemetry(res.data.synthesis.inference_telemetry);
        }
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleResetDemo = async () => {
    if (!session) return;
    const res = await safeFetchJson<{ session: ClientWorkbookSession; ddl: any }>(
      `/api/session/${session.session_id}/reset`,
      {
        method: 'POST'
      }
    );
    if (res.ok && res.data?.session) {
      setSession(res.data.session);
      saveLocalSession(res.data.session);
      if (res.data.ddl) setDdl(res.data.ddl);
    } else {
      setSession(DEFAULT_FALLBACK_SESSION);
      setDdl(computeClientFallbackDdl(DEFAULT_FALLBACK_SESSION, allPrograms));
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

  if (deviceMode === 'landing_auth') {
    return (
      <LandingAndOnboardingView
        profiles={profiles}
        initialTab={landingInitialTab}
        upgradeFromGuestSessionId={upgradeFromGuestId}
        initialGuestCity={session.municipality}
        initialGuestBarriers={session.active_barriers}
        onLoginWithPin={handleLoginWithPin}
        onRegisterWithPin={handleRegisterWithPin}
        onContinueAsGuest={handleContinueAsGuest}
        hasActiveSession={Boolean(session)}
        activeSessionAlias={session.client_alias}
        onReturnToActiveSession={() =>
          setDeviceMode(session.is_guest ? 'guest_sanctuary' : 'split_copilot')
        }
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Top Frosted Sea-Glass Header Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#d5ebe6] shadow-2xs px-4 lg:px-6 py-3">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                setLandingInitialTab('login');
                setUpgradeFromGuestId(undefined);
                setDeviceMode('landing_auth');
              }}
              title="Return to Main Landing & PIN Sign-In Page"
              className="w-11 h-11 rounded-2xl ocean-btn flex items-center justify-center text-white font-bold text-base tracking-tight relative overflow-hidden cursor-pointer"
            >
              <Waves className="w-5 h-5" />
            </button>
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
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Client / Guest Badge + Switch User Button */}
            <div className="px-3 py-1.5 rounded-full bg-[#faf6ee] border border-[#e2d6c1] text-xs flex items-center gap-2 text-[#335059] shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-[#1ca796] animate-pulse' : 'bg-[#3b82a6]'
                }`}
              />
              <span className="text-[#156e62]">
                {renderAvatarIcon(session.avatar_icon, 'w-3.5 h-3.5')}
              </span>
              <span className="font-medium">
                <strong>{session.client_alias}</strong>
                {session.is_guest ? (
                  <span className="ml-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#fff1d0] text-[#8a520d] border border-[#f2c977] font-bold">
                    Guest Mode
                  </span>
                ) : (
                  <span className="ml-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#dff7f4] text-[#116358] border border-[#9ddbd1] font-bold">
                    PIN #{session.session_id}
                  </span>
                )}
              </span>
            </div>

            {/* Quick Landing / PIN Login & Onboarding Buttons */}
            <button
              type="button"
              onClick={() => {
                setLandingInitialTab('login');
                setUpgradeFromGuestId(undefined);
                setDeviceMode('landing_auth');
              }}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-[#0f5e53] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Open Main Landing & 4-Digit PIN Login"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#1ca796]" />
              <span>PIN Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLandingInitialTab('register');
                setUpgradeFromGuestId(session.is_guest ? session.session_id : undefined);
                setDeviceMode('landing_auth');
              }}
              className="px-3 py-1.5 rounded-full bg-[#faf6ee] hover:bg-[#efe5d2] border border-[#dfd2bc] text-[#2b4c55] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Onboard a New Client with a 4-Digit PIN (No Email Required)"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#1ca796]" />
              <span>New Client PIN</span>
            </button>

            {/* Daily Auto-Refresh & Import Button */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              title="Daily Service Auto-Refresh & Live Import Center"
              className="px-3 py-1.5 rounded-full bg-[#e3f7f4] hover:bg-[#d2f2ed] border border-[#9ddbd1] text-[#116358] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Daily Sync</span>
              {syncState?.auto_daily_enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              )}
            </button>

            {/* Response Speed Toggle */}
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              title="Switch between Quick Match and Detailed Match"
              className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
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
                onClick={() => setDeviceMode('guest_sanctuary')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'guest_sanctuary'
                    ? 'ocean-btn text-white font-semibold'
                    : 'text-[#4c6770] hover:text-[#14343d]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> Guest Page
              </button>
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
        {deviceMode === 'guest_sanctuary' && (
          <GuestSanctuaryView
            session={session}
            allPrograms={
              allPrograms.length > 0
                ? allPrograms
                : [...ddl.immediate_relief_matches, ...ddl.primary_matches]
            }
            onPatchSession={handlePatchSession}
            onUpgradeToPinAccount={() => {
              setLandingInitialTab('register');
              setUpgradeFromGuestId(session.session_id);
              setDeviceMode('landing_auth');
            }}
            onOpenInteractiveWorkbookAsGuest={() => setDeviceMode('split_copilot')}
            onGoToLandingLogin={() => {
              setLandingInitialTab('login');
              setUpgradeFromGuestId(undefined);
              setDeviceMode('landing_auth');
            }}
          />
        )}

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
                    Complete Lower Mainland Sanctuary Directory ({allPrograms.length || 78} Verified Programs Grouped by Category)
                  </h3>
                  <p className="text-xs text-[#4b6a73] mt-0.5">
                    Every program and phone number is grouped by its dedicated category—Hospitals &amp; Labs, Free Counselors, Pregnancy &amp; Baby Care, Shelters, Food Banks, Subsidies, Options+, Sources BC &amp; Schools.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#e3f7f4] hover:bg-[#d0f0eb] border border-[#9ddbd1] text-xs font-semibold text-[#116358] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Refresh &amp; Import Services</span>
                  </button>
                  <span className="text-xs font-medium text-[#4a656d]">Filter City:</span>
                  <select
                    value={directoryCity}
                    onChange={(e) => setDirectoryCity(e.target.value)}
                    className="bg-[#f7f4ed] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#163038] cursor-pointer focus:outline-none focus:border-[#2a9d8f]"
                  >
                    <option value="All">All Lower Mainland Cities ({allPrograms.length || 78} Programs)</option>
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

      {/* Daily Auto-Refresh & Live Import Modal */}
      <DailySyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncState={syncState}
        isSyncing={isSyncing}
        onRunSyncNow={handleRunDailySyncNow}
        onToggleSchedule={handleToggleSyncSchedule}
        onImportPayload={handleImportServices}
      />

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
