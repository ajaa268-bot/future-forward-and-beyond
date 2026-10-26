# Multi-Barrier Navigator & Co-Pilot Workbook: Master Technical Specification
**File:** `multi_barrier_navigator_master_spec.md`  
**Version:** 4.0 (Master Consolidated Edition — Core Architecture, API/DDL Registry, Dual-Axis Competency Engine & Co-Pilot Workbook)  
**Target Stack:** Node.js / Python (FastAPI) + PostgreSQL (`pgvector`) + Real-Time WebSockets + Local/Cloud LLM (`gpt-4o`, `claude-3-5-sonnet`, or local `Llama-3.1-70B` / `Qwen-3.6` via Node 82 / LM Studio / Jan / Ollama)

---

## PART 1: EXECUTIVE SUMMARY & CORE DESIGN PHILOSOPHY

Navigating government benefits, non-profit outreach, skills training, and employment pathways is intimidating—especially for multi-barrier individuals facing burnout, complex bureaucracy, or administrative fatigue.

### 1.1 The Three Core Pillars
1. **Interest-First Entry Bridge:** Uses casual everyday interests (food, gaming, music, fixing hardware, plants, community cook-offs) as a low-stakes psychological bridge to map out functional strengths without clinical interrogation.
2. **Decoupling Literacy from Intelligence (Dual-Axis Model):** Standard institutional assessments make a critical mistake: they treat **text literacy and tolerance for paperwork** as the same thing as **intelligence**. An adult who struggles with spelling, reading walls of text, or filling out government forms may simultaneously possess elite spatial reasoning, mechanical troubleshooting, culinary pacing, audio signal-flow logic, or crisis de-escalation skills. Our system evaluates **Problem-Solving Complexity** completely independently from **Text/Administrative Friction**.
3. **Deterministic Coordinator DDL Verification:** Pure LLM prompts hallucinate grants, miss application deadlines, and ignore hard barriers (like missing ID or transit poverty). Every LLM recommendation is strictly cross-referenced against a live PostgreSQL database (`pgvector` + relational rules) synced with provincial and community APIs.

---

## PART 2: SYSTEM ARCHITECTURE & DUAL-DEVICE "CO-PILOT" FLOW

### 2.1 Four-Tier Backend Architecture
```
[ 1. User / Co-Pilot Workbook Intake (Voice, Sliders, Visual Cards) ]
                         ↓
[ 2. LLM Dual-Axis & Blueprint Synthesizer ]  <-- Extracts pro skills, problem-solving IQ, & barriers
                         ↓
[ 3. Deterministic RAG & PostgreSQL DDL Check ] <-- Verifies live status, ID rules, oral testing, transit
                         ↓
[ 4. Action Plan & Coordinator Warm Handoff ]   <-- Outputs 1 immediate relief win + 1 verified bridge step
```

### 2.2 Dual-Device "Co-Pilot" Workbook Architecture (1-on-1 & Classroom Mode)
Instead of a coordinator sitting behind a desk typing into a hidden monitor while the client feels "processed," the system uses a real-time synced workspace (via WebSockets / Socket.io / Supabase Realtime) across a shared tablet and a companion phone app:

```
[ Coordinator Tablet / Surface Pro (The Shared Blueprint Canvas) ]
   │  • Side-by-side interactive modules (drag-and-drop, sliders, visual diagrams)
   │  • Coordinator "Drop-In Drawer": Push specific modules to the canvas on the fly
   │  • Voice-to-Blueprint Mic: Captures spoken explanations -> zero spelling required
   │  • Silent Backend: LLM translates interactions into SQL/DDL verification queries
   ▼
[ Real-Time Sync Layer (WebSockets / Local Network) ]
   ▼
[ Client Companion Phone App (The Pocket Takeaway) ]
      • Zero clutter: Displays their custom "Skill Blueprint" & strengths
      • Interactive card swiping ("Lock It In" / "Test Run" / "Scrap It")
      • Voice-note drops & photo logs (things they built, cooked, or fixed)
      • "My Next 1 Step" card: Verified program match, bus route, warm contact
```

