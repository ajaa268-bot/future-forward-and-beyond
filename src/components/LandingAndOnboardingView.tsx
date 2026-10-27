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
  Eye,
  EyeOff,
  Lock,
  RotateCcw
} from 'lucide-react';
import {
  PublicClientProfileSummary,
  ClientRegistrationPayload,
  ClientAgeGroup
} from '../types/navigator.js';
import { GROUPED_24_7_HELPLINES } from '../types/programGrouping.js';

interface LandingAndOnboardingViewProps {
  profiles?: PublicClientProfileSummary[];
  initialTab?: 'login' | 'register';
  upgradeFromGuestSessionId?: string;
  initialGuestCity?: string;
  initialGuestBarriers?: string[];
  rememberedDeviceHandle?: string;
  onLoginWithPin: (
    identifier: string,
    pinCode: string,
    rememberDevice?: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  onRegisterWithPin: (
    payload: ClientRegistrationPayload
  ) => Promise<{ ok: boolean; error?: string }>;
  onResetPinWithRecovery?: (
    identifier: string,
    recoveryPhrase: string,
    newPinCode: string,
    rememberDevice?: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
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
  initialTab = 'login',
  upgradeFromGuestSessionId,
  initialGuestCity,
  initialGuestBarriers,
  rememberedDeviceHandle,
  onLoginWithPin,
  onRegisterWithPin,
  onResetPinWithRecovery,
  onContinueAsGuest,
  onReturnToActiveSession,
  hasActiveSession,
  activeSessionAlias
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    upgradeFromGuestSessionId ? 'register' : initialTab
  );

  // Returning Client Private PIN Login state (Zero Public Name Enumeration)
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>(
    rememberedDeviceHandle || ''
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [showLoginPin, setShowLoginPin] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Self-Service Private PIN Recovery state (Zero Email Required)
  const [showRecoveryReset, setShowRecoveryReset] = useState<boolean>(false);
  const [recoveryWordInput, setRecoveryWordInput] = useState<string>('');
  const [recoveryNewPin, setRecoveryNewPin] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [isResettingPin, setIsResettingPin] = useState<boolean>(false);

  // New Client 3-Step Onboarding state (Zero Email Required, Salted PIN + Recovery Word)
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [regAlias, setRegAlias] = useState<string>('');
  const [regAvatar, setRegAvatar] = useState<string>('Waves');
  const [regCity, setRegCity] = useState<string>(initialGuestCity || 'Surrey');
  const [regAgeGroup, setRegAgeGroup] = useState<ClientAgeGroup>('Adult (25–54)');
  const [regPin, setRegPin] = useState<string>('');
  const [showRegPin, setShowRegPin] = useState<boolean>(false);
  const [regRecoveryPhrase, setRegRecoveryPhrase] = useState<string>('');
  const [regHint, setRegHint] = useState<string>('');
  const [regRememberDevice, setRegRememberDevice] = useState<boolean>(true);
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

  useEffect(() => {
    if (rememberedDeviceHandle && !selectedIdentifier) {
      setSelectedIdentifier(rememberedDeviceHandle);
    }
  }, [rememberedDeviceHandle]);

  const generateEasyRecoveryPhrase = () => {
    const words = ['harbor', 'cedar', 'pacific', 'sunrise', 'lighthouse', 'breeze', 'compass', 'meadow'];
    const pick = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(10 + Math.random() * 89);
    setRegRecoveryPhrase(`${pick}-${num}`);
  };

  const handleDigitPress = (digit: string, mode: 'login' | 'register') => {
    if (mode === 'login') {
      setLoginError(null);
      if (pinInput.length < 6) {
        const next = pinInput + digit;
        setPinInput(next);
      }
    } else {
      setRegError(null);
      if (regPin.length < 6) {
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
      setLoginError('Please enter your private Name, Nickname, or Sanctuary Code.');
      return;
    }
    if (finalPin.length < 4) {
      setLoginError('Please enter your secret PIN (at least 4 digits).');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await onLoginWithPin(selectedIdentifier.trim(), finalPin, rememberDevice);
      if (!res.ok) {
        setLoginError(
          res.error ||
            'Invalid Name/Handle or PIN. Please check your entry or use your Recovery Word.'
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmitRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onResetPinWithRecovery) return;
    if (!selectedIdentifier.trim() || !recoveryWordInput.trim()) {
      setRecoveryError('Please enter both your private Name/Handle and your Secret Recovery Word.');
      return;
    }
    const cleanNew = recoveryNewPin.replace(/\D/g, '');
    if (cleanNew.length < 4) {
      setRecoveryError('Please enter a new PIN with at least 4 digits.');
      return;
    }
    setIsResettingPin(true);
    setRecoveryError(null);
    setRecoverySuccess(null);
    try {
      const res = await onResetPinWithRecovery(
        selectedIdentifier.trim(),
        recoveryWordInput.trim(),
        cleanNew,
        rememberDevice
      );
      if (!res.ok) {
        setRecoveryError(res.error || 'Could not verify Recovery Word for that handle.');
      } else {
        setRecoverySuccess('PIN updated! Opening your private Sanctuary...');
      }
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleToggleNeed = (needId: string) => {
    setRegBarriers((prev) =>
      prev.includes(needId) ? prev.filter((x) => x !== needId) : [...prev, needId]
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!regAlias.trim()) {
      setRegError('Please enter a private Name, Nickname, or Handle in Step 1.');
      setOnboardingStep(1);
      return;
    }
    if (regPin.length < 4) {
      setRegError('Please choose a secret PIN (at least 4 digits) in Step 2.');
      setOnboardingStep(2);
      return;
    }

    setIsRegistering(true);
    setRegError(null);
    try {
      const res = await onRegisterWithPin({
        client_alias: regAlias.trim(),
        pin_code: regPin,
        recovery_phrase: regRecoveryPhrase.trim() || undefined,
        pin_recovery_hint:
          regHint.trim() || 'Protected by salted PIN & private recovery word',
        municipality: regCity,
        avatar_icon: regAvatar,
        age_group: regAgeGroup,
        active_barriers: regBarriers,
        upgrade_from_session_id: upgradeFromGuestSessionId,
        remember_device: regRememberDevice
      });
      if (!res.ok) {
        setRegError(res.error || 'Could not complete registration. Please check your handle and PIN.');
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

            {/* TAB 1: PRIVATE CLIENT PIN LOGIN (ZERO PUBLIC PROFILE ENUMERATION) */}
            {activeTab === 'login' && (
              <form onSubmit={(e) => handleSubmitPinLogin(e)} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e3f7f4] border border-[#9ddbd1] text-[11px] font-bold text-[#0f5e53] mb-1">
                      <Lock className="w-3 h-3 text-[#1ca796]" />
                      <span>Private &amp; Encrypted Login • Names Are Never Publicly Listed</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#12323b]">
                      1. Enter Your Private Name, Nickname, or Code
                    </h2>
                    <p className="text-xs text-[#4b6a73]">
                      Your identity stays strictly private. Type your chosen handle or Sanctuary ID below.
                    </p>
                  </div>
                </div>

                {/* Private Handle Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2b4c55] flex items-center justify-between">
                    <span>Your Private Name / Nickname / Sanctuary Code:</span>
                    <span className="text-[11px] font-normal text-[#4b6a73]">
                      Zero public directory
                    </span>
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    value={selectedIdentifier}
                    onChange={(e) => {
                      setSelectedIdentifier(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="Type your private nickname or #Code..."
                    className="w-full rounded-2xl bg-[#fbf8f2] border border-[#d8ccb8] px-4 py-3 text-sm font-bold text-[#12323b] focus:outline-none focus:border-[#1ca796]"
                  />
                </div>

                {/* Masked Secret PIN Pad & Keyboard Input */}
                <div className="bg-[#f8f3e8] border border-[#e2d6c1] rounded-2xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#12323b]">
                        2. Enter Your Secret PIN (Masked for Privacy)
                      </div>
                      <div className="text-[11px] text-[#4b6a73]">
                        Tap the keypad or type your 4–6 digit PIN • Hidden from shoulder-surfing
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLoginPin(!showLoginPin)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-xs font-semibold text-[#156e62] flex items-center gap-1 cursor-pointer"
                      >
                        {showLoginPin ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide PIN</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show PIN</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecoveryReset(!showRecoveryReset);
                          setRecoveryError(null);
                          setRecoverySuccess(null);
                        }}
                        className="text-xs font-semibold text-[#156e62] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Forgot PIN?</span>
                      </button>
                    </div>
                  </div>

                  {/* Masked PIN Boxes + Direct Keyboard Input */}
                  <div className="space-y-2.5">
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
                            {char ? (showLoginPin ? char : '•') : '–'}
                          </div>
                        );
                      })}
                    </div>

                    <div className="max-w-xs mx-auto">
                      <input
                        type={showLoginPin ? 'text' : 'password'}
                        inputMode="numeric"
                        autoComplete="current-password"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setLoginError(null);
                        }}
                        placeholder="Or type PIN on keyboard..."
                        className="w-full text-center rounded-xl bg-white border border-[#d8ccb8] px-3 py-1.5 text-xs font-bold text-[#12323b] focus:outline-none focus:border-[#1ca796]"
                      />
                    </div>
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

                {/* Session Retention & Device Security Toggle */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f3faf8] border border-[#bce5dd] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#1ca796] rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-[#0f5248] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1ca796]" />
                      <span>Keep me signed in on this personal device (30-Day Encrypted Retention)</span>
                    </div>
                    <div className="text-[11px] text-[#4b6a73] mt-0.5">
                      Saves a signed security token so your workbook and pinned programs stay open next time you visit. Uncheck if using a shared library or shelter computer.
                    </div>
                  </div>
                </label>

                {/* Self-Service Private PIN Reset Drawer (Zero Email Needed) */}
                {showRecoveryReset && (
                  <div className="p-4 rounded-2xl bg-[#fffdf8] border-2 border-[#9ddbd1] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-[#0f5248] flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-[#1ca796]" />
                        <span>Reset Forgotten PIN with Your Secret Recovery Word</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRecoveryReset(false)}
                        className="text-[11px] font-bold text-[#4b6a73] hover:text-[#12323b] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <p className="text-[11px] text-[#4b6a73]">
                      Enter the Secret Recovery Word you chose when creating your account to set a brand-new PIN immediately—no email required.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-[#2b4c55]">
                          Your Secret Recovery Word:
                        </label>
                        <input
                          type="password"
                          value={recoveryWordInput}
                          onChange={(e) => {
                            setRecoveryWordInput(e.target.value);
                            setRecoveryError(null);
                          }}
                          placeholder="Enter your secret word..."
                          className="w-full mt-1 rounded-xl bg-white border border-[#d8ccb8] px-3 py-2 text-xs font-bold text-[#12323b]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#2b4c55]">
                          New 4–6 Digit PIN:
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={recoveryNewPin}
                          onChange={(e) => {
                            setRecoveryNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setRecoveryError(null);
                          }}
                          placeholder="e.g., 4 new digits"
                          className="w-full mt-1 rounded-xl bg-white border border-[#d8ccb8] px-3 py-2 text-xs font-bold text-[#12323b]"
                        />
                      </div>
                    </div>
                    {recoveryError && (
                      <div className="text-xs font-semibold text-[#9b1c1c] bg-[#fde8e8] border border-[#f5b5b5] rounded-xl px-3 py-2">
                        {recoveryError}
                      </div>
                    )}
                    {recoverySuccess && (
                      <div className="text-xs font-semibold text-[#0f5e53] bg-[#dff7f4] border border-[#9ddbd1] rounded-xl px-3 py-2">
                        {recoverySuccess}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={isResettingPin}
                        onClick={handleSubmitRecoveryReset}
                        className="px-4 py-2 rounded-xl ocean-btn text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                      >
                        {isResettingPin ? 'Verifying & Resetting...' : 'Verify Word & Set New PIN'}
                      </button>
                    </div>
                  </div>
                )}

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
                    First time here? Create a Private Handle &amp; PIN →
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="px-6 py-3 rounded-2xl ocean-btn text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLoggingIn ? 'Verifying Encrypted PIN...' : 'Unlock My Sanctuary'}</span>
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

                {/* STEP 2: SECRET PIN + RECOVERY WORD + RETENTION (NO EMAIL NEEDED) */}
                {onboardingStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#12323b]">
                        Step 2: Choose Your Secret PIN &amp; Recovery Word
                      </h2>
                      <p className="text-xs text-[#4b6a73]">
                        Your PIN is cryptographically salted &amp; hashed (never stored in plain text). Add a Secret Recovery Word so you can reset your PIN anytime without needing an email.
                      </p>
                    </div>

                    <div className="bg-[#f8f3e8] border border-[#e2d6c1] rounded-2xl p-4 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#35535b]">
                          Tap 4–6 numbers below or type on keyboard:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowRegPin(!showRegPin)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e3f7f4] border border-[#bce5dd] text-[#0f5248] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {showRegPin ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Mask PIN</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Show PIN</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 4 PIN Boxes */}
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
                              {char ? (showRegPin ? char : '•') : '–'}
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

                    {/* Secret Recovery Word (Encrypted Self-Service Reset) */}
                    <div className="p-3.5 rounded-2xl bg-[#f3faf8] border border-[#bce5dd] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-[#0f5248] flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1ca796]" />
                          <span>Secret Recovery Word (Lets You Reset Your PIN Without Email):</span>
                        </label>
                        <button
                          type="button"
                          onClick={generateEasyRecoveryPhrase}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e3f7f4] border border-[#9ddbd1] text-[11px] font-bold text-[#0f5e53] cursor-pointer"
                        >
                          Generate Easy Word
                        </button>
                      </div>
                      <input
                        type="text"
                        value={regRecoveryPhrase}
                        onChange={(e) => setRegRecoveryPhrase(e.target.value)}
                        placeholder="e.g., harbor-42, childhood pet, or favorite street"
                        className="w-full rounded-xl bg-white border border-[#d8ccb8] px-3.5 py-2 text-xs font-bold text-[#12323b] focus:outline-none focus:border-[#1ca796]"
                      />
                    </div>

                    {/* Session Retention Preference */}
                    <label className="flex items-start gap-3 p-3 rounded-2xl bg-[#faf6ee] border border-[#e2d6c1] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regRememberDevice}
                        onChange={(e) => setRegRememberDevice(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#1ca796] rounded cursor-pointer"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-[#12323b]">
                          Retain my login on this personal device (30-Day Encrypted Token)
                        </div>
                        <div className="text-[11px] text-[#4b6a73]">
                          Automatically keeps your workbook unlocked on this phone/computer until you click Lock &amp; Sign Out.
                        </div>
                      </div>
                    </label>

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
                            setRegError('Please pick at least 4 numbers for your secret PIN first.');
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
                        <Lock className="w-4 h-4" />
                        <span>
                          {isRegistering
                            ? 'Encrypting & Creating Your Sanctuary...'
                            : 'Save Encrypted PIN & Open My Sanctuary'}
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
