import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import api from '../../services/api';
import { getSocket } from '../../hooks/useSocket';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

export default function DiscussionTab({ boardId }) {
  const { user } = useAuthStore();
  const { board } = useBoardStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);

  // Markdown parser
  const renderMarkdown = (msgText) => {
    // Basic bold **text**, italic *text*, inline code `code`
    let html = msgText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-brand-300 px-1 py-0.5 rounded text-[13px] font-mono">$1</code>')
      .replace(/\n/g, '<br />');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const handleReply = (userToReply) => {
    const mention = `@${userToReply.name || userToReply.email.split('@')[0]} `;
    setText(prev => prev ? prev + ' ' + mention : mention);
    composerRef.current?.focus();
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/boards/${boardId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleMessage = ({ message }) => {
      setMessages((prev) => {
        // Prevent duplicates from optimistic UI
        if (prev.find(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };
    socket.on('chat:message', handleMessage);
    return () => socket.off('chat:message', handleMessage);
  }, []);

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
      setText(tempText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const timeAgo = (date) => {
    return new Date(date).toLocaleString('en-US', { 
      hour: 'numeric', minute: '2-digit' 
    });
  };

  const fullDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0c0c0f] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-[#111114] shrink-0 z-10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              # discussion
            </h2>
            <p className="text-[11px] text-white/35 mt-0.5">Central hub for team communication on <strong>{board?.title}</strong></p>
          </div>
          <div className="flex -space-x-1.5">
            {board?.members?.slice(0, 5).map(m => (
              <div key={m.user._id} className="w-7 h-7 rounded-md border-2 border-[#111114]" title={m.user.name || m.user.email}>
                <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto pt-5 pb-2 space-y-0 relative">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/15 text-xs gap-3">
              <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>No discussions yet. Be the first to start!</span>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.user._id === user.userId;
              const prevMsg = messages[i-1];
              // Group if same user and within 5 minutes
              const isGrouped = prevMsg && 
                                prevMsg.user._id === msg.user._id && 
                                (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 5 * 60000;
              // Add date separator if a new day started
              const showDate = !prevMsg || new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center gap-4 my-5 px-5">
                      <div className="flex-1 border-b border-white/[0.06]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">{fullDate(msg.createdAt)}</span>
                      <div className="flex-1 border-b border-white/[0.06]" />
                    </div>
                  )}
                  <div className={`group flex gap-3 px-5 py-1 hover:bg-[#111114] transition-colors relative ${isGrouped ? 'mt-0' : 'mt-4'}`}>
                    
                    {/* Hover Actions Menu */}
                    <div className="absolute right-5 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#161619] border border-white/[0.10] rounded-md shadow-xl flex items-center px-0.5 z-10">
                      <button onClick={() => handleReply(msg.user)} className="p-1.5 text-white/35 hover:text-white hover:bg-white/[0.06] rounded transition-colors" title="Reply">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(msg.text)} className="p-1.5 text-white/35 hover:text-white hover:bg-white/[0.06] rounded transition-colors" title="Copy text">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>

                    {!isGrouped ? (
                      <div className="shrink-0 mt-0.5">
                        <Avatar name={msg.user.name || msg.user.email} src={msg.user.avatar} size="md" />
                      </div>
                    ) : (
                      <div className="w-10 shrink-0 text-right pr-2 text-[9px] text-white/0 group-hover:text-white/15 select-none mt-1">
                        {timeAgo(msg.createdAt)}
                      </div>
                    )}
                    
                    <div className="flex flex-col flex-1 min-w-0 pb-1">
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-[13px] font-semibold ${isMe ? 'text-brand-400' : 'text-white/85'}`}>
                            {msg.user.name || msg.user.email?.split('@')[0]}
                          </span>
                          <span className="text-[10px] text-white/25">{timeAgo(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className="text-[13px] leading-[1.6] text-white/75 break-words whitespace-pre-wrap font-normal">
                        {renderMarkdown(msg.text)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-6" />
        </div>

        {/* Composer */}
        <div className="px-5 pb-5 pt-2 bg-[#0c0c0f] shrink-0">
          <form onSubmit={handleSend} className="relative flex flex-col bg-[#111114] border border-white/[0.08] rounded-lg transition-all focus-within:border-brand-500/25 focus-within:bg-[#141418]">
            
            <textarea
              ref={composerRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${board?.title.replace(/\s+/g, '-').toLowerCase()}`}
              className="w-full max-h-48 min-h-[40px] bg-transparent text-[13px] text-white placeholder-white/25 outline-none resize-none px-3.5 pt-2.5 pb-1"
              rows={1}
            />

            <div className="flex items-center justify-between px-2.5 pb-2 mt-0.5">
              <button type="button" className="p-1 text-white/25 hover:text-white/70 transition-colors rounded hover:bg-white/[0.04]" title="Add attachment">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
              </button>

              <button
                type="submit"
                disabled={!text.trim()}
                className="px-2.5 py-1 rounded-md bg-brand-600 text-white font-medium text-[11px] hover:bg-brand-500 disabled:opacity-40 disabled:bg-white/[0.04] disabled:text-white/15 transition-all flex items-center gap-1.5"
              >
                Send
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
