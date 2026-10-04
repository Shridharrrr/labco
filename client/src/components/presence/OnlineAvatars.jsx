import usePresenceStore from '../../store/presenceSlice';
import Avatar from '../ui/Avatar';

export default function OnlineAvatars() {
  const { onlineUsers } = usePresenceStore();

  if (!onlineUsers.length) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 6).map((u) => (
          <Avatar
            key={u.userId}
            name={u.name || u.email}
            src={u.avatar}
            color={u.color}
            size="sm"
          />
        ))}
        {onlineUsers.length > 6 && (
          <div className="w-7 h-7 rounded-md bg-white/10 border border-[#09090b]
            flex items-center justify-center text-[10px] text-zinc-300 font-semibold">
            +{onlineUsers.length - 6}
          </div>
        )}
      </div>
      <span className="ml-2 text-xs text-zinc-400 font-medium hidden sm:block">
        {onlineUsers.length} online
      </span>
    </div>
  );
}
