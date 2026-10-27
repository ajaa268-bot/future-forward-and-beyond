import React, { useState, useEffect } from 'react';
import {
  Waves,
  Sun,
  Compass,
  Trees,
  Flame,
  Wrench,
  Heart,
  Star,
  KeyRound,
  UserPlus,
  Sparkles,
  Phone,
  CheckCircle2,
  ArrowRight,
  Delete,
  HelpCircle,
  ShieldCheck,
  MapPin,
  Users,
  Eye
} from 'lucide-react';
import {
  PublicClientProfileSummary,
  ClientRegistrationPayload,
  ClientAgeGroup
} from '../types/navigator.js';
import { GROUPED_24_7_HELPLINES } from '../types/programGrouping.js';

interface LandingAndOnboardingViewProps {
  profiles: PublicClientProfileSummary[];
  initialTab?: 'login' | 'register';
  upgradeFromGuestSessionId?: string;
  initialGuestCity?: string;
  initialGuestBarriers?: string[];
  onLoginWithPin: (identifier: string, pinCode: string) => Promise<{ ok: boolean; error?: string }>;
  onRegisterWithPin: (payload: ClientRegistrationPayload) => Promise<{ ok: boolean; error?: string }>;
  onContinueAsGuest: (municipality?: string) => Promise<void>;
  onReturnToActiveSession?: () => void;
  hasActiveSession?: boolean;
  activeSessionAlias?: string;
}

export const AVATAR_OPTIONS = [
  { id: 'Waves', label: 'Ocean Wave', icon: Waves, color: 'bg-[#e0f6f3] text-[#116e62] border-[#9de0d6]' },
  { id: 'Sun', label: 'Warm Sun', icon: Sun, color: 'bg-[#fff3d6] text-[#9a5b13] border-[#f5d08a]' },
  { id: 'Compass', label: 'Compass', icon: Compass, color: 'bg-[#e3f1fc] text-[#17567d] border-[#a3d1f3]' },
  { id: 'Trees', label: 'Cedar Tree', icon: Trees, color: 'bg-[#e4f5e8] text-[#1b6b3a] border-[#a6dfb5]' },
  { id: 'Flame', label: 'Kitchen Spark', icon: Flame, color: 'bg-[#fdebe4] text-[#9c3b1b] border-[#f4b8a4]' },
  { id: 'Wrench', label: 'Hands-On Builder', icon: Wrench, color: 'bg-[#edeafb] text-[#453582] border-[#c2b8f0]' },
  { id: 'Heart', label: 'Caring Heart', icon: Heart, color: 'bg-[#fce8ef] text-[#8f2447] border-[#f2b6cb]' },
  { id: 'Star', label: 'North Star', icon: Star, color: 'bg-[#fef6df] text-[#855d10] border-[#f2d680]' }
];

export function renderAvatarIcon(avatarId?: string, className: string = 'w-5 h-5') {
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];
  const IconComponent = found.icon;
  return <IconComponent className={className} />;
}

const CITY_OPTIONS = [
  'Surrey',
  'White Rock / South Surrey',
  'Langley',
  'Delta',
  'Burnaby',
  'New Westminster',
  'Coquitlam',
  'Vancouver',
  'Richmond'
];

const AGE_GROUPS: ClientAgeGroup[] = [
  'Youth & Young Adult (Under 25)',
  'Adult (25–54)',
  'Senior & Elder (55+)',
  'Family / Parent & Caregiver'
];

