import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Bus,
  MapPin,
  Volume2,
  Copy,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  HandHeart,
  ExternalLink
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
} from '../types/navigator.js';
import { parseContactBadges } from '../types/programGrouping.js';

export function buildTransitRouteUrl(
  program: VerifiedProgramRecord,
  originMunicipality?: string
): string {
  const dest = encodeURIComponent(
    `${program.street_address}, ${program.municipality}, BC`
  );
  if (originMunicipality && originMunicipality !== 'All') {
    const origin = encodeURIComponent(`${originMunicipality}, BC`);
    return `https://www.google.com/maps/dir/?api=1&travelmode=transit&origin=${origin}&destination=${dest}`;
  }
  return `https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=${dest}`;
}

interface RealWorldConnectionBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClientWorkbookSession;
  primaryProgram: VerifiedProgramRecord | null;
  reliefProgram: VerifiedProgramRecord | null;
  initialMode?: 'desk_card' | 'call_script' | 'transit_checklist' | 'buddy_share';
}

export const RealWorldConnectionBridgeModal: React.FC<RealWorldConnectionBridgeModalProps> = ({
  isOpen,
  onClose,
  session,
  primaryProgram,
  reliefProgram,
  initialMode = 'desk_card'
}) => {
  const [activeMode, setActiveMode] = useState<
    'desk_card' | 'call_script' | 'transit_checklist' | 'buddy_share'
  >(initialMode);
  const [targetType, setTargetType] = useState<'primary' | 'relief'>(
    reliefProgram && !primaryProgram ? 'relief' : 'primary'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeProgram =
    targetType === 'relief'
      ? reliefProgram || primaryProgram
      : primaryProgram || reliefProgram;

  if (!activeProgram) return null;

  const contactBadges = parseContactBadges(activeProgram.contact_phone_or_email);
  const firstPhoneBadge = contactBadges.find((b) => b.href?.startsWith('tel:'));
  const rawPhoneDigits = firstPhoneBadge?.href?.replace('tel:', '') || '211';

  const speakOutLoud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.96;
      window.speechSynthesis.speak(u);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const deskCardText = `Hello. My name is ${session.client_alias}. I am here to connect with ${activeProgram.program_name} (${activeProgram.organization_name}). ${
    session.coordinator_scribe_required || session.text_admin_tolerance <= 2
      ? 'I do best with spoken or hands-on walkthroughs rather than heavy paperwork. Could someone please help me as a scribe with any intake forms?'
      : 'Could you please connect me with the intake lead?'
  } ${
    session.active_barriers.includes('Transit Pass / Compass')
      ? 'I also need help with Compass bus tickets today.'
      : ''
  } Thank you.`;

  const callScriptText = `Hi, may I speak with ${activeProgram.contact_lead_name}? My name is ${session.client_alias} in ${session.municipality}. I was matched with ${activeProgram.program_name} and I'm calling to ask how I can get started ${
    activeProgram.intake_type === 'Drop-In'
      ? 'during drop-in hours today'
      : 'with a warm handoff'
  }.${
    activeProgram.provides_transit_tickets
      ? ' Could I also ask about Compass transit ticket support to get there?'
      : ''
  }`;

  const buddyShareSummary = [
    `=== FUTURE FORWARD & BEYOND — POCKET CONNECTION CARD ===`,
    `Name / Nickname: ${session.client_alias} (${session.municipality})`,
    session.is_guest
      ? `Account Mode: Guest Sanctuary Mode`
      : `Saved Profile ID: #${session.session_id} (Sign in with 4-digit PIN)`,
    ``,
    `1. IMMEDIATE RELIEF / SAME-DAY SUPPORT:`,
    reliefProgram
      ? `• ${reliefProgram.program_name} (${reliefProgram.organization_name})\n  Address: ${reliefProgram.street_address}, ${reliefProgram.municipality}\n  Transit: ${reliefProgram.nearest_transit_stop}\n  Contact: ${reliefProgram.contact_lead_name} — ${reliefProgram.contact_phone_or_email}`
      : `• Call 2-1-1 (Shelter & Food) or 310-6789 (Mental Health)`,
    ``,
    `2. NEXT STEP / HANDS-ON PROGRAM:`,
    primaryProgram
      ? `• ${primaryProgram.program_name} (${primaryProgram.organization_name})\n  Address: ${primaryProgram.street_address}, ${primaryProgram.municipality}\n  Transit: ${primaryProgram.nearest_transit_stop}\n  Contact: ${primaryProgram.contact_lead_name} — ${primaryProgram.contact_phone_or_email}`
      : `• See coordinator for warm handoff`,
    ``,
    `24/7 EMERGENCY & HELPLINES: Crisis 9-8-8 • Shelter/Food 2-1-1 • Nurse 8-1-1`
  ].join('\n');

  const mapsDestination = encodeURIComponent(
    `${activeProgram.street_address}, ${activeProgram.municipality}, BC`
  );
  const transitMapsUrl = `https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=${mapsDestination}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d262e]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#fcfaf5] border-2 border-[#9ddbd1] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#146e62] via-[#1b7a6e] to-[#23638a] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              <HandHeart className="w-3.5 h-3.5" />
              <span>Real-World Connection Bridge • Zero Awkward Barriers</span>
            </div>
            <h3 className="text-lg font-extrabold mt-1">
              Connect Where It Matters — Practical Walk-In, Call &amp; Transit Helper
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Switch Between Primary Match and Immediate Relief Match */}
          {primaryProgram && reliefProgram && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f3eadb] p-2 rounded-2xl border border-[#dfd2bc]">
              <span className="text-xs font-bold text-[#2b4c55] px-2">
                Which place are you connecting with right now?
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTargetType('relief')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    targetType === 'relief'
                      ? 'ocean-btn text-white'
                      : 'bg-white text-[#35535b] border border-[#d8ccb8]'
                  }`}
                >
                  Same-Day Relief: {reliefProgram.program_name.slice(0, 32)}...
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('primary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    targetType === 'primary'
                      ? 'ocean-btn text-white'
                      : 'bg-white text-[#35535b] border border-[#d8ccb8]'
                  }`}
                >
                  Next Step: {primaryProgram.program_name.slice(0, 32)}...
                </button>
              </div>
            </div>
          )}

          {/* 4 Connection Dynamic Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'desk_card' as const,
                label: '1. Show at Front Desk',
                sub: 'No-Stress Walk-In Card'
              },
              {
                id: 'call_script' as const,
                label: '2. Call / Text Script',
                sub: 'Beat Phone Anxiety'
              },
              {
                id: 'transit_checklist' as const,
                label: '3. Bus & What to Bring',
                sub: 'Directions & ID Rules'
              },
              {
                id: 'buddy_share' as const,
                label: '4. Pocket Card / Buddy',
                sub: 'Print or Share Offline'
              }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  activeMode === tab.id
                    ? 'bg-[#e3f7f4] border-2 border-[#1ca796] shadow-2xs'
                    : 'bg-white hover:bg-[#f6f1e6] border-[#e2d6c1]'
                }`}
              >
                <div className="text-xs font-extrabold text-[#12323b]">{tab.label}</div>
                <div className="text-[10px] text-[#4b6a73] mt-0.5">{tab.sub}</div>
              </button>
            ))}
          </div>

          {/* MODE 1: SILENT FRONT DESK WALK-IN ADVOCACY CARD */}
          {activeMode === 'desk_card' && (
            <div className="space-y-4">
              <div className="text-xs text-[#355963]">
                <strong>Why this helps:</strong> Walking up to a hospital window, shelter desk, or training centre can be overwhelming when a room is loud or you’re tired of explaining yourself. <strong>Hold your screen up to the staff member</strong> or tap <em>Speak Card Out Loud</em>.
              </div>

              <div className="bg-white border-4 border-[#1ca796] rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8ece7] pb-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#dff7f4] text-[#0f5e53] border border-[#9ddbd1]">
                      Front Desk / Intake Helper Card — Please Read
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakOutLoud(deskCardText)}
                    className="px-3.5 py-1.5 rounded-xl ocean-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Speak Card Out Loud</span>
                  </button>
                </div>

                <div className="text-base sm:text-lg font-bold text-[#103038] leading-relaxed">
                  “Hello, my name is <span className="underline decoration-[#1ca796]">{session.client_alias}</span>. I’m here today for{' '}
                  <span className="text-[#116358]">{activeProgram.program_name}</span> (ask for{' '}
                  <strong>{activeProgram.contact_lead_name}</strong>).”
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#f3fbf9] border border-[#bce5dd] space-y-1">
                    <div className="font-extrabold text-[#0f5248] uppercase text-[10px]">
                      How Staff Can Help Me Best Today:
                    </div>
                    <div className="font-semibold text-[#12323b]">
                      ✓ {session.coordinator_scribe_required || session.text_admin_tolerance <= 2
                        ? 'Please help fill out intake paperwork with me (Scribe / Verbal Intake)'
                        : 'Calm 1-on-1 check-in'}
                    </div>
                    <div className="text-[#355963]">
                      ✓ Best learning/communication style: {session.preferred_learning_modality.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#fff8e8] border border-[#f2d28b] space-y-1">
                    <div className="font-extrabold text-[#8a520d] uppercase text-[10px]">
                      Immediate Barrier Support Needed:
                    </div>
                    <div className="font-semibold text-[#12323b]">
                      {session.active_barriers.length > 0
                        ? session.active_barriers.join(' • ')
                        : 'Friendly orientation & next step'}
                    </div>
                    <div className="text-[#5c4824]">
                      {!activeProgram.requires_government_id
                        ? '✓ Verified: No Government ID required for initial drop-in'
                        : '✓ Coordinator assisting with ID requirements'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: PHONE ANXIETY & SMS SCRIPT GENERATOR */}
          {activeMode === 'call_script' && (
            <div className="space-y-4">
              <div className="text-xs text-[#355963]">
                <strong>Why this helps:</strong> Not sure what to say when someone answers the phone? Read these 2 sentences word-for-word, or tap <strong>Send as Text Message (SMS)</strong> if you prefer texting over talking.
              </div>

              <div className="bg-white border-2 border-[#bce5dd] rounded-3xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#116358]">
                    2-Sentence Script for {activeProgram.contact_lead_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakOutLoud(callScriptText)}
                      className="px-3 py-1.5 rounded-xl bg-[#e3f7f4] hover:bg-[#cdeee9] text-[#0f5e53] border border-[#9ddbd1] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Practice Hearing It</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(callScriptText, 'script')}
                      className="px-3 py-1.5 rounded-xl bg-[#faf6ee] hover:bg-[#efe6d5] text-[#2b4c55] border border-[#dfd2bc] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'script' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1ca796]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f4fbf9] border border-[#bce5dd] text-sm sm:text-base font-bold text-[#12323b] leading-relaxed">
                  “{callScriptText}”
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href={`tel:${rawPhoneDigits}`}
                    className="px-5 py-3 rounded-2xl ocean-btn text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now ({firstPhoneBadge?.value || rawPhoneDigits})</span>
                  </a>
                  <a
                    href={`sms:${rawPhoneDigits}?body=${encodeURIComponent(callScriptText)}`}
                    className="px-5 py-3 rounded-2xl bg-[#e6f2fb] hover:bg-[#d3e8f8] border border-[#9ec8e8] text-[#154c70] font-bold text-xs sm:text-sm inline-flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open in Text Message (SMS)</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: 1-TAP TRANSIT DIRECTIONS & ZERO-SURPRISE CHECKLIST */}
          {activeMode === 'transit_checklist' && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-[#bce5dd] rounded-3xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#156e62]">
                      SkyTrain, Bus &amp; Street Directions ({activeProgram.municipality})
                    </div>
                    <h4 className="text-base font-extrabold text-[#12323b] mt-0.5">
                      {activeProgram.program_name}
                    </h4>
                    <div className="text-xs text-[#355963] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#1ca796] shrink-0" />
                      <span>
                        <strong>Address:</strong> {activeProgram.street_address}, {activeProgram.municipality}
                      </span>
                    </div>
                    <div className="text-xs text-[#1d5b82] mt-1 flex items-center gap-1.5 font-semibold">
                      <Bus className="w-4 h-4 text-[#23638a] shrink-0" />
                      <span>
                        <strong>Nearest Transit Stop:</strong> {activeProgram.nearest_transit_stop}
                      </span>
                    </div>
                  </div>

                  <a
                    href={transitMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-2xl ocean-btn text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Bus className="w-4 h-4" />
                    <span>Open Live Bus / SkyTrain Route</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Zero-Surprise Walk-In Checklist */}
                <div className="border-t border-[#e2ece9] pt-4">
                  <div className="text-xs font-extrabold text-[#12323b] mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1ca796]" />
                    <span>Before You Head Out — Zero-Surprise Checklist:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-[#f3fbf9] border border-[#bce5dd]">
                      <div className="font-bold text-[#0f5248]">
                        {!activeProgram.requires_government_id
                          ? '✓ No Government ID Needed to Start'
                          : '• Bring ID (Or Ask Coordinator for ID Clinic First)'}
                      </div>
                      <div className="text-[11px] text-[#4b6a73] mt-0.5">
                        Verified against program intake rules ({activeProgram.intake_type.replace('_', ' ')}).
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#f3fbf9] border border-[#bce5dd]">
                      <div className="font-bold text-[#0f5248]">
                        {activeProgram.scribe_or_reader_available
                          ? '✓ Staff Will Help Fill Out Forms With You'
                          : '✓ Bring Coordinator Notes'}
                      </div>
                      <div className="text-[11px] text-[#4b6a73] mt-0.5">
                        No spelling tests or solo paperwork walls required.
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#fff8e8] border border-[#f2d28b]">
                      <div className="font-bold text-[#8a520d]">
                        {activeProgram.provides_transit_tickets
                          ? '✓ Free Compass Bus Tickets Available'
                          : '• Standard Transit Access'}
                      </div>
                      <div className="text-[11px] text-[#5c4824] mt-0.5">
                        Ask {activeProgram.contact_lead_name} for return fare support when you arrive.
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#fff8e8] border border-[#f2d28b]">
                      <div className="font-bold text-[#8a520d]">
                        {activeProgram.provides_food_or_meals
                          ? '✓ Free Hot Meal / Groceries On Site'
                          : activeProgram.provides_gear_or_boots
                          ? '✓ Free Work Boots / Gear Provided'
                          : '✓ Free Community Access'}
                      </div>
                      <div className="text-[11px] text-[#5c4824] mt-0.5">
                        Estimated wait time: {activeProgram.waitlist_weeks_estimate === 0 ? 'Same-Day / Walk-In' : `~${activeProgram.waitlist_weeks_estimate} week(s)`}.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: POCKET CARD & BUDDY / FAMILY PROXY SHARE */}
          {activeMode === 'buddy_share' && (
            <div className="space-y-4">
              <div className="text-xs text-[#355963]">
                <strong>Why this helps:</strong> Phone batteries die, data runs out, or a friend/family member might be giving you a ride. Copy or print this pocket summary so you have every address, bus stop, and phone number in one place.
              </div>

              <pre className="bg-white border-2 border-[#d8ccb8] rounded-2xl p-4 text-xs font-mono text-[#12323b] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {buddyShareSummary}
              </pre>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => copyToClipboard(buddyShareSummary, 'buddy')}
                  className="px-5 py-2.5 rounded-2xl ocean-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedKey === 'buddy' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Copied Pocket Card to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Summary to Text a Friend / Worker</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#f3eadb] border border-[#d8ccb8] text-[#12323b] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#1ca796]" />
                  <span>Print Paper Pocket Pass</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
