import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { NavigatorDatabaseEngine } from './dbEngine.js';
import { DailySyncService } from './dailySyncService.js';
import {
  synthesizeDualAxisBlueprint,
  MASTER_SYSTEM_PROMPT,
  VERIFY_PROGRAMS_DDL_TOOL
} from './llmSynthesizer.js';
import { DDLQueryFilterParams } from '../src/types/navigator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const ALLOWED_ORIGINS = [
  'https://plauxie.life',
  'https://www.plauxie.life',
  'http://localhost:4180',
  'http://localhost:5185'
];

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith('.plauxie.life') ||
        origin.endsWith('.railway.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PATCH']
  }
});

app.use(express.json());

const db = new NavigatorDatabaseEngine();

function computeDDLForSession(sessionId: string) {
  const session = db.getSession(sessionId);
  const supportsHighSkillLowText =
    session.problem_solving_complexity >= 3 && session.text_admin_tolerance <= 2;
  const lacksId = session.active_barriers.includes('Replacement ID / SIN');
  const needsTransit = session.active_barriers.includes('Transit Pass / Compass');
  const needsGear = session.active_barriers.includes('Work Boots / Gear');
  const needsScribe =
    session.active_barriers.includes('Paperwork / Scribe Help') ||
    session.text_admin_tolerance <= 2;

  const filters: DDLQueryFilterParams = {
    municipality: session.municipality,
    supports_high_skill_low_text: supportsHighSkillLowText,
    offers_oral_or_practical_testing: supportsHighSkillLowText,
    scribe_or_reader_available: needsScribe,
    requires_government_id: lacksId ? false : undefined,
    provides_transit_tickets: needsTransit ? true : undefined,
    provides_gear_or_boots: needsGear ? true : undefined
  };

  return db.verifyProgramsDDL(filters, session);
}

const syncService = new DailySyncService(db, (syncState, programs) => {
  const ddl = computeDDLForSession('A842');
  io.emit('programs:synced', {
    sync_state: syncState,
    programs,
    ddl
  });
});

// Health & System Metadata (Railway Healthcheck Endpoint)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    project: 'Future Forward and Beyond — Multi-Barrier Navigator & Co-Pilot Workbook',
    version: '4.0.0',
    domain: process.env.PUBLIC_DOMAIN || 'https://plauxie.life',
    railway_project_id: process.env.RAILWAY_PROJECT_ID || '9821be45-444b-4d47-b79e-2b811be6851f',
    environment: process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || 'development',
    modules_count: db.getModules().length,
    verified_programs_count: db.getAllPrograms().length
  });
});

// Get Workbook Modules & System Spec Prompt
app.get('/api/modules', (_req, res) => {
  res.json({
    modules: db.getModules(),
    system_prompt: MASTER_SYSTEM_PROMPT,
    ddl_tool_schema: VERIFY_PROGRAMS_DDL_TOOL
  });
});

// Get All Verified Programs
app.get('/api/programs', (_req, res) => {
  res.json({ programs: db.getAllPrograms() });
});

// ============================================================================
// Private PIN Authentication, Cryptographic Session Tokens & Retention Endpoints
// ============================================================================
function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const customHeader = req.headers['x-auth-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

// Client names/profiles are strictly private — returns empty array to prevent enumeration
app.get('/api/auth/profiles', (_req, res) => {
  res.json({ profiles: [] });
});

// Verify & Resume Retained Session Token (30-Day Personal Device / 12-Hour Shared Kiosk)
app.get('/api/auth/session', (req, res) => {
  const token = extractBearerToken(req);
  const verified = db.verifyAuthToken(token);
  if (!verified.valid || !verified.session) {
    return res.status(401).json({
      authenticated: false,
      error: 'No active retained session token found.'
    });
  }

  const ddl = computeDDLForSession(verified.session.session_id);
  res.json({
    authenticated: true,
    session: db.sanitizeSession(verified.session),
    ddl,
    auth_token: token,
    expires_at: verified.record?.expires_at,
    security: db.getAuthSecurityStatus(verified.session, verified.record)
  });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, pin_code, remember_device = true } = req.body || {};
  if (!identifier || !pin_code) {
    return res
      .status(400)
      .json({ error: 'Please enter your private Name/Handle and your secret PIN.' });
  }

  const authResult = db.authenticateClientPin(String(identifier), String(pin_code));
  if (!authResult.session) {
    return res.status(authResult.locked ? 429 : 401).json({
      error:
        authResult.error ||
        'Invalid Name/Handle or PIN. Please check your entry or use your Recovery Word.'
    });
  }

  const tokenBundle = db.issueAuthToken(
    authResult.session.session_id,
    Boolean(remember_device)
  );
  const ddl = computeDDLForSession(authResult.session.session_id);

  res.json({
    session: db.sanitizeSession(authResult.session),
    ddl,
    auth_token: tokenBundle.auth_token,
    expires_at: tokenBundle.expires_at,
    security: db.getAuthSecurityStatus(authResult.session, tokenBundle.record),
    profiles: []
  });
});

