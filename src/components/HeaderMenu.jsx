import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, KeyRound, Lock, LogOut, Monitor, Moon, MoreVertical, Sun } from 'lucide-react';
import { useLedger } from '../lib/ledger';
import { hasApiKey, providerLabel } from '../lib/apikey';
import ApiKeyDialog from './ApiKeyDialog';

// The settings that aren't navigation live behind the three dots, so the
// header keeps only the two places you actually go.
export default function HeaderMenu({
  editing,
  setEditing,
  remindersOn,
  notifPermission,
  toggleReminders,
  onSignOut,
}) {
  const { theme, setTheme } = useLedger();
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!wrapper.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const remindersActive = remindersOn && notifPermission === 'granted';
  const remindersLabel = notifPermission === 'denied'
    ? 'Blocked in browser settings'
    : notifPermission === 'default'
      ? 'Off — tap to allow'
      : remindersActive ? 'On' : 'Off';

  const item = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-stone-700 dark:text-stone-300';

  return (
    <div className="relative" ref={wrapper}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center px-2.5 py-2.5 rounded-lg border text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700"
      >
        <MoreVertical size={19} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-stone-900 border-2 border-stone-800 dark:border-stone-600 rounded-lg shadow-lg overflow-hidden z-40"
        >
          <button
            role="menuitem"
            onClick={() => { toggleReminders(); }}
            disabled={notifPermission === 'denied'}
            className={`${item} disabled:text-stone-400`}
          >
            {remindersActive ? <Bell size={15} className="shrink-0" /> : <BellOff size={15} className="shrink-0" />}
            <span className="flex-1">Deadline reminders</span>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">{remindersLabel}</span>
          </button>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-stone-200 dark:border-stone-700">
            <Moon size={15} className="shrink-0 text-stone-700 dark:text-stone-300" />
            <span className="flex-1 text-sm text-stone-700 dark:text-stone-300">Appearance</span>
            <div className="flex rounded border border-stone-300 dark:border-stone-700 overflow-hidden">
              {[
                { key: 'light', Icon: Sun, label: 'Light' },
                { key: 'dark', Icon: Moon, label: 'Dark' },
                { key: 'system', Icon: Monitor, label: 'Follow the system' },
              ].map(({ key, Icon, label }) => (
                <button
                  key={key}
                  role="menuitemradio"
                  aria-checked={theme === key}
                  onClick={() => setTheme(key)}
                  title={label}
                  className={`px-2 py-1.5 ${
                    theme === key
                      ? 'bg-stone-800 dark:bg-stone-700 text-white'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          {!editing && (
            <button
              role="menuitem"
              onClick={() => { setEditing(true); setOpen(false); }}
              className={`${item} border-t border-stone-200 dark:border-stone-700`}
            >
              <Lock size={15} className="shrink-0" />
              <span className="flex-1">Edit</span>
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">Locked</span>
            </button>
          )}

          <button
            role="menuitem"
            onClick={() => { setOpen(false); setShowKey(true); }}
            className={`${item} border-t border-stone-200 dark:border-stone-700`}
          >
            <KeyRound size={15} className="shrink-0" />
            <span className="flex-1">Reader key</span>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
              {hasApiKey() ? (providerLabel() || 'Set') : 'Not set'}
            </span>
          </button>

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut(); }}
            className={`${item} border-t border-stone-200 dark:border-stone-700`}
          >
            <LogOut size={15} className="shrink-0" />
            <span className="flex-1">Sign out</span>
          </button>
        </div>
      )}

      {showKey && <ApiKeyDialog onClose={() => setShowKey(false)} />}
    </div>
  );
}
