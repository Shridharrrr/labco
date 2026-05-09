import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import api from '../../services/api';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { getSocket } from '../../hooks/useSocket';

export default function RightPanel({ boardId, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'members'
  const { board } = useBoardStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    if (activeTab !== 'chat') return;
    setLoading(true);
    api.get(`/boards/${boardId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [boardId, activeTab]);

  // Listen for real-time messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleMessage = ({ message }) => {
      setMessages((prev) => [...prev, message]);
    };
    socket.on('chat:message', handleMessage);
    return () => socket.off('chat:message', handleMessage);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const tempText = text;
    setText('');
    try {
      const { data } = await api.post(`/boards/${boardId}/messages`, { text: tempText });
      setMessages((prev) => [...prev, data]);
      getSocket()?.emit('chat:message', { boardId, message: data });
    } catch {
      setText(tempText); // restore on fail
    }
  };

  const timeAgo = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#151515] border-l border-white/[0.06]
      z-40 flex flex-col shadow-2xl animate-[slideIn_0.25s_ease-out]">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 pt-4 border-b border-white/[0.06] shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chat' ? 'border-brand-500 text-white' : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            Board Chat
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members' ? 'border-brand-500 text-white' : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            Members
          </button>
        </div>
        <button onClick={onClose} className="pb-3 text-white/30 hover:text-white/80 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'chat' ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-sm">No messages yet.<br/>Start the conversation!</div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.user._id === user.userId;
                  const showAvatar = i === 0 || messages[i-1].user._id !== msg.user._id;

                  return (
                    <div key={msg._id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {showAvatar ? (
                        <div className="shrink-0 pt-1">
                          <Avatar name={msg.user.name || msg.user.email} src={msg.user.avatar} size="sm" />
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <span className="text-[10px] text-white/30 mb-1 px-1">
                            {isMe ? 'You' : (msg.user.name || msg.user.email?.split('@')[0])}
                          </span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                          isMe ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white/[0.06] text-white/90 rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-white/20 mt-1 px-1">{timeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06] bg-[#151515] shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-full pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="absolute right-1.5 p-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-0 disabled:scale-75 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-3">Board Owner</h4>
              {board.members.filter(m => m.role === 'owner').map(m => (
                <div key={m._id} className="flex items-center gap-3">
                  <Avatar name={m.user.name || m.user.email} src={m.user.avatar} />
                  <div>
                    <p className="text-sm font-medium text-white/90">{m.user.name || m.user.email?.split('@')[0]}</p>
                    <p className="text-xs text-white/40">{m.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-3 mt-6">Editors & Viewers</h4>
              <div className="space-y-4">
                {board.members.filter(m => m.role !== 'owner').map(m => (
                  <div key={m._id} className="flex items-center gap-3">
                    <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/80 truncate">{m.user.name || m.user.email?.split('@')[0]}</p>
                      <p className="text-[11px] text-white/40 capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
                {board.members.length === 1 && (
                  <p className="text-xs text-white/30 italic">No other members</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
