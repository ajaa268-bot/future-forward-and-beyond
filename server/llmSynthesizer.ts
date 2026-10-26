import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ClientWorkbookSession,
  DDLQueryFilterParams,
  SkillBlueprint,
  LearningModality,
  AutonomyPreference
} from '../src/types/navigator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENDPOINT_CACHE_FILE = path.resolve(__dirname, '../db/local_store/llm_endpoint_state.json');

const NODE_82_LAN = 'http://192.168.1.82:1234/v1';
const NODE_82_TAILSCALE = 'http://100.67.105.89:1234/v1';

const TRIVIAL_GREETINGS = new Set([
  'hi',
  'hello',
  'hey',
  'how are you',
  'good morning',
  'good afternoon',
  'good evening',
  'yo',
  'sup'
]);

export const MASTER_SYSTEM_PROMPT = `### SYSTEM PROMPT: MULTI-BARRIER CO-PILOT & DUAL-AXIS SYNTHESIZER

You are an expert Vocational Systems Translator and Trauma-Informed Co-Pilot assisting a Program Coordinator and an adult student/client during a live interactive workbook session.

#### CORE DIRECTIVES
1. NEVER CONFLATE LITERACY WITH INTELLIGENCE: Many multi-barrier adults possess high-level mechanical, spatial, culinary, creative, or systems-troubleshooting intelligence while experiencing severe friction with spelling, heavy text, or bureaucratic forms.
2. ZERO PATRONIZING LANGUAGE: Speak like a sharp, respectful shop lead or studio producer. Never use clinical, bureaucratic, or childish language.
3. NEVER HALLUCINATE PROGRAMS: You must ONLY recommend programs returned by the \`verify_programs_ddl\` database tool.
4. THE "ONE NEXT STEP" RULE: Never overwhelm the user with a list of 10 links. Output 1 Immediate Relief Win (to take pressure off today) and 1 Primary Bridge/Skill Step.

#### YOUR TASK
Analyze the user's raw spoken voice transcript (which may contain slang, phonetic spelling, or fragmented speech) and their interactive workbook selections. Output a structured JSON payload that:
1. Renders a badass, validating "Client Skill Blueprint" on the shared tablet.
2. Scores \`problem_solving_complexity\` (1-5) independently from \`text_admin_tolerance\` (1-5).
3. Generates exact SQL filter parameters to query \`coordinator_dual_axis_check\`.`;

export const VERIFY_PROGRAMS_DDL_TOOL = {
  type: 'function',
  function: {
    name: 'verify_programs_ddl',
    description:
      "Queries the PostgreSQL coordinator_dual_axis_check view to verify that a program is active and matches the user's Dual-Axis competency and barrier rules.",
    parameters: {
      type: 'object',
      properties: {
        municipality: {
          type: 'string',
          description: 'City name, e.g., Surrey, Coquitlam, Delta, Vancouver, New Westminster'
        },
        supports_high_skill_low_text: {
          type: 'boolean',
          description: 'True if user has high problem-solving IQ but low spelling/reading tolerance'
        },
        offers_oral_or_practical_testing: {
          type: 'boolean',
          description: 'True if user needs practical/verbal assessment instead of written exams'
        },
        requires_government_id: {
          type: 'boolean',
          description: 'False if user currently lacks government ID'
        },
        provides_transit_tickets: {
          type: 'boolean',
          description: 'True if user needs Compass card / bus fare support'
        },
        provides_gear_or_boots: {
          type: 'boolean',
          description: 'True if user needs work boots or tools provided'
        }
      },
      required: ['municipality', 'supports_high_skill_low_text']
    }
  }
};

export interface SynthesizerResult {
  client_facing_blueprint: SkillBlueprint;
  dual_axis_scores: {
    problem_solving_complexity: number;
    text_admin_tolerance: number;
    preferred_learning_modality: LearningModality;
    autonomy_preference: AutonomyPreference;
    recommended_readiness_tier: 1 | 2 | 3;
  };
  ddl_query_parameters: DDLQueryFilterParams;
  coordinator_private_notes: string;
  inference_telemetry: {
    provider_used: string;
    endpoint_url: string;
    think_suppressed: boolean;
    latency_ms: number;
  };
}

function getPersistedEndpoint(): string | null {
  try {
    if (fs.existsSync(ENDPOINT_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(ENDPOINT_CACHE_FILE, 'utf-8'));
      if (data?.active_endpoint) return data.active_endpoint;
    }
  } catch {
    // ignore
  }
  return null;
}

