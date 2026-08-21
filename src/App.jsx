import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, Check, ChevronLeft, GraduationCap, Target } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';
import { daysUntil, pastPaperLabel, subjectLabel } from './lib/helpers';
import { LedgerContext } from './lib/ledger';
import { navigate, paths, useRoute } from './lib/router';
import { assignMissingAccents, categoryAccent, subjectAccent } from './lib/palette';
import { parseLedger, serialiseLedger } from './lib/ledgerdata';
import { getApiKey, setApiKey } from './lib/apikey';
import HeaderMenu from './components/HeaderMenu';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SubjectPage from './pages/SubjectPage';
import PaperPage from './pages/PaperPage';
import PastPapersPage from './pages/PastPapersPage';
import PastPaperPage from './pages/PastPaperPage';
import ReportDetailPage from './pages/ReportDetailPage';

function NotFound({ message }) {
  return (
    <div className="p-6 text-center py-20">
      <p className="text-stone-400 font-serif text-sm mb-3">{message}</p>
      <button
        onClick={() => navigate(paths.home())}
        className="px-3 py-1.5 border border-stone-300 rounded text-sm text-stone-600"
      >
        Back to the ledger
      </button>
    </div>
  );
}

export default function StudyTracker() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('sign-in');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState(false);
  const [readerKey, setReaderKey] = useState(getApiKey);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  // Browser permission can be granted but never withdrawn from script, so the
  // on/off state is ours to keep — permission is only the gate in front of it.
  const [remindersOn, setRemindersOn] = useState(
    () => localStorage.getItem('study-tracker:reminders') !== 'off'
  );

  const route = useRoute();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSubjects([]);
      setLoaded(true);
      return;
    }

    let cancelled = false;

    const loadSubjects = async () => {
      setLoaded(false);
      setSaveError(false);

      try {
        const { data, error } = await supabase
          .from('goal_ledger_data')
          .select('subjects')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (data?.subjects) {
          const ledger = parseLedger(data.subjects);
          setSubjects(ledger.subjects);

          if (ledger.readerKey) {
            // A key added on another device arrives here.
            setApiKey(ledger.readerKey);
            setReaderKey(ledger.readerKey);
          } else if (getApiKey()) {
            // This device has one and the account does not: send it up, so the
            // next device gets it without being asked.
            const localKey = getApiKey();
            setReaderKey(localKey);
            await supabase.from('goal_ledger_data').upsert(
              { user_id: user.id, subjects: serialiseLedger(ledger.subjects, localKey), updated_at: new Date().toISOString() },
              { onConflict: 'user_id' },
            );
          }
        } else {
          // Migrate the old browser-only data once if this device still has it.
          // 'study-tracker:subjects' is the key the pre-Supabase app wrote to.
          const oldSaved = localStorage.getItem('study-tracker:subjects')
            || localStorage.getItem('studyTrackerSubjects');
          const oldSubjects = oldSaved ? JSON.parse(oldSaved) : [];
          const initialSubjects = Array.isArray(oldSubjects) ? oldSubjects : [];
          setSubjects(initialSubjects);

          if (initialSubjects.length > 0) {
            const { error: insertError } = await supabase
              .from('goal_ledger_data')
              .upsert(
                { user_id: user.id, subjects: serialiseLedger(initialSubjects, getApiKey()) },
                { onConflict: 'user_id' }
              );
            if (insertError) throw insertError;
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Could not load Goal Ledger data:', e);
          setSaveError(true);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadSubjects();

    const channel = supabase
      .channel(`goal-ledger-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_ledger_data',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (cancelled || !payload.new?.subjects) return;
          const ledger = parseLedger(payload.new.subjects);
          setSubjects(ledger.subjects);
          if (ledger.readerKey && ledger.readerKey !== getApiKey()) {
            setApiKey(ledger.readerKey);
            setReaderKey(ledger.readerKey);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!loaded || !remindersOn || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let notified = {};
    try {
      const saved = localStorage.getItem('study-tracker:notified-deadlines');
      if (saved) notified = JSON.parse(saved);
    } catch (e) {
      // none yet
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    let changed = false;

    subjects.forEach(s => {
      if (!s.deadline) return;
      const d = daysUntil(s.deadline);
      if (d !== 0 && d !== 1 && d !== 2) return;
      const key = `${s.id}:${todayKey}`;
      if (notified[key]) return;
      try {
        new Notification(`${s.name} — deadline ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`, {
          body: s.target ? `Target: ${s.target}` : 'Check your progress in the tracker.',
        });
      } catch (e) {
        // notification failed to fire, ignore
      }
      notified[key] = true;
      changed = true;
    });

    if (changed) {
      try {
        localStorage.setItem('study-tracker:notified-deadlines', JSON.stringify(notified));
      } catch (e) {
        // best effort
      }
    }
  }, [loaded, remindersOn, subjects]);

  // One listener for the whole app, so every button — including ones rendered
  // later — acknowledges a press without each component opting in.
  useEffect(() => {
    const PRESSABLE = 'button, [data-tappable], label[data-tappable]';

    const onPointerDown = (e) => {
      const el = e.target.closest?.(PRESSABLE);
      if (!el || el.disabled) return;
      el.classList.remove('is-pressed');
      void el.offsetWidth; // restart the animation on a rapid second press
      el.classList.add('is-pressed');
    };

    const onAnimationEnd = (e) => {
      if (e.animationName === 'press' || e.animationName === 'press-card') {
        e.target.classList.remove('is-pressed');
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('animationend', onAnimationEnd, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('animationend', onAnimationEnd, true);
    };
  }, []);

  const toggleReminders = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        setRemindersOn(true);
        localStorage.setItem('study-tracker:reminders', 'on');
      }
      return;
    }
    setRemindersOn(on => {
      const next = !on;
      localStorage.setItem('study-tracker:reminders', next ? 'on' : 'off');
      return next;
    });
  }, []);

  const persist = useCallback(async (next, keyOverride) => {
    if (!user) return;
    try {
      const key = keyOverride === undefined ? getApiKey() : keyOverride;
      const { error } = await supabase
        .from('goal_ledger_data')
        .upsert(
          { user_id: user.id, subjects: serialiseLedger(next, key), updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      setSaveError(false);
    } catch (e) {
      console.error('Could not save Goal Ledger data:', e);
      setSaveError(true);
    }
  }, [user]);

  const updateSubjects = useCallback((next) => {
    setSubjects(next);
    persist(next);
  }, [persist]);

  // Kept on this device so every request can reach it without waiting, and on
  // the account so the next device does not have to be told again.
  const saveReaderKey = useCallback((key) => {
    setApiKey(key);
    setReaderKey(key || '');
    persist(subjects, key || '');
  }, [persist, subjects]);

  // Subjects made before colours existed have none, so give each a distinct one
  // and save it. Once per session, and only when something is actually missing.
  const accentsBackfilled = useRef(false);
  useEffect(() => {
    if (!loaded || !user || accentsBackfilled.current) return;
    const next = assignMissingAccents(subjects);
    if (next === subjects) return;
    accentsBackfilled.current = true;
    updateSubjects(next);
  }, [loaded, user, subjects, updateSubjects]);

  const ledger = useMemo(
    () => ({ subjects, updateSubjects, weekOffset, setWeekOffset, editing, setEditing, notifPermission, readerKey, saveReaderKey }),
    [subjects, updateSubjects, weekOffset, editing, notifPermission, readerKey, saveReaderKey]
  );

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthError('Enter your email and password.');
      return;
    }

    try {
      if (authMode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: authPassword });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: authPassword });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage('Account created. Check your email to confirm your account, then sign in.');
          setAuthMode('sign-in');
        }
      }
    } catch (e) {
      setAuthError(e.message || 'Authentication failed.');
    }
  };

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="text-stone-500 font-serif">Loading Goal Ledger…</div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="w-full min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border-2 border-stone-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={24} className="text-stone-800" />
            <h1 className="font-serif text-2xl text-stone-900">Goal Ledger</h1>
          </div>
          <p className="text-sm text-stone-600 mb-3">
            This build has no Supabase credentials, so it can't sign you in or load your ledger.
          </p>
          <p className="text-sm text-stone-600 mb-2">
            Set these two environment variables where the site is built, then redeploy:
          </p>
          <ul className="text-xs font-mono text-stone-700 bg-stone-100 rounded p-3 mb-3 space-y-1">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_PUBLISHABLE_KEY</li>
          </ul>
          <p className="text-xs text-stone-500">
            They're in your local <span className="font-mono">.env.local</span>, which is deliberately kept out of the repository.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border-2 border-stone-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={24} className="text-stone-800" />
            <h1 className="font-serif text-2xl text-stone-900">Goal Ledger</h1>
          </div>
          <p className="text-sm text-stone-500 mb-6">Sign in to keep your goals and study progress synced across your devices.</p>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="border border-stone-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <input
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              placeholder="Password"
              autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'}
              className="border border-stone-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />

            {authError && <p className="text-xs text-rose-600">{authError}</p>}
            {authMessage && <p className="text-xs text-emerald-700">{authMessage}</p>}

            <button type="submit" className="px-3 py-2.5 bg-stone-800 text-white rounded text-sm font-medium">
              {authMode === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setAuthMode(mode => (mode === 'sign-in' ? 'sign-up' : 'sign-in'));
              setAuthError('');
              setAuthMessage('');
            }}
            className="w-full mt-3 px-3 py-2 text-sm text-stone-600 rounded"
          >
            {authMode === 'sign-in' ? 'Create a new account' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return <div className="w-full p-8 text-stone-500 font-serif">Loading your subjects…</div>;
  }

  const routeSubject = route.subjectId ? subjects.find(s => s.id === route.subjectId) : null;
  const routePastPaper = route.pastPaperId
    ? (routeSubject?.pastPapers || []).find(pp => pp.id === route.pastPaperId)
    : null;

  const categoryIcon = (category, subject) => {
    const style = subject ? { color: subjectAccent(subject) } : undefined;
    return category === 'study'
      ? <GraduationCap size={22} className={subject ? '' : 'text-indigo-800'} style={style} />
      : <Target size={22} className={subject ? '' : 'text-amber-700'} style={style} />;
  };

  const header = (() => {
    switch (route.name) {
      case 'dashboard':
        return {
          back: paths.home(),
          icon: categoryIcon(route.category),
          title: route.category === 'study' ? 'Studies' : 'General goals',
        };
      case 'subject':
        return {
          back: routeSubject ? paths.category(routeSubject.category) : paths.home(),
          icon: routeSubject ? categoryIcon(routeSubject.category, routeSubject) : null,
          title: routeSubject ? subjectLabel(routeSubject) : 'Subject',
        };
      case 'paper':
        return { back: paths.subject(route.subjectId), icon: null, title: route.paper };
      case 'pastPapers':
        return { back: paths.paper(route.subjectId, route.paper), icon: null, title: `${route.paper} past papers` };
      case 'pastPaper':
        return {
          back: paths.pastPapers(route.subjectId, route.paper),
          icon: null,
          title: routePastPaper ? pastPaperLabel(routePastPaper) : 'Past paper',
        };
      case 'reportDetail':
        return {
          back: paths.home(),
          icon: routeSubject ? categoryIcon(routeSubject.category, routeSubject) : <CalendarCheck size={22} className="text-stone-800" />,
          title: routeSubject ? routeSubject.name : 'Weekly report',
        };
      default:
        return { back: null, icon: <GraduationCap size={22} className="text-stone-800" />, title: 'Goal ledger' };
    }
  })();

  const page = (() => {
    switch (route.name) {
      case 'dashboard':
        return <DashboardPage category={route.category} />;
      case 'subject':
        return routeSubject
          ? <SubjectPage subject={routeSubject} />
          : <NotFound message="That subject no longer exists." />;
      case 'paper':
        return routeSubject
          ? <PaperPage subject={routeSubject} paper={route.paper} />
          : <NotFound message="That subject no longer exists." />;
      case 'pastPapers':
        return routeSubject
          ? <PastPapersPage subject={routeSubject} paper={route.paper} />
          : <NotFound message="That subject no longer exists." />;
      case 'pastPaper':
        return routePastPaper
          ? <PastPaperPage subject={routeSubject} pastPaper={routePastPaper} />
          : <NotFound message="That past paper no longer exists." />;
      case 'reportDetail':
        return <ReportDetailPage subjectId={route.subjectId} />;
      default:
        return <HomePage />;
    }
  })();

  return (
    <LedgerContext.Provider value={ledger}>
      <div className="w-full bg-stone-50 min-h-screen">
        <div className="border-b-2 border-stone-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {header.back && (
              <button
                onClick={() => navigate(header.back)}
                className="mr-2 p-1.5 rounded text-stone-700"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <button
              onClick={() => navigate(paths.home())}
              title="Back to the weekly report"
              className="flex items-center gap-2 rounded px-1.5 py-1 -mx-1.5"
            >
              {header.icon}
              <h1 className="font-serif text-xl text-stone-900 tracking-tight">{header.title}</h1>
            </button>
          </div>
          <div className="flex items-center gap-2">
          {[
            { key: 'study', label: 'Studies', Icon: GraduationCap },
            { key: 'general', label: 'Goals', Icon: Target },
          ].map(({ key, label, Icon }) => {
            const active = route.name === 'dashboard' && route.category === key;
            const hue = categoryAccent(key);
            return (
              <button
                key={key}
                onClick={() => navigate(paths.category(key))}
                title={key === 'study' ? 'Studies' : 'General goals'}
                className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border font-medium"
                style={{
                  color: active ? '#ffffff' : hue,
                  borderColor: hue,
                  backgroundColor: active ? hue : `${hue}12`,
                }}
              >
                <Icon size={17} /> <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
          {editing && (
            <button
              onClick={() => setEditing(false)}
              title="Lock the ledger"
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border font-medium bg-stone-800 text-white border-stone-800"
            >
              <Check size={17} /> <span className="hidden sm:inline">Done</span>
            </button>
          )}
          <HeaderMenu
            editing={editing}
            setEditing={setEditing}
            remindersOn={remindersOn}
            notifPermission={notifPermission}
            toggleReminders={toggleReminders}
            onSignOut={() => supabase.auth.signOut()}
          />
          </div>
        </div>

        {saveError && (
          <div className="mx-6 mt-4 px-3 py-2 bg-rose-50 border border-rose-300 text-rose-800 text-sm rounded">
            Couldn't save your changes. They may not persist — try again in a moment.
          </div>
        )}

        <div key={JSON.stringify(route)} className="page-enter">
          {page}
        </div>
      </div>
    </LedgerContext.Provider>
  );
}
