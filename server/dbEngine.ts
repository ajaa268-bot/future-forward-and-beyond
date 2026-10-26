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

    if (fs.existsSync(PROGRAMS_FILE)) {
      try {
        this.programs = JSON.parse(fs.readFileSync(PROGRAMS_FILE, 'utf-8'));
      } catch {
        this.programs = [...SEEDED_VERIFIED_PROGRAMS];
      }
    } else {
      this.programs = [...SEEDED_VERIFIED_PROGRAMS];
      fs.writeFileSync(PROGRAMS_FILE, JSON.stringify(this.programs, null, 2), 'utf-8');
    }

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

  /**
   * Executes the deterministic `verify_programs_ddl` check against `coordinator_dual_axis_check`
   * Mirrors the PostgreSQL view + parameterized filtering in Part 7 & Part 8.2
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
      whereClauses.push(`municipality ILIKE '${filters.municipality}'`);
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

    // Filter active & verified < 14 days
    const activePool = this.programs.filter(
      (p) => p.operational_status === 'Active' && p.days_since_verified <= 14
    );

    // 1. Immediate Relief Matches (Maslow Tier 1)
    const immediate_relief_matches = activePool.filter(
      (p) =>
        p.category === 'Survival_Relief' &&
        (!filters.municipality ||
          filters.municipality === 'All' ||
          p.municipality.toLowerCase() === filters.municipality.toLowerCase() ||
          p.municipality === 'Surrey')
    );

    // 2. Primary Bridge / Skill Matches scored by Dual-Axis & Barrier fit
    const bridgePool = activePool.filter((p) => p.category !== 'Survival_Relief');

    const scored = bridgePool
      .map((prog) => {
        let score = 0;

        // Municipality match
        if (
          filters.municipality &&
          filters.municipality !== 'All' &&
          prog.municipality.toLowerCase() === filters.municipality.toLowerCase()
        ) {
          score += 30;
        } else if (!filters.municipality || filters.municipality === 'All') {
          score += 15;
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

        // Government ID filter (hard barrier avoidance)
        if (filters.requires_government_id === false && !prog.requires_government_id) {
          score += 15;
        } else if (filters.requires_government_id === false && prog.requires_government_id) {
          score -= 40;
        }

        // Barrier relief bonuses
        if (filters.provides_transit_tickets && prog.provides_transit_tickets) score += 10;
        if (filters.provides_gear_or_boots && prog.provides_gear_or_boots) score += 10;
        if (filters.scribe_or_reader_available && prog.scribe_or_reader_available) score += 10;

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
          if (scrappedCategories.includes(prog.category)) score -= 35;
        }

        return { prog, score };
      })
      .filter((item) => item.score > 10)
      .sort((a, b) => b.score - a.score);

    return {
      sql_executed,
      primary_matches: scored.map((s) => s.prog),
      immediate_relief_matches
    };
  }
}