---

## PART 3: THE DUAL-AXIS COMPETENCY & TRAJECTORY MATRIX

### 3.1 Dual-Axis Evaluation Grid
Every client/student is plotted across two independent axes so that low spelling/reading tolerance never downgrades their problem-solving tier:

```
                     HIGH PROBLEM-SOLVING / SYSTEMS IQ (Score: 4–5)
                                           ▲
     [ QUADRANT A: Hands-On Specialist ]   │   [ QUADRANT B: Systems & Tech Lead ]
     • High spatial, mechanical, culinary, │   • High technical & systems fluency
       audio, or street-smart logic        │   • Comfortable with specs, code, or
     • Low tolerance for spelling/forms    │     written documentation
     • Route to: Red Seal trades (with     │   • Route to: IT/Server admin, CAD,
       oral exam accommodation), stagehand │     project coordination, formal
       unions, fabrication, line cook      │     diploma/degree pathways
     ◄─────────────────────────────────────┼─────────────────────────────────────►
     LOW TEXT / ADMIN TOLERANCE (Score: 1) │     HIGH TEXT / ADMIN TOLERANCE (Score: 5)
                                           │
     [ QUADRANT C: Guided Foundations ]    │   [ QUADRANT D: Structured Admin ]
     • Prefers steady, predictable,        │   • Comfortable with reading/typing
       hands-on tasks with visual coaching │   • Prefers clear checklists & routine
     • Route to: Supported peer cohorts,   │   • Route to: Data entry, inventory
       community gardens, prep kitchens,   │     control, reception, clerical
       stabilization workshops             │     support roles
                                           ▼
                     STEADY / ROUTINE TASK PREFERENCE (Score: 1–2)
```

### 3.2 Hobby-to-Career Trajectory Mapping
| Personal Interest / Hobby | Underlying Functional Skill | Bridge Program / Immediate Service | Longer-Term Employment Goal |
| :--- | :--- | :--- | :--- |
| **Cooking / Community Cook-offs** | Pacing, food safety, prep logistics, heat management | FoodSafe Level 1 subsidies, community kitchen stipends | Line cook, prep cook, catering operations, culinary Red Seal |
| **Gaming / Modding / Server Tinkering** | Systematic troubleshooting, logic, hardware diagnostics | Civic digital labs, hardware refurbishment co-ops, CompTIA bridges | IT helpdesk, server/network tech, hardware repair |
| **Gardening / Plants / Outdoors** | Physical stamina, botanical care, spatial layout | Urban farming cohorts, municipal trail maintenance programs | Landscaping, municipal parks, nursery operations, arborist |
| **Music / Audio / Live Events** | Signal flow logic, acoustic troubleshooting, gear rigging | Community media labs, arts council micro-grants, stagehand intros | Audio/video technician, live event stagehand (IATSE), studio tech |
| **Fixing Bikes / Mechanical Tinkering** | Root-cause isolation, tool fluency, spatial assembly | Community bike kitchen cohorts, trades discovery foundations | Millwright apprentice, heavy duty mechanic, fabrication |

### 3.3 Maslow's Barrier Mitigation Hierarchy
A job or school placement will fail if immediate survival friction isn't cleared first:
* **Tier 1: Immediate Stabilization & Survival Relief:** Subsidized transit passes (Compass cards), emergency grocery/community kitchen access, low-barrier harm reduction, replacement government ID clinics.
* **Tier 2: Transitional & Bridge Supports:** Stipended training cohorts, work gear vouchers (steel-toed boots, rain gear), funded short certificates (FoodSafe, First Aid, WHMIS, Forklift), coordinator scribe support for forms.
* **Tier 3: Placement & Career Launch:** WorkBC wage subsidies, Red Seal trades foundations with oral exam accommodations, supportive employer placements.

---

## PART 4: ADULT "PRO-STUDIO / SHOP BLUEPRINT" WORKBOOK MODULES

To ensure grown adults never feel patronized by "kiddie" quizzes, all workbook modules use a **Pro-Studio / Shop Blueprint** aesthetic (audio mixers, diagnostic schematics, loadout decks) and require **zero spelling or typing**.

