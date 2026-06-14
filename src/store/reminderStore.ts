import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReminderStore {
  dailyReminderDate: string;
  remindersShownToday: number;
  lastReminderTime: string | null;
  ensureToday: (dateString: string) => void;
  recordReminderShown: () => void;
  completeTodayReminders: () => void;
}

const getTodayString = () => new Date().toISOString().slice(0, 10);

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set) => ({
      dailyReminderDate: getTodayString(),
      remindersShownToday: 0,
      lastReminderTime: null,

      ensureToday: (dateString: string) =>
        set((state) => {
          if (state.dailyReminderDate === dateString) {
            return state;
          }
          return {
            dailyReminderDate: dateString,
            remindersShownToday: 0,
            lastReminderTime: null,
          };
        }),

      recordReminderShown: () =>
        set((state) => ({
          dailyReminderDate: getTodayString(),
          remindersShownToday: Math.min(4, state.remindersShownToday + 1),
          lastReminderTime: new Date().toISOString(),
        })),

      completeTodayReminders: () =>
        set({
          dailyReminderDate: getTodayString(),
          remindersShownToday: 4,
          lastReminderTime: new Date().toISOString(),
        }),
    }),
    {
      name: 'reminder-store',
      version: 1,
      migrate: (persistedState: any) => ({
        dailyReminderDate: persistedState?.dailyReminderDate ?? getTodayString(),
        remindersShownToday: persistedState?.remindersShownToday ?? 0,
        lastReminderTime: persistedState?.lastReminderTime ?? null,
      }),
    }
  )
);
