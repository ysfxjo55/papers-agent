'use client'

import { createElement, createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Locale = 'en' | 'ar'
export const LOCALE_KEY = 'ai-mind-locale'

// ── String dictionaries ────────────────────────────────────────────────────────

export const STRINGS = {
  en: {
    brand_tag: 'a personal natural history of machine intelligence',
    nodes_edges: (n: number, e: number) => `${n} nodes · ${e} edges`,
    theme_dark: '☽ Dark',
    theme_light: '☼ Light',
    export_btn: 'Export',
    reset_btn: 'Reset',
    resetting: 'Resetting…',
    loading: 'Opening your notebook…',
    folio: 'folio I',
    chat_fab: 'Chat with Tutor',
    canvas_subtitle: 'a private chart of how machines learned to think · 1940 — 2026',

    reset_modal_title: 'Reset notebook?',
    reset_modal_body:
      'All nodes, edges, and chat history will be cleared on this device and the server. This cannot be undone.',
    cancel: 'Cancel',
    notice_cleared: 'Notebook cleared.',
    notice_failed: 'Reset failed — please try again.',

    chat_title: 'Knowledge Assistant',
    chat_sub: 'AI History Tutor',
    fullscreen: 'Full screen',
    exit_fullscreen: 'Exit full screen',
    close: 'Close',
    you: 'You',
    tutor: 'Tutor',
    thinking: 'thinking',
    placeholder_hero: 'Ask anything about the history of artificial intelligence…',
    placeholder_chat: 'Ask about any idea in the history of artificial intelligence…',
    enter_hint: 'enter to send · shift+enter newline',
    send: 'Send',
    ai_tutor_label: 'AI Tutor',
    node_count: (n: number) => `+${n} ${n === 1 ? 'node' : 'nodes'}`,
    note_count: (n: number) => `+${n} ${n === 1 ? 'note' : 'notes'}`,

    categories: {
      foundations: 'Foundations',
      vision: 'Vision',
      language: 'Language',
      rl: 'Reinforcement',
      architecture: 'Architecture',
      other: 'Other',
    },

    open_notebook: 'Open notebook',
    open_notebook_long: 'Open your notebook',
    how_it_works_link: 'How it works',
    hero_ornament: '❧',
    hero_headline_main: 'The History of Artificial Intelligence,',
    hero_headline_em: 'mapped as you learn it.',
    hero_body:
      'Chat with a scholarly AI tutor. Every concept becomes a permanent node on your personal timeline — a notebook that grows more valuable with every session.',
    how_it_works_label: 'How it works',
    hiw_title: 'Three steps. One growing notebook.',
    step1_num: '01', step1_title: 'Ask',
    step1_body:
      'Chat about any AI paper, researcher, or concept. The tutor answers with scholarly context — not a search result, but a considered explanation.',
    step2_num: '02', step2_title: 'Map',
    step2_body:
      'Every idea you discuss is placed on an interactive timeline. Edges connect concepts that precede, enable, or inspired each other.',
    step3_num: '03', step3_title: 'Return',
    step3_body:
      'Your notebook persists across every session. The more you explore, the richer the map — a personal history of AI you built yourself.',
    footer_cta_title: 'Your notebook is waiting.',
    footer_cta_body:
      'Start with a question about the Perceptron, the Transformer, or anything in between.',
    open_ai_mind: 'Open AI Mind',

    sandbox_chat_head: 'Knowledge Assistant',
    sandbox_user_label: 'You',
    sandbox_tutor_label: 'Tutor',
    sandbox_cta: 'Open your notebook',
    sandbox_nudge: 'Start your own timeline',
    sandbox_beat1_user: "Tell me about Rosenblatt's Perceptron",
    sandbox_beat2_tutor:
      "Rosenblatt's 1958 Perceptron was the first trainable neural network. It was born from the 1956 Dartmouth workshop — the gathering that coined the term 'artificial intelligence.'",
    sandbox_beat3_user: 'What theorem proved it works?',
    sandbox_beat4_tutor:
      'The 1962 Convergence Theorem proved the Perceptron always finds a solution if one exists — the first mathematical guarantee that a machine could learn.',

    founding_label: 'Founding members',
    founding_title_plain: 'Free in beta.',
    founding_title_em: '$7/mo for life',
    founding_title_suffix: 'for the first 200.',
    cadence_month: '/mo',
    tier_free_name: 'Free', tier_free_price: '$0', tier_free_blurb: 'Try the notebook',
    tier_free_points: ['1 notebook', '30 tutor turns / mo', 'Full canvas'],
    tier_recommended: 'Recommended',
    tier_scholar_name: 'Scholar', tier_scholar_price: '$12', tier_scholar_blurb: 'The whole product',
    tier_scholar_points: ['Unlimited nodes', '500 tutor turns / mo', 'Export · spaced review'],
    tier_patron_name: 'Patron', tier_patron_price: '$24', tier_patron_blurb: 'For power users',
    tier_patron_points: ['Everything unlimited', 'Priority model', 'Early features'],
    email_placeholder: 'you@example.com',
    reserve_btn: 'Reserve my spot',
    reserving: 'Reserving…',
    founding_done: "You're on the list. We'll email your founding-member invite soon.",
    founding_error: 'Please enter a valid email and try again.',
    founding_fineprint: "No charge now. We'll only email you when your invite is ready.",

    auth_back: 'Back to AI Mind',
    auth_signin_title: 'Welcome back',
    auth_signin_sub: 'Sign in to return to your notebook.',
    auth_signup_title: 'Create your notebook',
    auth_signup_sub: 'A private timeline of everything you learn, saved to your account.',
    auth_name_label: 'Name',
    auth_name_placeholder: 'Your name',
    auth_email_label: 'Email',
    auth_password_label: 'Password',
    auth_password_placeholder: 'At least 8 characters',
    auth_password_placeholder_signin: 'Your password',
    auth_confirm_label: 'Confirm password',
    auth_confirm_placeholder: 'Retype your password',
    auth_show_password: 'Show password',
    auth_hide_password: 'Hide password',
    auth_signin_submit: 'Sign in',
    auth_signup_submit: 'Create account',
    auth_submitting: 'Please wait…',
    auth_no_account: "Don't have an account?",
    auth_create_one: 'Create one',
    auth_have_account: 'Already have an account?',
    auth_sign_in: 'Sign in',
    auth_err_name: 'Please enter your name.',
    auth_err_email: 'Please enter a valid email address.',
    auth_err_password_len: 'Password must be at least 8 characters.',
    auth_err_password_match: "Passwords don't match.",
    auth_preview_notice:
      'Accounts aren’t connected yet — this is a preview of the sign-in experience.',
    auth_generic_error: 'Something went wrong. Please try again.',

    guest_turns_left: (n: number) => `${n} free ${n === 1 ? 'question' : 'questions'} left`,
    guest_gate_body:
      "You've used your 5 free questions. Sign in or create an account to keep exploring your notebook.",
    guest_gate_placeholder: 'Sign in to continue the conversation…',

    settings_title: 'Settings',
    settings_section_account: 'Account',
    settings_guest_notice: "You're browsing as a guest. Sign in or create an account to save your notebook to the cloud.",
    settings_guest_value: 'Guest',
    settings_change_password: 'Change password',
    settings_sign_out: 'Sign out',
    settings_section_notebook: 'Notebook',
    settings_section_usage: 'Usage',
    settings_usage_body: (used: number, limit: number) => `${used} of ${limit} free questions used`,
    settings_usage_note: 'Free questions are tracked on this device. Sign in for a monthly plan with more.',
    settings_section_plan: 'Plan',
    settings_current_plan: 'Current plan',
    settings_upgrade: 'Upgrade',
    settings_section_preferences: 'Preferences',
    settings_pref_language: 'Language',
    settings_pref_theme: 'Theme',
    settings_section_danger: 'Danger zone',
    settings_delete_account: 'Delete account',
    settings_delete_body: 'Permanently delete your account and all notebooks. This cannot be undone.',
  },

  ar: {
    brand_tag: 'تاريخ طبيعي شخصي للذكاء الاصطناعي',
    nodes_edges: (n: number, e: number) => `${n} عقدة · ${e} رابط`,
    theme_dark: '☽ داكن',
    theme_light: '☼ فاتح',
    export_btn: 'تصدير',
    reset_btn: 'إعادة تعيين',
    resetting: 'جارٍ الإعادة…',
    loading: 'جارٍ فتح دفترك…',
    folio: 'الورقة الأولى',
    chat_fab: 'محادثة مع المعلم',
    canvas_subtitle: 'خريطة خاصة لكيف تعلمت الآلات التفكير · 1940 — 2026',

    reset_modal_title: 'إعادة تعيين الدفتر؟',
    reset_modal_body:
      'ستُحذف جميع العقد والروابط وسجل المحادثة من هذا الجهاز والخادم. لا يمكن التراجع عن هذا الإجراء.',
    cancel: 'إلغاء',
    notice_cleared: 'تم مسح الدفتر.',
    notice_failed: 'فشلت الإعادة — يرجى المحاولة مرة أخرى.',

    chat_title: 'المساعد المعرفي',
    chat_sub: 'مُعلِّم تاريخ الذكاء الاصطناعي',
    fullscreen: 'ملء الشاشة',
    exit_fullscreen: 'إنهاء ملء الشاشة',
    close: 'إغلاق',
    you: 'أنت',
    tutor: 'المعلم',
    thinking: 'يفكر',
    placeholder_hero: 'اسأل عن أي شيء في تاريخ الذكاء الاصطناعي…',
    placeholder_chat: 'اسأل عن أي فكرة في تاريخ الذكاء الاصطناعي…',
    enter_hint: 'Enter للإرسال · Shift+Enter لسطر جديد',
    send: 'إرسال',
    ai_tutor_label: 'المساعد الذكي',
    node_count: (n: number) => `+${n} ${n === 1 ? 'عقدة' : 'عقد'}`,
    note_count: (n: number) => `+${n} ${n === 1 ? 'ملاحظة' : 'ملاحظات'}`,

    categories: {
      foundations: 'الأسس',
      vision: 'الرؤية',
      language: 'اللغة',
      rl: 'التعزيز',
      architecture: 'البنية',
      other: 'أخرى',
    },

    open_notebook: 'افتح الدفتر',
    open_notebook_long: 'افتح دفترك',
    how_it_works_link: 'كيف يعمل',
    hero_ornament: '❧',
    hero_headline_main: 'تاريخ الذكاء الاصطناعي،',
    hero_headline_em: 'مُرسَّخ وأنت تتعلمه.',
    hero_body:
      'تحدث مع مُعلِّم ذكاء اصطناعي متخصص. كل مفهوم يتحول إلى عقدة دائمة على جدولك الزمني الشخصي — دفتر يزداد قيمةً مع كل جلسة.',
    how_it_works_label: 'كيف يعمل',
    hiw_title: 'ثلاث خطوات. دفتر واحد ينمو.',
    step1_num: '01', step1_title: 'اسأل',
    step1_body:
      'تحدث عن أي ورقة بحثية أو باحث أو مفهوم. يُجيب المعلم بسياق أكاديمي — ليس نتيجة بحث، بل شرح مدروس.',
    step2_num: '02', step2_title: 'خرِّط',
    step2_body:
      'تُوضع كل فكرة تناقشها على جدول زمني تفاعلي. تربط الحواف المفاهيم التي تسبق أو تُمكِّن أو أوحت ببعضها.',
    step3_num: '03', step3_title: 'عُد',
    step3_body:
      'يبقى دفترك محفوظاً عبر كل جلسة. كلما استكشفت أكثر، ازدادت الخريطة ثراءً — تاريخ شخصي للذكاء الاصطناعي بنيته بنفسك.',
    footer_cta_title: 'دفترك ينتظرك.',
    footer_cta_body: 'ابدأ بسؤال عن البيرسبترون أو المحوِّل أو أي شيء بينهما.',
    open_ai_mind: 'افتح AI Mind',

    sandbox_chat_head: 'المساعد المعرفي',
    sandbox_user_label: 'أنت',
    sandbox_tutor_label: 'المعلم',
    sandbox_cta: 'افتح دفترك',
    sandbox_nudge: 'ابدأ جدولك الزمني الخاص',
    sandbox_beat1_user: 'أخبرني عن بيرسبترون روزنبلات',
    sandbox_beat2_tutor:
      'كان بيرسبترون روزنبلات عام 1958 أول شبكة عصبية قابلة للتدريب. نشأ من ورشة دارتموث 1956 — التجمع الذي صكّ مصطلح «الذكاء الاصطناعي».',
    sandbox_beat3_user: 'ما النظرية التي أثبتت أنه يعمل؟',
    sandbox_beat4_tutor:
      'أثبتت نظرية التقارب عام 1962 أن البيرسبترون يجد دائماً حلاً إذا وُجد — أول ضمان رياضي على أن الآلة يمكنها التعلم.',

    founding_label: 'الأعضاء المؤسسون',
    founding_title_plain: 'مجاني في مرحلة التجربة.',
    founding_title_em: '7 دولارات شهرياً مدى الحياة',
    founding_title_suffix: 'لأول 200 عضو.',
    cadence_month: '/شهر',
    tier_free_name: 'مجاني', tier_free_price: '$0', tier_free_blurb: 'جرّب الدفتر',
    tier_free_points: ['دفتر واحد', '30 دورة تعليمية / شهر', 'لوحة كاملة'],
    tier_recommended: 'موصى به',
    tier_scholar_name: 'باحث', tier_scholar_price: '$12', tier_scholar_blurb: 'المنتج كاملاً',
    tier_scholar_points: ['عقد غير محدودة', '500 دورة تعليمية / شهر', 'تصدير · مراجعة متباعدة'],
    tier_patron_name: 'راعٍ', tier_patron_price: '$24', tier_patron_blurb: 'للمستخدمين المتقدمين',
    tier_patron_points: ['كل شيء غير محدود', 'نموذج ذو أولوية', 'ميزات مبكرة'],
    email_placeholder: 'بريدك@مثال.com',
    reserve_btn: 'احجز مكانك',
    reserving: 'جارٍ الحجز…',
    founding_done: 'أنت في القائمة. سنرسل إليك دعوة العضو المؤسس قريباً.',
    founding_error: 'يرجى إدخال بريد إلكتروني صالح والمحاولة مرة أخرى.',
    founding_fineprint: 'لا رسوم الآن. لن نرسل إليك إلا حين تصبح دعوتك جاهزة.',

    auth_back: 'العودة إلى AI Mind',
    auth_signin_title: 'مرحباً بعودتك',
    auth_signin_sub: 'سجّل الدخول للعودة إلى دفترك.',
    auth_signup_title: 'أنشئ دفترك',
    auth_signup_sub: 'جدول زمني خاص بكل ما تتعلمه، محفوظ في حسابك.',
    auth_name_label: 'الاسم',
    auth_name_placeholder: 'اسمك',
    auth_email_label: 'البريد الإلكتروني',
    auth_password_label: 'كلمة المرور',
    auth_password_placeholder: '8 أحرف على الأقل',
    auth_password_placeholder_signin: 'كلمة المرور',
    auth_confirm_label: 'تأكيد كلمة المرور',
    auth_confirm_placeholder: 'أعد كتابة كلمة المرور',
    auth_show_password: 'إظهار كلمة المرور',
    auth_hide_password: 'إخفاء كلمة المرور',
    auth_signin_submit: 'تسجيل الدخول',
    auth_signup_submit: 'إنشاء حساب',
    auth_submitting: 'جارٍ المعالجة…',
    auth_no_account: 'ليس لديك حساب؟',
    auth_create_one: 'أنشئ حساباً',
    auth_have_account: 'لديك حساب بالفعل؟',
    auth_sign_in: 'سجّل الدخول',
    auth_err_name: 'يرجى إدخال اسمك.',
    auth_err_email: 'يرجى إدخال بريد إلكتروني صالح.',
    auth_err_password_len: 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
    auth_err_password_match: 'كلمتا المرور غير متطابقتين.',
    auth_preview_notice:
      'الحسابات غير مفعّلة بعد — هذه معاينة لتجربة تسجيل الدخول.',
    auth_generic_error: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    guest_turns_left: (n: number) => `${n} ${n === 1 ? 'سؤال مجاني متبقٍ' : 'أسئلة مجانية متبقية'}`,
    guest_gate_body:
      'لقد استخدمت أسئلتك المجانية الخمسة. سجّل الدخول أو أنشئ حساباً لمواصلة استكشاف دفترك.',
    guest_gate_placeholder: 'سجّل الدخول لمتابعة المحادثة…',

    settings_title: 'الإعدادات',
    settings_section_account: 'الحساب',
    settings_guest_notice: 'أنت تتصفح كضيف. سجّل الدخول أو أنشئ حساباً لحفظ دفترك في السحابة.',
    settings_guest_value: 'ضيف',
    settings_change_password: 'تغيير كلمة المرور',
    settings_sign_out: 'تسجيل الخروج',
    settings_section_notebook: 'الدفتر',
    settings_section_usage: 'الاستخدام',
    settings_usage_body: (used: number, limit: number) => `${used} من ${limit} أسئلة مجانية مستخدمة`,
    settings_usage_note: 'تُتبَّع الأسئلة المجانية على هذا الجهاز. سجّل الدخول للحصول على خطة شهرية أوسع.',
    settings_section_plan: 'الخطة',
    settings_current_plan: 'الخطة الحالية',
    settings_upgrade: 'ترقية',
    settings_section_preferences: 'التفضيلات',
    settings_pref_language: 'اللغة',
    settings_pref_theme: 'المظهر',
    settings_section_danger: 'منطقة الخطر',
    settings_delete_account: 'حذف الحساب',
    settings_delete_body: 'سيؤدي هذا إلى حذف حسابك وجميع دفاترك نهائياً. لا يمكن التراجع عن هذا الإجراء.',
  },
} as const

export type Strings = typeof STRINGS['en']

// ── Context ────────────────────────────────────────────────────────────────────

interface LocaleCtx {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleCtx>({ locale: 'en', setLocale: () => {} })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, _setLocale] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'ar' || saved === 'en') _setLocale(saved)
  }, [])

  function setLocale(l: Locale) {
    _setLocale(l)
    localStorage.setItem(LOCALE_KEY, l)
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  }

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  return createElement(LocaleContext.Provider, { value: { locale, setLocale } }, children)
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext)
  return {
    locale,
    setLocale,
    t: STRINGS[locale] as Strings,
    dir: (locale === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    isRTL: locale === 'ar',
  }
}