### Module 1: "The Troubleshooter" (Visual Scenario Diagnostics)
* **Purpose:** Gauges high-level problem-solving, spatial reasoning, and triage logic without reading or writing.
* **UI Mechanic:** Interactive visual diagram on the tablet showing a real-world bottleneck:
  * *Scenario A (Kitchen Rush):* Commercial prep line is backed up 15 minutes before service, and a primary burner goes down.
  * *Scenario B (Signal/Hardware):* A stage audio rig or server rack has a dead signal path and tangled power distribution.
  * *Scenario C (Shop Bay):* A construction/repair bay has materials blocking the main exit and two critical tools missing.
* **User Action:** User taps components on the diagram or verbally tells the coordinator how they would isolate the fault, re-order the sequence, or direct a helper.
* **Competency Output:** Calculates `problem_solving_complexity` (1–5) and identifies whether they solve problems via **Root-Cause Isolation**, **Spatial Reorganization**, or **Crew Delegation**.

### Module 2: "System Spec Sheet" (How Your Brain Runs Best)
* **Purpose:** Replaces invasive literacy or disability questions with an audio equalizer / custom rig tuning interface.
* **UI Mechanic:** Tactile switches and sliders:
  * **Input Channel (How you take in info fastest):** `[Hands-On / Watch & Do]` | `[Visual Diagram / Blueprint]` | `[Talk It Through / Audio]` | `[Written Manual / Text]`
  * **Operating Mode Sliders:**
    * `Solo Deep-Focus <─────────┼─> Small Tight Crew`
    * `Step-by-Step Checklist <──┼────────> Give Me the End Goal & Let Me Build`
  * **System Bottlenecks (What drains your battery):** `[Heavy Reading / Spelling Forms]` | `[Sitting Still at a Desk]` | `[Loud Crowded Rooms]` | `[Early Morning Transit]`
* **Competency Output:** Sets `text_admin_tolerance` (1–5), `preferred_learning_modality`, and `autonomy_preference`.

### Module 3: "Voice-to-Blueprint" (Spoken Skill Extractor)
* **Purpose:** Lets users who hate typing/spelling talk naturally for 60 seconds about something they know how to do, rewarding them with an instant technical breakdown.
* **UI Mechanic:** A single studio-style **"Record / Talk"** button.
* **Prompt:** *"Tell me about something you've fixed, cooked, built, modded, or organized that came out right. Don't worry about formal words—just walk me through how you did it."*
* **Output:** Whisper STT transcribes the audio, and the LLM renders a clean **Technical Competency Blueprint** on screen in real time—showing the user how their everyday story translates into professional trade/technical skills.

### Module 4: "The Loadout" (Tactile Card Sort)
* **Purpose:** Fast, visual filtering of work environments and industries.
* **UI Mechanic:** Photo/icon cards with optional audio tap-to-read. Swiped into **"Lock It In" (Hell Yeah)**, **"Test Run" (Maybe)**, or **"Scrap It" (Hard Pass)**.

### Module 5: "The Pressure Valve" (Barrier Offloader)
* **Purpose:** Identifies urgent survival or administrative friction so the coordinator can take the pressure off today.
* **UI Mechanic:** Tactile toggle blocks representing heavy rocks. The user taps 1 or 2 blocks to hand over to the coordinator: `[Transit Pass / Compass]` | `[Groceries / Meals]` | `[Paperwork / Scribe Help]` | `[Replacement ID / SIN]` | `[Work Boots / Gear]`.

---

## PART 5: NON-INVASIVE CONVERSATIONAL QUESTION MATRIX

When the coordinator and student are talking casually (without using tablet visual modules), these questions uncover readiness, literacy barriers, and competency without triggering defensiveness:

