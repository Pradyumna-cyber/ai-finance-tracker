import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  name: string;
  age: number;
  isOnboarded: boolean;
}

interface UserStore {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  completeOnboarding: (name: string, age: number) => void;
  isOnboarded: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user: UserProfile) => {
        set({ user });
      },

      completeOnboarding: (name: string, age: number) => {
        const user: UserProfile = {
          name: name.trim(),
          age,
          isOnboarded: true,
        };
        set({ user });
      },

      isOnboarded: () => {
        const { user } = get();
        return user?.isOnboarded ?? false;
      },
    }),
    {
      name: 'user-store',
      version: 1,
    }
  )
);
