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
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    if (iq >= 3 && textTol >= 3) {
      return {
        code: 'QUADRANT B',
        name: 'Systems & Technical Lead',
        route: 'IT/Server administration, CAD, project coordination, formal diploma pathways',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
      };
    }
    if (iq < 3 && textTol <= 2) {
      return {
        code: 'QUADRANT C',
        name: 'Guided Hands-On Foundations',
        route: 'Supported peer cohorts, community gardens, prep kitchens, stabilization workshops',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      };
    }
    return {
      code: 'QUADRANT D',
      name: 'Structured Admin & Inventory Specialist',
      route: 'Inventory control, shipping/receiving checklists, library/civic clerical support',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    };
  };

  const quadrant = getQuadrantInfo();

  return (
    <div className="space-y-5">
      {/* Dual-Axis Evaluation Matrix & Coordinator Triage Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 5 Cols: Dual-Axis 2x2 Quadrant Grid */}
        <div className="xl:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
                PART 3 // DUAL-AXIS COMPETENCY MATRIX
              </span>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded border ${quadrant.badgeColor}`}>
                {quadrant.code}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Decoupling Literacy from Problem-Solving Intelligence
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Low text/spelling tolerance never downgrades a client&apos;s systems or mechanical IQ.
            </p>

            {/* 2x2 Visual Grid */}
            <div className="mt-4 relative bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-center text-[10px] font-mono uppercase text-emerald-400 mb-2">
                ▲ HIGH PROBLEM-SOLVING / SYSTEMS IQ (SCORE 4–5)
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Quadrant A */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    quadrant.code === 'QUADRANT A'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-amber-300">
                    [QUADRANT A] Hands-On Specialist
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    High spatial, culinary, audio, or mechanical IQ + Low form/spelling tolerance.
                  </p>
                </div>

                {/* Quadrant B */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    quadrant.code === 'QUADRANT B'
                      ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-sky-300">
                    [QUADRANT B] Systems & Tech Lead
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    High systems IQ + Comfortable with written specs, manuals & documentation.
                  </p>
                </div>

                {/* Quadrant C */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    quadrant.code === 'QUADRANT C'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    [QUADRANT C] Guided Foundations
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Steady hands-on tasks with visual coaching, peer cohorts & zero paperwork.
                  </p>
                </div>

                {/* Quadrant D */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    quadrant.code === 'QUADRANT D'
                      ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-purple-300">
                    [QUADRANT D] Structured Admin
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">
                    Comfortable with reading/checklists; prefers predictable routine shifts.
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-900">
                <span>◄ LOW TEXT / FORM TOLERANCE (1)</span>
                <span>HIGH TEXT TOLERANCE (5) ►</span>
              </div>
            </div>
          </div>

          {/* Direct Axis Override Controls for Coordinator */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Problem-Solving IQ:</span>
                <span className="text-emerald-400 font-bold">{iq}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={iq}
                onChange={(e) =>
                  onPatchSession({ problem_solving_complexity: Number(e.target.value) })
                }
                className="w-full accent-emerald-500 mt-1 cursor-pointer"
              />
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Text/Form Tolerance:</span>
                <span className="text-amber-400 font-bold">{textTol}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={textTol}
                onChange={(e) =>
                  onPatchSession({ text_admin_tolerance: Number(e.target.value) })
                }
                className="w-full accent-amber-500 mt-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Part 9 Coordinator Co-Pilot Triage Summary & Verified DDL Matches */}
        <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> PART 9 // COORDINATOR CO-PILOT TRIAGE SUMMARY — SESSION #{session.session_id} (ALIAS: &ldquo;{session.client_alias}&rdquo;)
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Deterministic PostgreSQL DDL Green-Light Verification
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Municipality:</span>
              <select
                value={session.municipality}
                onChange={(e) => onPatchSession({ municipality: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300 cursor-pointer"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-mono uppercase text-amber-400 mb-1">
                Coordinator Private Synthesis Notes
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {session.skill_blueprint_json.coordinator_private_notes}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono">
              <div className="text-[10px] uppercase text-emerald-400 mb-1 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" /> Live Parameterized DDL Query (verify_programs_ddl)
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {ddl.sql_executed}
              </pre>
            </div>
          </div>

          {/* Immediate Relief Win (Maslow Tier 1) */}
          {ddl.immediate_relief_matches.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase text-amber-300 font-bold">
                  ★ IMMEDIATE RELIEF WIN (MASLOW TIER 1 STABILIZATION — TODAY)
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Verified {ddl.immediate_relief_matches[0].days_since_verified}d ago
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white">
                    {ddl.immediate_relief_matches[0].program_name} ({ddl.immediate_relief_matches[0].municipality})
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {ddl.immediate_relief_matches[0].highlight_note}
                  </div>
                </div>
                <div className="text-xs font-mono text-amber-200 bg-slate-950/80 px-2.5 py-1.5 rounded border border-amber-500/30">
                  {ddl.immediate_relief_matches[0].contact_lead_name} • {ddl.immediate_relief_matches[0].contact_phone_or_email}
                </div>
              </div>
            </div>
          )}

          {/* Verified Green-Light Skill / Bridge Matches */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono uppercase text-slate-400">
              VERIFIED GREEN-LIGHT MATCHES (CHECKED &lt; 14 DAYS AGO — PIN 1 NEXT STEP TO CLIENT PHONE):
            </div>

            {ddl.primary_matches.slice(0, 3).map((prog, index) => {
              const isPinned = session.pinned_program_id === prog.program_id;
              return (
                <div
                  key={prog.program_id}
                  className={`rounded-xl border p-3.5 transition-all ${
                    isPinned
                      ? 'bg-emerald-950/30 border-emerald-400 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          #{index + 1} GREEN MATCH • {prog.operational_status.toUpperCase()} (Verified {prog.days_since_verified}d ago)
                        </span>
                        <span className="text-xs font-mono text-amber-300">
                          Intake: {prog.intake_type.replace('_', ' ')} | Waitlist: ~{prog.waitlist_weeks_estimate} wk
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">
                        {prog.program_name} — <span className="text-slate-300 font-normal">{prog.organization_name}</span>
                      </h4>
                    </div>

                    <button
                      onClick={() =>
                        onPatchSession({
                          pinned_program_id: prog.program_id,
                          next_micro_step_text: `Coordinator calls ${prog.contact_lead_name} (${prog.contact_phone_or_email}) for ${prog.intake_type.replace('_', ' ')} + acts as scribe for 1-page intake.`
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isPinned
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      {isPinned ? 'Pinned to Client Phone' : 'Pin as Next 1 Step'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {prog.highlight_note}
                  </p>

                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Bus className="w-3.5 h-3.5 text-amber-400" /> {prog.nearest_transit_stop}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300">
                      <Phone className="w-3.5 h-3.5" /> {prog.contact_lead_name}: {prog.contact_phone_or_email}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {prog.supports_high_skill_low_text && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                        ✓ High-Skill / Low-Text
                      </span>
                    )}
                    {prog.offers_oral_or_practical_testing && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-700">
                        ✓ Oral / Practical Testing
                      </span>
                    )}
                    {prog.scribe_or_reader_available && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-700">
                        ✓ Scribe Available
                      </span>
                    )}
                    {!prog.requires_government_id && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-slate-700">
                        ✓ No Gov ID Required to Start
                      </span>
                    )}
                    {prog.provides_transit_tickets && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-700">
                        ✓ Compass Tickets Included
                      </span>
                    )}
                    {prog.provides_gear_or_boots && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                        ✓ CSA Boots / Gear Included
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> PART 5 // NON-INVASIVE CONVERSATIONAL QUESTION MATRIX (CASUAL COFFEE CHAT MODE)
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              Ask Casual Questions to Uncover Readiness & Literacy Accommodations Without Defensiveness
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {CONVERSATIONAL_MATRIX.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {item.tier}
                </span>
                <p className="text-xs text-slate-200 italic mt-2 leading-relaxed">
                  {item.question}
                </p>
                <div className="text-[11px] text-slate-400 mt-2">
                  <strong className="text-slate-300">Signal:</strong> {item.signal}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-emerald-400 mb-2">
                  SQL: {item.filterLabel}
                </div>
                <button
                  onClick={() => onPatchSession(item.applyPatch(session))}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-mono text-xs transition-all cursor-pointer font-medium"
                >
                  Apply Signal to Session
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