### Tier 1: High-Barrier / Stabilization & Low-Friction
| Casual Question Asked to Client | Hidden Coordinator Signal | Database Filter Triggered |
| :--- | :--- | :--- |
| *"When you want to learn how to make or fix something—like a meal or a game tip—do you prefer watching someone do it in person, watching a short video, or reading steps?"* | **Literacy & Learning Modality:** Identifies reading/spelling friction without asking *"Can you read well?"* | `min_reading_clb_level = 0`, `primary_instruction_mode = 'Kinesthetic_HandsOn'` |
| *"What does a really good day look like for your energy—are you a morning person, a night owl, or does it change day to day?"* | **Schedule Stability & Stamina:** Gauges if a rigid 8:00 AM classroom will fail vs. flexible drop-in hours. | `intake_type = 'Drop-In'`, `required_readiness_tier = 1` |
| *"If a cool community project or kitchen was happening nearby, what's the biggest headache in getting there—bus fare, the crowd, or just having a busy week?"* | **Immediate Friction Check:** Uncovers transit poverty or social anxiety naturally. | `provides_transit_tickets = TRUE` |
| *"How do you feel about paperwork and forms? Do you usually knock them out, or would you rather have someone sit down with a coffee and help sort the annoying stuff?"* | **Administrative / ID Barriers:** Flags missing ID/SIN or need for a scribe during registration. | `requires_government_id = FALSE`, `scribe_or_reader_available = TRUE` |

### Tier 2: Transitional / Stipended Bridge & Hands-On Labs
| Casual Question Asked to Client | Hidden Coordinator Signal | Database Filter Triggered |
| :--- | :--- | :--- |
| *"When you're deep into a project—cooking, gaming, music, or fixing something—do you like hyper-focusing solo for hours, or bouncing ideas around with a small crew?"* | **Work Environment Fit:** Separates solo technical/back-of-house roles from collaborative crew roles. | Matches `autonomy_preference` (`Independent_Problem_Solver` vs. `Small_Crew_Collab`) |
| *"If you could jump into a hands-on workshop that pays a training stipend or gives you free gear, what sounds least boring: commercial cooking, building/fixing hardware, audio/media, or outdoor work?"* | **Goal & Stipend Motivation:** Identifies primary interest cluster while confirming readiness for a multi-week cohort. | `required_readiness_tier = 2`, `provides_living_stipend = TRUE` |

### Tier 3: High-Skill / Career & Apprenticeship Launch
| Casual Question Asked to Client | Hidden Coordinator Signal | Database Filter Triggered |
| :--- | :--- | :--- |
| *"Think about a time things went sideways on a project, a meal, or a build, and you figured out a workaround—how did you troubleshoot it?"* | **Systems & Triage IQ:** Confirms high `problem_solving_complexity` (4–5) for trades/technical routing. | `supports_high_skill_low_text = TRUE`, `max_problem_solving_tier >= 4` |
| *"To step into a full-time trade, program, or job next month, what's the last missing piece—work boots/gear, a quick ticket like FoodSafe/First Aid, or bypassing written exams with a practical test?"* | **Final Launch Accommodation:** Identifies exact rapid-funding or oral exam accommodation required. | `provides_gear_or_boots = TRUE`, `offers_oral_or_practical_testing = TRUE` |

---

## PART 6: EXTERNAL APIs & OPEN DATA REGISTRIES TO CONNECT

To keep the PostgreSQL database accurate without manual data entry for thousands of programs, ingest and cross-reference these four Canadian/provincial data feeds:

| Data Source / API | Protocol / Standard | What It Provides | Ingestion / Sync Strategy |
| :--- | :--- | :--- | :--- |
| **BC211 / 211 Canada API** | REST API / Open Referral **HSDS v3.0 JSON** & AIRS XML | 150,000+ community, shelter, food, outreach, and foundational programs across BC and Canada. | Nightly cron sync via 211 API key (`211.ca/data`) mapped to `verified_programs` table. |
| **BC Data Catalogue API** | CKAN REST API (`catalogue.data.gov.bc.ca/api/3/action/package_search`) | Live locations and metadata for WorkBC centres, skills training grants, transit hubs, and health clinics. | Open read-only REST pulls; zero API key required for public datasets. |
| **National Occupational Classification (NOC) & Job Bank API** | Open Government CKAN API (`open.canada.ca`) | Maps extracted hobby skills to formal 5-digit NOC codes, regional wage rates, and entry requirements. | Sync NOC skill taxonomy JSON into local embeddings for semantic hobby-to-career matching. |
| **EducationPlannerBC & SkilledTradesBC** | XML/JSON Feeds & Scheduled Scrapers | Post-secondary micro-credentials, Red Seal foundation programs, tuition waivers, and trade exam accommodations. | Weekly sync into `verified_programs` and `program_suitability_rules`. |

