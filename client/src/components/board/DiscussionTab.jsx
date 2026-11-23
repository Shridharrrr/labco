import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import api from '../../services/api';
import { getSocket } from '../../hooks/useSocket';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { isImage, FileTypeIcon, formatBytes, fileColor } from '../../utils/fileHelpers';
import { parseSafeMarkdown } from '../../utils/sanitize';

// ─── Component ───────────────────────────────────────────────────────────────
export default function DiscussionTab({ boardId }) {
  const { user } = useAuthStore();
  const { board } = useBoardStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [stagedFiles, setStagedFiles] = useState([]); // { file, preview? }
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0–100
  const [error, setError]       = useState('');
  const messagesEndRef = useRef(null);
  const composerRef    = useRef(null);
  const fileInputRef   = useRef(null);

  // ── Markdown ────────────────────────────────────────────────────────────
  const renderMarkdown = (msgText) => {
    if (!msgText) return null;
    return <span dangerouslySetInnerHTML={{ __html: parseSafeMarkdown(msgText, { inlineOnly: true }) }} />;
  };

  // ── Message feed ────────────────────────────────────────────────────────
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
    const handler = ({ message }) => {
      setMessages(prev => prev.find(m => m._id === message._id) ? prev : [...prev, message]);
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── File staging ────────────────────────────────────────────────────────
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

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && stagedFiles.length === 0) return;

    const tempText  = text;
    const tempFiles = stagedFiles;

    setText('');
    setStagedFiles([]);
    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      if (tempText.trim()) formData.append('text', tempText);
      tempFiles.forEach(({ file }) => formData.append('files', file));

      const { data } = await api.post(`/boards/${boardId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      setMessages(prev => [...prev, data]);
      getSocket()?.emit('chat:message', { boardId, message: data });
    } catch (err) {
      setText(tempText);
      setStagedFiles(tempFiles);
      setError(err?.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleReply = (u) => {
    const mention = `@${u.name || u.email.split('@')[0]} `;
    setText(prev => prev ? prev + ' ' + mention : mention);
    composerRef.current?.focus();
  };

  const timeStr  = (d) => new Date(d).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr  = (d) => new Date(d).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-[#0c0c0f] overflow-hidden">

      {/* Header */}
      <div className="px-3 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.06] bg-[#111114] shrink-0 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            # discussion
          </h2>
          <p className="text-[11px] text-white/35 mt-0.5">
            Central hub for team communication on <strong>{board?.title}</strong>
          </p>
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
      <div className="flex-1 overflow-y-auto pt-5 pb-2 relative">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/15 text-xs gap-3">
            <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>No discussions yet. Be the first to start!</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe     = msg.user._id === (user?.userId || user?._id);
            const prevMsg  = messages[i - 1];
            const isGrouped = prevMsg &&
              prevMsg.user._id === msg.user._id &&
              (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 5 * 60000;
            const showDate = !prevMsg ||
              new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="flex items-center gap-4 my-5 px-3 sm:px-5">
                    <div className="flex-1 border-b border-white/[0.06]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      {dateStr(msg.createdAt)}
                    </span>
                    <div className="flex-1 border-b border-white/[0.06]" />
                  </div>
                )}

                <div className={`group flex gap-2.5 sm:gap-3 px-3 sm:px-5 py-1 hover:bg-[#111114] transition-colors relative ${isGrouped ? 'mt-0' : 'mt-4'}`}>

                  {/* Hover Actions */}
                  <div className="absolute right-2 sm:right-5 -top-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[#161619] border border-white/[0.10] rounded-md shadow-xl flex items-center px-0.5 z-10">
                    <button onClick={() => handleReply(msg.user)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 active:scale-95" title="Reply">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    {msg.text && (
                      <button onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 active:scale-95" title="Copy text">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Avatar column */}
                  {!isGrouped ? (
                    <div className="shrink-0 mt-0.5">
                      <Avatar name={msg.user.name || msg.user.email} src={msg.user.avatar} size="md" />
                    </div>
                  ) : (
                    <div className="w-10 shrink-0" />
                  )}

                  {/* Content */}
                  <div className="flex flex-col flex-1 min-w-0 pb-1">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-[13px] font-semibold ${isMe ? 'text-brand-400' : 'text-white/90'}`}>
                          {msg.user.name || msg.user.email?.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-zinc-400">{timeStr(msg.createdAt)}</span>
                      </div>
                    )}

                    {msg.text && (
                      <div className="text-[13px] leading-[1.6] text-zinc-200 break-words whitespace-pre-wrap">
                        {renderMarkdown(msg.text)}
                      </div>
                    )}

                    {/* Attachments */}
                    {msg.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.attachments.map((att, idx) => (
                          isImage(att.filename) ? (
                            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all group/img">
                              <img src={att.url} alt={att.filename}
                                className="max-w-[280px] max-h-[200px] object-cover group-hover/img:scale-[1.01] transition-transform duration-200" />
                            </a>
                          ) : (
                            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-3 py-2.5 transition-all group/doc max-w-[280px]">
                              <FileTypeIcon name={att.filename} className="w-8 h-8 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-zinc-200 truncate group-hover/doc:text-white transition-colors">
                                  {att.filename}
                                </p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  {att.filename.split('.').pop()?.toUpperCase()} · Click to open
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-zinc-400 shrink-0 group-hover/doc:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-6" />
      </div>

      {/* Composer */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-2 bg-[#0c0c0f] shrink-0">

        {/* Error */}
        {error && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            {error}
            <button onClick={() => setError('')} className="ml-auto text-rose-400/60 hover:text-rose-300">✕</button>
          </div>
        )}

        <form onSubmit={handleSend}
          className="relative flex flex-col bg-[#111114] border border-white/[0.08] rounded-xl transition-all focus-within:border-brand-500/50 focus-within:bg-[#141418]">

          {/* Staged file previews */}
          {stagedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {stagedFiles.map(({ file, preview }, i) => (
                <div key={i}
                  className="relative flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden"
                  style={{ maxWidth: '200px' }}>
                  {preview ? (
                    <img src={preview} alt={file.name}
                      className="w-12 h-12 object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-white/[0.04] shrink-0">
                      <FileTypeIcon name={file.name} className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 pr-6 py-1">
                    <p className={`text-[10px] font-medium truncate ${fileColor(file.name)}`}>
                      {file.name}
                    </p>
                    <p className="text-[9px] text-zinc-400 mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeStaged(i)}
                    className="absolute right-1.5 top-1.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/80 transition-colors text-[10px] leading-none">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={composerRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${board?.title?.replace(/\s+/g, '-').toLowerCase() || 'general'}`}
            className="w-full max-h-48 min-h-[44px] bg-transparent text-[13px] text-zinc-100 placeholder-zinc-500 outline-none resize-none px-4 pt-3 pb-1"
            rows={1}
          />

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.zip,.pptx"
            onChange={e => {
              if (e.target.files) stageFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {/* Upload progress bar */}
          {uploading && uploadProgress > 0 && (
            <div className="mx-3 mb-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between px-3 pb-3 mt-1">
            <div className="flex items-center gap-1">
              {/* Attachment button */}
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 rounded-lg active:scale-95 text-[11px]"
                title="Attach files (images, PDFs, docs)">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {stagedFiles.length > 0 && (
                  <span className="font-medium text-brand-400">{stagedFiles.length}</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {uploading && (
                <span className="text-[10px] text-zinc-400 font-medium">
                  {uploadProgress < 100 ? `Uploading ${uploadProgress}%…` : 'Processing…'}
                </span>
              )}
              <button
                type="submit"
                disabled={(!text.trim() && stagedFiles.length === 0) || uploading}
                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold text-[11px] hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5"
              >
                {uploading ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>
                    Send
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <p className="hidden sm:block text-[10px] text-zinc-500 mt-1.5 px-1">
          Attach up to 5 files · 10 MB each · Images, PDFs, Docs · Press <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}
