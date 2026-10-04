import { useState, useEffect, useRef } from 'react';
import useBoardStore from '../../store/boardSlice';
import useAuthStore from '../../store/authSlice';
import * as boardService from '../../services/boardService';
import Spinner from '../ui/Spinner';
import Avatar from '../ui/Avatar';

export default function OverviewTab({ boardId }) {
  const { board, cards, columns } = useBoardStore();
  const { user } = useAuthStore();

  const [description, setDescription] = useState(board?.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editMode, setEditMode] = useState('write'); // 'write' | 'preview'
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const textareaRef = useRef(null);

  const insertMarkdown = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    let prefix = '';
    let suffix = '';
    let defaultVal = '';

    switch (type) {
      case 'heading':
        prefix = '### ';
        defaultVal = 'Heading';
        break;
      case 'bold':
        prefix = '**';
        suffix = '**';
        defaultVal = 'bold text';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        defaultVal = 'italic text';
        break;
      case 'quote':
        prefix = '> ';
        defaultVal = 'Quote';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        defaultVal = 'code';
        break;
      case 'link':
        prefix = '[';
        suffix = '](url)';
        defaultVal = 'link text';
        break;
      case 'ordered':
        prefix = '1. ';
        defaultVal = 'List item';
        break;
      case 'unordered':
        prefix = '- ';
        defaultVal = 'List item';
        break;
      case 'checklist':
        prefix = '- [ ] ';
        defaultVal = 'Task item';
        break;
      default:
        break;
    }

    const insertedText = prefix + (selectedText || defaultVal) + suffix;
    const newText = currentText.substring(0, start) + insertedText + currentText.substring(end);

    setDescription(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText || defaultVal).length
      );
    }, 0);
  };

  // Sync internal state if board updates
  useEffect(() => {
    if (board && !isEditingDesc) {
      setDescription(board.description || '');
    }
  }, [board, isEditingDesc]);

  // Load activities
  useEffect(() => {
    boardService.getActivity(boardId, { limit: 10 })
      .then(({ data }) => {
        // Handle both { activities: [] } and [ ] structures
        const list = data.activities || data.activity || (Array.isArray(data) ? data : []);
        setActivities(list);
      })
      .catch(() => { })
      .finally(() => setLoadingActivities(false));
  }, [boardId]);

  const handleSaveDescription = async () => {
    try {
      setIsEditingDesc(false);
      useBoardStore.getState().updateBoardInfo({ description });
      await boardService.updateBoard(boardId, { description });
    } catch {
      // Ignore
    }
  };

  // Compute my tasks
  const myCards = Object.values(cards).filter(
    (c) => !c.isArchived && c.assignees?.some((a) => (a._id || a) === (user?._id || user?.userId))
  ).sort((a, b) => new Date(a.dueDate || '2099') - new Date(b.dueDate || '2099'));

  // Progress calculation removed

  const parseMarkdown = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-black/40 p-3 rounded-md my-3 overflow-x-auto font-mono text-xs"><code>$1</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-brand-300 font-mono text-[11px]">$1</code>');
    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-4 mb-2 text-white/90">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold mt-5 mb-2 text-white border-b border-white/10 pb-1.5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-6 mb-3 text-white border-b border-white/10 pb-2">$1</h1>');
    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white/90">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-brand-400 hover:underline">$1</a>');
    // Unordered Lists
    html = html.replace(/^\s*[-*+] (.*$)/gim, '<li class="ml-5 list-disc marker:text-white/30">$1</li>');
    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-brand-500/50 pl-3 py-0.5 my-2 text-white/60 bg-brand-500/5 rounded-r">$1</blockquote>');

    // Wrap list items in ul
    html = html.replace(/(<li class="ml-5 list-disc marker:text-white\/30">.*?<\/li>(?:\s*<br\s*\/?>|\n)*)+/g, match => `<ul class="my-2 space-y-1">${match}</ul>`);

    // Paragraphs / Line breaks
    html = html.split(/\n\n+/).map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<ul') || p.trim().startsWith('<blockquote')) return p;
      return `<p class="mb-3">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5">
      <div className="w-full px-1 sm:px-4 py-1 sm:py-2 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Board Description */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em]">Board README</h2>
              {!isEditingDesc ? (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 active:scale-95"
                >
                  Edit
                </button>
              ) : (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                  <div className="flex bg-black/40 rounded p-1 mr-1 sm:mr-2">
                    <button
                      onClick={() => setEditMode('write')}
                      className={`px-2.5 sm:px-3 py-1 rounded text-[11px] font-medium transition-colors ${editMode === 'write' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Write
                    </button>
                    <button
                      onClick={() => setEditMode('preview')}
                      className={`px-2.5 sm:px-3 py-1 rounded text-[11px] font-medium transition-colors ${editMode === 'preview' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Preview
                    </button>
                  </div>
                  <button
                    onClick={() => { setIsEditingDesc(false); setDescription(board.description || ''); setEditMode('write'); }}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-sm"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {isEditingDesc ? (
              editMode === 'write' ? (
                <div className="flex flex-col border border-white/[0.08] bg-black/25 rounded-lg overflow-hidden focus-within:border-brand-500/50 focus-within:bg-white/[0.01] transition-all duration-200">
                  {/* Toolbar */}
                  <div className="flex items-center flex-wrap gap-1 sm:gap-2 px-2 py-2 border-b border-white/[0.06] bg-[#0c0c0f]/50 select-none">
                    <button type="button" onClick={() => insertMarkdown('heading')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Heading">
                      <span className="font-semibold text-[15px] leading-none text-zinc-400 group-hover:text-white transition-colors flex items-center justify-center w-4 h-4">H</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('bold')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Bold">
                      <span className="font-bold text-[14px] leading-none text-zinc-400 group-hover:text-white transition-colors flex items-center justify-center w-4 h-4">B</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('italic')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Italic">
                      <span className="italic font-serif text-[15px] leading-none text-zinc-400 group-hover:text-white transition-colors flex items-center justify-center w-4 h-4">I</span>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('quote')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Quote">
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16M10 8h8M10 12h6M10 16h8" /></svg>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('code')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Code">
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" /></svg>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('link')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Link">
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    </button>

                    <div className="w-px h-5 bg-white/[0.08] mx-2" />

                    <button type="button" onClick={() => insertMarkdown('ordered')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Numbered List">
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6h10M10 12h10M10 18h10M5 6v4m-1-4h2M5 14h-1v1.5c0 .3.2.5.5.5h1" /></svg>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('unordered')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Bulleted List">
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01" /></svg>
                    </button>
                    <button type="button" onClick={() => insertMarkdown('checklist')} className="group p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200" title="Checklist">
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h11M9 12h11M9 18h11" />
                        <rect x="3.5" y="4.5" width="3" height="3" rx="0.5" />
                        <rect x="3.5" y="10.5" width="3" height="3" rx="0.5" />
                        <rect x="3.5" y="16.5" width="3" height="3" rx="0.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5l1 1 2-2" />
                      </svg>
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a description, board goals, or helpful links here... (Markdown supported)"
                    className="w-full h-48 bg-transparent p-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-y font-mono"
                  />
                </div>
              ) : (
                <div
                  className="w-full min-h-[12rem] bg-[#09090b] border border-white/[0.06] rounded-lg p-4 text-sm text-zinc-200 leading-relaxed overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: description ? parseMarkdown(description) : '<span class="italic text-zinc-500">Nothing to preview</span>' }}
                />
              )
            ) : (
              <div
                className="min-h-[8rem] text-sm text-zinc-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: board?.description ? parseMarkdown(board.description) : '<span class="italic text-zinc-500">No description provided. Click Edit to add one.</span>' }}
              />
            )}
          </section>

          {/* My Tasks */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-[0.12em] mb-3">My Pending Tasks</h2>
            {myCards.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-white/[0.08] rounded-lg">
                You have no tasks assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {myCards.map(card => {
                  const col = columns[card.column];
                  return (
                    <div key={card._id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-sm" style={{ background: card.coverColor || '#4b5563' }} />
                        <div>
                          <p className="text-sm font-medium text-white/90">{card.title}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">In {col?.title || 'Unknown Column'}</p>
                        </div>
                      </div>
                      {card.dueDate && (
                        <div className="text-[11px] font-medium px-2 py-1 rounded-md bg-white/5 text-zinc-300">
                          Due {new Date(card.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-8">



          {/* Members Summary */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-4">Team Members ({board?.members?.length || 0})</h2>
            <div className="flex flex-wrap gap-2">
              {board?.members?.map((m) => (
                <div key={m.user._id} title={`${m.user.name || m.user.email} (${m.role})`} className="w-7 h-7 rounded-md border border-[#0c0c0f]">
                  <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="sm" />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
