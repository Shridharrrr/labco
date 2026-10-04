import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeUser = (user) => {
  if (!user) return null;
  const id = user.userId || user._id || user.id;
  return {
    ...user,
    _id: id,
    userId: id,
  };
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken }) =>
        set({ user: normalizeUser(user), accessToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      updateUser: (changes) =>
        set((state) => ({ user: normalizeUser({ ...state.user, ...changes }) })),
    }),
    {
      name: 'labco-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.user = normalizeUser(state.user);
        }
      },
    }
  )
);

export default useAuthStore;
