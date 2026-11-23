import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import api from '../../services/api';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { getSocket } from '../../hooks/useSocket';
import { isImage, FileTypeIcon, formatBytes, fileColor } from '../../utils/fileHelpers';
import { parseSafeMarkdown } from '../../utils/sanitize';

export default function RightPanel({ boardId, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'members'
  const { board } = useBoardStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [text, setText] = useState('');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
      setMessages((prev) => prev.find(m => m._id === message._id) ? prev : [...prev, message]);
    };
    socket.on('chat:message', handleMessage);
    return () => socket.off('chat:message', handleMessage);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stagedFiles]);

  const stageFiles = (incoming) => {
    const newFiles = Array.from(incoming).map(file => ({
      file,
      preview: isImage(file.name) ? URL.createObjectURL(file) : null,
    }));
    setStagedFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const removeStaged = (idx) => {
    setStagedFiles(prev => {
      const copy = [...prev];
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && stagedFiles.length === 0) return;
    
    const tempText = text;
    const tempFiles = stagedFiles;
    
    setText('');
    setStagedFiles([]);
    setError('');
    setUploading(true);
    
    try {
      const formData = new FormData();
      if (tempText.trim()) formData.append('text', tempText);
      tempFiles.forEach(({ file }) => formData.append('files', file));

      const { data } = await api.post(`/boards/${boardId}/messages`, formData);
      setMessages((prev) => [...prev, data]);
      getSocket()?.emit('chat:message', { boardId, message: data });
    } catch (err) {
      setText(tempText); // restore on fail
      setStagedFiles(tempFiles);
      setError(err?.response?.data?.message || 'Failed to send');
    } finally {
      setUploading(false);
    }
  };

  const timeAgo = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Unique color generator for names
  const nameColor = (name) => {
    if (!name) return '#a1a1aa';
    return `hsl(${(name.charCodeAt(0) * 5) % 360}, 65%, 65%)`;
  };

  // Markdown rendering
  const renderMarkdown = (msgText) => {
    if (!msgText) return null;
    return <span dangerouslySetInnerHTML={{ __html: parseSafeMarkdown(msgText, { inlineOnly: true }) }} />;
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-[#0c0c0f] border-l border-white/[0.06]
        z-50 sm:z-40 flex flex-col shadow-2xl shadow-black/80 animate-[slideIn_0.2s_ease-out]">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 pt-3.5 border-b border-white/[0.06] shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === 'chat' ? 'border-brand-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Board Chat
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === 'members' ? 'border-brand-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Members
          </button>
        </div>
        <button onClick={onClose} className="mb-2.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'chat' ? (
          <>
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {loading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs">No messages yet.<br/>Start the conversation!</div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.user._id === (user?.userId || user?._id);
                  const prevMsg = messages[i-1];
                  const isGrouped = prevMsg && prevMsg.user._id === msg.user._id && (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 5 * 60000;
                  const uName = msg.user.name || msg.user.email?.split('@')[0];

                  return (
                    <div key={msg._id} className={`flex flex-col ${isGrouped ? 'mt-0' : 'mt-4'}`}>
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-1 pl-1">
                          <span className="text-[11px] font-semibold" style={{ color: nameColor(uName) }}>
                            {uName}
                          </span>
                          <span className="text-[10px] text-zinc-400">{timeAgo(msg.createdAt)}</span>
                        </div>
                      )}
                      
                      {msg.text && (
                        <div className="px-1 text-[12px] leading-relaxed text-white/85 break-words">
                          {renderMarkdown(msg.text)}
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.attachments?.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1.5 px-1">
                          {msg.attachments.map((att, idx) => (
                            isImage(att.filename) ? (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block max-w-[90%] rounded-lg overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all">
                                <img src={att.url} alt={att.filename} className="object-cover w-full max-h-[160px]" />
                              </a>
                            ) : (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 max-w-[90%] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-2 py-2 transition-all">
                                <FileTypeIcon name={att.filename} className="w-6 h-6 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-medium text-white/80 truncate">{att.filename}</p>
                                </div>
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06] bg-[#0c0c0f] shrink-0">
              {error && <div className="text-[10px] text-rose-400 mb-2 px-1">{error}</div>}
              
              {/* Staged files */}
              {stagedFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2.5 px-1">
                  {stagedFiles.map(({ file, preview }, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {preview ? <img src={preview} className="w-5 h-5 object-cover rounded-sm" /> : <FileTypeIcon name={file.name} className="w-4 h-4" />}
                        <span className={`text-[10px] truncate ${fileColor(file.name)}`}>{file.name}</span>
                      </div>
                      <button type="button" onClick={() => removeStaged(i)} className="text-white/40 hover:text-white">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex flex-col bg-white/[0.04] border border-white/[0.08] rounded-lg focus-within:border-brand-500/50 transition-colors">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-transparent p-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none resize-none min-h-[40px] max-h-32"
                  rows={1}
                />
                
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) stageFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                <div className="flex items-center justify-between px-2 pb-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors" title="Attach file">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <button
                    type="submit"
                    disabled={(!text.trim() && stagedFiles.length === 0) || uploading}
                    className="p-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-30 disabled:scale-95 transition-all"
                  >
                    {uploading ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.12em] mb-2.5">Board Owner</h4>
              {board.members.filter(m => m.role === 'owner').map(m => (
                <div key={m._id} className="flex items-center gap-2.5">
                  <Avatar name={m.user.name || m.user.email} src={m.user.avatar} />
                  <div>
                    <p className="text-[13px] font-medium text-white/90">{m.user.name || m.user.email?.split('@')[0]}</p>
                    <p className="text-[11px] text-zinc-400">{m.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.12em] mb-2.5 mt-4">Editors & Viewers</h4>
              <div className="space-y-3">
                {board.members.filter(m => m.role !== 'owner').map(m => (
                  <div key={m._id} className="flex items-center gap-2.5">
                    <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-zinc-200 truncate">{m.user.name || m.user.email?.split('@')[0]}</p>
                      <p className="text-[10px] text-zinc-400 capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
                {board.members.length === 1 && (
                  <p className="text-[11px] text-zinc-500 italic">No other members</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