const ONBOARDING_NEED_CARDS = [
  {
    id: 'Groceries / Meals',
    title: 'Food Banks & Daily Hot Meals',
    subtitle: 'Free groceries, hot lunches, community fridges & baby formula'
  },
  {
    id: 'Safe Shelter / Housing & Rent Subsidy',
    title: 'Safe Shelter, Housing & Rent Help',
    subtitle: '24/7 shelter beds, BC Housing, rent bank & outreach'
  },
  {
    id: 'Free Counselors & Emotional Support',
    title: 'Free Counselors & Someone to Talk To',
    subtitle: 'Walk-in counseling, trauma support, grief & family therapy'
  },
  {
    id: 'Pregnancy, Baby & Family Support',
    title: 'Pregnancy, New Baby & Parent Care',
    subtitle: 'Prenatal clinics, midwives, diapers, food vouchers & support'
  },
  {
    id: 'Hospitals, Doctors & Medical Labs',
    title: 'Hospitals, Walk-In Doctors & Labs',
    subtitle: '24/7 ERs, UPCC same-day doctors, bloodwork & ultrasound'
  },
  {
    id: 'Transit Pass / Compass',
    title: 'Bus Tickets & Compass Card Help',
    subtitle: 'Immediate transit tickets & low-cost pass assistance'
  },
  {
    id: 'Disability (PWD) / Income Assistance',
    title: 'Disability (PWD), Subsidies & Leisure Pass',
    subtitle: 'Income assistance, PWD advocacy & free rec centre passes'
  },
  {
    id: 'AA / NA / CA / CoDA Peer Recovery',
    title: 'AA / NA / CA / CoDA & Recovery Support',
    subtitle: '24/7 peer recovery meetings, detox & harm reduction'
  },
  {
    id: 'Youth, Families & Seniors (55+)',
    title: 'Youth Hubs, Families & Seniors (55+)',
    subtitle: 'Foundry youth clinics, seniors home help & caregiver support'
  },
  {
    id: 'Legal Aid & First Responder Help',
    title: 'Legal Aid, Tenancy & Victim Support',
    subtitle: 'Free legal advocates, eviction defense & non-emergency help'
  },
  {
    id: 'Work Boots / Gear',
    title: 'Hands-On Training, Schools & Work Gear',
    subtitle: 'Options+, Sources BC, KPU/BCIT/VCC trades & free work boots'
  },
  {
    id: 'Paperwork / Scribe Help',
    title: 'Friendly Help With Forms & ID',
    subtitle: 'Someone to sit down and fill out forms or replace lost ID with you'
  }
];