---

## PART 7: MASTER POSTGRESQL DATABASE SCHEMA (DDL)

Run this complete SQL script to initialize your PostgreSQL database with `pgvector`, Dual-Axis Competency tracking, Coordinator DDL verification views, and Workbook Session persistence.

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 1. CORE VERIFIED PROGRAMS TABLE (Synced with 211 & Provincial APIs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS verified_programs (
    program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_211_id VARCHAR(100) UNIQUE,
    program_name VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN (
        'Survival_Relief', 'Bridge_Training', 'Trades_Apprenticeship', 
        'Tech_Media_Lab', 'Culinary_Hospitality', 'Employment_Placement', 'Peer_Community'
    )),
    
    -- Live Operational Status (Crucial for Coordinator DDL Check)
    operational_status VARCHAR(30) DEFAULT 'Active' CHECK (operational_status IN (
        'Active', 'Waitlisted', 'Paused', 'Seasonal_Closed', 'Defunct'
    )),
    intake_type VARCHAR(50) CHECK (intake_type IN (
        'Drop-In', 'Referral_Required', 'Warm_Handoff', 'Scheduled_Intake', 'Online_Application'
    )),
    waitlist_weeks_estimate INT DEFAULT 0,
    contact_lead_name VARCHAR(100),
    contact_phone_or_email VARCHAR(150),
    last_verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_by_coordinator VARCHAR(100),

    -- Location & Transit Accessibility
    municipality VARCHAR(100) NOT NULL, -- e.g., 'Surrey', 'Coquitlam', 'Delta', 'Richmond', 'Vancouver'
    street_address TEXT,
    transit_accessible BOOLEAN DEFAULT TRUE,
    nearest_transit_stop VARCHAR(255),
    delivery_mode VARCHAR(30) CHECK (delivery_mode IN ('In-Person', 'Online', 'Hybrid', 'Shop_Floor')),

    -- Semantic Vector for Hobby/Skill Matching (OpenAI 1536 or Local 768/1024 dim)
    interest_embedding vector(1536)
);

