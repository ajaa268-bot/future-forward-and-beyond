import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  VerifiedProgramRecord,
  WorkbookModuleRecord,
  ClientWorkbookSession,
  DDLQueryFilterParams
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

    // Always sync with SEEDED_VERIFIED_PROGRAMS so newly added agencies, schools, and food hubs are present
    this.programs = [...SEEDED_VERIFIED_PROGRAMS];
    fs.writeFileSync(PROGRAMS_FILE, JSON.stringify(this.programs, null, 2), 'utf-8');

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
