import React, { useState } from 'react';
import {
  Search,
  Phone,
  Pin,
  X,
  KeyRound,
  Sparkles,
  Compass,
  MapPin,
  HeartHandshake,
  ArrowRight,
  Zap,
  Navigation,
  MessageSquareHeart
} from 'lucide-react';
import {
  ClientWorkbookSession,
  VerifiedProgramRecord
} from '../types/navigator.js';
import {
  CATEGORY_FILTER_PILLS,
  GROUPED_24_7_HELPLINES,
  SANCTUARY_SECTIONS,
  SanctuaryCategoryFilter,
  getCategoryFilterRank,
  getCityMatchTier,
  getProgramPrimarySectionId,
  getProgramSectionMeta,
  parseContactBadges
} from '../types/programGrouping.js';
import {
  RealWorldConnectionBridgeModal,
  buildTransitRouteUrl
} from './RealWorldConnectionBridgeModal.js';

interface GuestSanctuaryViewProps {
  session: ClientWorkbookSession;
  allPrograms: VerifiedProgramRecord[];
  onPatchSession: (patch: Partial<ClientWorkbookSession>) => void;
  onUpgradeToPinAccount: () => void;
  onOpenInteractiveWorkbookAsGuest: () => void;
  onGoToLandingLogin: () => void;
}

