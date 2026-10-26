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
  Wind
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord,
  ModuleCode
} from './types/navigator.js';
import { WorkbookModulesCanvas } from './components/WorkbookModulesCanvas.js';
import { CoordinatorTriagePanel } from './components/CoordinatorTriagePanel.js';
import { ClientCompanionPhone } from './components/ClientCompanionPhone.js';

type DeviceMode = 'split_copilot' | 'tablet_only' | 'phone_only' | 'architecture_ddl';

export function App() {
  const [session, setSession] = useState<ClientWorkbookSession | null>(null);
  const [ddl, setDdl] = useState<{
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  } | null>(null);
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
                <span>Take a Breath • No Rush, No Paperwork Stress</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#103038] tracking-tight">
                Find Your Next Step at Your Own Easy Pace
              </h2>
              <p className="text-xs sm:text-sm text-[#355963] leading-relaxed">
                You don’t need a resume or formal words here. Just tap what feels natural in everyday life—we’ll turn your hands-on strengths into a warm introduction to open local programs.
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
            <div className="clinical-card border border-[#cfe8e3] rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-bold text-[#14343d]">
                All Verified Community Programs &amp; Practical Supports
              </h3>
              <p className="text-xs text-[#4b6a73]">
                Every program listed below is checked directly with local coordinators so you know what is open and what support is included.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2d6c1] bg-[#f8f2e7] text-[#45636b] font-semibold">
                      <th className="py-3 px-3.5 rounded-tl-xl">Program &amp; Community Partner</th>
                      <th className="py-3 px-3.5">City</th>
                      <th className="py-3 px-3.5">How to Join</th>
                      <th className="py-3 px-3.5">Hands-On Learning</th>
                      <th className="py-3 px-3.5">No Written Test</th>
                      <th className="py-3 px-3.5">No ID Needed to Start</th>
                      <th className="py-3 px-3.5 rounded-tr-xl">Free Support Included</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe1d1]">
                    {[...ddl.immediate_relief_matches, ...ddl.primary_matches].map((p) => (
                      <tr key={p.program_id} className="hover:bg-[#eef9f7] transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#14343d]">{p.program_name}</div>
                          <div className="text-[#56737b]">{p.organization_name}</div>
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[#28505a]">{p.municipality}</td>
                        <td className="py-3 px-3.5 text-[#1f6a8f] font-medium">
                          {p.intake_type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3.5">
                          {p.supports_high_skill_low_text ? (
                            <span className="text-[#16796d] font-semibold">✓ Yes</span>
                          ) : (
                            <span className="text-[#789098]">Reading/List Based</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {p.offers_oral_or_practical_testing ? (
                            <span className="text-[#1f6a8f] font-semibold">✓ Practical / Spoken</span>
                          ) : (
                            <span className="text-[#789098]">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {!p.requires_government_id ? (
                            <span className="text-[#16796d] font-semibold">✓ Start Right Away</span>
                          ) : (
                            <span className="text-[#b86b52]">ID Needed</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-[#35535b]">
                          {[
                            p.provides_transit_tickets && 'Bus Tickets',
                            p.provides_food_or_meals && 'Free Meals',
                            p.provides_living_stipend && 'Training Pay',
                            p.provides_gear_or_boots && 'Work Boots/Gear'
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
