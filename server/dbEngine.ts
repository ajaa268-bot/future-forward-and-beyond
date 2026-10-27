import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  VerifiedProgramRecord,
  WorkbookModuleRecord,
  ClientWorkbookSession,
  DDLQueryFilterParams,
  SyncChangeItem,
  PublicClientProfileSummary,
  ClientRegistrationPayload,
  AuthSecurityStatus
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
const SESSION_BACKUP_FILE = path.join(DATA_DIR, 'sessions.backup.json');
const AUTH_TOKENS_FILE = path.join(DATA_DIR, 'auth_tokens.json');
const AUTH_SECRET_FILE = path.join(DATA_DIR, 'auth_secret.key');
const PROGRAMS_FILE = path.join(DATA_DIR, 'verified_programs.json');

interface StoredAuthTokenRecord {
  token_id: string;
  session_id: string;
  issued_at: string;
  expires_at: string;
  remember_device: boolean;
  last_seen_at: string;
}

interface FailedLoginTracker {
  count: number;
  first_failed_at: number;
  locked_until: number;
}

export class NavigatorDatabaseEngine {
  private programs: VerifiedProgramRecord[] = [];
  private modules: WorkbookModuleRecord[] = SEEDED_WORKBOOK_MODULES;
  private sessions: Map<string, ClientWorkbookSession> = new Map();
  private authTokens: Map<string, StoredAuthTokenRecord> = new Map();
  private failedLogins: Map<string, FailedLoginTracker> = new Map();
  private hmacSecret: string = '';

  constructor() {
    this.ensureLocalStore();
  }

  private hashSecret(secret: string, saltHex?: string): { hash: string; salt: string } {
    const salt = saltHex || crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(secret. normalize('NFKC'), salt, 64);
    return {
      hash: derived.toString('hex'),
      salt
    };
  }

  private verifySecret(candidate: string, storedHash?: string, storedSalt?: string): boolean {
    if (!storedHash || !storedSalt) return false;
    try {
      const candidateBuf = crypto.scryptSync(candidate.normalize('NFKC'), storedSalt, 64);
      const storedBuf = Buffer.from(storedHash, 'hex');
      if (candidateBuf.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(candidateBuf, storedBuf);
    } catch {
      return false;
    }
  }

  private writeJsonAtomic(filePath: string, data: unknown, backupPath?: string) {
    const serialized = JSON.stringify(data, null, 2);
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, serialized, { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tmpPath, filePath);
    if (backupPath) {
      try {
        fs.writeFileSync(backupPath, serialized, { encoding: 'utf-8', mode: 0o600 });
      } catch {
        // ignore backup error
      }
    }
  }

  private ensureLocalStore() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }

