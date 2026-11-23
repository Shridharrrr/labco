import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import api from '../../services/api';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { getSocket } from '../../hooks/useSocket';
import { isImage, FileTypeIcon, fileColor } from '../../utils/fileHelpers';
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
      setText(tempText);
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

      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-white dark:bg-[#0a0b10] border-l border-black/[0.07] dark:border-white/[0.07]
        z-50 sm:z-40 flex flex-col shadow-2xl animate-[slideIn_0.15s_ease-out]">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 pt-3.5 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2.5 text-[12px] font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-2.5 text-[12px] font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'members'
                  ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Members
            </button>
          </div>
          <button onClick={onClose} className="mb-2 p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-xs">No messages yet.<br/>Start the conversation!</div>
                ) : (
                  messages.map((msg, i) => {
                    const prevMsg = messages[i-1];
                    const isGrouped = prevMsg && prevMsg.user._id === msg.user._id && (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 5 * 60000;
                    const uName = msg.user.name || msg.user.email?.split('@')[0];

                    return (
                      <div key={msg._id} className={`flex flex-col ${isGrouped ? 'mt-0' : 'mt-3'}`}>
                        {!isGrouped && (
                          <div className="flex items-center gap-2 mb-1 pl-1">
                            <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                              {uName}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">{timeAgo(msg.createdAt)}</span>
                          </div>
                        )}
                        
                        {msg.text && (
                          <div className="px-1 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 break-words">
                            {renderMarkdown(msg.text)}
                          </div>
                        )}

                        {/* Attachments */}
                        {msg.attachments?.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1.5 px-1">
                            {msg.attachments.map((att, idx) => (
                              isImage(att.filename) ? (
                                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block max-w-[90%] rounded-lg overflow-hidden border border-black/10 dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all">
                                  <img src={att.url} alt={att.filename} className="object-cover w-full max-h-[160px]" />
                                </a>
                              ) : (
                                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 max-w-[90%] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-black/10 dark:border-white/[0.08] rounded-md px-2 py-1.5 transition-all">
                                  <FileTypeIcon name={att.filename} className="w-4 h-4 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{att.filename}</p>
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
              <form onSubmit={handleSend} className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#0a0b10] shrink-0">
                {error && (
                  <div className="text-[10px] text-rose-500 mb-2 px-1">
                    {typeof error === 'string' ? error : (error?.message || JSON.stringify(error || ''))}
                  </div>
                )}
                
                {/* Staged files */}
                {stagedFiles.length > 0 && (
                  <div className="flex flex-col gap-1 mb-2 px-1">
                    {stagedFiles.map(({ file, preview }, i) => (
                      <div key={i} className="flex items-center justify-between bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-md px-2 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {preview ? <img src={preview} className="w-4 h-4 object-cover rounded-xs" /> : <FileTypeIcon name={file.name} className="w-3.5 h-3.5" />}
                          <span className={`text-[10px] truncate ${fileColor(file.name)}`}>{file.name}</span>
                        </div>
                        <button type="button" onClick={() => removeStaged(i)} className="text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative flex flex-col bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-lg focus-within:border-black/20 dark:focus-within:border-white/20 transition-colors">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-transparent p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none min-h-[38px] max-h-28"
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

                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors cursor-pointer" title="Attach file">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <button
                      type="submit"
                      disabled={(!text.trim() && stagedFiles.length === 0) || uploading}
                      className="px-2.5 py-1 rounded bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer text-xs font-semibold"
                    >
                      {uploading ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Workspace Owner</h4>
                {board.members.filter(m => m.role === 'owner').map(m => (
                  <div key={m._id} className="flex items-center gap-2.5">
                    <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="xs" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{m.user.name || m.user.email?.split('@')[0]}</p>
                      <p className="text-[11px] text-zinc-400">{m.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 mt-4">Members</h4>
                <div className="space-y-2">
                  {board.members.filter(m => m.role !== 'owner').map(m => (
                    <div key={m._id} className="flex items-center gap-2.5">
                      <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{m.user.name || m.user.email?.split('@')[0]}</p>
                        <p className="text-[10px] text-zinc-400 capitalize">{m.role}</p>
                      </div>
                    </div>
                  ))}
                  {board.members.length === 1 && (
                    <p className="text-[11px] text-zinc-400 italic">No other members</p>
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
