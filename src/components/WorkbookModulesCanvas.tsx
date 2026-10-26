import React from 'react';
import {
  Wrench,
  Cpu,
  Headphones,
  FileText,
  Mic,
  Flame,
  Speaker,
  Trees,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Volume2,
  Sliders,
  Compass,
  ShieldAlert,
  Radio
} from 'lucide-react';
import {
  ClientWorkbookSession,
  ModuleCode,
  LearningModality
} from '../types/navigator.js';

interface WorkbookModulesCanvasProps {
  session: ClientWorkbookSession;
  onPatchSession: (patch: Partial<ClientWorkbookSession>) => void;
  onSynthesizeVoice: (transcript: string) => void;
  isSynthesizing: boolean;
}

const TROUBLESHOOTER_SCENARIOS = [
  {
    id: 'kitchen_rush',
    title: 'SCENARIO A // COMMERCIAL KITCHEN RUSH',
    subtitle: 'Prep line is backed up 15 mins before service & primary range burner #2 drops pressure.',
    badge: 'Culinary / Line Triage',
    nodes: [
      {
        id: 'isolate_burner',
        label: 'Shut off valve #2, pull regulator jet & shift high-heat pans to flat-top',
        style: 'Root-Cause Isolation' as const,
        iq: 5
      },
      {
        id: 'reroute_prep',
        label: 'Clear central prep island & re-stage cold plating away from hot line bottleneck',
        style: 'Spatial Reorganization' as const,
        iq: 4
      },
      {
        id: 'delegate_runner',
        label: 'Have dish/prep runner batch-portion sauces while you call the pass',
        style: 'Crew Delegation' as const,
        iq: 4
      }
    ]
  },
  {
    id: 'signal_hardware',
    title: 'SCENARIO B // STAGE AUDIO RIG & SERVER RACK',
    subtitle: 'Main PA left stack is dead and power distro breaker keeps tripping before soundcheck.',
    badge: 'Signal Flow / Hardware',
    nodes: [
      {
        id: 'trace_signal',
        label: 'Swap XLR/patch at stage snake input #1 to isolate mic vs. board channel fault',
        style: 'Root-Cause Isolation' as const,
        iq: 5
      },
      {
        id: 'split_power',
        label: 'Re-route high-draw sub amps onto dedicated 20A circuit leg',
        style: 'Spatial Reorganization' as const,
        iq: 5
      },
      {
        id: 'stage_patch',
        label: 'Direct stagehand to label & coil dead lines off main load-in ramp',
        style: 'Crew Delegation' as const,
        iq: 4
      }
    ]
  },
  {
    id: 'shop_bay',
    title: 'SCENARIO C // FABRICATION & REPAIR BAY',
    subtitle: 'Pallet delivery is blocking the main bay door and two critical torque wrenches are missing.',
    badge: 'Shop Floor / Fabrication',
    nodes: [
      {
        id: 'clear_egress',
        label: 'Pallet-jack stock to side staging zone first so lift & emergency lanes stay clear',
        style: 'Spatial Reorganization' as const,
        iq: 5
      },
      {
        id: 'shadow_board',
        label: 'Inspect last active service bay & lock out calibrated substitute wrench',
        style: 'Root-Cause Isolation' as const,
        iq: 4
      },
      {
        id: 'spotter_call',
        label: 'Post a crew spotter at bay door while moving heavy stock',
        style: 'Crew Delegation' as const,
        iq: 4
      }
    ]
  }
];

const VOICE_PRESETS = [
  {
    label: 'Preset 1: Cook-Off & Audio Mixer Fix (Quadrant A — High IQ / Low Text)',
    text: "Last month our community centre cook-off had one of the big propane burners losing flame right when we had 60 plates queued up. I shut the faulty line, pulled the regulator apart to clear a greased jet, and re-staged the prep pans onto the flat-top so nobody waited. Same way I fix up old gaming PCs and audio mixers when a channel drops out—trace the signal or fuel line from the source instead of guessing."
  },
  {
    label: 'Preset 2: Bike Hydraulics & Shop Welding (Quadrant A — Mechanical Trades)',
    text: "My neighbour's e-bike had a seized rear caliper and stripped rotor bolts. I soaked the threads, used an extractor bit without cracking the hub, bled the hydraulic brake line by hand, and trued the wheel on a makeshift stand. Give me tools and a shop bench and I can figure out how anything goes together, I just hate filling out government forms."
  },
  {
    label: 'Preset 3: Outdoor Trail Crew & Nursery Layout (Quadrant C/A — Green Jobs)',
    text: "I helped run the community garden beds and storm drainage ditching after the heavy rain. We trenched gravel channels so the root beds wouldn't rot and organized the tool shed by hand. I do best outdoors moving around with a small crew instead of sitting under fluorescent lights."
  }
];

