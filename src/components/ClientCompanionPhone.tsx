import React from 'react';
import {
  Smartphone,
  CheckCircle2,
  Bus,
  Phone,
  ShieldAlert,
  Sparkles,
  Volume2,
  Wifi
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
} from '../types/navigator.js';

interface ClientCompanionPhoneProps {
  session: ClientWorkbookSession;
  ddl: {
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  };
  onPatchSession: (patch: Partial<ClientWorkbookSession>) => void;
}

export const ClientCompanionPhone: React.FC<ClientCompanionPhoneProps> = ({
  session,
  ddl,
  onPatchSession
}) => {
  const pinnedProgram =
    ddl.primary_matches.find((p) => p.program_id === session.pinned_program_id) ||
    ddl.primary_matches[0];
  const reliefProgram = ddl.immediate_relief_matches[0];

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.98;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="w-full max-w-[390px] mx-auto bg-slate-950 border-4 border-slate-800 rounded-[36px] p-4 shadow-2xl relative overflow-hidden">
      {/* Phone Top Notch / Status Bar */}
      <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-900 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Wifi className="w-3.5 h-3.5" /> LIVE SYNC #{session.session_id}
        </span>
        <span className="font-bold text-slate-200">{session.client_alias}</span>
        <span>POCKET TAKEAWAY</span>
      </div>

      <div className="space-y-4 mt-3 max-h-[760px] overflow-y-auto pr-1">
        {/* 1. Custom Skill Blueprint Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> YOUR SKILL BLUEPRINT
            </span>
            <button
              onClick={() =>
                speakText(
                  `${session.skill_blueprint_json.headline_strength}. ${session.skill_blueprint_json.extracted_pro_skills
                    .map((s) => s.pro_translation)
                    .join('. ')}`
                )
              }
              className="text-slate-300 hover:text-amber-400 p-1 cursor-pointer"
              title="Read Blueprint Aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-bold text-white leading-snug">
            {session.skill_blueprint_json.headline_strength}
          </h4>

          <div className="space-y-1.5">
            {session.skill_blueprint_json.extracted_pro_skills.map((skill, idx) => (
              <div
                key={idx}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-xs"
              >
                <div className="font-bold text-emerald-300">✓ {skill.pro_translation}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{skill.what_you_did}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. "My Next 1 Step" Verified Card */}
        {pinnedProgram && (
          <div className="bg-emerald-950/30 border-2 border-emerald-500/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                MY NEXT 1 STEP (VERIFIED)
              </span>
              <button
                onClick={() =>
                  speakText(
                    `Your next step is ${pinnedProgram.program_name} in ${pinnedProgram.municipality}. Transit stop: ${pinnedProgram.nearest_transit_stop}. Contact: ${pinnedProgram.contact_lead_name}.`
                  )
                }
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm font-bold text-white">{pinnedProgram.program_name}</div>
            <div className="text-xs text-slate-300">{pinnedProgram.organization_name}</div>

            <div className="bg-slate-950/90 rounded-xl p-2.5 space-y-1.5 text-xs border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Bus className="w-3.5 h-3.5 shrink-0" />
                <span>{pinnedProgram.nearest_transit_stop}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{pinnedProgram.contact_lead_name} ({pinnedProgram.contact_phone_or_email})</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-200 bg-slate-900/90 rounded-lg p-2 border border-slate-800">
              <strong className="text-emerald-400">Warm Handoff Plan:</strong>{' '}
              {session.next_micro_step_text}
            </div>
          </div>
        )}

        {/* 3. Immediate Relief Win Today */}
        {reliefProgram && (
          <div className="bg-amber-950/25 border border-amber-500/40 rounded-2xl p-3 space-y-1">
            <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">
              ★ TODAY&apos;S PRESSURE RELIEF WIN
            </div>
            <div className="text-xs font-bold text-white">{reliefProgram.program_name}</div>
            <div className="text-[11px] text-slate-300">{reliefProgram.nearest_transit_stop}</div>
          </div>
        )}

        {/* 4. Interactive Card Swiping ("The Loadout" on Phone) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400">
            SWIPE / TAP YOUR LOADOUT (UPDATES TABLET LIVE)
          </div>
          <div className="space-y-2">
            {session.loadout_cards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{card.title}</span>
                  <span className="text-[10px] font-mono text-amber-400">{card.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['Lock It In', 'Test Run', 'Scrap It'] as const).map((st) => {
                    const active = card.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          const updatedCards = session.loadout_cards.map((c) =>
                            c.id === card.id ? { ...c, status: st } : c
                          );
                          onPatchSession({ loadout_cards: updatedCards });
                        }}
                        className={`py-1 rounded text-[10px] font-mono cursor-pointer ${
                          active
                            ? st === 'Lock It In'
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : st === 'Test Run'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-rose-500 text-white font-bold'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
