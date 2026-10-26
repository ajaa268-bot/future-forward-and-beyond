import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Tablet,
  Smartphone,
  Columns,
  RotateCcw,
  Database,
  Sparkles
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
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
      <div className="min-h-screen flex items-center justify-center bg-[#f6f3ec] text-[#1f7a6e] font-medium text-sm">
        <div className="clinical-card border border-[#cde8e2] rounded-2xl px-6 py-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2a9d8f] animate-ping" />
          Loading Future Forward &amp; Beyond...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Sleek Medical / Coastal Wellness Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e2dcd0] shadow-xs px-4 lg:px-6 py-3.5">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2a9d8f] to-[#2c6e9b] shadow-sm flex items-center justify-center text-white font-bold text-base tracking-tight">
              FF+
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#163038]">
                  Future Forward &amp; Beyond
                </h1>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#e5f6f3] text-[#1b7a6e] border border-[#bce5dd]">
                  Real-World Strengths &amp; Local Support Guide
                </span>
              </div>
              <p className="text-xs text-[#557078]">
                Simple, practical ways to match your everyday skills with welcoming local programs
              </p>
            </div>
          </div>

          {/* Simple Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync Status Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-[#f7f4ed] border border-[#e3dccf] text-xs flex items-center gap-2 text-[#335059]">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-[#2a9d8f] animate-pulse' : 'bg-[#3b82a6]'
                }`}
              />
              <span className="font-medium">
                Connected • {session.client_alias}
              </span>
            </div>

            {/* Response Speed Toggle */}
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              title="Switch between Instant Match and Deep Match"
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                enableThinking
                  ? 'bg-[#e8f3f9] border-[#9ec8e2] text-[#1e5678]'
                  : 'bg-[#e6f6f3] border-[#b5e4da] text-[#1b7a6e]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {enableThinking ? 'Detailed Match' : 'Quick Match'}
            </button>

            {/* View Switcher */}
            <div className="flex bg-[#f3EFE6] p-1 rounded-xl border border-[#e2d9c8]">
              <button
                onClick={() => setDeviceMode('split_copilot')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'split_copilot'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" /> Side-by-Side View
              </button>
              <button
                onClick={() => setDeviceMode('tablet_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'tablet_only'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Shared Screen
              </button>
              <button
                onClick={() => setDeviceMode('phone_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'phone_only'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Phone Takeaway
              </button>
              <button
                onClick={() => setDeviceMode('architecture_ddl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'architecture_ddl'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> All Local Programs
              </button>
            </div>

            <button
              onClick={handleResetDemo}
              className="p-2 rounded-xl bg-[#f7f4ed] hover:bg-[#ebe4d6] border border-[#e2d9c8] text-[#4a656d] cursor-pointer transition-colors"
              title="Start Fresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Friendly Banner if Story Was Updated */}
      {telemetry && (
        <div className="bg-[#e6f6f3] border-b border-[#bce5dd] px-6 py-2 text-xs text-[#185e55] flex flex-wrap items-center justify-between gap-2">
          <span>
            ✓ Updated your real-world strengths and matched open local programs
          </span>
          <span className="text-[11px]">
            Updated in {telemetry.latency_ms}ms
          </span>
        </div>
      )}

      {/* Main Content Workspace */}
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
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-22">
              <div className="text-center mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#237a6f] bg-[#e6f6f3] border border-[#bce5dd] px-3 py-1 rounded-full">
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
            <div className="clinical-card border border-[#e2dcd0] rounded-2xl p-6 space-y-3">
              <h3 className="text-base font-bold text-[#163038]">
                All Verified Community Programs &amp; Practical Supports
              </h3>
              <p className="text-xs text-[#547078]">
                Every program listed below is checked directly with local coordinators so you know what is open and what support is included.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2dcd0] bg-[#f7f4ed] text-[#4a656d] font-semibold">
                      <th className="py-3 px-3.5 rounded-tl-xl">Program &amp; Community Partner</th>
                      <th className="py-3 px-3.5">City</th>
                      <th className="py-3 px-3.5">How to Join</th>
                      <th className="py-3 px-3.5">Hands-On Learning</th>
                      <th className="py-3 px-3.5">No Written Test</th>
                      <th className="py-3 px-3.5">No ID Needed to Start</th>
                      <th className="py-3 px-3.5 rounded-tr-xl">Free Support Included</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe5d9]">
                    {[...ddl.immediate_relief_matches, ...ddl.primary_matches].map((p) => (
                      <tr key={p.program_id} className="hover:bg-[#f2faf8] transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#163038]">{p.program_name}</div>
                          <div className="text-[#5a757d]">{p.organization_name}</div>
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[#2c525c]">{p.municipality}</td>
                        <td className="py-3 px-3.5 text-[#2c6e9b] font-medium">
                          {p.intake_type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3.5">
                          {p.supports_high_skill_low_text ? (
                            <span className="text-[#1b7a6e] font-semibold">✓ Yes</span>
                          ) : (
                            <span className="text-[#789098]">Reading/List Based</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {p.offers_oral_or_practical_testing ? (
                            <span className="text-[#23638a] font-semibold">✓ Practical / Spoken</span>
                          ) : (
                            <span className="text-[#789098]">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {!p.requires_government_id ? (
                            <span className="text-[#1b7a6e] font-semibold">✓ Start Right Away</span>
                          ) : (
                            <span className="text-[#b86b52]">ID Needed</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-[#37535b]">
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
    </div>
  );
}

export default App;

