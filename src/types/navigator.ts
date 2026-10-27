export type ProgramCategory =
  | 'Survival_Relief'
  | 'Bridge_Training'
  | 'Trades_Apprenticeship'
  | 'Tech_Media_Lab'
  | 'Culinary_Hospitality'
  | 'Employment_Placement'
  | 'Peer_Community';

export type OperationalStatus = 'Active' | 'Waitlisted' | 'Paused' | 'Seasonal_Closed' | 'Defunct';

export type IntakeType =
  | 'Drop-In'
  | 'Referral_Required'
  | 'Warm_Handoff'
  | 'Scheduled_Intake'
  | 'Online_Application';

export type LearningModality =
  | 'Kinesthetic_HandsOn'
  | 'Visual_Blueprint'
  | 'Verbal_Coaching'
  | 'Text_Manual';

export type AutonomyPreference =
  | 'Independent_Problem_Solver'
  | 'Small_Crew_Collab'
  | 'Structured_Checklist';

export type ModuleCode =
  | 'TROUBLESHOOTER'
  | 'SPEC_SHEET'
  | 'VOICE_BLUEPRINT'
  | 'LOADOUT_DECK'
  | 'PRESSURE_VALVE';

export interface VerifiedProgramRecord {
  program_id: string;
  external_211_id: string;
  program_name: string;
  organization_name: string;
  category: ProgramCategory;
  operational_status: OperationalStatus;
  intake_type: IntakeType;
  waitlist_weeks_estimate: number;
  contact_lead_name: string;
  contact_phone_or_email: string;
  last_verified_at: string;
  verified_by_coordinator: string;
  municipality: string;
  street_address: string;
  transit_accessible: boolean;
  nearest_transit_stop: string;
  delivery_mode: 'In-Person' | 'Online' | 'Hybrid' | 'Shop_Floor';
  required_readiness_tier: 1 | 2 | 3;
  min_problem_solving_tier: number;
  max_problem_solving_tier: number;
  min_reading_clb_level: number;
  supports_high_skill_low_text: boolean;
  offers_oral_or_practical_testing: boolean;
  scribe_or_reader_available: boolean;
  primary_instruction_mode: LearningModality;
  requires_government_id: boolean;
  requires_sin_number: boolean;
  requires_clean_record: boolean;
  sobriety_requirement: string;
  provides_transit_tickets: boolean;
  provides_food_or_meals: boolean;
  provides_living_stipend: boolean;
  provides_gear_or_boots: boolean;
  days_since_verified: number;
  hobby_tags: string[];
  noc_code: string;
  highlight_note: string;
}

export interface WorkbookModuleRecord {
  module_id: string;
  module_code: ModuleCode;
  display_title: string;
  ui_component_type:
    | 'Visual_Diagnostic'
    | 'Equalizer_Sliders'
    | 'Voice_Recorder'
    | 'Card_Sort'
    | 'Barrier_Toggles';
  requires_spelling_or_typing: boolean;
  json_config_schema: Record<string, any>;
}

export interface ExtractedProSkill {
  what_you_did: string;
  pro_translation: string;
  noc_domain: string;
}

export interface SkillBlueprint {
  headline_strength: string;
  extracted_pro_skills: ExtractedProSkill[];
  coordinator_private_notes: string;
}

export interface LoadoutCardItem {
  id: string;
  title: string;
  category: ProgramCategory;
  icon: string;
  status: 'Lock It In' | 'Test Run' | 'Scrap It' | 'Unrated';
  tagline: string;
}

export type ClientAgeGroup =
  | 'Youth & Young Adult (Under 25)'
  | 'Adult (25–54)'
  | 'Senior & Elder (55+)'
  | 'Family / Parent & Caregiver';

export interface PublicClientProfileSummary {
  session_id: string;
  client_alias: string;
  municipality: string;
  avatar_icon: string;
  age_group: string;
  pin_recovery_hint?: string;
  is_guest?: boolean;
  updated_at: string;
}

export interface ClientRegistrationPayload {
  client_alias: string;
  pin_code: string;
  pin_recovery_hint?: string;
  municipality: string;
  avatar_icon?: string;
  age_group?: string;
  active_barriers?: string[];
  preferred_learning_modality?: LearningModality;
  upgrade_from_session_id?: string;
}

export interface ClientWorkbookSession {
  session_id: string;
  client_alias: string;
  coordinator_id: string;
  municipality: string;
  pin_code?: string;
  pin_recovery_hint?: string;
  avatar_icon?: string;
  age_group?: string;
  is_guest?: boolean;
  problem_solving_complexity: number;
  text_admin_tolerance: number;
  preferred_learning_modality: LearningModality;
  autonomy_preference: AutonomyPreference;
  current_readiness_tier: 1 | 2 | 3;
  troubleshooter_selections: {
    scenario_id: string;
    selected_node_id: string;
    solving_style: 'Root-Cause Isolation' | 'Spatial Reorganization' | 'Crew Delegation';
  };
  spec_sheet_state: {
    input_channel: LearningModality;
    crew_slider: number; // 0 = Solo Deep-Focus, 100 = Small Tight Crew
    structure_slider: number; // 0 = Step-by-Step Checklist, 100 = Give Me End Goal & Let Me Build
    bottlenecks: string[];
  };
  voice_transcript: string;
  skill_blueprint_json: SkillBlueprint;
  completed_modules_json: ModuleCode[];
  extracted_likes_tags: string[];
  extracted_dislikes_tags: string[];
  active_barriers: string[];
  loadout_cards: LoadoutCardItem[];
  pinned_program_id: string | null;
  pinned_relief_program_id: string | null;
  next_micro_step_text: string;
  coordinator_scribe_required: boolean;
  active_module_on_canvas: ModuleCode;
  updated_at: string;
}

export interface DDLQueryFilterParams {
  municipality?: string;
  supports_high_skill_low_text?: boolean;
  offers_oral_or_practical_testing?: boolean;
  scribe_or_reader_available?: boolean;
  requires_government_id?: boolean;
  provides_transit_tickets?: boolean;
  provides_gear_or_boots?: boolean;
  provides_food_or_meals?: boolean;
  provides_living_stipend?: boolean;
  category?: ProgramCategory;
}

export interface FeedConnectorStatus {
  id: string;
  name: string;
  provider: string;
  protocol: string;
  endpoint_url: string;
  status: 'online' | 'synced' | 'standby' | 'error';
  last_checked_at: string;
  remote_last_modified?: string;
  records_tracked: number;
  changes_detected: number;
  message: string;
}

export interface SyncChangeItem {
  timestamp: string;
  program_id: string;
  program_name: string;
  municipality: string;
  change_type: 'added' | 'updated' | 'verified';
  source_feed: string;
  summary: string;
}

export interface DailySyncState {
  auto_daily_enabled: boolean;
  interval_hours: number;
  last_sync_at: string;
  next_scheduled_sync_at: string;
  last_sync_trigger: 'startup' | 'scheduled_daily' | 'manual_refresh' | 'custom_import';
  total_programs_count: number;
  last_run_summary: {
    added_count: number;
    updated_count: number;
    verified_unchanged_count: number;
    duration_ms: number;
  };
  connectors: FeedConnectorStatus[];
  recent_changes: SyncChangeItem[];
}

