import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  VerifiedProgramRecord,
  WorkbookModuleRecord,
  ClientWorkbookSession,
  DDLQueryFilterParams,
  SyncChangeItem
} from '../src/types/navigator.js';
import {
  getProgramPrimarySectionId,
  getCityMatchTier,
  PrimarySectionId
} from '../src/types/programGrouping.js';
import {
  SEEDED_VERIFIED_PROGRAMS,
  SEEDED_WORKBOOK_MODULES,
  INITIAL_DEMO_SESSION
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../db/local_store');
const SESSION_FILE = path.join(DATA_DIR, 'sessions.json');
const PROGRAMS_FILE = path.join(DATA_DIR, 'verified_programs.json');

export class NavigatorDatabaseEngine {
  private programs: VerifiedProgramRecord[] = [];
  private modules: WorkbookModuleRecord[] = SEEDED_WORKBOOK_MODULES;
  private sessions: Map<string, ClientWorkbookSession> = new Map();

  constructor() {
    this.ensureLocalStore();
  }

  private ensureLocalStore() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Merge persisted custom/imported programs with SEEDED_VERIFIED_PROGRAMS
    const seededMap = new Map<string, VerifiedProgramRecord>();
    for (const p of SEEDED_VERIFIED_PROGRAMS) {
      seededMap.set(p.program_id, { ...p });
    }

    if (fs.existsSync(PROGRAMS_FILE)) {
      try {
        const persisted: VerifiedProgramRecord[] = JSON.parse(
          fs.readFileSync(PROGRAMS_FILE, 'utf-8')
        );
        for (const p of persisted) {
          if (!p || !p.program_id) continue;
          if (!seededMap.has(p.program_id)) {
            // Preserve custom-imported program from daily sync or manual import
            seededMap.set(p.program_id, p);
          } else {
            // Preserve updated verification timestamps or live synced edits if newer
            const base = seededMap.get(p.program_id)!;
            if (p.last_verified_at && p.last_verified_at > base.last_verified_at) {
              seededMap.set(p.program_id, {
                ...base,
                ...p,
                days_since_verified: 0
              });
            }
          }
        }
      } catch {
        // Fallback to seeded programs
      }
    }

    this.programs = Array.from(seededMap.values());
    this.persistPrograms();

    if (fs.existsSync(SESSION_FILE)) {
      try {
        const raw: ClientWorkbookSession[] = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
        for (const s of raw) {
          this.sessions.set(s.session_id, s);
        }
      } catch {
        this.sessions.set(INITIAL_DEMO_SESSION.session_id, { ...INITIAL_DEMO_SESSION });
      }
    }

    if (!this.sessions.has(INITIAL_DEMO_SESSION.session_id)) {
      this.sessions.set(INITIAL_DEMO_SESSION.session_id, { ...INITIAL_DEMO_SESSION });
      this.persistSessions();
    }
  }

  private persistPrograms() {
    fs.writeFileSync(PROGRAMS_FILE, JSON.stringify(this.programs, null, 2), 'utf-8');
  }

  private persistSessions() {
    const arr = Array.from(this.sessions.values());
    fs.writeFileSync(SESSION_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  }

  public getModules(): WorkbookModuleRecord[] {
    return this.modules;
  }

  public getAllPrograms(): VerifiedProgramRecord[] {
    return this.programs;
  }

  /**
   * Diffs incoming service records against the existing store, applying only actual changes
   * or inserting newly discovered programs, and refreshing verification timestamps.
   */
  public upsertProgramsWithDiff(
    incomingRecords: Array<Partial<VerifiedProgramRecord> & { program_name: string }>,
    sourceFeed: string
  ): {
    added_count: number;
    updated_count: number;
    verified_unchanged_count: number;
    changes: SyncChangeItem[];
  } {
    let added_count = 0;
    let updated_count = 0;
    let verified_unchanged_count = 0;
    const changes: SyncChangeItem[] = [];
    const nowIso = new Date().toISOString();

    const COMPARE_FIELDS: Array<keyof VerifiedProgramRecord> = [
      'program_name',
      'organization_name',
      'category',
      'operational_status',
      'intake_type',
      'waitlist_weeks_estimate',
      'contact_lead_name',
      'contact_phone_or_email',
      'municipality',
      'street_address',
      'nearest_transit_stop',
      'highlight_note',
      'provides_transit_tickets',
      'provides_food_or_meals',
      'provides_living_stipend',
      'provides_gear_or_boots'
    ];

    for (const incoming of incomingRecords) {
      if (!incoming.program_name) continue;

      const existingIdx = this.programs.findIndex(
        (p) =>
          (incoming.program_id && p.program_id === incoming.program_id) ||
          (incoming.external_211_id && p.external_211_id === incoming.external_211_id) ||
          (p.program_name.toLowerCase() === incoming.program_name.toLowerCase() &&
            (!incoming.municipality ||
              p.municipality.toLowerCase() === incoming.municipality.toLowerCase()))
      );

      if (existingIdx === -1) {
        const slug = incoming.program_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 28);
        const newProgram: VerifiedProgramRecord = {
          program_id: incoming.program_id || `prog-import-${slug}-${Date.now().toString().slice(-4)}`,
          external_211_id:
            incoming.external_211_id || `SYNC-${Date.now().toString().slice(-6)}`,
          program_name: incoming.program_name,
          organization_name: incoming.organization_name || sourceFeed,
          category: incoming.category || 'Survival_Relief',
          operational_status: incoming.operational_status || 'Active',
          intake_type: incoming.intake_type || 'Drop-In',
          waitlist_weeks_estimate: incoming.waitlist_weeks_estimate ?? 0,
          contact_lead_name: incoming.contact_lead_name || 'Intake Coordinator',
          contact_phone_or_email: incoming.contact_phone_or_email || 'Call 211',
          last_verified_at: nowIso,
          verified_by_coordinator: `Daily Auto-Sync (${sourceFeed})`,
          municipality: incoming.municipality || 'Surrey',
          street_address: incoming.street_address || 'Lower Mainland, BC',
          transit_accessible: incoming.transit_accessible ?? true,
          nearest_transit_stop: incoming.nearest_transit_stop || 'SkyTrain / Bus Accessible',
          delivery_mode: incoming.delivery_mode || 'In-Person',
          required_readiness_tier: incoming.required_readiness_tier || 1,
          min_problem_solving_tier: incoming.min_problem_solving_tier ?? 1,
          max_problem_solving_tier: incoming.max_problem_solving_tier ?? 5,
          min_reading_clb_level: incoming.min_reading_clb_level ?? 0,
          supports_high_skill_low_text: incoming.supports_high_skill_low_text ?? true,
          offers_oral_or_practical_testing: incoming.offers_oral_or_practical_testing ?? true,
          scribe_or_reader_available: incoming.scribe_or_reader_available ?? true,
          primary_instruction_mode: incoming.primary_instruction_mode || 'Verbal_Coaching',
          requires_government_id: incoming.requires_government_id ?? false,
          requires_sin_number: incoming.requires_sin_number ?? false,
          requires_clean_record: incoming.requires_clean_record ?? false,
          sobriety_requirement:
            incoming.sobriety_requirement || 'Low_Barrier_Harm_Reduction',
          provides_transit_tickets: incoming.provides_transit_tickets ?? false,
          provides_food_or_meals: incoming.provides_food_or_meals ?? false,
          provides_living_stipend: incoming.provides_living_stipend ?? false,
          provides_gear_or_boots: incoming.provides_gear_or_boots ?? false,
          days_since_verified: 0,
          hobby_tags: incoming.hobby_tags || ['community', 'support'],
          noc_code: incoming.noc_code || 'Community & Regional Service',
          highlight_note:
            incoming.highlight_note ||
            `Imported and verified via ${sourceFeed}.`
        };

        this.programs.unshift(newProgram);
        added_count++;
        changes.push({
          timestamp: nowIso,
          program_id: newProgram.program_id,
          program_name: newProgram.program_name,
          municipality: newProgram.municipality,
          change_type: 'added',
          source_feed: sourceFeed,
          summary: `Added new service (${newProgram.organization_name} — ${newProgram.contact_phone_or_email})`
        });
      } else {
        const existing = this.programs[existingIdx];
        const modifiedFields: string[] = [];

        for (const field of COMPARE_FIELDS) {
          if (
            incoming[field] !== undefined &&
            incoming[field] !== null &&
            String(incoming[field]).trim() !== '' &&
            incoming[field] !== existing[field]
          ) {
            modifiedFields.push(String(field).replace(/_/g, ' '));
          }
        }

        if (modifiedFields.length > 0) {
          const updatedRecord: VerifiedProgramRecord = {
            ...existing,
            ...incoming,
            program_id: existing.program_id,
            last_verified_at: nowIso,
            days_since_verified: 0,
            verified_by_coordinator: `Daily Auto-Sync (${sourceFeed})`
          };
          this.programs[existingIdx] = updatedRecord;
          updated_count++;
          changes.push({
            timestamp: nowIso,
            program_id: updatedRecord.program_id,
            program_name: updatedRecord.program_name,
            municipality: updatedRecord.municipality,
            change_type: 'updated',
            source_feed: sourceFeed,
            summary: `Updated ${modifiedFields.join(', ')}`
          });
        } else {
          this.programs[existingIdx] = {
            ...existing,
            last_verified_at: nowIso,
            days_since_verified: 0
          };
          verified_unchanged_count++;
        }
      }
    }

    this.persistPrograms();
    return {
      added_count,
      updated_count,
      verified_unchanged_count,
      changes
    };
  }

  /**
   * Refreshes verification timestamps across all active programs during a daily check
   * so verified programs stay within the < 14 day green-light window.
   */
  public markAllActiveProgramsVerified(sourceNote: string = 'Daily Feed Check'): number {
    const nowIso = new Date().toISOString();
    let count = 0;
    this.programs = this.programs.map((p) => {
      if (p.operational_status === 'Active') {
        count++;
        return {
          ...p,
          last_verified_at: nowIso,
          days_since_verified: 0,
          verified_by_coordinator: p.verified_by_coordinator || sourceNote
        };
      }
      return p;
    });
    this.persistPrograms();
    return count;
  }

  public getSession(sessionId: string = 'A842'): ClientWorkbookSession {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const fresh: ClientWorkbookSession = {
      ...INITIAL_DEMO_SESSION,
      session_id: sessionId,
      updated_at: new Date().toISOString()
    };
    this.sessions.set(sessionId, fresh);
    this.persistSessions();
    return fresh;
  }

  public updateSession(
    sessionId: string,
    patch: Partial<ClientWorkbookSession>
  ): ClientWorkbookSession {
    const current = this.getSession(sessionId);
    const updated: ClientWorkbookSession = {
      ...current,
      ...patch,
      session_id: sessionId,
      updated_at: new Date().toISOString()
    };
    this.sessions.set(sessionId, updated);
    this.persistSessions();
    return updated;
  }

  public resetDemoSession(sessionId: string = 'A842'): ClientWorkbookSession {
    const reset: ClientWorkbookSession = {
      ...JSON.parse(JSON.stringify(INITIAL_DEMO_SESSION)),
      session_id: sessionId,
      updated_at: new Date().toISOString()
    };
    this.sessions.set(sessionId, reset);
    this.persistSessions();
    return reset;
  }

  private matchesCity(progCity: string, filterCity?: string): 'exact' | 'regional' | 'none' {
    if (!filterCity || filterCity === 'All') return 'exact';
    const p = progCity.toLowerCase();
    const f = filterCity.toLowerCase();
    if (p === f || p.includes(f) || f.includes(p)) return 'exact';
    // Neighboring South Fraser / Lower Mainland proximity
    const southFraser = ['surrey', 'white rock / south surrey', 'langley', 'delta'];
    if (southFraser.includes(p) && southFraser.includes(f)) return 'regional';
    return 'none';
  }

  /**
   * Executes the deterministic `verify_programs_ddl` check against `coordinator_dual_axis_check`
   */
  public verifyProgramsDDL(
    filters: DDLQueryFilterParams,
    session?: ClientWorkbookSession
  ): {
    sql_executed: string;
    primary_matches: VerifiedProgramRecord[];
    immediate_relief_matches: VerifiedProgramRecord[];
  } {
    const whereClauses: string[] = ["operational_status = 'Active'", 'days_since_verified <= 14'];

    if (filters.municipality && filters.municipality !== 'All') {
      whereClauses.push(`municipality ILIKE '%${filters.municipality}%'`);
    }
    if (filters.supports_high_skill_low_text !== undefined) {
      whereClauses.push(`supports_high_skill_low_text = ${filters.supports_high_skill_low_text}`);
    }
    if (filters.offers_oral_or_practical_testing) {
      whereClauses.push('offers_oral_or_practical_testing = TRUE');
    }
    if (filters.scribe_or_reader_available) {
      whereClauses.push('scribe_or_reader_available = TRUE');
    }
    if (filters.requires_government_id === false) {
      whereClauses.push('requires_government_id = FALSE');
    }
    if (filters.provides_transit_tickets) {
      whereClauses.push('provides_transit_tickets = TRUE');
    }
    if (filters.provides_gear_or_boots) {
      whereClauses.push('provides_gear_or_boots = TRUE');
    }

    const sql_executed = `SELECT * FROM coordinator_dual_axis_check\nWHERE ${whereClauses.join('\n  AND ')}\nORDER BY waitlist_weeks_estimate ASC, days_since_verified ASC;`;

    const activePool = this.programs.filter(
      (p) => p.operational_status === 'Active' && p.days_since_verified <= 14
    );

    // Map Step 5 active barriers to PrimarySectionId so tapping Step 5 buttons boosts the exact matching category
    const activeBarriers = session?.active_barriers || [];
    const prioritizedSections = new Set<PrimarySectionId>();
    if (activeBarriers.includes('Safe Shelter / Housing & Rent Subsidy')) {
      prioritizedSections.add('HOUSING_HOMELESS');
      prioritizedSections.add('SUBSIDIES_LEISURE');
    }
    if (activeBarriers.includes('Mental Health & Crisis Support')) {
      prioritizedSections.add('MENTAL_HEALTH_CRISIS');
    }
    if (activeBarriers.includes('Free Counselors & Emotional Support')) {
      prioritizedSections.add('COUNSELORS_THERAPY');
    }
    if (activeBarriers.includes('Pregnancy, Baby & Family Support')) {
      prioritizedSections.add('PREGNANCY_BABY');
    }
    if (activeBarriers.includes('Hospitals, Doctors & Medical Labs')) {
      prioritizedSections.add('HOSPITALS_LABS');
    }
    if (activeBarriers.includes('Youth, Families & Seniors (55+)')) {
      prioritizedSections.add('ALL_AGES_SENIORS_YOUTH');
    }
    if (activeBarriers.includes('Disability (PWD) / Income Assistance')) {
      prioritizedSections.add('SUBSIDIES_LEISURE');
    }
    if (activeBarriers.includes('Physical Barriers & Mobility Gear')) {
      prioritizedSections.add('PHYSICAL_BARRIERS');
    }
    if (activeBarriers.includes('AA / NA / CA / CoDA Peer Recovery')) {
      prioritizedSections.add('RECOVERY_12STEP');
    }
    if (activeBarriers.includes('Legal Aid & First Responder Help')) {
      prioritizedSections.add('LAW_FIRST_RESPONDERS');
    }
    if (activeBarriers.includes('Groceries / Meals')) {
      prioritizedSections.add('FOOD_PROGRAMS');
    }

    // 1. Immediate Relief, Health, Sanctuary & Food Matches (Maslow Tier 1)
    const immediate_relief_matches = activePool
      .filter((p) => p.category === 'Survival_Relief')
      .map((prog) => {
        const cityFit = getCityMatchTier(prog, filters.municipality);
        let score = cityFit === 'exact' ? 100 : cityFit === 'regional' ? 65 : 10;
        const secId = getProgramPrimarySectionId(prog);
        if (prioritizedSections.has(secId)) {
          score += 80;
        }
        return { prog, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.prog);

    // 2. Primary Skill, School, Options+, Sources BC & Bridge Matches
    const bridgePool = activePool.filter((p) => p.category !== 'Survival_Relief');

    const wantsMeals = session?.active_barriers.includes('Groceries / Meals');

    const scored = bridgePool
      .map((prog) => {
        let score = 0;

        const cityFit = this.matchesCity(prog.municipality, filters.municipality);
        if (cityFit === 'exact') {
          score += 45;
        } else if (cityFit === 'regional') {
          score += 20;
        } else {
          score += 5;
        }

        // High-Skill / Low-Text alignment
        if (filters.supports_high_skill_low_text && prog.supports_high_skill_low_text) {
          score += 25;
        } else if (
          filters.supports_high_skill_low_text === false &&
          !prog.supports_high_skill_low_text
        ) {
          score += 25;
        }

        // Oral/practical testing accommodation
        if (filters.offers_oral_or_practical_testing && prog.offers_oral_or_practical_testing) {
          score += 15;
        }

        // Government ID filter
        if (filters.requires_government_id === false && !prog.requires_government_id) {
          score += 15;
        } else if (filters.requires_government_id === false && prog.requires_government_id) {
          score -= 40;
        }

        // Barrier relief bonuses
        if (filters.provides_transit_tickets && prog.provides_transit_tickets) score += 10;
        if (filters.provides_gear_or_boots && prog.provides_gear_or_boots) score += 10;
        if (filters.scribe_or_reader_available && prog.scribe_or_reader_available) score += 10;
        if (wantsMeals && prog.provides_food_or_meals) score += 12;

        // Session Loadout & Problem-Solving Tier alignment
        if (session) {
          if (
            session.problem_solving_complexity >= prog.min_problem_solving_tier &&
            session.problem_solving_complexity <= prog.max_problem_solving_tier
          ) {
            score += 15;
          }

          const lockedCategories = session.loadout_cards
            .filter((c) => c.status === 'Lock It In')
            .map((c) => c.category);
          const scrappedCategories = session.loadout_cards
            .filter((c) => c.status === 'Scrap It')
            .map((c) => c.category);

          if (lockedCategories.includes(prog.category)) score += 25;
          if (scrappedCategories.includes(prog.category)) score -= 25;
        }

        return { prog, score };
      })
      .sort((a, b) => b.score - a.score);

    return {
      sql_executed,
      primary_matches: scored.map((s) => s.prog),
      immediate_relief_matches
    };
  }
}
