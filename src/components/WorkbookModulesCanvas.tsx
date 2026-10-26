import React, { useState } from 'react';
import {
  Wrench,
  Cpu,
  Headphones,
  FileText,
  Mic,
  MicOff,
  CheckCircle2,
  Sparkles,
  Volume2,
  HeartHandshake,
  Compass,
  ArrowRight,
  ArrowLeft
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

const EVERYDAY_SCENARIOS = [
  {
    id: 'kitchen_rush',
    title: 'Cooking a Big Meal for People',
    subtitle: 'You are helping make dinner for a hungry group, and one side of the stove stops heating up.',
    badge: 'Food & Kitchens',
    nodes: [
      {
        id: 'isolate_burner',
        stepTitle: 'Fix It Directly',
        label: 'Turn off the broken burner and move the pots to the working side so the food keeps cooking.',
        style: 'Root-Cause Isolation' as const,
        iq: 5
      },
      {
        id: 'reroute_prep',
        stepTitle: 'Organize the Space',
        label: 'Clear space on the counter so plates, salads, and cold food are ready to hand out right away.',
        style: 'Spatial Reorganization' as const,
        iq: 4
      },
      {
        id: 'delegate_runner',
        stepTitle: 'Team Up Together',
        label: 'Ask a helper to dish up the side plates while you finish cooking the main meal.',
        style: 'Crew Delegation' as const,
        iq: 4
      }
    ]
  },
  {
    id: 'signal_hardware',
    title: 'Setting Up Music or a TV',
    subtitle: 'You are setting up speakers or a TV for friends, and no sound is coming out.',
    badge: 'Everyday Tech & Sound',
    nodes: [
      {
        id: 'trace_signal',
        stepTitle: 'Check Step-by-Step',
        label: 'Check the cords one by one or try plugging in a different cable to see which one is loose.',
        style: 'Root-Cause Isolation' as const,
        iq: 5
      },
      {
        id: 'split_power',
        stepTitle: 'Move to a Better Plug',
        label: 'Plug the big speaker into its own wall outlet so the power strip does not overload.',
        style: 'Spatial Reorganization' as const,
        iq: 5
      },
      {
        id: 'stage_patch',
        stepTitle: 'Keep the Room Safe',
        label: 'Ask someone to neatly coil the extra cords out of the walkway while you test the sound.',
        style: 'Crew Delegation' as const,
        iq: 4
      }
    ]
  },
  {
    id: 'shop_bay',
    title: 'Busy Garage or Work Area',
    subtitle: 'Heavy boxes are blocking the main doorway, and a tool you need isn’t in its usual spot.',
    badge: 'Hands-On & Outdoors',
    nodes: [
      {
        id: 'clear_egress',
        stepTitle: 'Clear the Path First',
        label: 'Move the boxes to the side wall first so everyone can walk through safely.',
        style: 'Spatial Reorganization' as const,
        iq: 5
      },
      {
        id: 'shadow_board',
        stepTitle: 'Find What Works',
        label: 'Check the last table where the tool was used, or grab another tool that gets the job done.',
        style: 'Root-Cause Isolation' as const,
        iq: 4
      },
      {
        id: 'spotter_call',
        stepTitle: 'Look Out for Each Other',
        label: 'Ask a teammate to watch the doorway and guide people around while you move the boxes.',
        style: 'Crew Delegation' as const,
        iq: 4
      }
    ]
  }
];

const SIMPLE_STYLE_LABELS: Record<string, string> = {
  'Root-Cause Isolation': 'Hands-On Problem Solver',
  'Spatial Reorganization': 'Practical Space Organizer',
  'Crew Delegation': 'Supportive Team Player'
};

const VOICE_PRESETS = [
  {
    label: 'Example 1: Cooking for a Group & Fixing Home Electronics',
    text: "Last month at a big family and community dinner, one side of the stove stopped working right when everyone was waiting to eat. I turned off the bad burner, moved the big pots over, and got all the plates served warm on time. I'm also the person friends call when their TV, speaker, or computer isn't working—I just check the cords one by one until it works."
  },
  {
    label: 'Example 2: Fixing Bikes, Tools & Hands-On Trades School (KPU / BCIT)',
    text: "My friend's bike brakes were stuck and the chain kept slipping. I took the wheel off, cleaned and tightened the parts, and got it riding smooth again. Give me real tools at a school shop like KPU or BCIT and I can figure out how anything goes together—I just hate filling out long forms."
  },
  {
    label: 'Example 3: Helping Outdoors, Gardening & Yard Work',
    text: "After the heavy rain, I helped clear out the community garden beds, dug a small path so the water would drain away, and organized all the tools in the shed. I feel best working outside and moving around with a friendly group instead of sitting indoors."
  },
  {
    label: 'Example 4: Community Kitchens, Options+, Sources BC & Local Food Banks',
    text: "I love helping out with food prep, sorting fresh produce, and making sure neighbors get a warm meal. I want to connect with Options+, Sources BC, or a local food bank and teaching kitchen where I can get FoodSafe, bus tickets, and hands-on work experience."
  }
];

const BARRIER_BLOCKS = [
  {
    id: 'Safe Shelter / Housing & Rent Subsidy',
    title: 'Housing, Shelter & Rent Subsidy',
    subtitle: '24/7 shelter bed tonight, BC Housing / RAP rent subsidy, or Rent Bank help',
    helpSummary: 'Included: Shelter, BC Housing & Rent Bank'
  },
  {
    id: 'Mental Health & Crisis Support',
    title: 'Mental Health & 24/7 Crisis Care',
    subtitle: 'Walk-in counseling, Clubhouse community, CMHA, or 9-8-8 / Car 67 peer support',
    helpSummary: 'Included: Walk-in mental health & peer support'
  },
  {
    id: 'Disability (PWD) / Income Assistance',
    title: 'PWD ($1,500+/mo) & Leisure Pass',
    subtitle: 'Disability assistance, crisis grants, $52/yr Bus Pass & FREE Pool/Gym/Shower Pass',
    helpSummary: 'Included: PWD advocate + Free Leisure Pass'
  },
  {
    id: 'Physical Barriers & Mobility Gear',
    title: 'Physical Barriers & Adaptive Gear',
    subtitle: 'Neil Squire ergonomic/adaptive tools, wheelchair grants, & HandyDART',
    helpSummary: 'Included: Free adaptive gear & HandyDART'
  },
  {
    id: 'AA / NA / CA / CoDA Peer Recovery',
    title: 'AA, NA, CA & CoDA Recovery',
    subtitle: 'Free 24/7 anonymous peer recovery lines & welcoming daily local meetings',
    helpSummary: 'Included: 24/7 AA / NA / CA / CoDA meetings'
  },
  {
    id: 'Legal Aid & First Responder Help',
    title: 'Legal Aid, Eviction & Nurse 8-1-1',
    subtitle: 'Free eviction/court lawyer, VictimLink, Car 67/87 nurse & BCEHS paramedics',
    helpSummary: 'Included: Free legal aid & health outreach'
  },
  {
    id: 'Transit Pass / Compass',
    title: 'Bus Pass / Compass Card',
    subtitle: 'Free bus and SkyTrain tickets so getting there is easy',
    helpSummary: 'Included: Compass transit tickets today'
  },
  {
    id: 'Groceries / Meals',
    title: 'Local Food Banks & Hot Meals',
    subtitle: 'Daily hot meals and take-home food bank hampers',
    helpSummary: 'Included: Food banks & free daily meals'
  },
  {
    id: 'Paperwork / Scribe Help',
    title: 'Help With Forms & Replacement ID',
    subtitle: 'We sit down with a coffee, fill out paperwork together & replace lost ID/SIN',
    helpSummary: 'Included: Staff handles forms + no ID needed'
  },
  {
    id: 'Work Boots / Gear',
    title: 'Work Boots & Rain Gear',
    subtitle: 'Free steel-toe boots, gloves, and weather gear before Day 1',
    helpSummary: 'Included: Free boots & gear voucher'
  }
];

const LOADOUT_BUTTON_LABELS: Record<'Lock It In' | 'Test Run' | 'Scrap It', string> = {
  'Lock It In': 'Love This',
  'Test Run': 'Maybe Try',
  'Scrap It': 'Not For Me'
};

export const WorkbookModulesCanvas: React.FC<WorkbookModulesCanvasProps> = ({
  session,
  onPatchSession,
  onSynthesizeVoice,
  isSynthesizing
}) => {
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);
  const activeModule = session.active_module_on_canvas || 'TROUBLESHOOTER';

  const MODULE_ORDER: Array<{ code: ModuleCode; label: string }> = [
    { code: 'TROUBLESHOOTER', label: '1. Everyday Situations' },
    { code: 'SPEC_SHEET', label: '2. How You Learn Best' },
    { code: 'VOICE_BLUEPRINT', label: '3. Tell Your Story' },
    { code: 'LOADOUT_DECK', label: '4. Work You’d Enjoy' },
    { code: 'PRESSURE_VALVE', label: '5. Help Needed Today' }
  ];
  const currentStepIdx = MODULE_ORDER.findIndex((m) => m.code === activeModule);

  const speakPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleMic = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setMicStatusMessage(
        'Voice mic is not enabled in this browser—loaded a sample story for you to customize!'
      );
      const nextStory = VOICE_PRESETS[3].text;
      onPatchSession({ voice_transcript: nextStory });
      onSynthesizeVoice(nextStory);
      return;
    }

    if (isRecordingMic) {
      setIsRecordingMic(false);
      setMicStatusMessage('Stopped listening.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'en-CA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsRecordingMic(true);
      setMicStatusMessage('Listening now... speak in your own everyday words.');

      recognition.onresult = (event: any) => {
        const spokenText = event.results?.[0]?.[0]?.transcript || '';
        if (spokenText) {
          const combined = session.voice_transcript
            ? `${session.voice_transcript} ${spokenText}`
            : spokenText;
          onPatchSession({ voice_transcript: combined });
          onSynthesizeVoice(combined);
          setMicStatusMessage('Got it! Updated your story and matched programs.');
        }
        setIsRecordingMic(false);
      };

      recognition.onerror = () => {
        setIsRecordingMic(false);
        setMicStatusMessage(
          'Could not access microphone—tap any example story above or type a few words below.'
        );
      };

      recognition.onend = () => {
        setIsRecordingMic(false);
      };

      recognition.start();
    } catch {
      setIsRecordingMic(false);
      setMicStatusMessage('Tap any example story above or type below.');
    }
  };

  const markModuleCompleted = (mod: ModuleCode) => {
    if (!session.completed_modules_json.includes(mod)) {
      return [...session.completed_modules_json, mod];
    }
    return session.completed_modules_json;
  };

  return (
    <div className="clinical-card border border-[#cde8e2] rounded-3xl overflow-hidden">
      {/* Simple, Welcoming Step Navigation */}
      <div className="linen-card border-b border-[#e2d6c1] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#1ca796]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3d5f68]">
            Step-by-Step Strengths Guide (No Typing or Spelling Needed)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { code: 'TROUBLESHOOTER', label: '1. Everyday Situations' },
              { code: 'SPEC_SHEET', label: '2. How You Learn Best' },
              { code: 'VOICE_BLUEPRINT', label: '3. Tell Your Story' },
              { code: 'LOADOUT_DECK', label: '4. Work You’d Enjoy' },
              { code: 'PRESSURE_VALVE', label: '5. Help Needed Today' }
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'ocean-btn text-white font-semibold'
                    : 'bg-white/90 text-[#35565f] hover:bg-[#e6f7f5] border border-[#dfd2bc]'
                }`}
              >
                {isDone && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-white' : 'text-[#1ca796]'
                    }`}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: EVERYDAY SITUATIONS (Simple, Real-World Ways) */}
      {activeModule === 'TROUBLESHOOTER' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Step 1 • Real-Life Everyday Moments
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                How Do You Naturally Handle Everyday Situations?
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Pick any everyday situation below and tap what you would do first. There are no wrong answers—everyone has their own practical way of helping out.
              </p>
            </div>
            <div className="bg-[#eaf7f4] border border-[#bce5dd] rounded-xl px-4 py-2.5 text-right">
              <div className="text-[11px] font-medium text-[#3b6e67] uppercase">Your Natural Style</div>
              <div className="text-sm font-bold text-[#155e54]">
                {SIMPLE_STYLE_LABELS[session.troubleshooter_selections.solving_style] || 'Hands-On Problem Solver'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {EVERYDAY_SCENARIOS.map((scen) => {
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
                        title="Listen Out Loud"
                        className="text-[#56747d] hover:text-[#2a9d8f] p-1 rounded-lg hover:bg-white/80 cursor-pointer transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-base text-[#163038]">{scen.title}</h4>
                    <p className="text-xs text-[#547078] mt-1 mb-3.5 leading-relaxed">
                      {scen.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2.5">
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
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                            activeNode
                              ? 'ocean-btn border-transparent text-white font-medium'
                              : 'bg-white/95 border-[#e2d6c1] text-[#26464f] hover:border-[#1ca796]/60 hover:bg-[#f2fbf9]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className={activeNode ? 'text-[#d8f7f2]' : 'text-[#2a9d8f]'}>
                              {node.stepTitle}
                            </span>
                            {activeNode && (
                              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="leading-relaxed">{node.label}</div>
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

      {/* STEP 2: HOW YOU LEARN BEST */}
      {activeModule === 'SPEC_SHEET' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Step 2 • Your Comfort Zone
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                How Do You Like to Learn &amp; Work?
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Everyone learns differently. Pick what feels easiest for you so we only match you with welcoming, comfortable programs.
              </p>
            </div>
            <div className="bg-[#e8f3f9] border border-[#c0dfef] rounded-xl px-4 py-2.5 text-right">
              <div className="text-[11px] font-medium text-[#2c678a] uppercase">Preferred Way to Learn</div>
              <div className="text-sm font-bold text-[#194c6b]">
                {session.preferred_learning_modality === 'Kinesthetic_HandsOn'
                  ? 'Hands-On / Watch & Do'
                  : session.preferred_learning_modality === 'Visual_Blueprint'
                  ? 'Pictures & Examples'
                  : session.preferred_learning_modality === 'Verbal_Coaching'
                  ? 'Talk It Through Together'
                  : 'Short Written Steps'}
              </div>
            </div>
          </div>

          {/* 1. How You Learn Best */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d5b63] mb-2.5">
              1. When learning something new, what works best for you?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  {
                    id: 'Kinesthetic_HandsOn',
                    label: 'Show Me Hands-On',
                    sub: 'Watch someone do it, then try it myself',
                    icon: Wrench
                  },
                  {
                    id: 'Visual_Blueprint',
                    label: 'Pictures & Examples',
                    sub: 'Look at photos or a simple example',
                    icon: Cpu
                  },
                  {
                    id: 'Verbal_Coaching',
                    label: 'Talk Me Through It',
                    sub: 'Have someone explain it out loud',
                    icon: Headphones
                  },
                  {
                    id: 'Text_Manual',
                    label: 'Simple Checklist',
                    sub: 'Follow a clear, short written list',
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

          {/* 2. Everyday Pace Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 linen-card border border-[#e3dccf] rounded-2xl p-4">
            <div className="bg-white/80 rounded-xl p-3.5 border border-[#eae3d5]">
              <div className="flex justify-between text-xs font-semibold text-[#35525a] mb-2">
                <span>Working on My Own</span>
                <span className="text-[#2a9d8f] font-bold">
                  {session.spec_sheet_state.crew_slider > 60
                    ? 'Small Friendly Group'
                    : session.spec_sheet_state.crew_slider < 40
                    ? 'Mostly on My Own'
                    : 'Mix of Both'}
                </span>
                <span>Small Friendly Group</span>
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
                <span>One Step at a Time</span>
                <span className="text-[#2c6e9b] font-bold">
                  {session.spec_sheet_state.structure_slider > 60
                    ? 'Show the Goal & Let Me Try'
                    : session.spec_sheet_state.structure_slider < 40
                    ? 'One Step at a Time'
                    : 'Balanced Guidance'}
                </span>
                <span>Show the Goal &amp; Let Me Try</span>
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

          {/* 3. Things You Want to Avoid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d5b63] mb-2.5">
              3. What drains your energy? (Tap any you want us to avoid):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'Heavy Reading / Spelling Forms',
                  label: 'Lots of Reading or Paperwork'
                },
                {
                  id: 'Sitting Still at a Desk',
                  label: 'Sitting Still at a Desk All Day'
                },
                {
                  id: 'Loud Crowded Rooms',
                  label: 'Loud, Crowded Rooms'
                },
                {
                  id: 'Early Morning Transit',
                  label: 'Super Early Morning Bus Rides'
                }
              ].map((item) => {
                const active = session.spec_sheet_state.bottlenecks.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      const exists = session.spec_sheet_state.bottlenecks.includes(item.id);
                      const next = exists
                        ? session.spec_sheet_state.bottlenecks.filter((b) => b !== item.id)
                        : [...session.spec_sheet_state.bottlenecks, item.id];
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
                    <span>{item.label}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-[#2c6e9b] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TELL YOUR STORY */}
      {activeModule === 'VOICE_BLUEPRINT' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Step 3 • Everyday Experiences Count
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                Tell Us About Something You Helped Make, Fix, or Organize
              </h3>
              <p className="text-sm text-[#547078] mt-1 italic">
                &ldquo;Tell me about something you cooked, fixed, built, or helped out with that went well. Just use your own everyday words.&rdquo;
              </p>
            </div>
            <button
              onClick={() =>
                speakPrompt(
                  "Tell me about something you cooked, fixed, built, or helped out with that went well. Just use your own everyday words."
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#e8f3f9] hover:bg-[#d8eaf5] border border-[#bddbf0] text-xs font-medium text-[#1c5678] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Listen to Prompt
            </button>
          </div>

          {/* Preset Everyday Stories */}
          <div>
            <div className="text-xs font-semibold text-[#48656e] uppercase mb-2">
              Tap a Real-Life Example Below (or share your own story):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VOICE_PRESETS.map((preset, idx) => {
                const isSelectedPreset = session.voice_transcript === preset.text;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onPatchSession({ voice_transcript: preset.text });
                      onSynthesizeVoice(preset.text);
                    }}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                      isSelectedPreset
                        ? 'bg-[#e6f6f3] border-[#2a9d8f] text-[#154d46] shadow-2xs'
                        : 'linen-card border-[#e2d9c8] hover:border-[#2a9d8f] hover:bg-white text-[#37535b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] text-[#1b7a6e] font-bold">
                        {preset.label}
                      </span>
                      {isSelectedPreset && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2a9d8f] text-white">
                          ✓ Loaded
                        </span>
                      )}
                    </div>
                    <div className="line-clamp-2 text-[#5a757d] leading-relaxed">{preset.text}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="linen-card border border-[#e2d9c8] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase text-[#1b7a6e] flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Your Everyday Story (No Spelling Worries)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    isRecordingMic
                      ? 'bg-[#e76f51] text-white border-[#e76f51] animate-pulse'
                      : 'bg-white hover:bg-[#e6f6f3] text-[#1b7a6e] border-[#bce5dd]'
                  }`}
                >
                  {isRecordingMic ? (
                    <>
                      <MicOff className="w-4 h-4" /> Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Speak Into Mic
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSynthesizing}
                  onClick={() => onSynthesizeVoice(session.voice_transcript)}
                  className="px-4 py-2 rounded-xl ocean-btn disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSynthesizing
                    ? 'Finding Your Strengths...'
                    : 'Turn My Story Into Job Strengths'}
                </button>
              </div>
            </div>
            {micStatusMessage && (
              <div className="text-xs font-medium text-[#1b7a6e] bg-[#e6f6f3] border border-[#bce5dd] rounded-xl px-3 py-1.5">
                {micStatusMessage}
              </div>
            )}
            <textarea
              rows={3}
              value={session.voice_transcript}
              onChange={(e) => onPatchSession({ voice_transcript: e.target.value })}
              className="w-full bg-white border border-[#dfd8ca] rounded-xl p-3.5 text-sm text-[#163038] focus:outline-none focus:border-[#2a9d8f]"
              placeholder="Share what you did in plain everyday words..."
            />
          </div>

          {/* Real-World Strengths Found */}
          <div className="bg-gradient-to-r from-[#e6f6f3] to-[#eaf4fa] border border-[#bce5dd] rounded-2xl p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1b7a6e]">
                  Your Real-World Strengths
                </span>
                <h4 className="text-base font-bold text-[#163038]">
                  {session.skill_blueprint_json.headline_strength}
                </h4>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/90 text-[#1e5678] border border-[#c2dff0]">
                Ready for Hands-On Programs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {session.skill_blueprint_json.extracted_pro_skills.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/95 border border-[#d6ebe6] rounded-xl p-3.5 space-y-1.5 shadow-2xs"
                >
                  <div className="text-xs text-[#547078]">
                    <span className="font-semibold text-[#38545c] uppercase text-[10px]">What You Did: </span>
                    {item.what_you_did}
                  </div>
                  <div className="text-sm font-bold text-[#1b7a6e]">
                    ✓Real-World Strength: {item.pro_translation}
                  </div>
                  <div className="text-[11px] text-[#2c6e9b] font-medium">
                    {item.noc_domain}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: WORK YOU'D ENJOY */}
      {activeModule === 'LOADOUT_DECK' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Step 4 • Pick What Sounds Good
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                What Kind of Everyday Work Would You Enjoy?
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                Tap how you feel about each type of activity below. Your choices update your recommended local programs right away.
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
                        Hands-On Option
                      </span>
                      <button
                        onClick={() => speakPrompt(`${card.title}. ${card.tagline}`)}
                        className="text-[#5a757d] hover:text-[#2a9d8f] cursor-pointer"
                        title="Listen Out Loud"
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
                          {LOADOUT_BUTTON_LABELS[statusOption]}
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

      {/* STEP 5: HELP NEEDED TODAY */}
      {activeModule === 'PRESSURE_VALVE' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eae4d8] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider">
                Step 5 • Practical Support Today
              </div>
              <h3 className="text-lg font-bold text-[#163038] mt-0.5">
                What Practical Help Would Take Stress Off Your Plate Today?
              </h3>
              <p className="text-sm text-[#547078] mt-1">
                It’s hard to focus on next steps if you need bus fare, food, boots, or help with forms. Tap 1 or 2 things below so we can cover them for you right away.
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
                      <HeartHandshake
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
                        {isActive ? 'Selected' : 'Tap to Add'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#163038]">{block.title}</div>
                    <div className="text-xs text-[#547078] mt-1">{block.subtitle}</div>
                  </div>
                  <div className="text-[11px] font-medium text-[#1b7a6e] mt-3 pt-2 border-t border-[#e3dccf]">
                    ✓ {block.helpSummary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Step Navigation Footer Bar */}
      <div className="linen-card border-t border-[#e2d6c1] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentStepIdx <= 0}
          onClick={() => {
            if (currentStepIdx > 0) {
              onPatchSession({
                active_module_on_canvas: MODULE_ORDER[currentStepIdx - 1].code
              });
            }
          }}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#e6f6f3] disabled:opacity-40 disabled:cursor-not-allowed border border-[#dcd4c4] text-xs font-semibold text-[#284952] flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {currentStepIdx > 0
            ? `Back: ${MODULE_ORDER[currentStepIdx - 1].label}`
            : 'Step 1 of 5'}
        </button>

        <span className="text-xs font-medium text-[#4a656d]">
          Step {currentStepIdx + 1} of {MODULE_ORDER.length} • Everything saves automatically
        </span>

        {currentStepIdx < MODULE_ORDER.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              onPatchSession({
                active_module_on_canvas: MODULE_ORDER[currentStepIdx + 1].code,
                completed_modules_json: markModuleCompleted(activeModule)
              });
            }}
            className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            Next: {MODULE_ORDER[currentStepIdx + 1].label}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onPatchSession({
                completed_modules_json: markModuleCompleted('PRESSURE_VALVE')
              });
              window.scrollTo({ top: 520, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            See My Matched Programs &amp; Food Banks ↓
          </button>
        )}
      </div>
    </div>
  );
};
