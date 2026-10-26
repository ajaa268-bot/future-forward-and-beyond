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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Module Selector Ribbon (Coordinator Drop-In Drawer) */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            COORDINATOR DROP-IN DRAWER (ZERO-SPELLING STUDIO MODULES)
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
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {isDone && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-slate-950' : 'text-emerald-400'
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
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                MODULE 01 // VISUAL SCENARIO DIAGNOSTICS (NO TYPING OR SPELLING)
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                The Troubleshooter — How You Isolate Bottlenecks Under Pressure
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Tap a real-world shop or kitchen bottleneck below and choose your first move. Evaluates{' '}
                <code className="text-amber-300 font-mono">problem_solving_complexity (1–5)</code>{' '}
                completely independently from reading/form tolerance.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-right">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Detected Triage Style</div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {session.troubleshooter_selections.solving_style} (IQ: {session.problem_solving_complexity}/5)
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
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isSelectedScenario
                      ? 'bg-slate-950/90 border-amber-500/70 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {scen.badge}
                      </span>
                      <button
                        onClick={() => speakPrompt(`${scen.title}. ${scen.subtitle}`)}
                        title="Tap to Read Aloud"
                        className="text-slate-400 hover:text-amber-400 p-1 rounded cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">{scen.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-3 leading-relaxed">
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
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            activeNode
                              ? 'bg-emerald-500/20 border-emerald-400 text-white font-medium'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1">
                            <span className={activeNode ? 'text-emerald-300' : 'text-amber-400/90'}>
                              [{node.style}]
                            </span>
                            <span className="text-slate-400">Complexity {node.iq}/5</span>
                          </div>
                          <div>{node.label}</div>
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
        <div className="p-5 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                MODULE 02 // EQUALIZER RIG TUNING (REPLACES INVASIVE LITERACY EXAMS)
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                System Spec Sheet — Tune How Your Brain Runs Best
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Configure your learning channel, crew autonomy, and system bottlenecks. Automatically sets{' '}
                <code className="text-amber-300 font-mono">text_admin_tolerance</code> and oral exam accommodations.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-right font-mono">
              <div className="text-[11px] text-slate-400">TEXT / FORM TOLERANCE</div>
              <div className="text-sm font-bold text-amber-400">
                Score: {session.text_admin_tolerance}/5 | Modality: {session.preferred_learning_modality}
              </div>
            </div>
          </div>

          {/* 1. Input Channel */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2.5">
              1. INPUT CHANNEL (HOW YOU TAKE IN INFO FASTEST):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  {
                    id: 'Kinesthetic_HandsOn',
                    label: 'Hands-On / Watch & Do',
                    sub: 'Shop floor demonstration',
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
                    sub: 'Checklists & specs',
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
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        selected ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="text-xs font-bold">{ch.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{ch.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Operating Mode Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
                <span>SOLO DEEP-FOCUS</span>
                <span className="text-amber-400">{session.spec_sheet_state.crew_slider}%</span>
                <span>SMALL TIGHT CREW</span>
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
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
                <span>STEP-BY-STEP CHECKLIST</span>
                <span className="text-emerald-400">{session.spec_sheet_state.structure_slider}%</span>
                <span>GIVE ME THE END GOAL & LET ME BUILD</span>
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
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. System Bottlenecks */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2.5">
              3. SYSTEM BOTTLENECKS (WHAT DRAINS YOUR BATTERY — TAP TO FLAG):
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
                    className={`p-3 rounded-lg border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-rose-500/20 border-rose-500/70 text-rose-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{bottleneck}</span>
                    {active && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: VOICE-TO-BLUEPRINT */}
      {activeModule === 'VOICE_BLUEPRINT' && (
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                MODULE 03 // SPOKEN SKILL EXTRACTOR (WHISPER STT + DUAL-AXIS LLM SYNTHESIZER)
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Voice-to-Blueprint — Talk For 60 Seconds, Get Your Technical Blueprint
              </h3>
              <p className="text-sm text-slate-400 mt-1 italic">
                &ldquo;Tell me about something you&apos;ve fixed, cooked, built, modded, or organized that came out right. Don&apos;t worry about formal words—just walk me through how you did it.&rdquo;
              </p>
            </div>
            <button
              onClick={() =>
                speakPrompt(
                  "Tell me about something you've fixed, cooked, built, modded, or organized that came out right. Don't worry about formal words, just walk me through how you did it."
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" /> Read Prompt Aloud
            </button>
          </div>

          {/* Preset Story Buttons for Instant Demo Testing */}
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase mb-2">
              Load Spoken Audio Transcript Sample (or speak/paste below):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {VOICE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onPatchSession({ voice_transcript: preset.text });
                    onSynthesizeVoice(preset.text);
                  }}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left text-xs text-slate-300 transition-all cursor-pointer"
                >
                  <div className="font-mono text-[11px] text-amber-400 font-bold mb-1">
                    {preset.label}
                  </div>
                  <div className="line-clamp-2 text-slate-400">{preset.text}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Captured Voice Transcript (Zero-Spelling Required)
              </span>
              <button
                disabled={isSynthesizing}
                onClick={() => onSynthesizeVoice(session.voice_transcript)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="w-4 h-4" />
                {isSynthesizing
                  ? 'Synthesizing Blueprint & Running DDL Check...'
                  : 'Run Dual-Axis LLM Synthesizer & DDL Check'}
              </button>
            </div>
            <textarea
              rows={3}
              value={session.voice_transcript}
              onChange={(e) => onPatchSession({ voice_transcript: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="Spoken voice transcript appears here..."
            />
          </div>

          {/* Synthesized Technical Competency Blueprint */}
          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                  EXTRACTED TECHNICAL COMPETENCY BLUEPRINT
                </span>
                <h4 className="text-base font-bold text-white">
                  {session.skill_blueprint_json.headline_strength}
                </h4>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Mapped to Canadian NOC Taxonomy
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {session.skill_blueprint_json.extracted_pro_skills.map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-1.5"
                >
                  <div className="text-xs text-slate-400">
                    <span className="font-mono text-slate-500 uppercase">What You Did: </span>
                    {item.what_you_did}
                  </div>
                  <div className="text-sm font-bold text-amber-300">
                    ✓ {item.pro_translation}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
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
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                MODULE 04 // TACTILE WORK ENVIRONMENT CARD SORT (SYNCED WITH CLIENT PHONE)
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                The Loadout — Lock It In, Test Run, or Scrap It
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Client can tap or swipe these on their companion phone or tablet. Directly weights PostgreSQL program matching.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {session.loadout_cards.map((card) => {
              return (
                <div
                  key={card.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {card.category.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => speakPrompt(`${card.title}. ${card.tagline}`)}
                        className="text-slate-400 hover:text-amber-400 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-1">{card.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{card.tagline}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-900">
                    {(['Lock It In', 'Test Run', 'Scrap It'] as const).map((statusOption) => {
                      const active = card.status === statusOption;
                      const activeStyle =
                        statusOption === 'Lock It In'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : statusOption === 'Test Run'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-rose-500/80 text-white font-bold';
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
                          className={`py-1.5 px-2 rounded text-[11px] font-mono transition-all cursor-pointer ${
                            active
                              ? activeStyle
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
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
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                MODULE 05 // MASLOW TIER-1 BARRIER OFFLOADER
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                The Pressure Valve — Hand Over 1 or 2 Heavy Rocks Today
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                A job or school placement will fail if immediate survival or administrative friction isn&apos;t cleared first. Tap any block to hand it over to the coordinator and filter the PostgreSQL DDL query.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <ShieldAlert
                        className={`w-5 h-5 ${
                          isActive ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {isActive ? 'OFFLOADED' : 'TAP TO HAND OVER'}
                      </span>
                    </div>
                    <div className="font-bold text-sm">{block.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{block.subtitle}</div>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-3 pt-2 border-t border-slate-800/80">
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
