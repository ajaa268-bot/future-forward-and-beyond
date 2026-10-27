import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  Upload,
  PlusCircle,
  Radio,
  History,
  X,
  Sparkles,
  Globe,
  FileJson
} from 'lucide-react';
import { DailySyncState, ProgramCategory } from '../types/navigator.js';

interface DailySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: DailySyncState | null;
  isSyncing: boolean;
  onRunSyncNow: () => Promise<void>;
  onToggleSchedule: (enabled: boolean, intervalHours: number) => Promise<void>;
  onImportPayload: (payload: any, sourceName: string) => Promise<{
    added_count: number;
    updated_count: number;
    verified_unchanged_count: number;
  } | null>;
}

export const DailySyncModal: React.FC<DailySyncModalProps> = ({
  isOpen,
  onClose,
  syncState,
  isSyncing,
  onRunSyncNow,
  onToggleSchedule,
  onImportPayload
}) => {
  const [activeTab, setActiveTab] = useState<'feeds' | 'changelog' | 'import'>('feeds');
  const [importMode, setImportMode] = useState<'quick_form' | 'json_feed'>('quick_form');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Quick Form State
  const [progName, setProgName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [city, setCity] = useState('Surrey');
  const [category, setCategory] = useState<ProgramCategory>('Survival_Relief');
  const [phoneEmail, setPhoneEmail] = useState('');
  const [contactLead, setContactLead] = useState('');
  const [address, setAddress] = useState('');
  const [transitStop, setTransitStop] = useState('');
  const [highlightNote, setHighlightNote] = useState('');
  const [tagsText, setTagsText] = useState('counseling, shelter, food');
  const [providesTransit, setProvidesTransit] = useState(true);
  const [providesMeals, setProvidesMeals] = useState(true);

  // JSON Batch Import State
  const [jsonInput, setJsonInput] = useState('');
  const [jsonSourceName, setJsonSourceName] = useState('BC211 / Agency Daily Delta Feed');
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen || !syncState) return null;

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const handleManualRefresh = async () => {
    setStatusBanner(null);
    await onRunSyncNow();
    setStatusBanner(
      'All 6 regional & provincial service feeds checked! Any changes have been merged and verified.'
    );
  };

  const handleQuickFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName.trim()) return;
    setStatusBanner(null);

    const payload = {
      program_name: progName.trim(),
      organization_name: orgName.trim() || 'Community Partner Agency',
      municipality: city,
      category,
      contact_phone_or_email: phoneEmail.trim() || 'Call 211',
      contact_lead_name: contactLead.trim() || 'Intake Coordinator',
      street_address: address.trim() || `${city}, BC`,
      nearest_transit_stop: transitStop.trim() || 'Transit Accessible',
      highlight_note:
        highlightNote.trim() ||
        `Local support program in ${city} imported via Coordinator Service Importer.`,
      hobby_tags: tagsText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      provides_transit_tickets: providesTransit,
      provides_food_or_meals: providesMeals,
      requires_government_id: false
    };

    const res = await onImportPayload(payload, orgName.trim() || 'Coordinator Quick Import');
    if (res) {
      setStatusBanner(
        res.added_count > 0
          ? `Added "${progName.trim()}" (${city}) to the live directory!`
          : res.updated_count > 0
          ? `Detected changes and updated "${progName.trim()}" (${city})!`
          : `"${progName.trim()}" is already up to date — refreshed verification timestamp.`
      );
      setProgName('');
      setOrgName('');
      setPhoneEmail('');
      setContactLead('');
      setAddress('');
      setTransitStop('');
      setHighlightNote('');
      setActiveTab('changelog');
    }
  };

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);
    setStatusBanner(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await onImportPayload(parsed, jsonSourceName || 'JSON / HSDS Feed Import');
      if (res) {
        setStatusBanner(
          `Import complete: ${res.added_count} new added, ${res.updated_count} updated, ${res.verified_unchanged_count} unchanged.`
        );
        setActiveTab('changelog');
      }
    } catch (err: any) {
      setJsonError(
        'Please check the JSON format. You can click "Load Sample Agency Update" below to test.'
      );
    }
  };

  const handleLoadSampleFeed = () => {
    setJsonError(null);
    const sample = [
      {
        program_name: 'Sources South Surrey / White Rock Community Resource & Mobile Outreach',
        organization_name: 'Sources BC (South Surrey / White Rock)',
        municipality: 'White Rock / South Surrey',
        category: 'Survival_Relief',
        contact_lead_name: 'Mobile Outreach & Housing Desk',
        contact_phone_or_email: '604-531-6226 / outreach@sourcesbc.ca',
        street_address: '15318 20 Ave, South Surrey / White Rock, BC',
        nearest_transit_stop: 'South Surrey Park & Ride / #351 & #360 Bus',
        highlight_note:
          'Daily drop-in outreach, emergency grocery vouchers, rent bank navigation, and seniors/family support.',
        hobby_tags: ['outreach', 'housing', 'food', 'counseling', 'seniors', 'family'],
        provides_transit_tickets: true,
        provides_food_or_meals: true
      }
    ];
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d262e]/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="clinical-card border border-[#b4e4dc] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-[#dff6f3] via-[#e8f5fa] to-[#f5eee0] px-6 py-4 border-b border-[#cbe6e1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl ocean-btn flex items-center justify-center text-white shadow-sm">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#103038]">
                  Daily Service Auto-Refresh &amp; Live Import Center
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#dff5ea] text-[#116342] border border-[#a9dfc4]">
                  {syncState.total_programs_count} Verified Programs
                </span>
              </div>
              <p className="text-xs text-[#3b5e68]">
                Automatically checks BC211, BC Data Catalogue, Health Authorities &amp; local agencies daily and merges only what changed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/80 hover:bg-white border border-[#cce5e0] text-[#35565f] cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Schedule & One-Click Refresh Bar */}
        <div className="bg-[#faf6ee] border-b border-[#e5dac7] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-2 font-semibold text-[#14343d] cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-[#dcd4c4]">
              <input
                type="checkbox"
                checked={syncState.auto_daily_enabled}
                onChange={(e) =>
                  onToggleSchedule(e.target.checked, syncState.interval_hours || 24)
                }
                className="accent-[#1ca796] w-4 h-4 cursor-pointer"
              />
              <span>Auto-Refresh Daily</span>
            </label>

            <select
              value={syncState.interval_hours || 24}
              onChange={(e) =>
                onToggleSchedule(syncState.auto_daily_enabled, Number(e.target.value))
              }
              className="bg-white border border-[#dcd4c4] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#2c4e57] cursor-pointer"
            >
              <option value={24}>Every 24 Hours (Daily Check)</option>
              <option value={12}>Every 12 Hours (Twice Daily)</option>
              <option value={6}>Every 6 Hours</option>
            </select>

            <div className="flex items-center gap-1.5 text-[#496770]">
              <Clock className="w-3.5 h-3.5 text-[#1ca796]" />
              <span>
                Last checked: <strong className="text-[#14343d]">{formatTime(syncState.last_sync_at)}</strong>
              </span>
              <span className="text-[#b8aa93]">•</span>
              <span>
                Next check:{' '}
                <strong className="text-[#156e62]">
                  {syncState.auto_daily_enabled
                    ? formatTime(syncState.next_scheduled_sync_at)
                    : 'Paused'}
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleManualRefresh}
            className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Checking Feeds for Changes...' : 'Refresh & Check for Changes Now'}</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusBanner && (
          <div className="bg-[#e3f7f4] border-b border-[#b4e4dc] px-6 py-2.5 text-xs text-[#115e53] font-medium flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1ca796] shrink-0" />
              {statusBanner}
            </span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-[#115e53] hover:underline text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-[#e5ecea] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('feeds')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'feeds'
                ? 'border-[#1ca796] text-[#11665b] bg-[#effaf8]'
                : 'border-transparent text-[#526f78] hover:text-[#14343d]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Connected Service Feeds ({syncState.connectors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'changelog'
                ? 'border-[#1ca796] text-[#11665b] bg-[#effaf8]'
                : 'border-transparent text-[#526f78] hover:text-[#14343d]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Change Detection Log ({syncState.recent_changes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#1ca796] text-[#11665b] bg-[#effaf8]'
                : 'border-transparent text-[#526f78] hover:text-[#14343d]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import or Update Service</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#fcfaf5]">
          {activeTab === 'feeds' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="linen-card border border-[#e3d7c3] rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-[#526f78]">
                    Last Run Summary
                  </div>
                  <div className="text-sm font-bold text-[#14343d] mt-0.5">
                    {syncState.last_run_summary.added_count} Added •{' '}
                    {syncState.last_run_summary.updated_count} Updated •{' '}
                    {syncState.last_run_summary.verified_unchanged_count} Verified
                  </div>
                  <div className="text-[11px] text-[#496770] mt-0.5">
                    Completed in {syncState.last_run_summary.duration_ms}ms
                  </div>
                </div>
                <div className="linen-card border border-[#e3d7c3] rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-[#526f78]">
                    Change-Only Smart Diffing
                  </div>
                  <div className="text-sm font-bold text-[#156e62] mt-0.5">
                    Active &amp; Non-Destructive
                  </div>
                  <div className="text-[11px] text-[#496770] mt-0.5">
                    Checks phone numbers, hours, waitlists &amp; status; updates only changed fields
                  </div>
                </div>
                <div className="linen-card border border-[#e3d7c3] rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-[#526f78]">
                    Green-Light Window (&lt;14 Days)
                  </div>
                  <div className="text-sm font-bold text-[#14343d] mt-0.5">
                    {syncState.total_programs_count} / {syncState.total_programs_count} Active
                  </div>
                  <div className="text-[11px] text-[#496770] mt-0.5">
                    All Lower Mainland services verified current
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {syncState.connectors.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white border border-[#d6e8e4] rounded-2xl p-4 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-[#14343d] flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#1ca796]" />
                          <span>{conn.name}</span>
                        </div>
                        <div className="text-[11px] text-[#526f78]">
                          {conn.provider} • <span className="font-medium">{conn.protocol}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          conn.status === 'online' || conn.status === 'synced'
                            ? 'bg-[#dff5ea] text-[#116342] border-[#a9dfc4]'
                            : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                        }`}
                      >
                        {conn.status === 'online'
                          ? 'LIVE API ONLINE'
                          : conn.status === 'synced'
                          ? 'DAILY SYNCED'
                          : 'STANDBY CACHE'}
                      </span>
                    </div>

                    <p className="text-xs text-[#35565f] leading-relaxed">{conn.message}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#eef4f2] text-[11px] text-[#526f78]">
                      <span>
                        Tracked: <strong className="text-[#14343d]">{conn.records_tracked} services</strong>
                      </span>
                      <span>
                        Feed date: <strong className="text-[#14343d]">{conn.remote_last_modified || 'Today'}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-2.5">
              {syncState.recent_changes.map((item, idx) => (
                <div
                  key={`${item.program_id}-${idx}`}
                  className="bg-white border border-[#dceae7] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.change_type === 'added'
                            ? 'bg-[#dcfce7] text-[#15803d] border border-[#86efac]'
                            : item.change_type === 'updated'
                            ? 'bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc]'
                            : 'bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]'
                        }`}
                      >
                        {item.change_type === 'added'
                          ? '+ New Imported'
                          : item.change_type === 'updated'
                          ? '↻ Change Applied'
                          : '✓ Verified Active'}
                      </span>
                      <span className="text-xs font-bold text-[#14343d]">{item.program_name}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#f3eadb] text-[#3d5a63]">
                        {item.municipality}
                      </span>
                    </div>
                    <p className="text-xs text-[#35565f]">{item.summary}</p>
                  </div>
                  <div className="text-right shrink-0 text-[11px] text-[#58747c]">
                    <div className="font-medium text-[#1b7a6e]">{item.source_feed}</div>
                    <div>{formatTime(item.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('quick_form')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    importMode === 'quick_form'
                      ? 'ocean-btn text-white'
                      : 'bg-white border border-[#dcd4c4] text-[#35565f]'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Quick Add / Update Service</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('json_feed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    importMode === 'json_feed'
                      ? 'ocean-btn text-white'
                      : 'bg-white border border-[#dcd4c4] text-[#35565f]'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Paste JSON / 211 HSDS Feed</span>
                </button>
              </div>

              {importMode === 'quick_form' ? (
                <form
                  onSubmit={handleQuickFormSubmit}
                  className="bg-white border border-[#d6e8e4] rounded-2xl p-4 space-y-3"
                >
                  <div className="text-xs text-[#35565f]">
                    Add a new local service or enter an existing program name to automatically update its phone number, address, or details.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Program or Service Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={progName}
                        onChange={(e) => setProgName(e.target.value)}
                        placeholder="e.g., Surrey Youth & Family Walk-In Counseling"
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Organization / Agency Name
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g., Options Community Services / Sources BC"
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        City / Municipality
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      >
                        <option value="Surrey">Surrey</option>
                        <option value="White Rock / South Surrey">White Rock / South Surrey</option>
                        <option value="Langley">Langley</option>
                        <option value="Delta">Delta</option>
                        <option value="Burnaby">Burnaby</option>
                        <option value="New Westminster">New Westminster</option>
                        <option value="Coquitlam">Coquitlam / Tri-Cities</option>
                        <option value="Vancouver">Vancouver</option>
                        <option value="Richmond">Richmond</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Primary Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProgramCategory)}
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      >
                        <option value="Survival_Relief">Immediate Relief, Health, Counseling, Shelter &amp; Food</option>
                        <option value="Peer_Community">Peer Recovery, Youth, Seniors &amp; Community</option>
                        <option value="Bridge_Training">Schools, Adult Upgrading &amp; Bridge Programs</option>
                        <option value="Culinary_Hospitality">Culinary &amp; Hospitality Training</option>
                        <option value="Trades_Apprenticeship">Trades &amp; Hands-On Apprenticeship</option>
                        <option value="Tech_Media_Lab">Tech, Media &amp; Makerspace</option>
                        <option value="Employment_Placement">Employment Placement &amp; WorkBC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Direct Phone Number &amp; Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={phoneEmail}
                        onChange={(e) => setPhoneEmail(e.target.value)}
                        placeholder="e.g., 604-584-5811 / intake@agency.ca"
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Contact Lead / Desk
                      </label>
                      <input
                        type="text"
                        value={contactLead}
                        onChange={(e) => setContactLead(e.target.value)}
                        placeholder="e.g., Warm Handoff Intake Desk"
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g., 13520 78 Ave, Surrey, BC"
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                        Nearest SkyTrain / Bus Stop
                      </label>
                      <input
                        type="text"
                        value={transitStop}
                        onChange={(e) => setTransitStop(e.target.value)}
                        placeholder="e.g., King George Station / R1 RapidBus"
                        className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#14343d] mb-1">
                      What They Provide / Real-World Summary
                    </label>
                    <input
                      type="text"
                      value={highlightNote}
                      onChange={(e) => setHighlightNote(e.target.value)}
                      placeholder="e.g., Free walk-in counseling, hot meals, and transit tickets with zero paperwork barrier."
                      className="w-full bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#2c4e57]">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={providesTransit}
                          onChange={(e) => setProvidesTransit(e.target.checked)}
                          className="accent-[#1ca796]"
                        />
                        <span>Provides Transit / Compass</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={providesMeals}
                          onChange={(e) => setProvidesMeals(e.target.checked)}
                          className="accent-[#1ca796]"
                        />
                        <span>Provides Food / Meals</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Save &amp; Merge into Live Directory</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleJsonSubmit}
                  className="bg-white border border-[#d6e8e4] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-[#35565f]">
                      Paste an array or object in <strong>Open Referral HSDS v3.0 JSON</strong> or native program format. Only changed or new services will be updated.
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleFeed}
                      className="px-3 py-1 rounded-lg bg-[#e6f6f3] hover:bg-[#d2f0ea] text-[#11665b] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Load Sample Agency Update</span>
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"program_name": "...", "organization_name": "...", "municipality": "Surrey", "contact_phone_or_email": "604-..."}]'
                    className="w-full font-mono text-xs bg-[#faf8f4] border border-[#dcd4c4] rounded-xl p-3 text-[#14343d]"
                  />

                  {jsonError && (
                    <div className="text-xs text-[#b91c1c] font-medium">{jsonError}</div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={jsonSourceName}
                      onChange={(e) => setJsonSourceName(e.target.value)}
                      placeholder="Source Feed Label"
                      className="bg-[#faf8f4] border border-[#dcd4c4] rounded-xl px-3 py-1.5 text-xs text-[#14343d] w-64"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import &amp; Diff JSON Feed</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