    // Load or generate persistent 256-bit HMAC server signing key
    if (fs.existsSync(AUTH_SECRET_FILE)) {
      try {
        this.hmacSecret = fs.readFileSync(AUTH_SECRET_FILE, 'utf-8').trim();
      } catch {
        this.hmacSecret = '';
      }
    }
    if (!this.hmacSecret || this.hmacSecret.length < 32) {
      this.hmacSecret =
        process.env.AUTH_HMAC_SECRET || crypto.randomBytes(32).toString('hex');
      try {
        fs.writeFileSync(AUTH_SECRET_FILE, this.hmacSecret, { encoding: 'utf-8', mode: 0o600 });
      } catch {
        // ignore
      }
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
            seededMap.set(p.program_id, p);
          } else {
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

    // Load sessions from primary store or automatic backup store
    let rawSessions: ClientWorkbookSession[] | null = null;
    for (const candidateFile of [SESSION_FILE, SESSION_BACKUP_FILE]) {
      if (fs.existsSync(candidateFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(candidateFile, 'utf-8'));
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawSessions = parsed;
            break;
          }
        } catch {
          // try backup
        }
      }
    }

    let migratedHashes = false;
    if (rawSessions) {
      for (const s of rawSessions) {
        const nowIso = new Date().toISOString();
        let pinHash = s.pin_hash;
        let pinSalt = s.pin_salt;

        // Migrate any legacy plaintext pin_code into salted scrypt hash and wipe plaintext
        if (!s.is_guest && (!pinHash || !pinSalt)) {
          const rawPin = s.pin_code || '1234';
          const hashed = this.hashSecret(rawPin);
          pinHash = hashed.hash;
          pinSalt = hashed.salt;
          migratedHashes = true;
        }

        // Ensure default recovery phrase hash on demo account A842 if not yet set
        let recHash = s.recovery_phrase_hash;
        let recSalt = s.recovery_phrase_salt;
        if (s.session_id === 'A842' && (!recHash || !recSalt)) {
          const rec = this.hashSecret('harbor');
          recHash = rec.hash;
          recSalt = rec.salt;
          migratedHashes = true;
        }

        const cleanSession: ClientWorkbookSession = {
          ...s,
          pin_code: undefined,
          pin_hash: pinHash,
          pin_salt: pinSalt,
          recovery_phrase_hash: recHash,
          recovery_phrase_salt: recSalt,
          pin_recovery_hint: s.pin_recovery_hint || 'Private recovery phrase protected',
          avatar_icon: s.avatar_icon || 'Waves',
          age_group: s.age_group || 'Adult (25–54)',
          is_guest: Boolean(s.is_guest),
          account_created_at: s.account_created_at || s.updated_at || nowIso,
          last_login_at: s.last_login_at || s.updated_at || nowIso
        };
        if (s.pin_code !== undefined) {
          migratedHashes = true;
        }
        this.sessions.set(s.session_id, cleanSession);
      }
    }

    if (!this.sessions.has(INITIAL_DEMO_SESSION.session_id)) {
      const demoPin = this.hashSecret(INITIAL_DEMO_SESSION.pin_code || '1234');
      const demoRec = this.hashSecret('harbor');
      const nowIso = new Date().toISOString();
      this.sessions.set(INITIAL_DEMO_SESSION.session_id, {
        ...INITIAL_DEMO_SESSION,
        pin_code: undefined,
        pin_hash: demoPin.hash,
        pin_salt: demoPin.salt,
        recovery_phrase_hash: demoRec.hash,
        recovery_phrase_salt: demoRec.salt,
        account_created_at: nowIso,
        last_login_at: nowIso
      });
      migratedHashes = true;
    }

    if (migratedHashes) {
      this.persistSessions();
    }

    // Load persisted auth tokens for long-term session retention across server restarts
    if (fs.existsSync(AUTH_TOKENS_FILE)) {
      try {
        const rawTokens: StoredAuthTokenRecord[] = JSON.parse(
          fs.readFileSync(AUTH_TOKENS_FILE, 'utf-8')
        );
        const now = Date.now();
        for (const t of rawTokens) {
          if (t && t.token_id && new Date(t.expires_at).getTime() > now) {
            this.authTokens.set(t.token_id, t);
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private persistPrograms() {
    this.writeJsonAtomic(PROGRAMS_FILE, this.programs);
  }

  private persistSessions() {
    const arr = Array.from(this.sessions.values()).map((s) => ({
      ...s,
      pin_code: undefined
    }));
    this.writeJsonAtomic(SESSION_FILE, arr, SESSION_BACKUP_FILE);
  }

  private persistAuthTokens() {
    const now = Date.now();
    const active = Array.from(this.authTokens.values()).filter(
      (t) => new Date(t.expires_at).getTime() > now
    );
    this.writeJsonAtomic(AUTH_TOKENS_FILE, active);
  }

  /**
   * Strips sensitive cryptographic hashes and PIN fields before sending a session to any client.
   */
  public sanitizeSession(session: ClientWorkbookSession): ClientWorkbookSession {
    const copy: ClientWorkbookSession = {
      ...session,
      pin_code: undefined,
      pin_hash: undefined,
      pin_salt: undefined,
      recovery_phrase_hash: undefined,
      recovery_phrase_salt: undefined
    };
    delete copy.pin_code;
    delete copy.pin_hash;
    delete copy.pin_salt;
    delete copy.recovery_phrase_hash;
    delete copy.recovery_phrase_salt;
    return copy;
  }

  public getAuthSecurityStatus(
    session: ClientWorkbookSession,
    tokenRecord?: StoredAuthTokenRecord | null
  ): AuthSecurityStatus {
    return {
      authenticated: !session.is_guest,
      auth_mode: session.is_guest ? 'guest_anonymous' : 'private_pin_token',
      token_expires_at: tokenRecord?.expires_at,
      remember_device: tokenRecord?.remember_device ?? true,
      account_created_at: session.account_created_at || session.updated_at,
      last_login_at: session.last_login_at || session.updated_at,
      pin_hashed: Boolean(session.pin_hash && session.pin_salt),
      has_recovery_phrase: Boolean(
        session.recovery_phrase_hash && session.recovery_phrase_salt
      ),
      retention_status: 'durable_retained'
    };
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
    const nowIso = new Date().toISOString();
    const demoPin = this.hashSecret('1234');
    const fresh: ClientWorkbookSession = {
      ...INITIAL_DEMO_SESSION,
      pin_code: undefined,
      pin_hash: demoPin.hash,
      pin_salt: demoPin.salt,
      session_id: sessionId,
      account_created_at: nowIso,
      last_login_at: nowIso,
      updated_at: nowIso
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
    // Prevent external patches from overwriting security hashes
    const {
      pin_code: _ignorePin,
      pin_hash: _ignoreHash,
      pin_salt: _ignoreSalt,
      recovery_phrase_hash: _ignoreRecHash,
      recovery_phrase_salt: _ignoreRecSalt,
      ...safePatch
    } = patch;

    const updated: ClientWorkbookSession = {
      ...current,
      ...safePatch,
      pin_code: undefined,
      pin_hash: current.pin_hash,
      pin_salt: current.pin_salt,
      recovery_phrase_hash: current.recovery_phrase_hash,
      recovery_phrase_salt: current.recovery_phrase_salt,
      session_id: sessionId,
      updated_at: new Date().toISOString()
    };
    this.sessions.set(sessionId, updated);
    this.persistSessions();
    return updated;
  }

  public resetDemoSession(sessionId: string = 'A842'): ClientWorkbookSession {
    const existing = this.sessions.get(sessionId);
    const demoPin = this.hashSecret('1234');
    const reset: ClientWorkbookSession = {
      ...JSON.parse(JSON.stringify(INITIAL_DEMO_SESSION)),
      session_id: sessionId,
      client_alias: existing?.client_alias || INITIAL_DEMO_SESSION.client_alias,
      pin_code: undefined,
      pin_hash: existing?.pin_hash || demoPin.hash,
      pin_salt: existing?.pin_salt || demoPin.salt,
      recovery_phrase_hash: existing?.recovery_phrase_hash,
      recovery_phrase_salt: existing?.recovery_phrase_salt,
      pin_recovery_hint: existing?.pin_recovery_hint || INITIAL_DEMO_SESSION.pin_recovery_hint,
      avatar_icon: existing?.avatar_icon || INITIAL_DEMO_SESSION.avatar_icon,
      age_group: existing?.age_group || INITIAL_DEMO_SESSION.age_group,
      is_guest: existing?.is_guest || false,
      account_created_at: existing?.account_created_at || new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.sessions.set(sessionId, reset);
    this.persistSessions();
    return reset;
  }

  /**
   * Client names and profiles are strictly PRIVATE.
   * Never publicly broadcast or enumerate registered client names on the login screen.
   */
  public listClientProfiles(): PublicClientProfileSummary[] {
    return [];
  }

  /**
   * Issues an HMAC-SHA256 signed authentication token with durable server-side retention.
   * - Personal device (`rememberDevice = true`): 30-day sliding retention
   * - Shared / public kiosk (`rememberDevice = false`): 12-hour retention
   */
  public issueAuthToken(
    sessionId: string,
    rememberDevice: boolean = true
  ): { auth_token: string; expires_at: string; record: StoredAuthTokenRecord } {
    const tokenId = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const ttlMs = rememberDevice ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const issuedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + ttlMs).toISOString();

    const payloadPart = Buffer.from(
      JSON.stringify({ tid: tokenId, sid: sessionId, exp: expiresAt })
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payloadPart)
      .digest('base64url');
    const signedToken = `${payloadPart}.${signature}`;

    const record: StoredAuthTokenRecord = {
      token_id: tokenId,
      session_id: sessionId,
      issued_at: issuedAt,
      expires_at: expiresAt,
      remember_device: rememberDevice,
      last_seen_at: issuedAt
    };

    this.authTokens.set(tokenId, record);
    this.persistAuthTokens();
    return { auth_token: signedToken, expires_at: expiresAt, record };
  }

  /**
   * Verifies an HMAC-SHA256 Bearer token and slides its retention window if valid.
   */
  public verifyAuthToken(rawToken?: string | null): {
    valid: boolean;
    session?: ClientWorkbookSession;
    record?: StoredAuthTokenRecord;
  } {
    if (!rawToken || !rawToken.includes('.')) {
      return { valid: false };
    }
    const [payloadPart, sigPart] = rawToken.trim().split('.');
    if (!payloadPart || !sigPart) return { valid: false };

    const expectedSig = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payloadPart)
      .digest('base64url');

    try {
      const sigBuf = Buffer.from(sigPart);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { valid: false };
      }

      const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
      const record = this.authTokens.get(decoded.tid);
      if (!record) return { valid: false };

      const now = Date.now();
      if (new Date(record.expires_at).getTime() <= now) {
        this.authTokens.delete(record.token_id);
        this.persistAuthTokens();
        return { valid: false };
      }

      const session = this.sessions.get(record.session_id);
      if (!session) return { valid: false };

      // Slide expiration window if remember_device is enabled
      if (record.remember_device) {
        record.last_seen_at = new Date(now).toISOString();
        record.expires_at = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
        this.authTokens.set(record.token_id, record);
        this.persistAuthTokens();
      }

      return { valid: true, session, record };
    } catch {
      return { valid: false };
    }
  }

  public revokeAuthToken(rawToken?: string | null): boolean {
    if (!rawToken || !rawToken.includes('.')) return false;
    try {
      const [payloadPart] = rawToken.trim().split('.');
      const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
      if (decoded?.tid && this.authTokens.has(decoded.tid)) {
        this.authTokens.delete(decoded.tid);
        this.persistAuthTokens();
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  private checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
    const now = Date.now();
    const entry = this.failedLogins.get(key);
    if (!entry) return { allowed: true };

    if (entry.locked_until > now) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((entry.locked_until - now) / 1000)
      };
    }

    // Reset window if > 10 minutes since first failure
    if (now - entry.first_failed_at > 10 * 60 * 1000) {
      this.failedLogins.delete(key);
      return { allowed: true };
    }

    return { allowed: true };
  }

  private recordFailedAttempt(key: string): { locked: boolean; attemptsRemaining: number } {
    const now = Date.now();
    const existing = this.failedLogins.get(key);
    const count = existing ? existing.count + 1 : 1;
    const firstFailed = existing ? existing.first_failed_at : now;
    const maxAttempts = 5;
    const lockedUntil = count >= maxAttempts ? now + 5 * 60 * 1000 : 0;

    this.failedLogins.set(key, {
      count,
      first_failed_at: firstFailed,
      locked_until: lockedUntil
    });

    return {
      locked: count >= maxAttempts,
      attemptsRemaining: Math.max(0, maxAttempts - count)
    };
  }

  /**
   * Authenticates a client privately using their nickname or session ID and secret PIN.
   * Uses salted scrypt hashing + timingSafeEqual and brute-force rate limiting.
   */
  public authenticateClientPin(
    identifier: string,
    pinCode: string
  ): {
    session: ClientWorkbookSession | null;
    error?: string;
    locked?: boolean;
  } {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPin = (pinCode || '').trim();
    if (!cleanId || !cleanPin) {
      return {
        session: null,
        error: 'Please enter your private Name/Handle and your secret PIN.'
      };
    }

    const rateCheck = this.checkRateLimit(cleanId);
    if (!rateCheck.allowed) {
      return {
        session: null,
        locked: true,
        error: `Too many incorrect PIN attempts. For your security, please wait ${rateCheck.retryAfterSec} seconds or use your Secret Recovery Word.`
      };
    }

    for (const s of this.sessions.values()) {
      if (s.is_guest || s.session_id === 'GUEST') continue;
      const matchesSession = s.session_id.toLowerCase() === cleanId;
      const matchesAlias = s.client_alias.trim().toLowerCase() === cleanId;

      if (matchesSession || matchesAlias) {
        const pinValid =
          s.pin_hash && s.pin_salt
            ? this.verifySecret(cleanPin, s.pin_hash, s.pin_salt)
            : (s.pin_code || '1234') === cleanPin;

        if (pinValid) {
          this.failedLogins.delete(cleanId);
          s.last_login_at = new Date().toISOString();
          s.updated_at = s.last_login_at;
          this.sessions.set(s.session_id, s);
          this.persistSessions();
          return { session: s };
        }
      }
    }

    const failInfo = this.recordFailedAttempt(cleanId);
    return {
      session: null,
      locked: failInfo.locked,
      error: failInfo.locked
        ? 'Account temporarily locked for 5 minutes after 5 failed attempts. You can reset your PIN using your Recovery Word.'
        : `Invalid Name/Handle or PIN (${failInfo.attemptsRemaining} attempts remaining before temporary lock).`
    };
  }

  /**
   * Registers a new private client profile with a salted scrypt PIN hash and optional recovery phrase hash.
   */
  public registerClientWithPin(payload: ClientRegistrationPayload): {
    session?: ClientWorkbookSession;
    error?: string;
  } {
    const cleanAlias = (payload.client_alias || '').trim();
    const cleanPin = (payload.pin_code || '').replace(/\D/g, '').slice(0, 8);
    if (!cleanAlias) {
      return { error: 'Please choose a private Name, Nickname, or Handle.' };
    }
    if (cleanPin.length < 4) {
      return { error: 'Your secret PIN must be at least 4 digits.' };
    }

    // Prevent another person from overwriting an existing private handle unless PIN matches
    for (const existing of this.sessions.values()) {
      if (existing.is_guest) continue;
      if (existing.client_alias.trim().toLowerCase() === cleanAlias.toLowerCase()) {
        return {
          error:
            'That private Name/Handle is already registered. Please sign in with your PIN, or add a number/initial to make your handle unique.'
        };
      }
    }

    const city = payload.municipality || 'Surrey';
    const barriers =
      Array.isArray(payload.active_barriers) && payload.active_barriers.length > 0
        ? payload.active_barriers
        : ['Transit Pass / Compass', 'Groceries / Meals'];

    const shortCode = `C${Math.floor(100 + Math.random() * 900)}`;
    const baseTemplate: ClientWorkbookSession =
      payload.upgrade_from_session_id && this.sessions.has(payload.upgrade_from_session_id)
        ? JSON.parse(JSON.stringify(this.sessions.get(payload.upgrade_from_session_id)!))
        : JSON.parse(JSON.stringify(INITIAL_DEMO_SESSION));

    const hashedPin = this.hashSecret(cleanPin);
    const cleanRecovery = (payload.recovery_phrase || '').trim().toLowerCase();
    const hashedRecovery = cleanRecovery ? this.hashSecret(cleanRecovery) : undefined;
    const nowIso = new Date().toISOString();

    const newSession: ClientWorkbookSession = {
      ...baseTemplate,
      session_id: shortCode,
      client_alias: cleanAlias,
      municipality: city,
      pin_code: undefined,
      pin_hash: hashedPin.hash,
      pin_salt: hashedPin.salt,
      recovery_phrase_hash: hashedRecovery?.hash,
      recovery_phrase_salt: hashedRecovery?.salt,
      pin_recovery_hint:
        (payload.pin_recovery_hint || '').trim() ||
        'Protected by private PIN & recovery phrase',
      avatar_icon: payload.avatar_icon || 'Waves',
      age_group: payload.age_group || 'Adult (25–54)',
      is_guest: false,
      preferred_learning_modality:
        payload.preferred_learning_modality || baseTemplate.preferred_learning_modality,
      active_barriers: barriers,
      account_created_at: nowIso,
      last_login_at: nowIso,
      updated_at: nowIso
    };

    const ddl = this.verifyProgramsDDL(
      {
        municipality: city,
        supports_high_skill_low_text: true,
        offers_oral_or_practical_testing: true,
        scribe_or_reader_available: true
      },
      newSession
    );

    if (ddl.primary_matches[0]) {
      newSession.pinned_program_id = ddl.primary_matches[0].program_id;
      newSession.next_micro_step_text = `Call ${ddl.primary_matches[0].contact_lead_name} (${ddl.primary_matches[0].contact_phone_or_email}) for a friendly intro in ${city}.`;
    }
    if (ddl.immediate_relief_matches[0]) {
      newSession.pinned_relief_program_id = ddl.immediate_relief_matches[0].program_id;
    }

    this.sessions.set(newSession.session_id, newSession);
    this.persistSessions();
    return { session: newSession };
  }

  /**
   * Resets a forgotten PIN using the client's private Secret Recovery Word/Phrase (zero email needed).
   */
  public resetPinWithRecoveryPhrase(
    identifier: string,
    recoveryPhrase: string,
    newPinCode: string
  ): { session?: ClientWorkbookSession; error?: string } {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhrase = (recoveryPhrase || '').trim().toLowerCase();
    const cleanNewPin = (newPinCode || '').replace(/\D/g, '').slice(0, 8);

    if (!cleanId || !cleanPhrase) {
      return { error: 'Please enter your Name/Handle and your Secret Recovery Word.' };
    }
    if (cleanNewPin.length < 4) {
      return { error: 'Your new PIN must be at least 4 digits.' };
    }

    for (const s of this.sessions.values()) {
      if (s.is_guest) continue;
      const matchesSession = s.session_id.toLowerCase() === cleanId;
      const matchesAlias = s.client_alias.trim().toLowerCase() === cleanId;

      if (matchesSession || matchesAlias) {
        if (!s.recovery_phrase_hash || !s.recovery_phrase_salt) {
          return {
            error:
              'No recovery word was set on this account. Please ask your navigator/coordinator for a reset.'
          };
        }
        const phraseValid = this.verifySecret(
          cleanPhrase,
          s.recovery_phrase_hash,
          s.recovery_phrase_salt
        );
        if (!phraseValid) {
          return { error: 'Recovery word did not match this account.' };
        }

        const newHash = this.hashSecret(cleanNewPin);
        s.pin_code = undefined;
        s.pin_hash = newHash.hash;
        s.pin_salt = newHash.salt;
        s.last_login_at = new Date().toISOString();
        s.updated_at = s.last_login_at;
        this.failedLogins.delete(cleanId);
        this.sessions.set(s.session_id, s);
        this.persistSessions();
        return { session: s };
      }
    }

    return { error: 'Could not verify Name/Handle and Recovery Word.' };
  }

  /**
   * Changes the PIN (and optionally recovery phrase) for an already-authenticated client session.
   */
  public changeClientPin(
    sessionId: string,
    currentPin: string,
    newPin: string,
    newRecoveryPhrase?: string
  ): { ok: boolean; error?: string } {
    const s = this.sessions.get(sessionId);
    if (!s || s.is_guest) {
      return { ok: false, error: 'Cannot change PIN on a guest session.' };
    }
    const cleanCurrent = (currentPin || '').trim();
    const cleanNew = (newPin || '').replace(/\D/g, '').slice(0, 8);
    if (cleanNew.length < 4) {
      return { ok: false, error: 'New PIN must be at least 4 digits.' };
    }

    const currentValid =
      s.pin_hash && s.pin_salt
        ? this.verifySecret(cleanCurrent, s.pin_hash, s.pin_salt)
        : false;
    if (!currentValid) {
      return { ok: false, error: 'Current PIN is incorrect.' };
    }

    const newHashed = this.hashSecret(cleanNew);
    s.pin_code = undefined;
    s.pin_hash = newHashed.hash;
    s.pin_salt = newHashed.salt;

    if (newRecoveryPhrase && newRecoveryPhrase.trim()) {
      const recHashed = this.hashSecret(newRecoveryPhrase.trim().toLowerCase());
      s.recovery_phrase_hash = recHashed.hash;
      s.recovery_phrase_salt = recHashed.salt;
    }

    s.updated_at = new Date().toISOString();
    this.sessions.set(sessionId, s);
    this.persistSessions();
    return { ok: true };
  }

  /**
   * Creates or returns the anonymous Guest Sanctuary session (no PIN or registration required).
   */
  public createOrGetGuestSession(municipality?: string): ClientWorkbookSession {
    const existing = this.sessions.get('GUEST');
    const city = municipality || existing?.municipality || 'Surrey';
    const guestSession: ClientWorkbookSession = {
      ...JSON.parse(JSON.stringify(INITIAL_DEMO_SESSION)),
      ...(existing || {}),
      session_id: 'GUEST',
      client_alias: 'Guest Visitor',
      municipality: city,
      pin_code: '',
      pin_recovery_hint: 'Guest Mode — No PIN required',
      avatar_icon: 'Sun',
      age_group: 'All Ages & Walks of Life',
      is_guest: true,
      updated_at: new Date().toISOString()
    };
    this.sessions.set('GUEST', guestSession);
    this.persistSessions();
    return guestSession;
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
