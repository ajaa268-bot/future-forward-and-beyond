import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Tablet,
  Smartphone,
  Columns,
  RotateCcw,
  Cpu,
  Database,
  Radio,
  BrainCircuit,
  FileCode2,
  CheckCircle2
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
  const [lastSyncSource, setLastSyncSource] = useState<string>('initial');
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
      if (payload.source) setLastSyncSource(payload.source);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-400 font-mono text-sm">
        Initializing Future Forward & Beyond Co-Pilot Workbook Engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Studio Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono font-black text-base">
              FF+
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  FUTURE FORWARD & BEYOND
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  v4.0 Master Spec
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Multi-Barrier Navigator • Dual-Axis Competency Engine • Deterministic PostgreSQL DDL Check
              </p>
            </div>
          </div>

          {/* Real-Time Status & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* WebSocket Sync Status Badge */}
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300">
                WS Sync: #{session.session_id} ({lastSyncSource})
              </span>
            </div>

            {/* LLM Reasoning Toggle (`</think>` Assistant Prefill Control) */}
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              title="Controls whether local Qwen/DeepSeek LLM uses </think> assistant prefill for <1s instant synthesis"
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                enableThinking
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                  : 'bg-slate-900 border-slate-800 text-emerald-300'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              {enableThinking ? 'Think Mode: ON' : 'Fast </think> Prefill: ON (<1s)'}
            </button>

            {/* View Switcher */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setDeviceMode('split_copilot')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer ${
                  deviceMode === 'split_copilot'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" /> Dual-Device Co-Pilot
              </button>
              <button
                onClick={() => setDeviceMode('tablet_only')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer ${
                  deviceMode === 'tablet_only'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Coordinator Tablet
              </button>
              <button
                onClick={() => setDeviceMode('phone_only')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer ${
                  deviceMode === 'phone_only'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Client Phone
              </button>
              <button
                onClick={() => setDeviceMode('architecture_ddl')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer ${
                  deviceMode === 'architecture_ddl'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> API & DDL Registry
              </button>
            </div>

            <button
              onClick={handleResetDemo}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              title="Reset Session #A842 (Stratus)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Telemetry Banner if Synthesizer Ran */}
      {telemetry && (
        <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-6 py-1.5 text-xs font-mono text-emerald-300 flex flex-wrap items-center justify-between gap-2">
          <span>
            ✓ Dual-Axis Synthesizer Executed via <strong>{telemetry.provider_used}</strong> ({telemetry.endpoint_url})
          </span>
          <span>
            Think Bypassed: {telemetry.think_suppressed ? 'YES (</think> prefill)' : 'NO'} • Latency: {telemetry.latency_ms}ms
          </span>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-4 lg:p-6">
        {deviceMode === 'split_copilot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Coordinator Shared Tablet Canvas */}
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
              <div className="text-center mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  LIVE SYNCED CLIENT COMPANION APP
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
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="text-xs font-mono uppercase text-amber-400">
                PART 6 & PART 7 // CANADIAN/PROVINCIAL API REGISTRY & COMPLETE VERIFIED PROGRAMS TABLE
              </div>
              <h2 className="text-lg font-bold text-white">
                Connected Provincial & Open Referral HSDS v3.0 Data Feeds
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    name: 'BC211 / 211 Canada API',
                    proto: 'Open Referral HSDS v3.0 JSON & AIRS XML',
                    desc: '150,000+ community, shelter, food, outreach, and foundational programs across BC & Canada.'
                  },
                  {
                    name: 'BC Data Catalogue API',
                    proto: 'CKAN REST API (catalogue.data.gov.bc.ca)',
                    desc: 'Live locations and metadata for WorkBC centres, skills training grants, transit hubs, and health clinics.'
                  },
                  {
                    name: 'NOC & Job Bank Canada API',
                    proto: 'Open Government CKAN API (open.canada.ca)',
                    desc: 'Maps extracted hobby skills to formal 5-digit NOC codes, regional wage rates, and entry requirements.'
                  },
                  {
                    name: 'EducationPlannerBC & SkilledTradesBC',
                    proto: 'XML/JSON Feeds & Scheduled Sync',
                    desc: 'Post-secondary micro-credentials, Red Seal foundation programs, tuition waivers, and oral exam accommodations.'
                  }
                ].map((feed, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5"
                  >
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      {feed.name}
                    </div>
                    <div className="text-[11px] font-mono text-amber-300">{feed.proto}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{feed.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold text-white">
                Live Coordinator DDL Verification View (coordinator_dual_axis_check)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 font-mono text-slate-400">
                      <th className="py-2 px-3">211 ID</th>
                      <th className="py-2 px-3">Program & Organization</th>
                      <th className="py-2 px-3">City</th>
                      <th className="py-2 px-3">Intake</th>
                      <th className="py-2 px-3">High-Skill / Low-Text</th>
                      <th className="py-2 px-3">Oral Exam</th>
                      <th className="py-2 px-3">No ID Req</th>
                      <th className="py-2 px-3">Compass / Gear</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {[...ddl.immediate_relief_matches, ...ddl.primary_matches].map((p) => (
                      <tr key={p.program_id} className="hover:bg-slate-950/60">
                        <td className="py-2.5 px-3 font-mono text-amber-300">
                          {p.external_211_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{p.program_name}</div>
                          <div className="text-slate-400">{p.organization_name}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{p.municipality}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-300">
                          {p.intake_type}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {p.supports_high_skill_low_text ? 'TRUE' : 'FALSE'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {p.offers_oral_or_practical_testing ? 'TRUE' : 'FALSE'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {!p.requires_government_id ? 'TRUE' : 'FALSE'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {p.provides_transit_tickets ? 'Compass ' : ''}
                          {p.provides_gear_or_boots ? '+ Boots' : ''}
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
