import React from 'react';
import {
  CheckCircle2,
  MapPin,
  Phone,
  Bus,
  ShieldCheck,
  Terminal,
  Pin,
  Award,
  MessageSquare,
  Compass,
  Wrench,
  BookOpen
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
} from '../types/navigator.js';

interface CoordinatorTriagePanelProps {
  session: ClientWorkbookSession;
  ddl: {
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  };
  onPatchSession: (patch: Partial<ClientWorkbookSession>) => void;
}

const CONVERSATIONAL_MATRIX = [
  {
    tier: 'Tier 1: Stabilization',
    question:
      '"When you want to learn how to make or fix something—like a meal or a game tip—do you prefer watching someone do it in person, watching a short video, or reading steps?"',
    signal: 'Literacy & Learning Modality (Zero defensiveness)',
    filterLabel: "min_reading_clb_level = 0, primary_instruction_mode = 'Kinesthetic_HandsOn'",
    applyPatch: (s: ClientWorkbookSession): Partial<ClientWorkbookSession> => ({
      preferred_learning_modality: 'Kinesthetic_HandsOn',
      text_admin_tolerance: 1
    })
  },
  {
    tier: 'Tier 1: Stabilization',
    question:
      '"How do you feel about paperwork and forms? Do you usually knock them out, or would you rather have someone sit down with a coffee and help sort the annoying stuff?"',
    signal: 'Administrative / ID & Scribe Barrier Check',
    filterLabel: 'requires_government_id = FALSE, scribe_or_reader_available = TRUE',
    applyPatch: (s: ClientWorkbookSession): Partial<ClientWorkbookSession> => ({
      coordinator_scribe_required: true,
      active_barriers: Array.from(
        new Set([...s.active_barriers, 'Paperwork / Scribe Help', 'Replacement ID / SIN'])
      )
    })
  },
  {
    tier: 'Tier 2: Bridge & Stipend',
    question:
      '"If you could jump into a hands-on workshop that pays a training stipend or gives you free gear, what sounds least boring: commercial cooking, building/fixing hardware, audio/media, or outdoor work?"',
    signal: 'Goal & Stipend Motivation',
    filterLabel: 'required_readiness_tier = 2, provides_living_stipend = TRUE',
    applyPatch: (): Partial<ClientWorkbookSession> => ({
      current_readiness_tier: 2
    })
  },
  {
    tier: 'Tier 3: High-Skill Launch',
    question:
      '"Think about a time things went sideways on a project, a meal, or a build, and you figured out a workaround—how did you troubleshoot it?"',
    signal: 'Systems & Triage IQ (Confirms Quadrant A)',
    filterLabel: 'supports_high_skill_low_text = TRUE, problem_solving_complexity = 5',
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
  const iq = session.problem_solving_complexity;
  const textTol = session.text_admin_tolerance;

  const getQuadrantInfo = () => {
    if (iq >= 3 && textTol <= 2) {
      return {
        code: 'QUADRANT A',
        name: 'Hands-On Specialist & Systems Troubleshooter',
        route: 'Red Seal trades (with oral exam accommodation), stagehand unions, fabrication, commercial culinary',
        badgeColor: 'bg-[#e6f6f3] text-[#1b7a6e] border-[#bce5dd]'
      };
    }
    if (iq >= 3 && textTol >= 3) {
      return {
        code: 'QUADRANT B',
        name: 'Systems & Technical Lead',
        route: 'IT/Server administration, CAD, project coordination, formal diploma pathways',
        badgeColor: 'bg-[#e8f3f9] text-[#23638a] border-[#c2dff0]'
      };
    }
    if (iq < 3 && textTol <= 2) {
      return {
        code: 'QUADRANT C',
        name: 'Guided Hands-On Foundations',
        route: 'Supported peer cohorts, community gardens, prep kitchens, stabilization workshops',
        badgeColor: 'bg-[#eaf7f4] text-[#21766b] border-[#bce5dd]'
      };
    }
    return {
      code: 'QUADRANT D',
      name: 'Structured Admin & Inventory Specialist',
      route: 'Inventory control, shipping/receiving checklists, library/civic clerical support',
      badgeColor: 'bg-[#edf5fa] text-[#2d6387] border-[#c8e0f0]'
    };
  };

  const quadrant = getQuadrantInfo();

  return (
    <div className="space-y-5">
      {/* Dual-Axis Evaluation Matrix & Coordinator Triage Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 5 Cols: Dual-Axis 2x2 Quadrant Grid */}
        <div className="xl:col-span-5 clinical-card border border-[#dfe6dd] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2a9d8f]">
                Dual-Axis Competency Profile
              </span>
              <span className={`text-xs font-semibold px-3 py-0.5 rounded-full border ${quadrant.badgeColor}`}>
                {quadrant.code}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#163038]">
              Decoupling Literacy from Problem-Solving Intelligence
            </h3>
            <p className="text-xs text-[#547078] mt-1">
              Paperwork or spelling friction never downgrades a client&apos;s spatial, culinary, or systems intelligence.
            </p>

            {/* 2x2 Visual Grid */}
            <div className="mt-4 relative linen-card border border-[#e3dccf] rounded-2xl p-4">
              <div className="text-center text-[10px] font-bold uppercase tracking-wider text-[#1b7a6e] mb-2.5">
                ▲ High Problem-Solving / Systems IQ (Score 4–5)
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Quadrant A */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    quadrant.code === 'QUADRANT A'
                      ? 'bg-[#e6f6f3] border-[#2a9d8f] text-[#154d46] shadow-xs'
                      : 'bg-white/80 border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#1b7a6e]">
                    [Quadrant A] Hands-On Specialist
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    High spatial, culinary, audio, or mechanical IQ + Low form/spelling tolerance.
                  </p>
                </div>

                {/* Quadrant B */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    quadrant.code === 'QUADRANT B'
                      ? 'bg-[#e8f3f9] border-[#3b82a6] text-[#164966] shadow-xs'
                      : 'bg-white/80 border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#23638a]">
                    [Quadrant B] Systems &amp; Tech Lead
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    High systems IQ + Comfortable with written specs, manuals &amp; documentation.
                  </p>
                </div>

                {/* Quadrant C */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    quadrant.code === 'QUADRANT C'
                      ? 'bg-[#eaf7f4] border-[#2a9d8f] text-[#154d46] shadow-xs'
                      : 'bg-white/80 border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#21766b]">
                    [Quadrant C] Guided Foundations
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Steady hands-on tasks with visual coaching, peer cohorts &amp; zero paperwork.
                  </p>
                </div>

                {/* Quadrant D */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    quadrant.code === 'QUADRANT D'
                      ? 'bg-[#edf5fa] border-[#3b82a6] text-[#164966] shadow-xs'
                      : 'bg-white/80 border-[#e4ddd0] text-[#59737b]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#2d6387]">
                    [Quadrant D] Structured Admin
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Comfortable with reading/checklists; prefers predictable routine shifts.
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-semibold text-[#547078] mt-3 pt-2 border-t border-[#e5dfd2]">
                <span>◄ Low Text / Form Tolerance (1)</span>
                <span>High Text Tolerance (5) ►</span>
              </div>
            </div>
          </div>

          {/* Direct Axis Override Controls for Coordinator */}
          <div className="mt-4 pt-3.5 border-t border-[#eae4d8] grid grid-cols-2 gap-3">
            <div className="linen-card p-3 rounded-xl border border-[#e3dccf]">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#4a656d]">Problem-Solving IQ:</span>
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
                <span className="text-[#4a656d]">Text/Form Comfort:</span>
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

        {/* Right 7 Cols: Part 9 Coordinator Co-Pilot Triage Summary & Verified DDL Matches */}
        <div className="xl:col-span-7 clinical-card border border-[#dfe6dd] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eae4d8] pb-3.5">
            <div>
              <div className="text-xs font-semibold text-[#1b7a6e] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2a9d8f]" /> Practitioner Care Summary — Session #{session.session_id} (Client: &ldquo;{session.client_alias}&rdquo;)
              </div>
              <h3 className="text-base font-bold text-[#163038] mt-0.5">
                Verified Provincial Program Matches &amp; Warm Handoff Plan
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#4a656d]">Community:</span>
              <select
                value={session.municipality}
                onChange={(e) => onPatchSession({ municipality: e.target.value })}
                className="bg-[#f7f4ed] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#163038] cursor-pointer focus:outline-none focus:border-[#2a9d8f]"
              >
                <option value="Surrey">Surrey</option>
                <option value="Vancouver">Vancouver</option>
                <option value="New Westminster">New Westminster</option>
                <option value="Coquitlam">Coquitlam</option>
                <option value="Delta">Delta</option>
                <option value="All">All Lower Mainland</option>
              </select>
            </div>
          </div>

          {/* Coordinator Private Notes & SQL Executed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="linen-card border border-[#e3dccf] rounded-xl p-3.5">
              <div className="text-[11px] font-semibold uppercase text-[#2c6e9b] mb-1">
                Practitioner Synthesis Notes
              </div>
              <p className="text-xs text-[#37535b] leading-relaxed">
                {session.skill_blueprint_json.coordinator_private_notes}
              </p>
            </div>
            <div className="bg-[#f1f7f9] border border-[#cfe2ec] rounded-xl p-3.5 font-mono">
              <div className="text-[10px] font-sans font-semibold uppercase text-[#1e5678] mb-1 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-[#2a9d8f]" /> Live Parameterized Registry Check (verify_programs_ddl)
              </div>
              <pre className="text-[11px] text-[#23495c] overflow-x-auto whitespace-pre-wrap">
                {ddl.sql_executed}
              </pre>
            </div>
          </div>

          {/* Immediate Relief Win (Maslow Tier 1) */}
          {ddl.immediate_relief_matches.length > 0 && (
            <div className="bg-[#eaf4fa] border border-[#b9d9ec] rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase text-[#1e5678]">
                  ★ Immediate Stabilization Support (Available Today)
                </span>
                <span className="text-[11px] font-medium text-[#1b7a6e] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#bce5dd]">
                  Verified {ddl.immediate_relief_matches[0].days_since_verified}d ago
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#163038]">
                    {ddl.immediate_relief_matches[0].program_name} ({ddl.immediate_relief_matches[0].municipality})
                  </div>
                  <div className="text-xs text-[#436069] mt-0.5">
                    {ddl.immediate_relief_matches[0].highlight_note}
                  </div>
                </div>
                <div className="text-xs font-medium text-[#1b5270] bg-white px-3 py-1.5 rounded-xl border border-[#c5e0f0]">
                  {ddl.immediate_relief_matches[0].contact_lead_name} • {ddl.immediate_relief_matches[0].contact_phone_or_email}
                </div>
              </div>
            </div>
          )}

          {/* Verified Green-Light Skill / Bridge Matches */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#4a656d]">
              Verified Program Matches (Checked &lt; 14 Days Ago — Pin 1 Step to Client Companion):
            </div>

            {ddl.primary_matches.slice(0, 3).map((prog, index) => {
              const isPinned = session.pinned_program_id === prog.program_id;
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
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e5f6f3] text-[#1b7a6e] border border-[#bce5dd]">
                          #{index + 1} Verified Match • {prog.operational_status} ({prog.days_since_verified}d ago)
                        </span>
                        <span className="text-xs font-medium text-[#2c6e9b]">
                          Intake: {prog.intake_type.replace('_', ' ')} • Waitlist: ~{prog.waitlist_weeks_estimate} wk
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#163038] mt-1.5">
                        {prog.program_name} — <span className="text-[#547078] font-medium">{prog.organization_name}</span>
                      </h4>
                    </div>

                    <button
                      onClick={() =>
                        onPatchSession({
                          pinned_program_id: prog.program_id,
                          next_micro_step_text: `Coordinator calls ${prog.contact_lead_name} (${prog.contact_phone_or_email}) for ${prog.intake_type.replace('_', ' ')} + assists with 1-page intake.`
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isPinned
                          ? 'bg-[#2a9d8f] text-white shadow-2xs'
                          : 'bg-white hover:bg-[#e6f6f3] text-[#284952] border border-[#dcd4c4]'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      {isPinned ? 'Pinned to Client Handset' : 'Pin as Next 1 Step'}
                    </button>
                  </div>

                  <p className="text-xs text-[#3f5b63] mt-2 leading-relaxed">
                    {prog.highlight_note}
                  </p>

                  <div className="mt-2.5 pt-2.5 border-t border-[#e5dfd2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4a656d]">
                    <span className="flex items-center gap-1.5 font-medium text-[#2c525c]">
                      <Bus className="w-3.5 h-3.5 text-[#2c6e9b]" /> {prog.nearest_transit_stop}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-[#1b7a6e]">
                      <Phone className="w-3.5 h-3.5" /> {prog.contact_lead_name}: {prog.contact_phone_or_email}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {prog.supports_high_skill_low_text && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ Hands-On / Low-Text
                      </span>
                    )}
                    {prog.offers_oral_or_practical_testing && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#23638a] border border-[#c7e0f0]">
                        ✓ Oral / Practical Assessment
                      </span>
                    )}
                    {prog.scribe_or_reader_available && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#2c6e9b] border border-[#c7e0f0]">
                        ✓ Intake Scribe Support
                      </span>
                    )}
                    {!prog.requires_government_id && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ No ID Required to Start
                      </span>
                    )}
                    {prog.provides_transit_tickets && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#1b7a6e] border border-[#cce8e2]">
                        ✓ Compass Fare Included
                      </span>
                    )}
                    {prog.provides_gear_or_boots && (
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white text-[#23638a] border border-[#c7e0f0]">
                        ✓ Work Gear / Boots Provided
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Part 5: Non-Invasive Conversational Question Matrix */}
      <div className="clinical-card border border-[#dfe6dd] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="text-xs font-semibold text-[#2a9d8f] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Conversational Intake Guide (Warm Consultation Prompts)
            </div>
            <h3 className="text-sm font-bold text-[#163038] mt-0.5">
              Natural, Low-Stress Prompts to Identify Strengths &amp; Support Needs
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CONVERSATIONAL_MATRIX.map((item, idx) => (
            <div
              key={idx}
              className="linen-card border border-[#e3dccf] rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#e8f3f9] text-[#23638a] border border-[#c5e0f0]">
                  {item.tier}
                </span>
                <p className="text-xs text-[#1f3b44] italic mt-2.5 leading-relaxed">
                  {item.question}
                </p>
                <div className="text-[11px] text-[#547078] mt-2">
                  <strong className="text-[#2c4a52]">Clinical Signal:</strong> {item.signal}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#1b7a6e] mb-2">
                  Filter: {item.filterLabel}
                </div>
                <button
                  onClick={() => onPatchSession(item.applyPatch(session))}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#2a9d8f] hover:text-white border border-[#d6cfc0] hover:border-[#2a9d8f] text-[#24424b] text-xs transition-all cursor-pointer font-semibold shadow-2xs"
                >
                  Apply to Client Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
