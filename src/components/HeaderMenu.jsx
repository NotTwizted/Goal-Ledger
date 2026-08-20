import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, KeyRound, Lock, LogOut, MoreVertical } from 'lucide-react';
import { hasApiKey, maskApiKey } from '../lib/apikey';
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

  const item = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-stone-700';

  return (
    <div className="relative" ref={wrapper}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center px-2.5 py-2.5 rounded-lg border text-stone-600 border-stone-300"
      >
        <MoreVertical size={19} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-56 bg-white border-2 border-stone-800 rounded-lg shadow-lg overflow-hidden z-40"
        >
          <button
            role="menuitem"
            onClick={() => { toggleReminders(); }}
            disabled={notifPermission === 'denied'}
            className={`${item} disabled:text-stone-400`}
          >
            {remindersActive ? <Bell size={15} className="shrink-0" /> : <BellOff size={15} className="shrink-0" />}
            <span className="flex-1">Deadline reminders</span>
            <span className="text-[10px] font-mono text-stone-400">{remindersLabel}</span>
          </button>

          {!editing && (
            <button
              role="menuitem"
              onClick={() => { setEditing(true); setOpen(false); }}
              className={`${item} border-t border-stone-200`}
            >
              <Lock size={15} className="shrink-0" />
              <span className="flex-1">Edit</span>
              <span className="text-[10px] font-mono text-stone-400">Locked</span>
            </button>
          )}

          <button
            role="menuitem"
            onClick={() => { setOpen(false); setShowKey(true); }}
            className={`${item} border-t border-stone-200`}
          >
            <KeyRound size={15} className="shrink-0" />
            <span className="flex-1">API key</span>
            <span className="text-[10px] font-mono text-stone-400">
              {hasApiKey() ? maskApiKey() : 'Not set'}
            </span>
          </button>

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut(); }}
            className={`${item} border-t border-stone-200`}
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