-- ============================================================================
-- 2. DUAL-AXIS SUITABILITY, BARRIER & ACCOMMODATION RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_suitability_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES verified_programs(program_id) ON DELETE CASCADE,
    
    -- Readiness & Problem-Solving Complexity Alignment
    required_readiness_tier INT CHECK (required_readiness_tier IN (1, 2, 3)),
    min_problem_solving_tier INT DEFAULT 1 CHECK (min_problem_solving_tier BETWEEN 1 AND 5),
    max_problem_solving_tier INT DEFAULT 5 CHECK (max_problem_solving_tier BETWEEN 1 AND 5),
    
    -- Literacy & Learning Modality Accommodations (High-Skill / Low-Text Support)
    min_reading_clb_level INT DEFAULT 0, -- 0 = No reading/spelling barrier
    supports_high_skill_low_text BOOLEAN DEFAULT FALSE, -- True for hands-on trades, culinary, media, fabrication
    offers_oral_or_practical_testing BOOLEAN DEFAULT FALSE, -- Exams done verbally or on shop floor
    scribe_or_reader_available BOOLEAN DEFAULT FALSE, -- Staff helps fill out intake/union forms
    primary_instruction_mode VARCHAR(50) DEFAULT 'Kinesthetic_HandsOn' CHECK (primary_instruction_mode IN (
        'Kinesthetic_HandsOn', 'Visual_Blueprint', 'Verbal_Coaching', 'Text_Manual'
    )),
    
    -- Administrative & ID Friction Filters (Avoids Dead-Ends)
    requires_government_id BOOLEAN DEFAULT FALSE,
    requires_sin_number BOOLEAN DEFAULT FALSE,
    requires_clean_record BOOLEAN DEFAULT FALSE,
    sobriety_requirement VARCHAR(50) DEFAULT 'Low_Barrier_Harm_Reduction',
    
    -- Built-In Barrier Relief Provided by the Program
    provides_transit_tickets BOOLEAN DEFAULT FALSE,
    provides_food_or_meals BOOLEAN DEFAULT FALSE,
    provides_living_stipend BOOLEAN DEFAULT FALSE,
    provides_gear_or_boots BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 3. INTERACTIVE WORKBOOK MODULE REGISTRY (Coordinator's Toolbox)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workbook_modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code VARCHAR(50) UNIQUE NOT NULL, -- 'TROUBLESHOOTER', 'SPEC_SHEET', 'VOICE_BLUEPRINT', 'LOADOUT_DECK', 'PRESSURE_VALVE'
    display_title VARCHAR(100) NOT NULL,
    ui_component_type VARCHAR(50) CHECK (ui_component_type IN (
        'Visual_Diagnostic', 'Equalizer_Sliders', 'Voice_Recorder', 'Card_Sort', 'Barrier_Toggles'
    )),
    requires_spelling_or_typing BOOLEAN DEFAULT FALSE,
    json_config_schema JSONB NOT NULL
);

-- ============================================================================
-- 4. CLIENT / STUDENT WORKBOOK SESSIONS (Progressive Co-Pilot State)
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_workbook_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_alias VARCHAR(100) NOT NULL, -- Anonymous nickname/handle chosen by client
    coordinator_id VARCHAR(100),
    
    -- Dual-Axis Competency Profile
    problem_solving_complexity INT CHECK (problem_solving_complexity BETWEEN 1 AND 5),
    text_admin_tolerance INT CHECK (text_admin_tolerance BETWEEN 1 AND 5),
    preferred_learning_modality VARCHAR(50) CHECK (preferred_learning_modality IN (
        'Kinesthetic_HandsOn', 'Visual_Blueprint', 'Verbal_Coaching', 'Text_Manual'
    )),
    autonomy_preference VARCHAR(50) CHECK (autonomy_preference IN (
        'Independent_Problem_Solver', 'Small_Crew_Collab', 'Structured_Checklist'
    )),
    current_readiness_tier INT DEFAULT 1 CHECK (current_readiness_tier IN (1, 2, 3)),
    
    -- Live Workbook Artifacts (Synced between Tablet & Phone)
    skill_blueprint_json JSONB DEFAULT '{}'::jsonb,
    completed_modules_json JSONB DEFAULT '[]'::jsonb,
    extracted_likes_tags TEXT[],
    extracted_dislikes_tags TEXT[],
    active_barriers TEXT[],
    
    -- Pinned Action Step (The "One Next Step" Rule)
    pinned_program_id UUID REFERENCES verified_programs(program_id),
    next_micro_step_text TEXT,
    coordinator_scribe_required BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. COORDINATOR DDL VERIFICATION VIEW (Real-Time Green-Light Check)
-- ============================================================================
CREATE OR REPLACE VIEW coordinator_dual_axis_check AS
SELECT 
    p.program_id,
    p.program_name,
    p.organization_name,
    p.category,
    p.municipality,
    p.operational_status,
    p.intake_type,
    p.waitlist_weeks_estimate,
    p.contact_lead_name,
    p.contact_phone_or_email,
    p.nearest_transit_stop,
    r.required_readiness_tier,
    r.min_problem_solving_tier,
    r.max_problem_solving_tier,
    r.supports_high_skill_low_text,
    r.offers_oral_or_practical_testing,
    r.scribe_or_reader_available,
    r.primary_instruction_mode,
    r.requires_government_id,
    r.requires_clean_record,
    r.provides_transit_tickets,
    r.provides_food_or_meals,
    r.provides_living_stipend,
    r.provides_gear_or_boots,
    EXTRACT(DAY FROM (NOW() - p.last_verified_at)) AS days_since_verified
