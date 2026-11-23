import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import api from '../../services/api';
import { getSocket } from '../../hooks/useSocket';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { isImage, FileTypeIcon, formatBytes, fileColor } from '../../utils/fileHelpers';
import { parseSafeMarkdown } from '../../utils/sanitize';

export default function DiscussionTab({ boardId }) {
  const { user } = useAuthStore();
  const { board } = useBoardStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]       = useState('');
  const messagesEndRef = useRef(null);
  const composerRef    = useRef(null);
  const fileInputRef   = useRef(null);

  const renderMarkdown = (msgText) => {
    if (!msgText) return null;
    return <span dangerouslySetInnerHTML={{ __html: parseSafeMarkdown(msgText, { inlineOnly: true }) }} />;
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
    const handler = ({ message }) => {
      setMessages(prev => prev.find(m => m._id === message._id) ? prev : [...prev, message]);
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  const dateStr  = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#08090d] overflow-hidden">

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-[#0a0b10] shrink-0 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span># discussion</span>
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Team channel for <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{board?.title}</strong>
          </p>
        </div>
        <div className="flex -space-x-1.5">
          {board?.members?.slice(0, 5).map(m => (
            <div key={m.user._id} className="w-6 h-6 rounded-md border border-white dark:border-[#0a0b10]" title={m.user.name || m.user.email}>
              <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="2xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto pt-4 pb-2 relative">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 text-xs gap-2">
            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>No discussions yet.</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.user._id === (user?.userId || user?._id);
            const prevMsg = messages[i - 1];
            const isGrouped = prevMsg &&
              prevMsg.user._id === msg.user._id &&
              (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 5 * 60000;
            const showDate = !prevMsg ||
              new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="flex items-center gap-4 my-4 px-4 sm:px-6">
                    <div className="flex-1 border-b border-black/[0.06] dark:border-white/[0.06]" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                      {dateStr(msg.createdAt)}
                    </span>
                    <div className="flex-1 border-b border-black/[0.06] dark:border-white/[0.06]" />
                  </div>
                )}

                <div className={`group flex gap-2.5 sm:gap-3 px-4 sm:px-6 py-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors relative ${isGrouped ? 'mt-0' : 'mt-3'}`}>

                  {/* Actions */}
                  <div className="absolute right-4 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#15161c] border border-black/10 dark:border-white/[0.08] rounded shadow-xs flex items-center z-10">
                    <button onClick={() => handleReply(msg.user)}
                      className="p-1 text-zinc-400 hover:text-black dark:hover:text-white rounded transition-colors cursor-pointer" title="Reply">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    {msg.text && (
                      <button onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="p-1 text-zinc-400 hover:text-black dark:hover:text-white rounded transition-colors cursor-pointer" title="Copy text">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Avatar */}
                  {!isGrouped ? (
                    <div className="shrink-0 mt-0.5">
                      <Avatar name={msg.user.name || msg.user.email} src={msg.user.avatar} size="xs" />
                    </div>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}

                  {/* Content */}
                  <div className="flex flex-col flex-1 min-w-0 pb-1">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${isMe ? 'text-zinc-950 dark:text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {msg.user.name || msg.user.email?.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">{timeStr(msg.createdAt)}</span>
                      </div>
                    )}

                    {msg.text && (
                      <div className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 break-words whitespace-pre-wrap">
                        {renderMarkdown(msg.text)}
                      </div>
                    )}

                    {/* Attachments */}
                    {msg.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {msg.attachments.map((att, idx) => (
                          isImage(att.filename) ? (
                            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all">
                              <img src={att.url} alt={att.filename}
                                className="max-w-[240px] max-h-[160px] object-cover" />
                            </a>
                          ) : (
                            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2.5 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] border border-black/10 dark:border-white/[0.08] rounded-md px-2.5 py-2 transition-all max-w-[240px]">
                              <FileTypeIcon name={att.filename} className="w-5 h-5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                  {att.filename}
                                </p>
                              </div>
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
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Composer */}
      <div className="px-4 sm:px-6 pb-4 pt-2 bg-transparent shrink-0">
        {error && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[11px] text-rose-500">
            {typeof error === 'string' ? error : (error?.message || JSON.stringify(error || ''))}
            <button onClick={() => setError('')} className="ml-auto text-rose-500/60 hover:text-rose-500">✕</button>
          </div>
        )}

        <form onSubmit={handleSend}
          className="relative flex flex-col bg-white dark:bg-[#0c0d12] border border-black/[0.08] dark:border-white/[0.08] rounded-lg transition-all focus-within:border-black/20 dark:focus-within:border-white/20">

          {/* Staged file previews */}
          {stagedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-2.5">
              {stagedFiles.map(({ file, preview }, i) => (
                <div key={i}
                  className="relative flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded px-2 py-1 max-w-[180px]">
                  {preview ? (
                    <img src={preview} alt={file.name} className="w-8 h-8 object-cover rounded-xs shrink-0" />
                  ) : (
                    <FileTypeIcon name={file.name} className="w-4 h-4 shrink-0" />
                  )}
                  <div className="min-w-0 pr-4">
                    <p className={`text-[10px] font-medium truncate ${fileColor(file.name)}`}>
                      {file.name}
                    </p>
                    <p className="text-[9px] text-zinc-400">{formatBytes(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeStaged(i)}
                    className="absolute right-1 top-1 text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer text-[10px]">
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
            className="w-full max-h-40 min-h-[40px] bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none px-3.5 pt-2.5 pb-1"
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

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="p-1 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors cursor-pointer"
              title="Attach files">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              {uploading && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {uploadProgress < 100 ? `${uploadProgress}%` : 'Processing...'}
                </span>
              )}
              <button
                type="submit"
                disabled={(!text.trim() && stagedFiles.length === 0) || uploading}
                className="px-3 py-1 rounded bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs hover:opacity-90 disabled:opacity-30 cursor-pointer transition-all"
              >
                {uploading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