app.post('/api/auth/register', (req, res) => {
  const {
    client_alias,
    pin_code,
    recovery_phrase,
    pin_recovery_hint,
    municipality,
    avatar_icon,
    age_group,
    active_barriers,
    preferred_learning_modality,
    upgrade_from_session_id,
    remember_device = true
  } = req.body || {};

  if (!client_alias || !String(client_alias).trim()) {
    return res.status(400).json({ error: 'Please enter a private Name, Nickname, or Handle.' });
  }
  const cleanPin = String(pin_code || '').replace(/\D/g, '');
  if (cleanPin.length < 4) {
    return res.status(400).json({ error: 'Please choose a secret PIN (at least 4 digits).' });
  }

  const regResult = db.registerClientWithPin({
    client_alias: String(client_alias).trim(),
    pin_code: cleanPin.slice(0, 8),
    recovery_phrase: recovery_phrase ? String(recovery_phrase).trim() : undefined,
    pin_recovery_hint,
    municipality: municipality || 'Surrey',
    avatar_icon,
    age_group,
    active_barriers,
    preferred_learning_modality,
    upgrade_from_session_id,
    remember_device: Boolean(remember_device)
  });

  if (!regResult.session) {
    return res.status(409).json({
      error: regResult.error || 'Could not create private profile.'
    });
  }

  const tokenBundle = db.issueAuthToken(
    regResult.session.session_id,
    Boolean(remember_device)
  );
  const ddl = computeDDLForSession(regResult.session.session_id);

  res.json({
    session: db.sanitizeSession(regResult.session),
    ddl,
    auth_token: tokenBundle.auth_token,
    expires_at: tokenBundle.expires_at,
    security: db.getAuthSecurityStatus(regResult.session, tokenBundle.record),
    profiles: []
  });
});

// Self-Service Private PIN Reset using Secret Recovery Word (No Email Required)
app.post('/api/auth/reset-pin', (req, res) => {
  const { identifier, recovery_phrase, new_pin_code, remember_device = true } = req.body || {};
  const resetResult = db.resetPinWithRecoveryPhrase(
    String(identifier || ''),
    String(recovery_phrase || ''),
    String(new_pin_code || '')
  );

  if (!resetResult.session) {
    return res.status(401).json({
      error: resetResult.error || 'Could not verify Name/Handle and Recovery Word.'
    });
  }

  const tokenBundle = db.issueAuthToken(
    resetResult.session.session_id,
    Boolean(remember_device)
  );
  const ddl = computeDDLForSession(resetResult.session.session_id);

  res.json({
    session: db.sanitizeSession(resetResult.session),
    ddl,
    auth_token: tokenBundle.auth_token,
    expires_at: tokenBundle.expires_at,
    security: db.getAuthSecurityStatus(resetResult.session, tokenBundle.record)
  });
});

// Change PIN / Recovery Word for an Active Session
app.post('/api/auth/change-pin', (req, res) => {
  const token = extractBearerToken(req);
  const verified = db.verifyAuthToken(token);
  const { session_id, current_pin, new_pin, new_recovery_phrase } = req.body || {};
  const targetId = verified.valid && verified.session ? verified.session.session_id : session_id;

  if (!targetId) {
    return res.status(401).json({ error: 'Please sign in first to update your security settings.' });
  }

  const result = db.changeClientPin(
    String(targetId),
    String(current_pin || ''),
    String(new_pin || ''),
    new_recovery_phrase ? String(new_recovery_phrase) : undefined
  );

  if (!result.ok) {
    return res.status(400).json({ error: result.error || 'Could not update PIN.' });
  }

  const updatedSession = db.getSession(String(targetId));
  res.json({
    ok: true,
    session: db.sanitizeSession(updatedSession),
    security: db.getAuthSecurityStatus(updatedSession, verified.record)
  });
});