FROM verified_programs p
JOIN program_suitability_rules r ON p.program_id = r.program_id;
```

---

## PART 8: LLM SYSTEM PROMPTS & FUNCTION-CALLING TOOLS

### 8.1 Master System Prompt (Dual-Axis Synthesizer & Co-Pilot)
Feed this prompt into your LLM orchestrator:

```markdown
### SYSTEM PROMPT: MULTI-BARRIER CO-PILOT & DUAL-AXIS SYNTHESIZER

You are an expert Vocational Systems Translator and Trauma-Informed Co-Pilot assisting a Program Coordinator and an adult student/client during a live interactive workbook session.

#### CORE DIRECTIVES
1. NEVER CONFLATE LITERACY WITH INTELLIGENCE: Many multi-barrier adults possess high-level mechanical, spatial, culinary, creative, or systems-troubleshooting intelligence while experiencing severe friction with spelling, heavy text, or bureaucratic forms.
2. ZERO PATRONIZING LANGUAGE: Speak like a sharp, respectful shop lead or studio producer. Never use clinical, bureaucratic, or childish language.
3. NEVER HALLUCINATE PROGRAMS: You must ONLY recommend programs returned by the `verify_programs_ddl` database tool.
4. THE "ONE NEXT STEP" RULE: Never overwhelm the user with a list of 10 links. Output 1 Immediate Relief Win (to take pressure off today) and 1 Primary Bridge/Skill Step.

#### YOUR TASK
Analyze the user's raw spoken voice transcript (which may contain slang, phonetic spelling, or fragmented speech) and their interactive workbook selections. Output a structured JSON payload that:
1. Renders a badass, validating "Client Skill Blueprint" on the shared tablet.
2. Scores `problem_solving_complexity` (1-5) independently from `text_admin_tolerance` (1-5).
3. Generates exact SQL filter parameters to query `coordinator_dual_axis_check`.

#### REQUIRED JSON OUTPUT FORMAT
{
  "client_facing_blueprint": {
    "headline_strength": "Short, adult-respecting title (e.g., 'Systems Troubleshooter & Hands-On Builder')",
    "extracted_pro_skills": [
      {
        "what_you_did": "Reference to their casual story/hobby (e.g., 'Organizing a community cook-off / fixing hardware')",
        "pro_translation": "Industry/trade competency (e.g., 'High-Volume Prep Pacing & Hardware Diagnostics')",
        "noc_domain": "Mapped Canadian NOC category"
      }
    ]
  },
  "dual_axis_scores": {
    "problem_solving_complexity": 4,
    "text_admin_tolerance": 1,
    "preferred_learning_modality": "Kinesthetic_HandsOn",
    "autonomy_preference": "Independent_Problem_Solver",
    "recommended_readiness_tier": 2
  },
  "ddl_query_parameters": {
    "municipality": "Surrey",
    "supports_high_skill_low_text": true,
    "offers_oral_or_practical_testing": true,
    "scribe_or_reader_available": true,
    "requires_government_id": false,
    "provides_transit_tickets": true
  },
  "coordinator_private_notes": "Client demonstrates strong root-cause troubleshooting and spatial logic (4/5), but explicitly flagged spelling/reading friction (1/5). Avoid text-heavy online portals. Route to hands-on trades bridge, culinary lab, or tech makerspace. Coordinator should act as scribe for registration forms."
}
```

### 8.2 LLM Tool Definition (`verify_programs_ddl`)
Register this tool in your OpenAI / Claude / Local LLM API call so the model queries PostgreSQL directly:

```json
{
  "type": "function",
  "function": {
    "name": "verify_programs_ddl",
    "description": "Queries the PostgreSQL coordinator_dual_axis_check view to verify that a program is active and matches the user's Dual-Axis competency and barrier rules.",
    "parameters": {
      "type": "object",
      "properties": {
        "municipality": { "type": "string", "description": "City name, e.g., Surrey, Coquitlam, Delta, Vancouver" },
        "supports_high_skill_low_text": { "type": "boolean", "description": "True if user has high problem-solving IQ but low spelling/reading tolerance" },
        "offers_oral_or_practical_testing": { "type": "boolean", "description": "True if user needs practical/verbal assessment instead of written exams" },
        "requires_government_id": { "type": "boolean", "description": "False if user currently lacks government ID" },
        "provides_transit_tickets": { "type": "boolean", "description": "True if user needs Compass card / bus fare support" },
        "provides_gear_or_boots": { "type": "boolean", "description": "True if user needs work boots or tools provided" }
      },
      "required": ["municipality", "supports_high_skill_low_text"]
    }
  }
}
```

---

## PART 9: COORDINATOR TRIAGE DASHBOARD OUTPUT TEMPLATE

When the SQL query returns verified matches, the Coordinator Tablet displays this 1-page verification card:

```
========================================================================
COORDINATOR CO-PILOT SUMMARY — SESSION #A842 (Client Alias: "Stratus")
========================================================================
• Dual-Axis Profile     : Problem-Solving IQ [4/5] | Text/Form Tolerance [1/5]
• Quadrant Classification: QUADRANT A — Hands-On Specialist / Troubleshooter
• Learning Modality     : Kinesthetic / Visual Blueprint (Avoid walls of text)
• Active Pressure Valve : Needs Compass Transit Support + Scribe for Forms

