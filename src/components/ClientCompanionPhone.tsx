import React from 'react';
import {
  Bus,
  Phone,
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

const SIMPLE_CHOICE_LABELS: Record<'Lock It In' | 'Test Run' | 'Scrap It', string> = {
  'Lock It In': 'Love This',
  'Test Run': 'Maybe Try',
  'Scrap It': 'Not For Me'
};

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
    <div className="w-full max-w-[395px] mx-auto bg-white border-[6px] border-[#dfd8ca] rounded-[40px] p-4 shadow-xl relative overflow-hidden">
      {/* Phone Top Notch / Status Bar */}
      <div className="flex items-center justify-between px-2.5 pb-3 border-b border-[#eae4d8] text-[11px] font-medium text-[#547078]">
        <span className="flex items-center gap-1.5 text-[#1b7a6e] font-semibold">
          <Wifi className="w-3.5 h-3.5" /> Live Sync
        </span>
        <span className="font-bold text-[#163038]">{session.client_alias}’s Pocket Guide</span>
        <span className="text-[#2c6e9b] font-medium">Take-Home Card</span>
      </div>

      <div className="space-y-4 mt-3.5 max-h-[760px] overflow-y-auto pr-1">
        {/* 1. Custom Skill Blueprint Banner */}
        <div className="bg-gradient-to-br from-[#e6f6f3] via-[#f2faf8] to-[#e8f3f9] border border-[#bce5dd] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b7a6e] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> What You’re Great At
            </span>
            <button
              onClick={() =>
                speakText(
                  `${session.skill_blueprint_json.headline_strength}. ${session.skill_blueprint_json.extracted_pro_skills
                    .map((s) => s.pro_translation)
                    .join('. ')}`
                )
              }
              className="text-[#2c6e9b] hover:text-[#1b7a6e] p-1 rounded-lg bg-white/80 cursor-pointer"
              title="Listen Out Loud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-bold text-[#163038] leading-snug">
            {session.skill_blueprint_json.headline_strength}
          </h4>

          <div className="space-y-2">
            {session.skill_blueprint_json.extracted_pro_skills.map((skill, idx) => (
              <div
                key={idx}
                className="bg-white/95 border border-[#d6ebe6] rounded-xl p-3 text-xs shadow-2xs"
              >
                <div className="font-bold text-[#1b7a6e]">✓ {skill.pro_translation}</div>
                <div className="text-[11px] text-[#547078] mt-0.5">{skill.what_you_did}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. "My Next 1 Step" Card */}
        {pinnedProgram && (
          <div className="bg-[#f3fbf9] border-2 border-[#2a9d8f] rounded-2xl p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#2a9d8f] text-white">
                My Next 1 Step
              </span>
              <button
                onClick={() =>
                  speakText(
                    `Your next step is ${pinnedProgram.program_name} in ${pinnedProgram.municipality}. Bus or SkyTrain stop: ${pinnedProgram.nearest_transit_stop}. Contact: ${pinnedProgram.contact_lead_name}.`
                  )
                }
                className="text-[#1b7a6e] hover:text-[#163038] cursor-pointer"
                title="Listen Out Loud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm font-bold text-[#163038]">{pinnedProgram.program_name}</div>
            <div className="text-xs text-[#4f6a72]">{pinnedProgram.organization_name}</div>

            <div className="bg-white rounded-xl p-3 space-y-1.5 text-xs border border-[#d8ece7]">
              <div className="flex items-center gap-1.5 text-[#23638a] font-medium">
                <Bus className="w-3.5 h-3.5 shrink-0" />
                <span>{pinnedProgram.nearest_transit_stop}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#1b7a6e] font-medium">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{pinnedProgram.contact_lead_name} ({pinnedProgram.contact_phone_or_email})</span>
              </div>
            </div>

            <div className="text-[11px] text-[#28454e] linen-card rounded-xl p-2.5 border border-[#e3dccf]">
              <strong className="text-[#1b7a6e]">Easy First Step:</strong>{' '}
              {session.next_micro_step_text}
            </div>
          </div>
        )}

        {/* 3. Immediate Help Today */}
        {reliefProgram && (
          <div className="bg-[#eaf4fa] border border-[#bddbf0] rounded-2xl p-3.5 space-y-1">
            <div className="text-[10px] font-bold uppercase text-[#1e5678]">
              ★ Help Available Today (Meals &amp; Bus Tickets)
            </div>
            <div className="text-xs font-bold text-[#163038]">{reliefProgram.program_name}</div>
            <div className="text-[11px] text-[#48656e]">{reliefProgram.nearest_transit_stop}</div>
          </div>
        )}

        {/* 4. Quick Work Preferences on Phone */}
        <div className="linen-card border border-[#e3dccf] rounded-2xl p-3.5 space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#4a656d]">
            Tap What Sounds Good to You
          </div>
          <div className="space-y-2">
            {session.loadout_cards.map((card) => (
              <div
                key={card.id}
                className="bg-white border border-[#e5dfd2] rounded-xl p-3 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#163038]">{card.title}</span>
                  <span className="text-[10px] font-semibold text-[#1b7a6e]">
                    {SIMPLE_CHOICE_LABELS[card.status as 'Lock It In' | 'Test Run' | 'Scrap It'] || card.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
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
                        className={`py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-all ${
                          active
                            ? st === 'Lock It In'
                              ? 'bg-[#2a9d8f] text-white font-semibold'
                              : st === 'Test Run'
                              ? 'bg-[#3b82a6] text-white font-semibold'
                              : 'bg-[#d9776c] text-white font-semibold'
                            : 'bg-[#f6f3ec] text-[#4c6770] hover:bg-[#e6f6f3]'
                        }`}
                      >
                        {SIMPLE_CHOICE_LABELS[st]}
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