export const GuestSanctuaryView: React.FC<GuestSanctuaryViewProps> = ({
  session,
  allPrograms,
  onPatchSession,
  onUpgradeToPinAccount,
  onOpenInteractiveWorkbookAsGuest,
  onGoToLandingLogin
}) => {
  const [selectedCity, setSelectedCity] = useState<string>(session.municipality || 'All');
  const [selectedCategory, setSelectedCategory] = useState<SanctuaryCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sameDayOnly, setSameDayOnly] = useState<boolean>(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState<boolean>(false);

  const pinnedMain = allPrograms.find((p) => p.program_id === session.pinned_program_id) || null;
  const pinnedRelief =
    allPrograms.find((p) => p.program_id === session.pinned_relief_program_id) || null;

  const filteredPrograms = allPrograms
    .filter((p) => {
      const cityRank = getCityMatchTier(p, selectedCity);
      const matchesCity = selectedCity === 'All' || cityRank !== 'none';
      const matchesCat = getCategoryFilterRank(p, selectedCategory) > 0;
      const matchesSameDay =
        !sameDayOnly ||
        p.waitlist_weeks_estimate === 0 ||
        p.category === 'Survival_Relief' ||
        /walk-in|drop-in|24\/7|same-day|today|immediate/i.test(
          `${p.highlight_note} ${p.nearest_transit_stop} ${p.program_name}`
        );
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.program_name.toLowerCase().includes(q) ||
        p.organization_name.toLowerCase().includes(q) ||
        p.municipality.toLowerCase().includes(q) ||
        p.highlight_note.toLowerCase().includes(q) ||
        p.contact_phone_or_email.toLowerCase().includes(q) ||
        (p.hobby_tags && p.hobby_tags.some((t) => t.toLowerCase().includes(q)));
      return matchesCity && matchesCat && matchesSameDay && matchesSearch;
    })
    .sort((a, b) => {
      if (selectedCategory !== 'ALL') {
        const catRankA = getCategoryFilterRank(a, selectedCategory);
        const catRankB = getCategoryFilterRank(b, selectedCategory);
        if (catRankA !== catRankB) return catRankB - catRankA;
      }
      if (selectedCity !== 'All') {
        const tierA = getCityMatchTier(a, selectedCity) === 'exact' ? 2 : 1;
        const tierB = getCityMatchTier(b, selectedCity) === 'exact' ? 2 : 1;
        if (tierA !== tierB) return tierB - tierA;
      }
      return a.waitlist_weeks_estimate - b.waitlist_weeks_estimate;
    });

  const groupedSections = SANCTUARY_SECTIONS.map((sec) => ({
    section: sec,
    items: filteredPrograms.filter((p) => getProgramPrimarySectionId(p) === sec.id)
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Guest Sanctuary Welcome & One-Click PIN Upgrade Banner */}
      <div className="clinical-card border-2 border-[#bce5dd] rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#e5f8f5] via-[#f6fbf9] to-[#fdf6e6] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#9ddbd1] text-xs font-bold text-[#116358]">
              <Compass className="w-3.5 h-3.5 text-[#1ca796]" />
              <span>Anonymous Guest Sanctuary Mode • Zero Login Required</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#12323b]">
              Browse All {allPrograms.length} Verified Lower Mainland Support Services
            </h2>
            <p className="text-xs sm:text-sm text-[#355963] leading-relaxed">
              Call any hospital, walk-in doctor, free counselor, shelter, pregnancy program, food bank, or school directly below. If you want to keep your pinned programs for next time, you can save them with an easy <strong>4-digit PIN (no email required)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConnectionModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#12323b] hover:bg-[#1b4a56] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <MessageSquareHeart className="w-4 h-4 text-[#6ee7d8]" />
              <span>Desk Card, Call Script &amp; Bus Helper</span>
            </button>
            <button
              type="button"
              onClick={onOpenInteractiveWorkbookAsGuest}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#e3f7f4] border border-[#9ddbd1] text-[#0f5e53] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#1ca796]" />
              <span>Try Interactive Strengths Workbook (Guest)</span>
            </button>
            <button
              type="button"
              onClick={onUpgradeToPinAccount}
              className="px-4 py-2.5 rounded-2xl ocean-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Save My Picks with a 4-Digit PIN (No Email)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onGoToLandingLogin}
              className="px-3.5 py-2.5 rounded-2xl bg-[#faf6ee] hover:bg-[#efe6d5] border border-[#dfd2bc] text-[#35535b] text-xs font-bold cursor-pointer"
            >
              Have a PIN? Sign In
            </button>
          </div>
        </div>

        {/* Pinned Guest Takeaway Strip */}
        {(pinnedMain || pinnedRelief) && (
          <div className="mt-4 pt-4 border-t border-[#cde8e2] grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinnedRelief && (
              <div className="p-3.5 rounded-2xl bg-white/95 border border-[#bce5dd] flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#156e62]">
                    Pinned Immediate Support (Guest Card)
                  </div>
                  <div className="text-xs font-bold text-[#12323b] mt-0.5">
                    {pinnedRelief.program_name} ({pinnedRelief.municipality})
                  </div>
                  <div className="text-[11px] text-[#4b6a73] mt-0.5">
                    {pinnedRelief.contact_phone_or_email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onUpgradeToPinAccount}
                  className="px-2.5 py-1 rounded-xl bg-[#e3f7f4] text-[#0f5e53] border border-[#9ddbd1] text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  Save with PIN
                </button>
              </div>
            )}
            {pinnedMain && (
              <div className="p-3.5 rounded-2xl bg-white/95 border border-[#bce5dd] flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#17567d]">
                    Pinned Training / Community Step (Guest Card)
                  </div>
                  <div className="text-xs font-bold text-[#12323b] mt-0.5">
                    {pinnedMain.program_name} ({pinnedMain.municipality})
                  </div>
                  <div className="text-[11px] text-[#4b6a73] mt-0.5">
                    {pinnedMain.contact_phone_or_email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onUpgradeToPinAccount}
                  className="px-2.5 py-1 rounded-xl bg-[#e3f7f4] text-[#0f5e53] border border-[#9ddbd1] text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  Save with PIN
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 24/7 Grouped Sanctuary Helplines Bar */}
      <div className="clinical-card border border-[#cfe8e3] rounded-3xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#145e54] flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-[#1ca796]" /> 24/7 Free Helplines &amp; Immediate Response — Tap Any Number to Call
          </div>
          <span className="text-[11px] text-[#4b6a73] font-medium">
            Free, confidential, and open 24 hours a day across BC
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px]">
          {GROUPED_24_7_HELPLINES.map((group) => (
            <div
              key={`guest-help-${group.id}`}
              className={`rounded-2xl px-3.5 py-2.5 border space-y-1.5 ${group.badgeColor}`}
            >
              <div className="font-bold text-[#14343d]">{group.title}</div>
              <div className="flex flex-wrap gap-1.5">
                {group.lines.map((item) => (
                  <a
                    key={`guest-${group.id}-${item.name}`}
                    href={`tel:${item.tel}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold transition-colors"
                    title={item.note}
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

      {/* Main Guest Directory Card */}
      <div className="clinical-card border border-[#cfe8e3] rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#14343d] flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#1ca796]" />
              <span>Find Support in Your City &amp; Category</span>
            </h3>
            <p className="text-xs text-[#4b6a73] mt-0.5">
              Pick your city and tap any category pill below—Hospitals &amp; Labs, Free Counselors, Pregnancy &amp; Baby Care, Shelters, Food Banks, Subsidies, Youth &amp; Seniors, or Schools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#2b4c55] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1ca796]" /> City:
            </span>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                if (e.target.value !== 'All') {
                  onPatchSession({ municipality: e.target.value });
                }
              }}
              className="bg-[#f7f4ed] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs font-bold text-[#163038] cursor-pointer focus:outline-none focus:border-[#2a9d8f]"
            >
              <option value="All">All Lower Mainland Cities ({allPrograms.length} Programs)</option>
              <option value="Surrey">Surrey (Whalley, Newton, Guildford, Cloverdale)</option>
              <option value="White Rock / South Surrey">White Rock / South Surrey</option>
              <option value="Langley">Langley</option>
              <option value="Delta">Delta</option>
              <option value="Burnaby">Burnaby</option>
              <option value="New Westminster">New Westminster</option>
              <option value="Coquitlam">Coquitlam / Tri-Cities</option>
              <option value="Vancouver">Vancouver</option>
              <option value="Richmond">Richmond</option>
            </select>
            <button
              type="button"
              onClick={() => setSameDayOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                sameDayOnly
                  ? 'bg-[#e76f51] text-white shadow-xs'
                  : 'bg-[#fdf3eb] text-[#9b3f25] border border-[#f2c6b6] hover:bg-[#fae5d7]'
              }`}
              title="Filter to programs with 0-week waitlist, same-day walk-in, or 24/7 immediate access"
            >
              <Zap className="w-3.5 h-3.5" />
              {sameDayOnly ? '✓ Walk-In Today Only' : 'Walk-In Today Only'}
            </button>
            {(selectedCity !== 'All' || selectedCategory !== 'ALL' || sameDayOnly || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCity('All');
                  setSelectedCategory('ALL');
                  setSameDayOnly(false);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#e6f6f3] border border-[#bce5dd] text-xs font-semibold text-[#1b7a6e] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Search Input & Category Pills */}
        <div className="flex flex-col gap-3 bg-[#faf6ee] border border-[#e3d7c3] rounded-2xl p-3.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5b767e] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital, counselor, baby/pregnancy, shelter, food bank, PWD, AA/NA, school, or phone number..."
              className="w-full rounded-xl bg-white border border-[#dcd2c0] pl-9 pr-9 py-2.5 text-xs text-[#153138] placeholder-[#789097] focus:outline-none focus:border-[#2a9d8f]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#647e86] hover:text-[#153138] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTER_PILLS.map((pill) => (
              <button
                key={`guest-pill-${pill.id}`}
                type="button"
                onClick={() => setSelectedCategory(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                  selectedCategory === pill.id
                    ? 'ocean-btn text-white'
                    : 'bg-white text-[#35565f] border border-[#dfd3be] hover:bg-[#e6f6f3]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="text-xs font-semibold text-[#145e54]">
            Showing <strong>{filteredPrograms.length}</strong> of {allPrograms.length} verified services across{' '}
            <strong>{groupedSections.length}</strong> categories
          </div>
        </div>

        {/* Grouped Program Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e2d6c1] bg-[#f8f2e7] text-[#45636b] font-semibold">
                <th className="py-3 px-3.5 rounded-tl-xl">Program, Category &amp; Community Partner</th>
                <th className="py-3 px-3.5">City &amp; Nearest Transit</th>
                <th className="py-3 px-3.5">Contact Person &amp; Direct Numbers</th>
                <th className="py-3 px-3.5">Access &amp; ID Rules</th>
                <th className="py-3 px-3.5">Free Support Included</th>
                <th className="py-3 px-3.5 rounded-tr-xl text-right">Pin for Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe1d1]">
              {groupedSections.map(({ section, items }) => (
                <React.Fragment key={`guest-sec-${section.id}`}>
                  <tr className="bg-gradient-to-r from-[#e7f5f2] via-[#edf6fa] to-[#f7f2e7] border-y-2 border-[#bce5dd]">
                    <td colSpan={6} className="py-2.5 px-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${section.badgeClasses}`}
                          >
                            {section.shortBadge}
                          </span>
                          <span className="text-xs font-bold text-[#14343d]">{section.title}</span>
                          <span className="text-[11px] text-[#4b6a73] hidden md:inline">
                            — {section.subtitle}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#1b7a6e] bg-white px-2.5 py-0.5 rounded-full border border-[#bce5dd]">
                          {items.length} {items.length === 1 ? 'Program' : 'Programs'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {items.map((p) => {
                    const isSavedMain = session.pinned_program_id === p.program_id;
                    const isSavedRelief = session.pinned_relief_program_id === p.program_id;
                    const isSaved = isSavedMain || isSavedRelief;
                    const sectionMeta = getProgramSectionMeta(p);
                    const contactBadges = parseContactBadges(p.contact_phone_or_email);
                    return (
                      <tr key={`guest-row-${p.program_id}`} className="hover:bg-[#eef9f7] transition-colors bg-white/90">
                        <td className="py-3.5 px-3.5 max-w-md">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sectionMeta.badgeClasses}`}
                            >
                              {sectionMeta.shortBadge}
                            </span>
                            <span className="text-[11px] font-semibold text-[#1b7a6e]">
                              {p.organization_name}
                            </span>
                          </div>
                          <div className="font-bold text-[#14343d] text-xs">{p.program_name}</div>
                          <div className="text-[11px] text-[#4e6b73] mt-0.5 leading-relaxed">
                            {p.highlight_note}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5">
                          <div className="font-bold text-[#14343d]">{p.municipality}</div>
                          <div className="text-[11px] text-[#4b6a73] mt-0.5">
                            {p.nearest_transit_stop}
                          </div>
                          <a
                            href={buildTransitRouteUrl(p, session.municipality)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-[#e6f7f4] hover:bg-[#cdeee8] text-[#0f5e53] border border-[#9ddbd1] text-[10px] font-bold"
                          >
                            <Navigation className="w-2.5 h-2.5 text-[#1ca796]" />
                            1-Tap Bus Route
                          </a>
                        </td>
                        <td className="py-3.5 px-3.5">
                          <div className="font-semibold text-[#14343d] mb-1">
                            {p.contact_lead_name}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {contactBadges.map((b, bIdx) =>
                              b.href ? (
                                <a
                                  key={`guest-${p.program_id}-contact-${bIdx}`}
                                  href={b.href}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f2faf8] hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold text-[11px] transition-colors"
                                >
                                  <Phone className="w-3 h-3 text-[#1ca796]" />
                                  {b.label !== 'Call' && b.label !== 'Email' ? `${b.label}: ` : ''}
                                  {b.value}
                                </a>
                              ) : (
                                <span
                                  key={`guest-${p.program_id}-contact-${bIdx}`}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#faf6ee] border border-[#e3d7c3] text-[#35565f] text-[11px]"
                                >
                                  {b.value}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5">
                          <div className="text-[#16796d] font-semibold">
                            {p.supports_high_skill_low_text ? '✓ 100% Hands-On' : '✓ Calm Walk-In / Phone'}
                          </div>
                          <div className="text-[11px] text-[#1f6a8f]">
                            {!p.requires_government_id ? 'No ID Needed' : 'ID Needed'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-[#35535b]">
                          {[
                            p.provides_transit_tickets && 'Bus Tickets',
                            p.provides_food_or_meals && 'Food / Hot Meals',
                            p.provides_living_stipend && 'Money / Stipend',
                            p.provides_gear_or_boots && 'Gear / Supplies'
                          ]
                            .filter(Boolean)
                            .join(' • ') || 'Free Service'}
                        </td>
                        <td className="py-3.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (p.category === 'Survival_Relief') {
                                onPatchSession({ pinned_relief_program_id: p.program_id });
                              } else {
                                onPatchSession({
                                  pinned_program_id: p.program_id,
                                  next_micro_step_text: `Call ${p.contact_lead_name} (${p.contact_phone_or_email}) together for a friendly intro.`
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all ${
                              isSaved
                                ? 'bg-[#2a9d8f] text-white'
                                : 'bg-white hover:bg-[#e6f6f3] text-[#1b7a6e] border border-[#bce5dd]'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {isSaved ? `✓ ${sectionMeta.savedLabel}` : sectionMeta.saveLabel}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RealWorldConnectionBridgeModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        session={session}
        primaryProgram={pinnedMain || filteredPrograms[0] || allPrograms[0] || null}
        reliefProgram={
          pinnedRelief ||
          filteredPrograms.find((p) => p.category === 'Survival_Relief') ||
          allPrograms.find((p) => p.category === 'Survival_Relief') ||
          null
        }
      />
    </div>
  );
};