[ CLIENT SKILL BLUEPRINT (Displayed on Shared Screen & Phone App) ]
  ✓ Hardware & Signal Diagnostics (Extracted from: Audio/PC tinkering)
  ✓ High-Volume Prep & Pacing     (Extracted from: Community cook-off)

[ VERIFIED GREEN-LIGHT MATCHES (PostgreSQL DDL Checked < 14 Days Ago) ]
------------------------------------------------------------------------
1. [GREEN MATCH] Community Culinary & FoodSafe Bridge Cohort (Surrey)
   • Status: ACTIVE (Verified 6 days ago) | Intake: Warm Handoff | Waitlist: ~1 wk
   • High-Skill / Low-Text Fit: 100% hands-on commercial kitchen lab;
     FoodSafe Level 1 exam administered with verbal/reader accommodation.
   • Barrier Relief Included: Provides daily meals + Compass transit tickets.
   • Coordinator Action: Call Sarah (Lead) at 604-XXX-XXXX; act as scribe for 1-page intake.

2. [GREEN MATCH] Civic Hardware & Makerspace Fabrication Lab (Surrey / New West)
   • Status: ACTIVE (Verified 11 days ago) | Intake: Drop-In (Tue/Thu 1pm–4pm)
   • High-Skill / Low-Text Fit: Practical troubleshooting & tool shop; zero written tests;
     no government ID required for initial drop-in bench access.
========================================================================
```

---

## PART 10: IMPLEMENTATION ROADMAP (MVP TO SCALE)

1. **Phase 1: Local Database & Seed Script (Weekend Build)**
   * Spin up PostgreSQL with `pgvector` (via Docker or Supabase).
   * Run the Master DDL script in **Part 7**.
   * Seed 20–30 real local programs in your region (e.g., Surrey/Lower Mainland community kitchens, WorkBC trades bridges, Options Community Services programs, maker labs).
2. **Phase 2: LLM Function-Calling Backend**
   * Connect Node.js or Python (FastAPI) to your LLM (OpenAI API, Claude API, or local Node 82 / LM Studio / Jan / Ollama server).
   * Wire the `verify_programs_ddl` tool to run live parameterized `SELECT` queries against `coordinator_dual_axis_check`.
3. **Phase 3: Co-Pilot Tablet & Phone UI**
   * Build the 5 zero-spelling workbook modules in React/Tailwind (Voice-to-Blueprint mic button, Equalizer Spec Sheet sliders, Troubleshooter visual cards, and Pressure Valve toggles).
   * Add WebSocket sync so swiping a card on the client's phone updates the coordinator's tablet in real time.