// Revoke Active Session Token (Sign Out & Lock Sanctuary)
app.post('/api/auth/logout', (req, res) => {
  const token = extractBearerToken(req) || req.body?.auth_token;
  db.revokeAuthToken(token);
  res.json({ ok: true });
});

app.post('/api/auth/guest', (req, res) => {
  const { municipality } = req.body || {};
  const guestSession = db.createOrGetGuestSession(municipality);
  const ddl = computeDDLForSession(guestSession.session_id);
  res.json({
    session: db.sanitizeSession(guestSession),
    ddl,
    security: db.getAuthSecurityStatus(guestSession, null)
  });
});

// Get Session + Live DDL Verification Matches (Protected for Private Client Sessions)
app.get('/api/session/:sessionId', (req, res) => {
  const requestedId = req.params.sessionId;
  const token = extractBearerToken(req);
  const verified = db.verifyAuthToken(token);

  // If requesting a private non-guest, non-demo session without a matching token, return Guest/Bootstrap safely
  if (
    requestedId !== 'GUEST' &&
    requestedId !== 'A842' &&
    (!verified.valid || verified.session?.session_id !== requestedId)
  ) {
    return res.status(401).json({
      error: 'Private session locked. Please sign in with your PIN.'
    });
  }

  const session = db.getSession(requestedId);
  const ddl = computeDDLForSession(session.session_id);
  res.json({
    session: db.sanitizeSession(session),
    ddl,
    security: db.getAuthSecurityStatus(session, verified.record)
  });
});

// Update Session (from Coordinator Tablet or Companion Phone)
app.patch('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const token = extractBearerToken(req);
  const verified = db.verifyAuthToken(token);

  if (
    sessionId !== 'GUEST' &&
    sessionId !== 'A842' &&
    (!verified.valid || verified.session?.session_id !== sessionId)
  ) {
    return res.status(401).json({
      error: 'Private session locked. Please sign in with your PIN.'
    });
  }

  const updated = db.updateSession(sessionId, req.body);
  const sanitized = db.sanitizeSession(updated);
  const ddl = computeDDLForSession(sessionId);

  io.to(sessionId).emit('session:updated', {
    session: sanitized,
    ddl,
    source: req.body._source || 'api'
  });

  res.json({ session: sanitized, ddl });
});

// Reset Session to Default State
app.post('/api/session/:sessionId/reset', (req, res) => {
  const { sessionId } = req.params;
  const reset = db.resetDemoSession(sessionId);
  const sanitized = db.sanitizeSession(reset);
  const ddl = computeDDLForSession(sessionId);

  io.to(sessionId).emit('session:updated', {
    session: sanitized,
    ddl,
    source: 'reset'
  });

  res.json({ session: sanitized, ddl });
});

// Run Dual-Axis LLM Synthesizer & DDL Tool Verification
app.post('/api/session/:sessionId/synthesize', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { voice_transcript, enable_thinking = false } = req.body;
    const current = db.getSession(sessionId);

    const synthResult = await synthesizeDualAxisBlueprint(
      current,
      voice_transcript || current.voice_transcript,
      Boolean(enable_thinking)
    );

    const ddl = db.verifyProgramsDDL(synthResult.ddl_query_parameters, current);
    const topMatch = ddl.primary_matches[0] || null;
    const topRelief = ddl.immediate_relief_matches[0] || null;

    const updated = db.updateSession(sessionId, {
      voice_transcript: voice_transcript || current.voice_transcript,
      problem_solving_complexity: synthResult.dual_axis_scores.problem_solving_complexity,
      text_admin_tolerance: synthResult.dual_axis_scores.text_admin_tolerance,
      preferred_learning_modality: synthResult.dual_axis_scores.preferred_learning_modality,
      autonomy_preference: synthResult.dual_axis_scores.autonomy_preference,
      current_readiness_tier: synthResult.dual_axis_scores.recommended_readiness_tier,
      skill_blueprint_json: synthResult.client_facing_blueprint,
      pinned_program_id: topMatch ? topMatch.program_id : current.pinned_program_id,
      pinned_relief_program_id: topRelief ? topRelief.program_id : current.pinned_relief_program_id,
      next_micro_step_text: topMatch
        ? `Warm Handoff to ${topMatch.contact_lead_name} (${topMatch.contact_phone_or_email}) at ${topMatch.program_name}`
        : current.next_micro_step_text
    });

    const sanitized = db.sanitizeSession(updated);

    io.to(sessionId).emit('session:updated', {
      session: sanitized,
      ddl,
      synthesizer_telemetry: synthResult.inference_telemetry,
      source: 'synthesizer'
    });

    res.json({
      session: sanitized,
      ddl,
      synthesis: synthResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Synthesizer failed' });
  }
});

