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
      <div className="min-h-screen flex items-center justify-center bg-[#f6f3ec] text-[#1f7a6e] font-medium text-sm">
        <div className="clinical-card border border-[#cde8e2] rounded-2xl px-6 py-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2a9d8f] animate-ping" />
          Initializing Future Forward & Beyond Clinical Co-Pilot Suite...
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
                  Clinical &amp; Vocational Co-Pilot v4.0
                </span>
              </div>
              <p className="text-xs text-[#557078]">
                Multi-Barrier Navigator • Dual-Axis Competency Assessment • Verified Provincial Registry
              </p>
            </div>
          </div>

          {/* Real-Time Status & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* WebSocket Sync Status Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#f7f4ed] border border-[#e3dccf] text-xs flex items-center gap-2 text-[#335059]">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-[#2a9d8f] animate-pulse' : 'bg-[#3b82a6]'
                }`}
              />
              <span className="font-medium">
                Live Sync: #{session.session_id} <span className="text-[#69838b]">({lastSyncSource})</span>
              </span>
            </div>

            {/* LLM Reasoning Toggle (`</think>` Assistant Prefill Control) */}
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              title="Controls whether local Qwen/DeepSeek LLM uses </think> assistant prefill for <1s instant synthesis"
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                enableThinking
                  ? 'bg-[#e8f3f9] border-[#9ec8e2] text-[#1e5678]'
                  : 'bg-[#e6f6f3] border-[#b5e4da] text-[#1b7a6e]'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              {enableThinking ? 'Deep Clinical Reasoning: ON' : 'Instant Synthesis (<1s): ON'}
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
                <Columns className="w-3.5 h-3.5" /> Co-Pilot Suite
              </button>
              <button
                onClick={() => setDeviceMode('tablet_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'tablet_only'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Practitioner Tablet
              </button>
              <button
                onClick={() => setDeviceMode('phone_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'phone_only'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Client Companion
              </button>
              <button
                onClick={() => setDeviceMode('architecture_ddl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  deviceMode === 'architecture_ddl'
                    ? 'bg-[#2a9d8f] text-white shadow-xs font-semibold'
                    : 'text-[#4c6770] hover:text-[#163038]'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> Verified Registry
              </button>
            </div>

            <button
              onClick={handleResetDemo}
              className="p-2 rounded-xl bg-[#f7f4ed] hover:bg-[#ebe4d6] border border-[#e2d9c8] text-[#4a656d] cursor-pointer transition-colors"
              title="Reset Session #A842 (Stratus)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Telemetry Banner if Synthesizer Ran */}
      {telemetry && (
        <div className="bg-[#e6f6f3] border-b border-[#bce5dd] px-6 py-2 text-xs text-[#185e55] flex flex-wrap items-center justify-between gap-2">
          <span>
            ✓ Dual-Axis Clinical Synthesizer completed via <strong>{telemetry.provider_used}</strong> ({telemetry.endpoint_url})
          </span>
          <span className="font-mono text-[11px]">
            Fast Prefill: {telemetry.think_suppressed ? 'Active' : 'Standard'} • Response Time: {telemetry.latency_ms}ms
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
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-22">
              <div className="text-center mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#237a6f] bg-[#e6f6f3] border border-[#bce5dd] px-3 py-1 rounded-full">
                  Live Client Companion Handset
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
            <div className="clinical-card border border-[#e2dcd0] rounded-2xl p-6 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#2a9d8f]">
                Provincial &amp; Federal Data Integrations • HSDS v3.0 Registry
              </div>
              <h2 className="text-lg font-bold text-[#163038]">
                Connected Provincial &amp; Open Referral Health/Social Data Feeds
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    name: 'BC211 / 211 Canada API',
                    proto: 'Open Referral HSDS v3.0 JSON & AIRS XML',
                    desc: '150,000+ community, shelter, nutrition, outreach, and foundational programs across BC & Canada.'
                  },
                  {
                    name: 'BC Data Catalogue API',
                    proto: 'CKAN REST API (catalogue.data.gov.bc.ca)',
                    desc: 'Live locations and metadata for WorkBC centres, skills training grants, transit hubs, and health clinics.'
                  },
                  {
                    name: 'NOC & Job Bank Canada API',
                    proto: 'Open Government CKAN API (open.canada.ca)',
                    desc: 'Maps extracted practical skills to formal 5-digit NOC codes, regional wage rates, and entry pathways.'
                  },
                  {
                    name: 'EducationPlannerBC & SkilledTradesBC',
                    proto: 'XML/JSON Feeds & Scheduled Sync',
                    desc: 'Post-secondary micro-credentials, Red Seal foundation programs, tuition waivers, and oral exam accommodations.'
                  }
                ].map((feed, i) => (
                  <div
                    key={i}
                    className="linen-card border border-[#e3dccf] rounded-2xl p-4 space-y-1.5"
                  >
                    <div className="text-xs font-bold text-[#1b7a6e]">
                      {feed.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#2c6e9b]">{feed.proto}</div>
                    <p className="text-xs text-[#4f6a72] leading-relaxed">{feed.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="clinical-card border border-[#e2dcd0] rounded-2xl p-6 space-y-3">
              <h3 className="text-base font-bold text-[#163038]">
                Live Coordinator DDL Verification View (coordinator_dual_axis_check)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2dcd0] bg-[#f7f4ed] text-[#4a656d] font-semibold">
                      <th className="py-3 px-3.5 rounded-tl-xl">211 Registry ID</th>
                      <th className="py-3 px-3.5">Program &amp; Clinical/Community Provider</th>
                      <th className="py-3 px-3.5">Municipality</th>
                      <th className="py-3 px-3.5">Intake Pathway</th>
                      <th className="py-3 px-3.5">Hands-On / Low-Text</th>
                      <th className="py-3 px-3.5">Oral Assessment</th>
                      <th className="py-3 px-3.5">Zero-ID Start</th>
                      <th className="py-3 px-3.5 rounded-tr-xl">Included Supports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe5d9]">
                    {[...ddl.immediate_relief_matches, ...ddl.primary_matches].map((p) => (
                      <tr key={p.program_id} className="hover:bg-[#f6fbf9] transition-colors">
                        <td className="py-3 px-3.5 font-mono text-[#2c6e9b] font-medium">
                          {p.external_211_id}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#163038]">{p.program_name}</div>
                          <div className="text-[#5a747c]">{p.organization_name}</div>
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[#2c4a52]">{p.municipality}</td>
                        <td className="py-3 px-3.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#e6f6f3] text-[#1b7a6e] border border-[#bce5dd] font-medium">
                            {p.intake_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[#1b7a6e]">
                          {p.supports_high_skill_low_text ? 'Yes' : 'Standard'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[#2c6e9b]">
                          {p.offers_oral_or_practical_testing ? 'Available' : 'Written'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[#335059]">
                          {!p.requires_government_id ? 'Yes' : 'ID Required'}
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[#1b7a6e]">
                          {p.provides_transit_tickets ? 'Compass Pass ' : ''}
                          {p.provides_gear_or_boots ? '• Work Gear' : ''}
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
