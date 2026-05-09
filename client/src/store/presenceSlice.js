import { create } from 'zustand';

const usePresenceStore = create((set) => ({
  onlineUsers: [],   // [{ userId, name, avatar, color }]
  cursors: {},       // { [userId]: { x, y } }

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  userJoined: (user) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.find((u) => u.userId === user.userId)
        ? s.onlineUsers
        : [...s.onlineUsers, user],
    })),

  userLeft: (userId) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.filter((u) => u.userId !== userId),
      cursors: Object.fromEntries(
        Object.entries(s.cursors).filter(([id]) => id !== userId)
      ),
    })),

  updateCursor: (userId, pos) =>
    set((s) => ({ cursors: { ...s.cursors, [userId]: pos } })),

  clearPresence: () => set({ onlineUsers: [], cursors: {} }),
}));

export default usePresenceStore;
