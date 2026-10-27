import React, { useState } from 'react';
import {
  Bus,
  Phone,
  Sparkles,
  Volume2,
  Wifi,
  HandHeart,
  MessageSquare,
  Printer,
  ShieldCheck
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
} from '../types/navigator.js';
import {
  GROUPED_24_7_HELPLINES,
  getProgramSectionMeta,
  parseContactBadges
} from '../types/programGrouping.js';
import { RealWorldConnectionBridgeModal } from './RealWorldConnectionBridgeModal.js';

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
  const [bridgeModalOpen, setBridgeModalOpen] = useState<boolean>(false);
  const [bridgeInitialMode, setBridgeInitialMode] = useState<
    'desk_card' | 'call_script' | 'transit_checklist' | 'buddy_share'
  >('desk_card');

  const allAvailable = [...ddl.primary_matches, ...ddl.immediate_relief_matches];
  const pinnedProgram =
    allAvailable.find((p) => p.program_id === session.pinned_program_id) ||
    ddl.primary_matches[0];
  const reliefProgram =
    ddl.immediate_relief_matches.find(
      (p) => p.program_id === session.pinned_relief_program_id
    ) || ddl.immediate_relief_matches[0];

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.98;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="w-full max-w-[395px] mx-auto bg-gradient-to-b from-white via-[#fcfaf5] to-[#f5ede0] border-[7px] border-[#e2d5be] rounded-[44px] p-4 shadow-xl relative overflow-hidden">
      {/* Phone Coastal Wave Banner */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-1 rounded-2xl bg-gradient-to-r from-[#dff7f4] via-[#eaf8f6] to-[#e4f2fb] border border-[#bce5dd] text-[11px] font-medium text-[#355862]">
        <span className="flex items-center gap-1.5 text-[#146e62] font-semibold">
          <Wifi className="w-3.5 h-3.5" /> Live Sync
        </span>
        <span className="font-bold text-[#12323b]">{session.client_alias}’s Beach Card</span>
        <span className="text-[#1f6a8f] font-medium">Take-Home</span>
      </div>

      <div className="space-y-4 mt-3.5 max-h-[760px] overflow-y-auto pr-1">
        {/* 0. Real-World Connection Bridge Bar (Walk-In Desk Card, Call/SMS Script, Bus Route, Pocket Share) */}
        <div className="bg-gradient-to-r from-[#fff8e8] via-[#f5fbf9] to-[#e6f6f3] border-2 border-[#9ddbd1] rounded-2xl p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#116358] flex items-center gap-1">
              <HandHeart className="w-3.5 h-3.5 text-[#1ca796]" /> Connect Without Stress
            </span>
            <span className="text-[10px] font-semibold text-[#4b6a73]">Tap Any Tool</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setBridgeInitialMode('desk_card');
                setBridgeModalOpen(true);
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-left flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#1ca796] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#12323b]">Show at Desk</div>
                <div className="text-[9px] text-[#4b6a73]">Silent Walk-In Card</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setBridgeInitialMode('call_script');
                setBridgeModalOpen(true);
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-left flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#23638a] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#12323b]">What to Say</div>
                <div className="text-[9px] text-[#4b6a73]">Call &amp; Text Script</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setBridgeInitialMode('transit_checklist');
                setBridgeModalOpen(true);
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-left flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Bus className="w-3.5 h-3.5 text-[#1b7a6e] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#12323b]">Bus &amp; Rules</div>
                <div className="text-[9px] text-[#4b6a73]">Route &amp; No-ID Check</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setBridgeInitialMode('buddy_share');
                setBridgeModalOpen(true);
              }}
              className="p-2 rounded-xl bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-left flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-[#8a520d] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#12323b]">Pocket Pass</div>
                <div className="text-[9px] text-[#4b6a73]">Share / Print Offline</div>
              </div>
            </button>
          </div>
        </div>

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
        {pinnedProgram && (() => {
          const pinnedMeta = getProgramSectionMeta(pinnedProgram);
          const pinnedBadges = parseContactBadges(pinnedProgram.contact_phone_or_email);
          return (
            <div className="bg-[#f3fbf9] border-2 border-[#2a9d8f] rounded-2xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#2a9d8f] text-white">
                    My Next 1 Step
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${pinnedMeta.badgeClasses}`}
                  >
                    {pinnedMeta.shortBadge}
                  </span>
                </div>
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
              <div className="text-xs text-[#4f6a72]">
                {pinnedProgram.organization_name} • {pinnedProgram.municipality}
              </div>

              <div className="bg-white rounded-xl p-3 space-y-2 text-xs border border-[#d8ece7]">
                <div className="flex items-center gap-1.5 text-[#23638a] font-medium">
                  <Bus className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinnedProgram.nearest_transit_stop}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-[#1b5270]">
                    {pinnedProgram.contact_lead_name}:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pinnedBadges.map((b, idx) =>
                      b.href ? (
                        <a
                          key={`pinned-badge-${idx}`}
                          href={b.href}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f2faf8] hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-[#1ca796]" />
                          {b.label !== 'Call' && b.label !== 'Email' ? `${b.label}: ` : ''}
                          {b.value}
                        </a>
                      ) : (
                        <span
                          key={`pinned-badge-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f6f9fa] border border-[#dce7ec] text-[#2c525c] text-[11px]"
                        >
                          {b.value}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#28454e] linen-card rounded-xl p-2.5 border border-[#e3dccf]">
                <strong className="text-[#1b7a6e]">Easy First Step:</strong>{' '}
                {session.next_micro_step_text}
              </div>
            </div>
          );
        })()}

        {/* 3. Saved Immediate Support Card */}
        {reliefProgram && (() => {
          const reliefMeta = getProgramSectionMeta(reliefProgram);
          const reliefBadges = parseContactBadges(reliefProgram.contact_phone_or_email);
          return (
            <div className="bg-[#eaf4fa] border border-[#bddbf0] rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[#1e5678]">
                  ★ {reliefMeta.savedLabel} ({reliefProgram.municipality})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      `Same-day support: ${reliefProgram.program_name} in ${reliefProgram.municipality}. Transit: ${reliefProgram.nearest_transit_stop}. Contact: ${reliefProgram.contact_lead_name} at ${reliefProgram.contact_phone_or_email}.`
                    )
                  }
                  className="text-[#1e5678] hover:text-[#163038] cursor-pointer"
                  title="Listen Out Loud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs font-bold text-[#163038]">{reliefProgram.program_name}</div>
              <div className="text-[11px] text-[#35565f]">{reliefProgram.organization_name}</div>
              <div className="text-[11px] text-[#23638a] font-medium flex items-center gap-1 pt-0.5">
                <Bus className="w-3 h-3 shrink-0" /> {reliefProgram.nearest_transit_stop}
              </div>
              <div className="pt-1 space-y-1">
                <div className="text-[11px] font-semibold text-[#1b5270]">
                  {reliefProgram.contact_lead_name}:
                </div>
                <div className="flex flex-wrap gap-1">
                  {reliefBadges.map((b, idx) =>
                    b.href ? (
                      <a
                        key={`relief-badge-${idx}`}
                        href={b.href}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#e5f6f3] border border-[#bce5dd] text-[#0f5248] font-semibold text-[10px]"
                      >
                        <Phone className="w-2.5 h-2.5 text-[#1ca796]" />
                        {b.label !== 'Call' && b.label !== 'Email' ? `${b.label}: ` : ''}
                        {b.value}
                      </a>
                    ) : (
                      <span
                        key={`relief-badge-${idx}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#dce7ec] text-[#2c525c] text-[10px]"
                      >
                        {b.value}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3B. Pocket 24/7 Grouped Sanctuary Helplines Card */}
        <div className="bg-gradient-to-br from-[#e6f6f3] to-[#eaf4fa] border border-[#b4dfd7] rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-[#145e54]">
              24/7 Grouped Sanctuary Lines (Tap to Call)
            </span>
            <button
              type="button"
              onClick={() =>
                speakText(
                  'Pocket 24/7 Numbers for All Ages. Emergency Police, Fire, or Ambulance: 9 1 1. Free 24/7 Nurse: 8 1 1. Shelter beds tonight: 2 1 1. Mental health crisis line: 9 8 8 or Fraser Crisis 604-951-8855. Free Counselor in 25 languages at Moving Forward: 778-321-3054. Pregnancy and Baby Care at Maxxine Wright: 604-587-3800. Surrey Memorial Hospital: 604-581-2211. LifeLabs and No-ID Street Nurse Lab: 604-587-3750. Youth Kids Help Phone: 1-800-668-6868. Seniors Line: 1-877-952-3181. AA: 604-434-3933. NA: 604-873-1018.'
                )
              }
              className="text-[#145e54] hover:text-[#12323b] cursor-pointer"
              title="Listen Out Loud"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {GROUPED_24_7_HELPLINES.map((group) => (
              <div
                key={`pocket-${group.id}`}
                className={`rounded-xl p-2 text-[10px] text-[#163038] space-y-1 border ${group.badgeColor}`}
              >
                <div className="font-bold text-[#14343d]">{group.title}</div>
                <div className="flex flex-wrap gap-1">
                  {group.lines.map((item) => (
                    <a
                      key={`pocket-${group.id}-${item.name}`}
                      href={`tel:${item.tel}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold"
                    >
                      <span className="text-[#35565f] font-medium">{item.name}:</span>
                      <span>{item.number}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

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

      <RealWorldConnectionBridgeModal
        isOpen={bridgeModalOpen}
        onClose={() => setBridgeModalOpen(false)}
        session={session}
        primaryProgram={pinnedProgram || null}
        reliefProgram={reliefProgram || null}
        initialMode={bridgeInitialMode}
      />
    </div>
  );
};
