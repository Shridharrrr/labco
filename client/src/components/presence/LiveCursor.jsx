import usePresenceStore from '../../store/presenceSlice';

export default function LiveCursor() {
  const { onlineUsers, cursors } = usePresenceStore();

  return (
    <>
      {Object.entries(cursors).map(([userId, pos]) => {
        const user = onlineUsers.find((u) => u.userId === userId);
        if (!user) return null;
        return (
          <div
            key={userId}
            className="fixed pointer-events-none z-[9998] transition-all duration-75"
            style={{ left: pos.x, top: pos.y }}
          >
            {/* Cursor SVG */}
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path
                d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9L0 0Z"
                fill={user.color}
                stroke="#0f0e17"
                strokeWidth="1"
              />
            </svg>
            {/* Name tag */}
            <div
              className="absolute top-4 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
              style={{ background: user.color }}
            >
              {user.name || user.email?.split('@')[0]}
            </div>
          </div>
        );
      })}
    </>
  );
}