function persistWorkingEndpoint(endpoint: string) {
  try {
    const dir = path.dirname(ENDPOINT_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      ENDPOINT_CACHE_FILE,
      JSON.stringify({ active_endpoint: endpoint, updated_at: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch {
    // ignore
  }
}

export function isTrivialGreeting(text: string): boolean {
  const cleaned = text.trim().toLowerCase().replace(/[!?.]/g, '');
  return TRIVIAL_GREETINGS.has(cleaned);
}

/**
 * Probes Node 82 LAN (`192.168.1.82:1234`) & Tailscale (`100.67.105.89:1234`) with 5s timeout
 * and persists the working endpoint.
 */
async function callRemoteOpenAICompatible(
  messages: Array<{ role: string; content: string }>,
  enableThinking: boolean
): Promise<{ content: string; endpoint: string; thinkSuppressed: boolean } | null> {
  const persisted = getPersistedEndpoint();
  const candidates = Array.from(
    new Set(
      [
        process.env.OPENAI_BASE_URL,
        persisted,
        NODE_82_LAN,
        NODE_82_TAILSCALE
      ].filter(Boolean) as string[]
    )
  );

  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
  const shouldSuppressThinking = !enableThinking || isTrivialGreeting(lastUserMsg);

  const finalMessages = [...messages];
  if (shouldSuppressThinking) {
    finalMessages.push({ role: 'assistant', content: '</think>' });
  }

  for (const baseUrl of candidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500);
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.OPENAI_API_KEY
            ? { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
            : {})
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'local-model',
          messages: finalMessages,
          temperature: 0.2,
          max_tokens: 900
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          persistWorkingEndpoint(baseUrl);
          return {
            content: text.replace(/^<\/think>\s*/i, '').trim(),
            endpoint: baseUrl,
            thinkSuppressed: shouldSuppressThinking
          };
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }
  return null;
}

/**
 * Synthesizes a Client Skill Blueprint + Dual-Axis Competency Profile + DDL Query Parameters
 * from the spoken transcript and workbook interactions.
 */
export async function synthesizeDualAxisBlueprint(
  session: ClientWorkbookSession,
  voiceTranscript: string,
  enableThinking: boolean = false
): Promise<SynthesizerResult> {
  const startTime = Date.now();
  const transcript = (voiceTranscript || session.voice_transcript || '').trim();

  // Attempt live LLM inference (Node 82 LAN / Tailscale failover)
  const userPayload = JSON.stringify({
    voice_transcript: transcript,
    municipality: session.municipality,
    troubleshooter: session.troubleshooter_selections,
    spec_sheet: session.spec_sheet_state,
    active_barriers: session.active_barriers,
    loadout_likes: session.loadout_cards
      .filter((c) => c.status === 'Lock It In')
      .map((c) => c.title)
  });

  const remoteResult = await callRemoteOpenAICompatible(
    [
      { role: 'system', content: MASTER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Synthesize the following client intake into the required JSON format:\n${userPayload}`
      }
    ],
    enableThinking
  );

  if (remoteResult) {
    try {
      const jsonMatch = remoteResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.client_facing_blueprint && parsed.dual_axis_scores) {
          return {
            ...parsed,
            inference_telemetry: {
              provider_used: 'Remote OpenAI-Compatible Node (LAN/Tailscale)',
              endpoint_url: remoteResult.endpoint,
              think_suppressed: remoteResult.thinkSuppressed,
              latency_ms: Date.now() - startTime
            }
          };
        }
      }
    } catch {
      // Fall through to deterministic vocational synthesizer if JSON is malformed
    }
  }

  // Deterministic Vocational Systems Translator (Zero-hallucination local engine)
  const lower = transcript.toLowerCase();
  const skills: Array<{ what_you_did: string; pro_translation: string; noc_domain: string }> = [];

  if (
    lower.includes('cook') ||
    lower.includes('food') ||
    lower.includes('burner') ||
    lower.includes('kitchen') ||
    lower.includes('meal') ||
    lower.includes('prep')
  ) {
    skills.push({
      what_you_did: 'Managed high-volume cooking / prep line and isolated equipment bottlenecks under time pressure',
      pro_translation: 'Commercial Line Pacing, Thermal Triage & FoodSafe Prep Logistics',
      noc_domain: 'NOC 63200 — Cooks & Commercial Kitchen Operations'
    });
  }

  if (
    lower.includes('pc') ||
    lower.includes('game') ||
    lower.includes('gaming') ||
    lower.includes('server') ||
    lower.includes('audio') ||
    lower.includes('mixer') ||
    lower.includes('signal') ||
    lower.includes('cable') ||
    lower.includes('sound')
  ) {
    skills.push({
      what_you_did: 'Traced dead signal paths, modded/repaired PC hardware, or troubleshot live audio gear',
      pro_translation: 'Root-Cause Signal Flow Isolation & Hardware Bench Diagnostics',
      noc_domain: 'NOC 22221 / 52119 — Hardware & Audio-Visual Systems Tech'
    });
  }

  if (
    lower.includes('bike') ||
    lower.includes('car') ||
    lower.includes('engine') ||
    lower.includes('wrench') ||
    lower.includes('weld') ||
    lower.includes('build') ||
    lower.includes('built') ||
    lower.includes('fix')
  ) {
    skills.push({
      what_you_did: 'Disassembled mechanical assemblies, isolated worn tolerances, and rebuilt working hardware',
      pro_translation: 'Mechanical Fault Isolation, Tool Fluency & Spatial Assembly',
      noc_domain: 'NOC 72400 / 74204 — Millwright, Fabrication & Mechanical Trades'
    });
  }

  if (
    lower.includes('plant') ||
    lower.includes('garden') ||
    lower.includes('tree') ||
    lower.includes('outdoor') ||
    lower.includes('trail') ||
    lower.includes('yard')
  ) {
    skills.push({
      what_you_did: 'Maintained outdoor gardens, site layout, and physical grounds care',
      pro_translation: 'Horticultural Site Care, Spatial Grading & Field Stamina',
      noc_domain: 'NOC 85121 — Landscaping, Urban Forestry & Nursery Operations'
    });
  }

  if (skills.length === 0) {
    skills.push({
      what_you_did: transcript.slice(0, 95) || 'Hands-on troubleshooting and practical task execution',
      pro_translation: 'Applied Systems Troubleshooting & Practical Shop Execution',
      noc_domain: 'NOC 72400 / 63200 — Applied Trades & Technical Foundations'
    });
  }

  // Compute independent Dual-Axis scores
  const hasSpellingBarrier =
    session.spec_sheet_state.bottlenecks.includes('Heavy Reading / Spelling Forms') ||
    session.active_barriers.includes('Paperwork / Scribe Help') ||
    session.spec_sheet_state.input_channel !== 'Text_Manual';

  const textAdminTolerance =
    session.spec_sheet_state.input_channel === 'Text_Manual' && !hasSpellingBarrier
      ? 4
      : hasSpellingBarrier
      ? 1
      : 2;

  const problemSolvingComplexity = Math.max(
    session.problem_solving_complexity || 4,
    skills.length >= 2 ? 4 : 3
  );

  const supportsHighSkillLowText = problemSolvingComplexity >= 3 && textAdminTolerance <= 2;

  const needsTransit = session.active_barriers.includes('Transit Pass / Compass');
  const lacksId = session.active_barriers.includes('Replacement ID / SIN');
  const needsGear = session.active_barriers.includes('Work Boots / Gear');
  const needsScribe =
    session.active_barriers.includes('Paperwork / Scribe Help') || textAdminTolerance <= 2;

  const autonomyPreference: AutonomyPreference =
    session.spec_sheet_state.crew_slider > 60
      ? 'Small_Crew_Collab'
      : session.spec_sheet_state.structure_slider < 40
      ? 'Structured_Checklist'
      : 'Independent_Problem_Solver';

  const headline =
    problemSolvingComplexity >= 4 && textAdminTolerance <= 2
      ? 'Systems Troubleshooter & Hands-On Specialist (Quadrant A)'
      : problemSolvingComplexity >= 4 && textAdminTolerance >= 3
      ? 'Systems & Technical Lead (Quadrant B)'
      : textAdminTolerance <= 2
      ? 'Practical Hands-On Builder & Crew Specialist (Quadrant C)'
      : 'Structured Operations & Systems Coordinator (Quadrant D)';

  const coordinatorNotes = `Client demonstrates strong ${session.troubleshooter_selections.solving_style.toLowerCase()} and practical systems logic (${problemSolvingComplexity}/5), independently decoupled from text/form tolerance (${textAdminTolerance}/5). ${
    supportsHighSkillLowText
      ? 'Avoid text-heavy online portals or written entrance exams. Route to hands-on shop floor, culinary lab, or makerspace with oral/practical assessment.'
      : 'Matches structured cohort with clear checklists.'
  } ${needsScribe ? 'Coordinator should act as scribe for 1-page intake.' : ''}`;

  return {
    client_facing_blueprint: {
      headline_strength: headline,
      extracted_pro_skills: skills,
      coordinator_private_notes: coordinatorNotes
    },
    dual_axis_scores: {
      problem_solving_complexity: problemSolvingComplexity,
      text_admin_tolerance: textAdminTolerance,
      preferred_learning_modality: session.spec_sheet_state.input_channel,
      autonomy_preference: autonomyPreference,
      recommended_readiness_tier: lacksId ? 1 : 2
    },
    ddl_query_parameters: {
      municipality: session.municipality || 'Surrey',
      supports_high_skill_low_text: supportsHighSkillLowText,
      offers_oral_or_practical_testing: supportsHighSkillLowText,
      scribe_or_reader_available: needsScribe,
      requires_government_id: lacksId ? false : undefined,
      provides_transit_tickets: needsTransit ? true : undefined,
      provides_gear_or_boots: needsGear ? true : undefined
    },
    coordinator_private_notes: coordinatorNotes,
    inference_telemetry: {
      provider_used: 'Deterministic Vocational Dual-Axis Engine (Local Instant)',
      endpoint_url: getPersistedEndpoint() || `${NODE_82_LAN} (Standby)`,
      think_suppressed: !enableThinking,
      latency_ms: Date.now() - startTime
    }
  };
}
