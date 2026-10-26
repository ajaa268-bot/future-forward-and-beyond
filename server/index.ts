import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { NavigatorDatabaseEngine } from './dbEngine.js';
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

// Get Session + Live DDL Verification Matches
app.get('/api/session/:sessionId', (req, res) => {
  const session = db.getSession(req.params.sessionId);
  const ddl = computeDDLForSession(session.session_id);
  res.json({ session, ddl });
});

// Update Session (from Coordinator Tablet or Companion Phone)
app.patch('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const updated = db.updateSession(sessionId, req.body);
  const ddl = computeDDLForSession(sessionId);

  io.to(sessionId).emit('session:updated', {
    session: updated,
    ddl,
    source: req.body._source || 'api'
  });

  res.json({ session: updated, ddl });
});

// Reset Session to Default "Stratus #A842" Demo State
app.post('/api/session/:sessionId/reset', (req, res) => {
  const { sessionId } = req.params;
  const reset = db.resetDemoSession(sessionId);
  const ddl = computeDDLForSession(sessionId);

  io.to(sessionId).emit('session:updated', {
    session: reset,
    ddl,
    source: 'reset'
  });

  res.json({ session: reset, ddl });
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

    io.to(sessionId).emit('session:updated', {
      session: updated,
      ddl,
      synthesizer_telemetry: synthResult.inference_telemetry,
      source: 'synthesizer'
    });

    res.json({
      session: updated,
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

// WebSocket Real-Time Co-Pilot Sync Layer
io.on('connection', (socket) => {
  const sessionId = (socket.handshake.query.sessionId as string) || 'A842';
  socket.join(sessionId);

  socket.on('session:patch', (patchPayload: Record<string, any>) => {
    const updated = db.updateSession(sessionId, patchPayload);
    const ddl = computeDDLForSession(sessionId);
    io.to(sessionId).emit('session:updated', {
      session: updated,
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
      session: updated,
      ddl,
      source: 'coordinator_drawer'
    });
  });
});

// Serve built frontend in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = Number(process.env.PORT || 4180);
server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[Future Forward & Beyond] Co-Pilot Navigator API & WebSocket Server running on http://localhost:${PORT}`
  );
});
