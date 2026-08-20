import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Check, Lock, LogOut, MoreVertical } from 'lucide-react';

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

  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-stone-700';

  return (
    <div className="relative" ref={wrapper}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center px-2 py-1.5 rounded border ${
          editing ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-600 border-stone-300'
        }`}
      >
        <MoreVertical size={15} />
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

          <button
            role="menuitem"
            onClick={() => { setEditing(v => !v); setOpen(false); }}
            className={`${item} border-t border-stone-200`}
          >
            {editing ? <Check size={15} className="shrink-0" /> : <Lock size={15} className="shrink-0" />}
            <span className="flex-1">{editing ? 'Done editing' : 'Edit'}</span>
            <span className="text-[10px] font-mono text-stone-400">{editing ? 'Unlocked' : 'Locked'}</span>
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
    </div>
  );
}