const BARRIER_BLOCKS = [
  {
    id: 'Transit Pass / Compass',
    title: 'Transit Pass / Compass',
    subtitle: 'Bus / SkyTrain fare covered immediately',
    reliefTag: 'Triggers provides_transit_tickets = TRUE'
  },
  {
    id: 'Groceries / Meals',
    title: 'Groceries / Hot Meals',
    subtitle: 'Daily kitchen meals & emergency food hamper',
    reliefTag: 'Triggers provides_food_or_meals = TRUE'
  },
  {
    id: 'Paperwork / Scribe Help',
    title: 'Paperwork / Scribe Help',
    subtitle: 'Coordinator fills out intake & union forms with you',
    reliefTag: 'Triggers scribe_or_reader_available = TRUE'
  },
  {
    id: 'Replacement ID / SIN',
    title: 'Replacement ID / SIN Clinic',
    subtitle: 'Route to zero-ID drop-in + free ID clinic voucher',
    reliefTag: 'Triggers requires_government_id = FALSE'
  },
  {
    id: 'Work Boots / Gear',
    title: 'CSA Work Boots / Rain Gear',
    subtitle: 'Steel-toe boots, gloves & rain gear voucher',
    reliefTag: 'Triggers provides_gear_or_boots = TRUE'
  }
];

