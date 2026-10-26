-- ============================================================================
-- FUTURE FORWARD AND BEYOND: MULTI-BARRIER NAVIGATOR & CO-PILOT WORKBOOK
-- Master PostgreSQL Database Schema (DDL) + Seed Data (v4.0)
-- ============================================================================

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
    municipality VARCHAR(100) NOT NULL, -- e.g., 'Surrey', 'Coquitlam', 'Delta', 'Richmond', 'Vancouver', 'New Westminster'
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
    p.external_211_id,
    p.program_name,
    p.organization_name,
    p.category,
    p.municipality,
    p.street_address,
    p.operational_status,
    p.intake_type,
    p.waitlist_weeks_estimate,
    p.contact_lead_name,
    p.contact_phone_or_email,
    p.nearest_transit_stop,
    p.delivery_mode,
    r.required_readiness_tier,
    r.min_problem_solving_tier,
    r.max_problem_solving_tier,
    r.min_reading_clb_level,
    r.supports_high_skill_low_text,
    r.offers_oral_or_practical_testing,
    r.scribe_or_reader_available,
    r.primary_instruction_mode,
    r.requires_government_id,
    r.requires_sin_number,
    r.requires_clean_record,
    r.sobriety_requirement,
    r.provides_transit_tickets,
    r.provides_food_or_meals,
    r.provides_living_stipend,
    r.provides_gear_or_boots,
    EXTRACT(DAY FROM (NOW() - p.last_verified_at))::INT AS days_since_verified
FROM verified_programs p
JOIN program_suitability_rules r ON p.program_id = r.program_id;