// Direct DDL Verification Tool Endpoint (`verify_programs_ddl`)
app.post('/api/ddl/verify', (req, res) => {
  const filters: DDLQueryFilterParams = req.body.filters || {};
  const sessionId: string = req.body.session_id || 'A842';
  const session = db.getSession(sessionId);
  const result = db.verifyProgramsDDL(filters, session);
  res.json(result);
});

// Daily Auto-Refresh & Live Service Import Endpoints
app.get('/api/sync/status', (_req, res) => {
  res.json({
    sync_state: syncService.getStatus(),
    programs_count: db.getAllPrograms().length
  });
});

app.post('/api/sync/run', async (_req, res) => {
  try {
    const syncState = await syncService.runSyncCheck('manual_refresh');
    const ddl = computeDDLForSession('A842');
    res.json({
      sync_state: syncState,
      programs: db.getAllPrograms(),
      ddl
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Daily sync check failed' });
  }
});

app.post('/api/sync/import', (req, res) => {
  try {
    const { payload, source_name } = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Missing payload to import' });
    }
    const result = syncService.importExternalServices(
      payload,
      source_name || 'Coordinator Direct Import'
    );
    const ddl = computeDDLForSession('A842');
    res.json({
      ...result,
      programs: db.getAllPrograms(),
      ddl
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Import failed' });
  }
});

app.post('/api/sync/schedule', (req, res) => {
  const { auto_daily_enabled, interval_hours } = req.body;
  const updatedState = syncService.updateScheduleConfig(
    Boolean(auto_daily_enabled),
    Number(interval_hours || 24)
  );
  res.json({ sync_state: updatedState });
});

// WebSocket Real-Time Co-Pilot Sync Layer
io.on('connection', (socket) => {
  const sessionId = (socket.handshake.query.sessionId as string) || 'A842';
  socket.join(sessionId);

  socket.on('session:patch', (patchPayload: Record<string, any>) => {
    const updated = db.updateSession(sessionId, patchPayload);
    const ddl = computeDDLForSession(sessionId);
    io.to(sessionId).emit('session:updated', {
      session: db.sanitizeSession(updated),
      ddl,
      source: patchPayload._source || socket.id
    });
  });

  socket.on('coordinator:push_module', (moduleCode: string) => {
    const updated = db.updateSession(sessionId, {
      active_module_on_canvas: moduleCode as any
    });
    const ddl = computeDDLForSession(sessionId);
    io.to(sessionId).emit('session:updated', {
      session: db.sanitizeSession(updated),
      ddl,
      source: 'coordinator_drawer'
    });
  });
});

// Explicit JSON 404 handler for any unmatched /api/* route so Express never returns <!DOCTYPE html>
app.all('/api/{*splat}', (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Serve built frontend in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return res.status(404).json({ error: `Not found: ${req.originalUrl}` });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Global JSON error middleware so malformed JSON or server errors never return HTML
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (req.path.startsWith('/api')) {
      return res.status(err?.status || 500).json({
        error: err?.message || 'Unexpected server error'
      });
    }
    res.status(500).send('Internal Server Error');
  }
);

const PORT = Number(process.env.PORT || 4180);
server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[Future Forward & Beyond] Co-Pilot Navigator API & WebSocket Server running on http://localhost:${PORT}`
  );
});

// Also listen on legacy local port 4170 when running locally so existing browser tabs on :4170 work seamlessly
if (!process.env.PORT && PORT !== 4170) {
  const legacyServer = http.createServer(app);
  io.attach(legacyServer);
  legacyServer.on('error', () => {
    // Ignore if 4170 is unavailable
  });
  legacyServer.listen(4170, '0.0.0.0', () => {
    console.log(
      `[Future Forward & Beyond] Mirror listener active on http://localhost:4170`
    );
  });
}