export const WorkbookModulesCanvas: React.FC<WorkbookModulesCanvasProps> = ({
  session,
  onPatchSession,
  onSynthesizeVoice,
  isSynthesizing
}) => {
  const activeModule = session.active_module_on_canvas || 'TROUBLESHOOTER';

  const speakPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      window.speechSynthesis.speak(utterance);
    }
  };

  const markModuleCompleted = (mod: ModuleCode) => {
    if (!session.completed_modules_json.includes(mod)) {
      return [...session.completed_modules_json, mod];
    }
    return session.completed_modules_json;
  };

  return (
    <div className="clinical-card border border-[#dfe6dd] rounded-2xl overflow-hidden">
      {/* Module Selector Ribbon (Practitioner Drop-In Drawer) */}
      <div className="linen-card border-b border-[#e4ddd0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#2a9d8f]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#46636b]">
            Interactive Assessment Modules (Zero-Spelling Guided Suite)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { code: 'TROUBLESHOOTER', label: '01 Troubleshooter' },
              { code: 'SPEC_SHEET', label: '02 System Spec' },
              { code: 'VOICE_BLUEPRINT', label: '03 Voice-to-Blueprint' },
              { code: 'LOADOUT_DECK', label: '04 The Loadout' },
              { code: 'PRESSURE_VALVE', label: '05 Pressure Valve' }
            ] as Array<{ code: ModuleCode; label: string }>
          ).map((tab) => {
            const isActive = activeModule === tab.code;
            const isDone = session.completed_modules_json.includes(tab.code);
            return (
              <button
                key={tab.code}
                onClick={() =>
                  onPatchSession({ active_module_on_canvas: tab.code })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#2a9d8f] text-white shadow-sm font-semibold'
                    : 'bg-white/90 text-[#3c5a63] hover:bg-[#eaf7f4] border border-[#dfd8ca]'
                }`}
              >
                {isDone && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-white' : 'text-[#2a9d8f]'
                    }`}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE 1: THE TROUBLESHOOTER */}
      {activeModule === 'TROUBLESHOOTER' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Module 01 • Visual Scenario Diagnostics (Zero Typing or Spelling)
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                The Troubleshooter — Practical Problem-Solving &amp; Triage
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Select a real-world scenario below and tap your first instinct. Evaluates{' '}
                <code className="text-[#1f6e8c] bg-[#e9f4f9] px-1.5 py-0.5 rounded font-mono text-xs">
                  problem_solving_complexity (1–5)
                </code>{' '}
                independently from reading or paperwork tolerance.
              </p>
            </div>
            <div className="bg-[#eaf7f4] border border-[#bce5dd] rounded-xl px-4 py-2.5 text-right">
              <div className="text-[11px] font-medium text-[#3b6e67] uppercase">Detected Triage Approach</div>
              <div className="text-sm font-bold text-[#155e54]">
                {session.troubleshooter_selections.solving_style} (Tier {session.problem_solving_complexity}/5)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {TROUBLESHOOTER_SCENARIOS.map((scen) => {
              const isSelectedScenario =
                session.troubleshooter_selections.scenario_id === scen.id;
              return (
                <div
                  key={scen.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    isSelectedScenario
                      ? 'bg-[#f4fbf9] border-[#2a9d8f] shadow-md shadow-[#2a9d8f]/10'
                      : 'linen-card border-[#e3dccf] hover:border-[#b5dfd7]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#e8f3f9] text-[#23638a] border border-[#c3dff0]">
                        {scen.badge}
                      </span>
                      <button
                        onClick={() => speakPrompt(`${scen.title}. ${scen.subtitle}`)}
                        title="Tap to Read Aloud"
                        className="text-[#56747d] hover:text-[#2a9d8f] p-1 rounded-lg hover:bg-white/80 cursor-pointer transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-[#163038]">{scen.title}</h4>
                    <p className="text-xs text-[#547078] mt-1 mb-3.5 leading-relaxed">
                      {scen.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {scen.nodes.map((node) => {
                      const activeNode =
                        isSelectedScenario &&
                        session.troubleshooter_selections.selected_node_id === node.id;
                      return (
                        <button
                          key={node.id}
                          onClick={() =>
                            onPatchSession({
                              problem_solving_complexity: node.iq,
                              troubleshooter_selections: {
                                scenario_id: scen.id,
                                selected_node_id: node.id,
                                solving_style: node.style
                              },
                              completed_modules_json: markModuleCompleted('TROUBLESHOOTER')
                            })
                          }
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                            activeNode
                              ? 'bg-[#2a9d8f] border-[#1f7a6e] text-white font-medium shadow-xs'
                              : 'bg-white border-[#e2dcd0] text-[#28454e] hover:border-[#2a9d8f]/60 hover:bg-[#f8fcfb]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold uppercase mb-1">
                            <span className={activeNode ? 'text-[#d8f7f2]' : 'text-[#2a9d8f]'}>
                              {node.style}
                            </span>
                            <span className={activeNode ? 'text-white/90' : 'text-[#647f87]'}>
                              Complexity {node.iq}/5
                            </span>
                          </div>
                          <div className="leading-snug">{node.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 2: SYSTEM SPEC SHEET */}
      {activeModule === 'SPEC_SHEET' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Module 02 • Cognitive &amp; Sensory Comfort Profile
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                System Spec Sheet — How Your Mind Works Most Comfortably
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Tune your preferred learning channel, collaborative pace, and environmental comfort. Automatically configures{' '}
                <code className="text-[#1f6e8c] bg-[#e9f4f9] px-1.5 py-0.5 rounded font-mono text-xs">
                  text_admin_tolerance
                </code>{' '}
                and practical testing accommodations.
              </p>
            </div>
            <div className="bg-[#e8f3f9] border border-[#c0dfef] rounded-xl px-4 py-2.5 text-right">
              <div className="text-[11px] font-medium text-[#2c678a] uppercase">Reading / Form Comfort</div>
              <div className="text-sm font-bold text-[#194c6b]">
                Score: {session.text_admin_tolerance}/5 • {session.preferred_learning_modality.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* 1. Input Channel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d5b63] mb-2.5">
              1. Input Channel (How You Absorb New Skills Fastest):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  {
                    id: 'Kinesthetic_HandsOn',
                    label: 'Hands-On / Watch & Do',
                    sub: 'Practical demonstration',
                    icon: Wrench
                  },
                  {
                    id: 'Visual_Blueprint',
                    label: 'Visual Diagram / Blueprint',
                    sub: 'Schematics & layouts',
                    icon: Cpu
                  },
                  {
                    id: 'Verbal_Coaching',
                    label: 'Talk It Through / Audio',
                    sub: 'Spoken walkthrough',
                    icon: Headphones
                  },
                  {
                    id: 'Text_Manual',
                    label: 'Written Manual / Text',
                    sub: 'Checklists & guides',
                    icon: FileText
                  }
                ] as Array<{
                  id: LearningModality;
                  label: string;
                  sub: string;
                  icon: any;
                }>
              ).map((ch) => {
                const Icon = ch.icon;
                const selected = session.spec_sheet_state.input_channel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      const newTolerance = ch.id === 'Text_Manual' ? 4 : 1;
                      onPatchSession({
                        preferred_learning_modality: ch.id,
                        text_admin_tolerance: newTolerance,
                        spec_sheet_state: {
                          ...session.spec_sheet_state,
                          input_channel: ch.id
                        },
                        completed_modules_json: markModuleCompleted('SPEC_SHEET')
                      });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#e6f6f3] border-[#2a9d8f] text-[#154d46] shadow-xs'
                        : 'linen-card border-[#e3dccf] text-[#35525a] hover:border-[#9fd6cc] hover:bg-white'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        selected ? 'text-[#1f7a6e]' : 'text-[#5b7880]'
                      }`}
                    />
                    <div className="text-xs font-bold">{ch.label}</div>
                    <div className="text-[11px] text-[#5e7a82] mt-0.5">{ch.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Operating Mode Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 linen-card border border-[#e3dccf] rounded-2xl p-4">
            <div className="bg-white/80 rounded-xl p-3.5 border border-[#eae3d5]">
              <div className="flex justify-between text-xs font-semibold text-[#35525a] mb-2">
                <span>SOLO DEEP-FOCUS</span>
                <span className="text-[#2a9d8f] font-bold">{session.spec_sheet_state.crew_slider}%</span>
                <span>SMALL SUPPORTIVE CREW</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={session.spec_sheet_state.crew_slider}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onPatchSession({
                    autonomy_preference:
                      val > 60 ? 'Small_Crew_Collab' : 'Independent_Problem_Solver',
                    spec_sheet_state: {
                      ...session.spec_sheet_state,
                      crew_slider: val
                    }
                  });
                }}
                className="w-full accent-[#2a9d8f] cursor-pointer"
              />
            </div>

            <div className="bg-white/80 rounded-xl p-3.5 border border-[#eae3d5]">
              <div className="flex justify-between text-xs font-semibold text-[#35525a] mb-2">
                <span>CLEAR STEP CHECKLIST</span>
                <span className="text-[#2c6e9b] font-bold">{session.spec_sheet_state.structure_slider}%</span>
                <span>SHOW END GOAL &amp; LET ME BUILD</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={session.spec_sheet_state.structure_slider}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onPatchSession({
                    autonomy_preference:
                      val < 40 ? 'Structured_Checklist' : 'Independent_Problem_Solver',
                    spec_sheet_state: {
                      ...session.spec_sheet_state,
                      structure_slider: val
                    }
                  });
                }}
                className="w-full accent-[#2c6e9b] cursor-pointer"
              />
            </div>
          </div>

          {/* 3. System Bottlenecks */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d5b63] mb-2.5">
              3. Friction Points (What Drains Your Energy — Tap to Accommodate):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                'Heavy Reading / Spelling Forms',
                'Sitting Still at a Desk',
                'Loud Crowded Rooms',
                'Early Morning Transit'
              ].map((bottleneck) => {
                const active = session.spec_sheet_state.bottlenecks.includes(bottleneck);
                return (
                  <button
                    key={bottleneck}
                    onClick={() => {
                      const exists = session.spec_sheet_state.bottlenecks.includes(bottleneck);
                      const next = exists
                        ? session.spec_sheet_state.bottlenecks.filter((b) => b !== bottleneck)
                        : [...session.spec_sheet_state.bottlenecks, bottleneck];
                      const lowersText = next.includes('Heavy Reading / Spelling Forms');
                      onPatchSession({
                        text_admin_tolerance: lowersText ? 1 : 3,
                        spec_sheet_state: {
                          ...session.spec_sheet_state,
                          bottlenecks: next
                        },
                        completed_modules_json: markModuleCompleted('SPEC_SHEET')
                      });
                    }}
                    className={`p-3.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-[#e8f3f9] border-[#5aa3cc] text-[#184a69] shadow-xs font-semibold'
                        : 'bg-white border-[#e3dccf] text-[#4c6770] hover:border-[#b5dfd7]'
                    }`}
                  >
                    <span>{bottleneck}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-[#2c6e9b] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: VOICE-TO-BLUEPRINT */}
      {activeModule === 'VOICE_BLUEPRINT' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Module 03 • Spoken Skill Extractor (Whisper STT + Dual-Axis Synthesizer)
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                Voice-to-Blueprint — Share a Story, See Your Professional Strengths
              </h3>
              <p className="text-sm text-[#547078] mt-1 italic">
                &ldquo;Tell me about something you&apos;ve fixed, cooked, built, modded, or organized that came out right. Don&apos;t worry about formal words—just walk me through how you did it.&rdquo;
              </p>
            </div>
            <button
              onClick={() =>
                speakPrompt(
                  "Tell me about something you've fixed, cooked, built, modded, or organized that came out right. Don't worry about formal words, just walk me through how you did it."
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#e8f3f9] hover:bg-[#d8eaf5] border border-[#bddbf0] text-xs font-medium text-[#1c5678] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Read Prompt Aloud
            </button>
          </div>

          {/* Preset Story Buttons for Instant Demo Testing */}
          <div>
            <div className="text-xs font-semibold text-[#48656e] uppercase mb-2">
              Select a Sample Client Narrative (or speak/type below):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {VOICE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onPatchSession({ voice_transcript: preset.text });
                    onSynthesizeVoice(preset.text);
                  }}
                  className="p-3.5 rounded-2xl linen-card border border-[#e2d9c8] hover:border-[#2a9d8f] hover:bg-white text-left text-xs text-[#37535b] transition-all cursor-pointer"
                >
                  <div className="text-[11px] text-[#1b7a6e] font-bold mb-1">
                    {preset.label}
                  </div>
                  <div className="line-clamp-2 text-[#5a757d] leading-relaxed">{preset.text}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="linen-card border border-[#e2d9c8] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase text-[#1b7a6e] flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Captured Spoken Narrative (Zero Spelling Required)
              </span>
              <button
                disabled={isSynthesizing}
                onClick={() => onSynthesizeVoice(session.voice_transcript)}
                className="px-4 py-2 rounded-xl bg-[#2a9d8f] hover:bg-[#21867a] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {isSynthesizing
                  ? 'Synthesizing Blueprint & Verifying Registry...'
                  : 'Synthesize Competency Blueprint'}
              </button>
            </div>
            <textarea
              rows={3}
              value={session.voice_transcript}
              onChange={(e) => onPatchSession({ voice_transcript: e.target.value })}
              className="w-full bg-white border border-[#dfd8ca] rounded-xl p-3.5 text-sm text-[#163038] focus:outline-none focus:border-[#2a9d8f]"
              placeholder="Spoken client narrative appears here..."
            />
          </div>

          {/* Synthesized Technical Competency Blueprint */}
          <div className="bg-gradient-to-r from-[#e6f6f3] to-[#eaf4fa] border border-[#bce5dd] rounded-2xl p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1b7a6e]">
                  Validated Competency Blueprint
                </span>
                <h4 className="text-base font-bold text-[#163038]">
                  {session.skill_blueprint_json.headline_strength}
                </h4>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/90 text-[#1e5678] border border-[#c2dff0]">
                Aligned with Canadian NOC Standards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {session.skill_blueprint_json.extracted_pro_skills.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/95 border border-[#d6ebe6] rounded-xl p-3.5 space-y-1.5 shadow-2xs"
                >
                  <div className="text-xs text-[#547078]">
                    <span className="font-semibold text-[#38545c] uppercase text-[10px]">Experience Shared: </span>
                    {item.what_you_did}
                  </div>
                  <div className="text-sm font-bold text-[#1b7a6e]">
                    ✓ {item.pro_translation}
                  </div>
                  <div className="text-[11px] font-mono text-[#2c6e9b] font-medium">
                    {item.noc_domain}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: THE LOADOUT (TACTILE CARD SORT) */}
      {activeModule === 'LOADOUT_DECK' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Module 04 • Tactile Environment Card Sort (Synced Live with Handset)
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                The Loadout — Preferred Work Settings &amp; Environments
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Clients can tap these cards on their companion phone or tablet. Directly weights verified program recommendations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {session.loadout_cards.map((card) => {
              return (
                <div
                  key={card.id}
                  className="linen-card border border-[#e2d9c8] rounded-2xl p-4 flex flex-col justify-between gap-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#e8f3f9] text-[#246185] border border-[#c6e1f2]">
                        {card.category.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => speakPrompt(`${card.title}. ${card.tagline}`)}
                        className="text-[#5a757d] hover:text-[#2a9d8f] cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-[#163038] mt-1.5">{card.title}</h4>
                    <p className="text-xs text-[#547078] mt-1">{card.tagline}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-[#e6dfd1]">
                    {(['Lock It In', 'Test Run', 'Scrap It'] as const).map((statusOption) => {
                      const active = card.status === statusOption;
                      const activeStyle =
                        statusOption === 'Lock It In'
                          ? 'bg-[#2a9d8f] text-white font-semibold shadow-2xs'
                          : statusOption === 'Test Run'
                          ? 'bg-[#3b82a6] text-white font-semibold shadow-2xs'
                          : 'bg-[#d9776c] text-white font-semibold';
                      return (
                        <button
                          key={statusOption}
                          onClick={() => {
                            const updatedCards = session.loadout_cards.map((c) =>
                              c.id === card.id ? { ...c, status: statusOption } : c
                            );
                            onPatchSession({
                              loadout_cards: updatedCards,
                              completed_modules_json: markModuleCompleted('LOADOUT_DECK')
                            });
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                            active
                              ? activeStyle
                              : 'bg-white text-[#4c6770] border border-[#e2dcd0] hover:bg-[#f1f8f6]'
                          }`}
                        >
                          {statusOption}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 5: THE PRESSURE VALVE */}
      {activeModule === 'PRESSURE_VALVE' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Module 05 • Immediate Stabilization &amp; Barrier Relief
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                The Pressure Valve — Let Us Take 1 or 2 Practical Burdens Off Your Plate Today
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Training or employment works best when immediate logistics are supported first. Tap any item below to include it in your support plan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {BARRIER_BLOCKS.map((block) => {
              const isActive = session.active_barriers.includes(block.id);
              return (
                <button
                  key={block.id}
                  onClick={() => {
                    const next = isActive
                      ? session.active_barriers.filter((b) => b !== block.id)
                      : [...session.active_barriers, block.id];
                    onPatchSession({
                      active_barriers: next,
                      coordinator_scribe_required: next.includes('Paperwork / Scribe Help'),
                      completed_modules_json: markModuleCompleted('PRESSURE_VALVE')
                    });
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#e6f6f3] border-[#2a9d8f] text-[#154d46] shadow-sm'
                      : 'linen-card border-[#e2d9c8] text-[#35525a] hover:border-[#9fd6cc] hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <ShieldAlert
                        className={`w-5 h-5 ${
                          isActive ? 'text-[#1b7a6e]' : 'text-[#6c868e]'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#2a9d8f] text-white'
                            : 'bg-white text-[#647f87] border border-[#e2dcd0]'
                        }`}
                      >
                        {isActive ? 'Included' : 'Select'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#163038]">{block.title}</div>
                    <div className="text-xs text-[#547078] mt-1">{block.subtitle}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#2c6e9b] mt-3 pt-2 border-t border-[#e3dccf]">
                    {block.reliefTag}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
