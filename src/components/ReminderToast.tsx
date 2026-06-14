import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { useReminderStore } from '@/store/reminderStore';

const REMINDER_TIMES = ['09:00', '12:00', '15:00', '18:00'];

const getCurrentTimeString = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const getNextReminder = (currentTime: string, remindersShown: number) => {
  if (remindersShown >= REMINDER_TIMES.length) return null;
  for (let i = remindersShown; i < REMINDER_TIMES.length; i += 1) {
    if (REMINDER_TIMES[i] > currentTime) {
      return REMINDER_TIMES[i];
    }
  }
  return null;
};

const getMinutesUntil = (timeString: string) => {
  const [hour, minute] = timeString.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
};

export default function ReminderToast() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const { dailyReminderDate, remindersShownToday, ensureToday, recordReminderShown } = useReminderStore();

  useEffect(() => {
    const todayString = new Date().toISOString().slice(0, 10);
    ensureToday(todayString);
  }, [ensureToday]);

  useEffect(() => {
    if (location.pathname === '/add') return undefined;

    const currentTime = getCurrentTimeString();
    const nextReminder = getNextReminder(currentTime, remindersShownToday);
    if (!nextReminder) return undefined;

    const minutesUntil = getMinutesUntil(nextReminder);
    const timer = window.setTimeout(() => {
      const notificationText = `Reminder ${remindersShownToday + 1} of 4: Add your expense now.`;
      setMessage(notificationText);
      setVisible(true);
      recordReminderShown();

      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Expense reminder', {
          body: 'Tap to add your next expense.',
          icon: '/favicon.ico',
        });
        notification.onclick = () => {
          window.focus();
          navigate('/add');
        };
      }
    }, minutesUntil * 60 * 1000);

    return () => window.clearTimeout(timer);
  }, [location.pathname, remindersShownToday, ensureToday, recordReminderShown, dailyReminderDate, navigate]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[min(92%,380px)] -translate-x-1/2 rounded-3xl border border-white/10 bg-[#111827]/95 p-4 text-sm text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
            <BellRing size={20} />
          </span>
          <div>
            <p className="font-semibold">Expense reminder</p>
            <p className="text-xs text-slate-300">{message}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            navigate('/add');
          }}
          className="rounded-full bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950"
        >
          Add now
        </button>
      </div>
    </div>
  );
}