export const LandingAndOnboardingView: React.FC<LandingAndOnboardingViewProps> = ({
  profiles,
  initialTab = 'login',
  upgradeFromGuestSessionId,
  initialGuestCity,
  initialGuestBarriers,
  onLoginWithPin,
  onRegisterWithPin,
  onContinueAsGuest,
  onReturnToActiveSession,
  hasActiveSession,
  activeSessionAlias
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    upgradeFromGuestSessionId ? 'register' : initialTab
  );

  // Returning Client PIN Login state
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>(
    profiles[0]?.client_alias || 'Stratus'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showPinHint, setShowPinHint] = useState<boolean>(false);

  // New Client 3-Step Onboarding state (Zero Email Required)
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [regAlias, setRegAlias] = useState<string>('');
  const [regAvatar, setRegAvatar] = useState<string>('Waves');
  const [regCity, setRegCity] = useState<string>(initialGuestCity || 'Surrey');
  const [regAgeGroup, setRegAgeGroup] = useState<ClientAgeGroup>('Adult (25–54)');
  const [regPin, setRegPin] = useState<string>('');
  const [regHint, setRegHint] = useState<string>('');
  const [regBarriers, setRegBarriers] = useState<string[]>(
    initialGuestBarriers && initialGuestBarriers.length > 0
      ? initialGuestBarriers
      : ['Groceries / Meals', 'Transit Pass / Compass']
  );
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [guestCity, setGuestCity] = useState<string>(initialGuestCity || 'Surrey');
  const [showHelplines, setShowHelplines] = useState<boolean>(false);

  useEffect(() => {
    if (upgradeFromGuestSessionId) {
      setActiveTab('register');
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, upgradeFromGuestSessionId]);

  const activeProfileObj = profiles.find(
    (p) =>
      p.client_alias.toLowerCase() === selectedIdentifier.trim().toLowerCase() ||
      p.session_id.toLowerCase() === selectedIdentifier.trim().toLowerCase()
  );

  const handleDigitPress = (digit: string, mode: 'login' | 'register') => {
    if (mode === 'login') {
      setLoginError(null);
      if (pinInput.length < 4) {
        const next = pinInput + digit;
        setPinInput(next);
      }
    } else {
      setRegError(null);
      if (regPin.length < 4) {
        setRegPin(regPin + digit);
      }
    }
  };

  const handleBackspace = (mode: 'login' | 'register') => {
    if (mode === 'login') {
      setLoginError(null);
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      setRegError(null);
      setRegPin((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmitPinLogin = async (e?: React.FormEvent, overridePin?: string) => {
    if (e) e.preventDefault();
    const finalPin = overridePin !== undefined ? overridePin : pinInput;
    if (!selectedIdentifier.trim()) {
      setLoginError('Please tap your name or type your nickname first.');
      return;
    }
    if (finalPin.length < 4) {
      setLoginError('Please enter your 4-digit PIN using the number pad.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await onLoginWithPin(selectedIdentifier.trim(), finalPin);
      if (!res.ok) {
        setLoginError(
          res.error || 'That PIN did not match. Try 1234 for Stratus or check your hint.'
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleToggleNeed = (needId: string) => {
    setRegBarriers((prev) =>
      prev.includes(needId) ? prev.filter((x) => x !== needId) : [...prev, needId]
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!regAlias.trim()) {
      setRegError('Please enter a first name or nickname in Step 1.');
      setOnboardingStep(1);
      return;
    }
    if (regPin.length < 4) {
      setRegError('Please choose an easy 4-digit PIN in Step 2.');
      setOnboardingStep(2);
      return;
    }

    setIsRegistering(true);
    setRegError(null);
    try {
      const res = await onRegisterWithPin({
        client_alias: regAlias.trim(),
        pin_code: regPin,
        pin_recovery_hint:
          regHint.trim() || `Easy 4-digit PIN created by ${regAlias.trim()}`,
        municipality: regCity,
        avatar_icon: regAvatar,
        age_group: regAgeGroup,
        active_barriers: regBarriers,
        upgrade_from_session_id: upgradeFromGuestSessionId
      });
      if (!res.ok) {
        setRegError(res.error || 'Could not complete registration. Please check your PIN.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#bcebe8]/80 via-[#eef8f6] to-[#f5ede0] text-[#12323b]">
      {/* Top 24/7 Emergency & Crisis Strip — Zero Login Required */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#c5e6df] px-4 lg:px-6 py-2.5 shadow-2xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#0f5a4f] bg-[#dff7f4] px-2.5 py-1 rounded-full border border-[#9de0d6]">
              <Phone className="w-3.5 h-3.5 text-[#1ca796]" /> 24/7 Immediate Help (No Login Needed):
            </span>
            <a
              href="tel:988"
              className="px-2.5 py-1 rounded-lg bg-[#fde8e8] hover:bg-[#fbd5d5] text-[#9b1c1c] font-bold border border-[#f8b4b4] transition-colors"
            >
              Crisis / Suicide: 9-8-8
            </a>
            <a
              href="tel:3106789"
              className="px-2.5 py-1 rounded-lg bg-[#e3f6f4] hover:bg-[#d0efe9] text-[#115e54] font-bold border border-[#a8dfd6] transition-colors"
            >
              Mental Health: 310-6789
            </a>
            <a
              href="tel:211"
              className="px-2.5 py-1 rounded-lg bg-[#fff4d9] hover:bg-[#fde8b8] text-[#8a530f] font-bold border border-[#f3d088] transition-colors"
            >
              Shelter &amp; Food: 2-1-1
            </a>
            <a
              href="tel:811"
              className="px-2.5 py-1 rounded-lg bg-[#e6f2fb] hover:bg-[#d3e8f8] text-[#175279] font-bold border border-[#abd2ee] transition-colors"
            >
              24/7 Nurse: 8-1-1
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelplines(!showHelplines)}
              className="px-3 py-1 rounded-lg bg-[#f5efe2] hover:bg-[#ebe1cd] border border-[#dcd0b9] text-[#32525b] font-semibold cursor-pointer transition-colors"
            >
              {showHelplines ? 'Hide All 24/7 Lines' : 'All 24/7 Helplines'}
            </button>
            {hasActiveSession && onReturnToActiveSession && (
              <button
                type="button"
                onClick={onReturnToActiveSession}
                className="px-3 py-1 rounded-lg ocean-btn text-white font-semibold cursor-pointer"
              >
                Back to {activeSessionAlias}’s Sanctuary →
              </button>
            )}
          </div>
        </div>

        {showHelplines && (
          <div className="max-w-[1440px] mx-auto mt-3 pt-3 border-t border-[#d7ebe6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
            {GROUPED_24_7_HELPLINES.map((group) => (
              <div
                key={`landing-help-${group.id}`}
                className={`rounded-xl px-3 py-2 border space-y-1 ${group.badgeColor}`}
              >
                <div className="font-bold text-[#14343d]">{group.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.lines.map((item) => (
                    <a
                      key={`landing-${group.id}-${item.name}`}
                      href={`tel:${item.tel}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#dff3ee] border border-[#bce5dd] text-[#0f5248] font-semibold"
                    >
                      <span>{item.name}:</span>
                      <span className="font-bold">{item.number}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Coastal Welcome Hero & Three Entry Pathways */}
      <div className="flex-1 max-w-[1380px] w-full mx-auto px-4 lg:px-6 py-6 lg:py-9 flex flex-col justify-between gap-8">
        {/* Top Brand Title */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/85 border border-[#b4e4dc] text-xs font-semibold text-[#136f63] shadow-2xs">
            <Waves className="w-4 h-4 text-[#1ca796]" />
            <span>Future Forward &amp; Beyond • Lower Mainland Support &amp; Strengths Sanctuary</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#103038] tracking-tight">
            Welcome In. No Email, No Paperwork Stress.
          </h1>
          <p className="text-sm sm:text-base text-[#355963] leading-relaxed">
            Sign in with a simple <strong>4-digit PIN</strong>, set up a new nickname in 30 seconds, or browse everything immediately as a <strong>Guest</strong>—78+ verified hospitals, free counselors, pregnancy &amp; baby programs, shelters, food banks, subsidies, and hands-on schools.
          </p>
        </div>

        {/* Main Grid: Left 7 Cols = PIN Login / 3-Step Client Onboarding, Right 5 Cols = Instant Guest Sanctuary & Quick Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: PIN Sign-In OR New Client PIN Registration */}
          <div className="lg:col-span-7 clinical-card border-2 border-[#bce5dd] rounded-3xl p-5 sm:p-7 shadow-lg bg-white/95 space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-[#f3eadb] p-1.5 rounded-2xl border border-[#dfd2bc]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'login'
                    ? 'ocean-btn text-white shadow-sm'
                    : 'text-[#3d5b63] hover:text-[#12323b]'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In with 4-Digit PIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setRegError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'register'
                    ? 'ocean-btn text-white shadow-sm'
                    : 'text-[#3d5b63] hover:text-[#12323b]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>New Client Setup (No Email)</span>
              </button>
            </div>

            {/* TAB 1: RETURNING CLIENT 4-DIGIT PIN LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={(e) => handleSubmitPinLogin(e)} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-[#12323b]">
                      1. Tap Your Name or Type Your Nickname
                    </h2>
                    <p className="text-xs text-[#4b6a73]">
                      No email address or complex password needed—just your nickname and 4-digit PIN.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIdentifier('Stratus');
                      setPinInput('1234');
                      handleSubmitPinLogin(undefined, '1234');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#e3f7f4] hover:bg-[#cdeee9] border border-[#9adbd0] text-[#0f5e53] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Demo Login (Stratus • PIN 1234)</span>
                  </button>
                </div>

                {/* Quick-Tap Registered Profile Chips */}
                {profiles.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#4b6a73]">
                      Saved Client Profiles on This Station (Tap Your Name):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profiles.map((prof) => {
                        const isSelected =
                          selectedIdentifier.trim().toLowerCase() ===
                            prof.client_alias.toLowerCase() ||
                          selectedIdentifier.trim().toLowerCase() ===
                            prof.session_id.toLowerCase();
                        return (
                          <button
                            key={prof.session_id}
                            type="button"
                            onClick={() => {
                              setSelectedIdentifier(prof.client_alias);
                              setLoginError(null);
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#e3f7f4] border-2 border-[#1ca796] shadow-2xs'
                                : 'bg-[#faf6ee] hover:bg-[#f1eadc] border-[#e2d6c1]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-white border border-[#bce5dd] flex items-center justify-center text-[#156e62]">
                                {renderAvatarIcon(prof.avatar_icon, 'w-5 h-5')}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-[#12323b] flex items-center gap-1.5">
                                  <span>{prof.client_alias}</span>
                                  {prof.session_id === 'A842' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dff7f4] text-[#116358] border border-[#9ddbd1]">
                                      PIN: 1234
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#4b6a73]">
                                  {prof.municipality} • #{prof.session_id}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#1ca796] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual Nickname Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2b4c55]">
                    Or Type Your First Name / Nickname:
                  </label>
                  <input
                    type="text"
                    value={selectedIdentifier}
                    onChange={(e) => {
                      setSelectedIdentifier(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="e.g., Stratus, Sam, Jordan..."
                    className="w-full rounded-2xl bg-[#fbf8f2] border border-[#d8ccb8] px-4 py-2.5 text-sm font-semibold text-[#12323b] focus:outline-none focus:border-[#1ca796]"
                  />
                </div>

                {/* 4-Digit Tactile PIN Pad */}
                <div className="bg-[#f8f3e8] border border-[#e2d6c1] rounded-2xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#12323b]">
                        2. Enter Your 4-Digit PIN
                      </div>
                      <div className="text-[11px] text-[#4b6a73]">
                        Tap the large numbers below or type 4 numbers on your keyboard
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPinHint(!showPinHint)}
                      className="text-xs font-semibold text-[#156e62] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Forgot PIN? Show Hint</span>
                    </button>
                  </div>

                  {showPinHint && (
                    <div className="p-3 rounded-xl bg-white border border-[#bce5dd] text-xs text-[#145e54] flex items-center justify-between gap-2">
                      <div>
                        <strong>Memory Hint for {selectedIdentifier || 'Client'}:</strong>{' '}
                        {activeProfileObj?.pin_recovery_hint ||
                          'For the demo account Stratus, the PIN is 1234. Or ask your coordinator to check your session card.'}
                      </div>
                      {selectedIdentifier.trim().toLowerCase() === 'stratus' && (
                        <button
                          type="button"
                          onClick={() => setPinInput('1234')}
                          className="px-2.5 py-1 rounded-lg bg-[#e3f7f4] text-[#0f5e53] font-bold border border-[#9ddbd1] shrink-0 cursor-pointer"
                        >
                          Use 1234
                        </button>
                      )}
                    </div>
                  )}

                  {/* 4 PIN Boxes + Direct Keyboard Input */}
                  <div className="flex items-center justify-center gap-3">
                    {[0, 1, 2, 3].map((idx) => {
                      const char = pinInput[idx] || '';
                      return (
                        <div
                          key={`login-pin-slot-${idx}`}
                          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-extrabold transition-all ${
                            char
                              ? 'bg-[#e3f7f4] border-[#1ca796] text-[#0f5248] shadow-2xs'
                              : 'bg-white border-[#d8ccb8] text-[#9ab0b8]'
                          }`}
                        >
                          {char ? char : '•'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual Number Keypad (1-9, Clear, 0, Backspace) */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={`login-pad-${num}`}
                        type="button"
                        onClick={() => handleDigitPress(num, 'login')}
                        className="h-12 rounded-2xl bg-white hover:bg-[#e3f7f4] active:scale-95 border border-[#d8ccb8] text-lg font-extrabold text-[#12323b] shadow-2xs cursor-pointer transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput('');
                        setLoginError(null);
                      }}
                      className="h-12 rounded-2xl bg-[#fbf6ec] hover:bg-[#f2e8d5] border border-[#d8ccb8] text-xs font-bold text-[#5a7178] cursor-pointer transition-all"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDigitPress('0', 'login')}
                      className="h-12 rounded-2xl bg-white hover:bg-[#e3f7f4] active:scale-95 border border-[#d8ccb8] text-lg font-extrabold text-[#12323b] shadow-2xs cursor-pointer transition-all"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBackspace('login')}
                      className="h-12 rounded-2xl bg-[#fbf6ec] hover:bg-[#f2e8d5] border border-[#d8ccb8] flex items-center justify-center text-[#5a7178] cursor-pointer transition-all"
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-2xl bg-[#fde8e8] border border-[#f5b5b5] text-xs font-semibold text-[#9b1c1c]">
                    {loginError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs font-bold text-[#156e62] hover:underline cursor-pointer"
                  >
                    First time here? Create a 4-Digit PIN (No Email) →
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="px-6 py-3 rounded-2xl ocean-btn text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isLoggingIn ? 'Opening Your Sanctuary...' : 'Sign In with PIN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: NEW CLIENT ONBOARDING & REGISTRATION (3 STEPS — NO EMAIL REQUIRED) */}
            {activeTab === 'register' && (
              <div className="space-y-5">
                {upgradeFromGuestSessionId && (
                  <div className="p-3.5 rounded-2xl bg-[#e3f7f4] border border-[#9ddbd1] text-xs text-[#115e54] font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#1ca796] shrink-0" />
                    <span>
                      <strong>Saving Your Guest Sanctuary:</strong> Pick a nickname and 4-digit PIN below so your pinned programs and notes stay saved for next time—no email needed.
                    </span>
                  </div>
                )}

                {/* 3-Step Progress Bar */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { step: 1 as const, label: '1. Name & Area' },
                    { step: 2 as const, label: '2. 4-Digit PIN' },
                    { step: 3 as const, label: '3. Help Today' }
                  ].map((s) => (
                    <button
                      key={`onboard-step-${s.step}`}
                      type="button"
                      onClick={() => setOnboardingStep(s.step)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all ${
                        onboardingStep === s.step
                          ? 'bg-[#e3f7f4] border-2 border-[#1ca796] text-[#0f5248]'
                          : 'bg-[#faf6ee] border-[#e2d6c1] text-[#4b6a73]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* STEP 1: NICKNAME, SYMBOL, CITY & LIFE STAGE */}
                {onboardingStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#12323b]">
                        Step 1: What Should We Call You?
                      </h2>
                      <p className="text-xs text-[#4b6a73]">
                        Use your first name, a nickname, or an alias. <strong>Zero email address and zero ID required.</strong>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2b4c55]">
                        Your First Name or Nickname:
                      </label>
                      <input
                        type="text"
                        value={regAlias}
                        onChange={(e) => {
                          setRegAlias(e.target.value);
                          setRegError(null);
                        }}
                        placeholder="e.g., Sam, River, Alex, Jay..."
                        className="w-full rounded-2xl bg-[#fbf8f2] border border-[#d8ccb8] px-4 py-3 text-sm font-bold text-[#12323b] focus:outline-none focus:border-[#1ca796]"
                      />
                    </div>

                    {/* Pick a Comfort Symbol / Avatar */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2b4c55]">
                        Pick Your Sanctuary Symbol (Makes Your Profile Easy to Spot):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {AVATAR_OPTIONS.map((av) => {
                          const IconComp = av.icon;
                          const active = regAvatar === av.id;
                          return (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => setRegAvatar(av.id)}
                              className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                                active
                                  ? 'bg-[#e3f7f4] border-2 border-[#1ca796] text-[#0f5248] shadow-2xs'
                                  : 'bg-[#faf6ee] hover:bg-[#f2eadb] border-[#e2d6c1] text-[#35535b]'
                              }`}
                            >
                              <span className={`p-1.5 rounded-xl border ${av.color}`}>
                                <IconComp className="w-4 h-4" />
                              </span>
                              <span>{av.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* City & Life Stage */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#2b4c55] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#1ca796]" /> Your City / Area:
                        </label>
                        <select
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full rounded-2xl bg-[#fbf8f2] border border-[#d8ccb8] px-3.5 py-2.5 text-xs font-bold text-[#12323b] cursor-pointer focus:outline-none focus:border-[#1ca796]"
                        >
                          {CITY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#2b4c55] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#1ca796]" /> Life Stage (All Ages Welcome):
                        </label>
                        <select
                          value={regAgeGroup}
                          onChange={(e) => setRegAgeGroup(e.target.value as ClientAgeGroup)}
                          className="w-full rounded-2xl bg-[#fbf8f2] border border-[#d8ccb8] px-3.5 py-2.5 text-xs font-bold text-[#12323b] cursor-pointer focus:outline-none focus:border-[#1ca796]"
                        >
                          {AGE_GROUPS.map((ag) => (
                            <option key={ag} value={ag}>
                              {ag}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {regError && (
                      <div className="p-3 rounded-2xl bg-[#fde8e8] border border-[#f5b5b5] text-xs font-semibold text-[#9b1c1c]">
                        {regError}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!regAlias.trim()) {
                            setRegError('Please type a first name or nickname first.');
                            return;
                          }
                          setRegError(null);
                          setOnboardingStep(2);
                        }}
                        className="px-6 py-3 rounded-2xl ocean-btn text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span>Next: Choose 4-Digit PIN</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: 4-DIGIT PIN PAD (NO EMAIL NEEDED) */}
                {onboardingStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#12323b]">
                        Step 2: Pick an Easy 4-Digit PIN
                      </h2>
                      <p className="text-xs text-[#4b6a73]">
                        Many people lose access to email accounts or phones. Pick <strong>any 4 numbers</strong> you can remember easily—or leave a hint for yourself or your support worker.
                      </p>
                    </div>

                    <div className="bg-[#f8f3e8] border border-[#e2d6c1] rounded-2xl p-4 space-y-3.5">
                      {/* Quick-Pick Easy PINs */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#35535b]">
                          Tap 4 numbers below, or quick-fill:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {['1234', '2468', '0000', '7777'].map((preset) => (
                            <button
                              key={`preset-${preset}`}
                              type="button"
                              onClick={() => {
                                setRegPin(preset);
                                setRegError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-[#0f5248] font-bold cursor-pointer"
                            >
                              Use {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4 Visible PIN Boxes (shown clearly during creation so client can see what they picked) */}
                      <div className="flex items-center justify-center gap-3">
                        {[0, 1, 2, 3].map((idx) => {
                          const char = regPin[idx] || '';
                          return (
                            <div
                              key={`reg-pin-slot-${idx}`}
                              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-extrabold ${
                                char
                                  ? 'bg-[#e3f7f4] border-[#1ca796] text-[#0f5248]'
                                  : 'bg-white border-[#d8ccb8] text-[#9ab0b8]'
                              }`}
                            >
                              {char || '–'}
                            </div>
                          );
                        })}
                      </div>

                      {/* Keypad */}
                      <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={`reg-pad-${num}`}
                            type="button"
                            onClick={() => handleDigitPress(num, 'register')}
                            className="h-11 rounded-2xl bg-white hover:bg-[#e3f7f4] border border-[#d8ccb8] text-lg font-extrabold text-[#12323b] cursor-pointer transition-all"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setRegPin('')}
                          className="h-11 rounded-2xl bg-[#fbf6ec] hover:bg-[#f2e8d5] border border-[#d8ccb8] text-xs font-bold text-[#5a7178] cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDigitPress('0', 'register')}
                          className="h-11 rounded-2xl bg-white hover:bg-[#e3f7f4] border border-[#d8ccb8] text-lg font-extrabold text-[#12323b] cursor-pointer transition-all"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBackspace('register')}
                          className="h-11 rounded-2xl bg-[#fbf6ec] hover:bg-[#f2e8d5] border border-[#d8ccb8] flex items-center justify-center text-[#5a7178] cursor-pointer"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Optional Memory Hint */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#2b4c55]">
                        Optional Memory Cue (Helps You or Your Coordinator If You Forget):
                      </label>
                      <input
                        type="text"
                        value={regHint}
                        onChange={(e) => setRegHint(e.target.value)}
                        placeholder="e.g., Last 4 of old phone, birth month/day, or 'Ask Sarah at Options'"
                        className="w-full rounded-2xl bg-[#fbf8f2] border border-[#d8ccb8] px-4 py-2.5 text-xs font-semibold text-[#12323b] focus:outline-none focus:border-[#1ca796]"
                      />
                    </div>

                    {regError && (
                      <div className="p-3 rounded-2xl bg-[#fde8e8] border border-[#f5b5b5] text-xs font-semibold text-[#9b1c1c]">
                        {regError}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(1)}
                        className="px-4 py-2.5 rounded-xl bg-[#faf6ee] hover:bg-[#efe6d5] border border-[#dfd2bc] text-xs font-bold text-[#35535b] cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (regPin.length < 4) {
                            setRegError('Please pick 4 numbers for your PIN first.');
                            return;
                          }
                          setRegError(null);
                          setOnboardingStep(3);
                        }}
                        className="px-6 py-3 rounded-2xl ocean-btn text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span>Next: What Helps Today?</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: IMMEDIATE NEEDS & BARRIERS TO PRE-MATCH */}
                {onboardingStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#12323b]">
                        Step 3: What Would Help Take Pressure Off Today?
                      </h2>
                      <p className="text-xs text-[#4b6a73]">
                        Tap as many as you want. We’ll immediately match open programs in <strong>{regCity}</strong> for your Sanctuary card.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {ONBOARDING_NEED_CARDS.map((card) => {
                        const selected = regBarriers.includes(card.id);
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => handleToggleNeed(card.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              selected
                                ? 'bg-[#e3f7f4] border-2 border-[#1ca796] shadow-2xs'
                                : 'bg-[#faf6ee] hover:bg-[#f2eadb] border-[#e2d6c1]'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-[#12323b]">{card.title}</div>
                              <div className="text-[11px] text-[#4b6a73] mt-0.5 leading-snug">
                                {card.subtitle}
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                selected
                                  ? 'bg-[#1ca796] text-white'
                                  : 'bg-white border border-[#cbbba0]'
                              }`}
                            >
                              {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {regError && (
                      <div className="p-3 rounded-2xl bg-[#fde8e8] border border-[#f5b5b5] text-xs font-semibold text-[#9b1c1c]">
                        {regError}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(2)}
                        className="px-4 py-2.5 rounded-xl bg-[#faf6ee] hover:bg-[#efe6d5] border border-[#dfd2bc] text-xs font-bold text-[#35535b] cursor-pointer"
                      >
                        ← Back to PIN
                      </button>
                      <button
                        type="button"
                        disabled={isRegistering}
                        onClick={handleCompleteOnboarding}
                        className="px-6 py-3 rounded-2xl ocean-btn text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isRegistering
                            ? 'Creating Your Sanctuary...'
                            : `Save PIN (${regPin || '....'}) & Open My Sanctuary`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Instant Guest Sanctuary Mode + Why PIN-Only Works */}
          <div className="lg:col-span-5 space-y-5">
            {/* Instant Guest Sanctuary Card */}
            <div className="clinical-card border-2 border-[#f3cc86] rounded-3xl p-6 bg-gradient-to-br from-[#fffdf7] via-[#fbf5e6] to-[#e8f8f5] shadow-lg space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1d0] border border-[#f2c977] text-[#8a520d] text-xs font-bold">
                <Eye className="w-3.5 h-3.5" />
                <span>Zero Sign-Up • 100% Anonymous Guest Page</span>
              </div>

              <h2 className="text-xl font-extrabold text-[#12323b]">
                Just Looking for Help Right Now? Browse as a Guest
              </h2>
              <p className="text-xs sm:text-sm text-[#355963] leading-relaxed">
                Don’t want to make a PIN yet? Jump straight into the <strong>Guest Sanctuary Page</strong> to search all 78+ verified Lower Mainland hospitals, walk-in doctors, free counselors, pregnancy &amp; baby care, food banks, shelters, subsidies, and schools.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2b4c55] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1ca796]" /> Optional: Pick Your City Before Entering Guest Page
                </label>
                <select
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                  className="w-full rounded-2xl bg-white border border-[#d8ccb8] px-3.5 py-2.5 text-xs font-bold text-[#12323b] cursor-pointer focus:outline-none focus:border-[#1ca796]"
                >
                  <option value="All">All Lower Mainland Cities (78+ Verified Services)</option>
                  {CITY_OPTIONS.map((c) => (
                    <option key={`guest-city-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => onContinueAsGuest(guestCity === 'All' ? 'Surrey' : guestCity)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#178a7c] to-[#236b8e] hover:from-[#137468] hover:to-[#1c5978] text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Enter Guest Sanctuary Page (No PIN Needed)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-[#4b6a73] text-center">
                You can still save your favorite programs with a 4-digit PIN later if you change your mind.
              </div>
            </div>

            {/* Trauma-Informed Design Guarantee Card */}
            <div className="clinical-card border border-[#cde8e2] rounded-3xl p-5 bg-white/90 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#12323b]">
                <ShieldCheck className="w-4 h-4 text-[#1ca796]" />
                <span>Built for Real Life — Why We Don’t Ask for Email</span>
              </div>
              <ul className="space-y-2 text-xs text-[#355963]">
                <li className="flex items-start gap-2">
                  <span className="text-[#1ca796] font-bold">✓</span>
                  <span>
                    <strong>No Lost Email Lockouts:</strong> Losing a phone or forgetting an email password shouldn’t lock you out of your support plan or shelter/program matches.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1ca796] font-bold">✓</span>
                  <span>
                    <strong>Easy 4-Digit PIN + Coordinator Backup:</strong> Use 4 simple numbers on any community tablet or phone, with an optional hint if you ever forget.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1ca796] font-bold">✓</span>
                  <span>
                    <strong>All Ages &amp; Walks of Life:</strong> Designed for youth, adults, parents, seniors (55+), and anyone navigating tough barriers.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
