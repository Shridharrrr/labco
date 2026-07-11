import { useState, useEffect } from 'react';
import useBoardStore from '../../store/boardSlice';
import useAuthStore from '../../store/authSlice';
import * as boardService from '../../services/boardService';
import Spinner from '../ui/Spinner';

export default function OverviewTab({ boardId }) {
  const { board, cards, columns } = useBoardStore();
  const { user } = useAuthStore();

  const [description, setDescription] = useState(board?.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editMode, setEditMode] = useState('write'); // 'write' | 'preview'
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

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

  // Compute progress: cards in 'final' type column(s) vs total
  const finalColumns = columns ? Object.values(columns).filter(c => c.columnType === 'final') : [];
  const doneColumn = finalColumns.length > 0
    ? finalColumns[0]
    : (columns ? Object.values(columns).find(c => c.title?.toLowerCase().includes('done')) : null);
  const allActiveCards = cards ? Object.values(cards).filter(c => !c.isArchived) : [];
  const totalCardsCount = allActiveCards.length;
  const doneCardsCount = finalColumns.length > 0
    ? finalColumns.reduce((sum, col) => sum + (col.cards?.length || 0), 0)
    : (doneColumn ? doneColumn.cards.length : 0);
  const progressPercent = totalCardsCount === 0 ? 0 : Math.round((doneCardsCount / totalCardsCount) * 100);

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
    <div className="flex-1 overflow-y-auto p-6 flex justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Board Description */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.12em]">Board README</h2>
              {!isEditingDesc ? (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors border border-white/[0.06]"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="flex bg-black/40 rounded p-1 mr-2">
                    <button
                      onClick={() => setEditMode('write')}
                      className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${editMode === 'write' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                    >
                      Write
                    </button>
                    <button
                      onClick={() => setEditMode('preview')}
                      className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${editMode === 'preview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                    >
                      Preview
                    </button>
                  </div>
                  <button
                    onClick={() => { setIsEditingDesc(false); setDescription(board.description || ''); setEditMode('write'); }}
                    className="px-2.5 py-1.5 rounded-md text-[11px] font-medium text-white/45 hover:text-white transition-colors hover:bg-white/5"
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
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a description, board goals, or helpful links here... (Markdown supported)"
                  className="w-full h-48 bg-black/20 border border-white/[0.08] rounded-lg p-4 text-sm text-white/85 placeholder-white/25 outline-none focus:border-brand-500/40 focus:bg-white/[0.02] transition-colors resize-y font-mono"
                />
              ) : (
                <div 
                  className="w-full min-h-[12rem] bg-[#09090b] border border-white/[0.04] rounded-lg p-4 text-sm text-white/70 leading-relaxed overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: description ? parseMarkdown(description) : '<span class="italic opacity-50">Nothing to preview</span>' }}
                />
              )
            ) : (
              <div 
                className="min-h-[8rem] text-sm text-white/70 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: board?.description ? parseMarkdown(board.description) : '<span class="italic opacity-50">No description provided. Click Edit to add one.</span>' }}
              />
            )}
          </section>

          {/* My Tasks */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.12em] mb-3">My Pending Tasks</h2>
            {myCards.length === 0 ? (
              <div className="text-center py-6 text-white/25 text-xs border border-dashed border-white/[0.08] rounded-lg">
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
                          <p className="text-[11px] text-white/40 mt-0.5">In {col?.title || 'Unknown Column'}</p>
                        </div>
                      </div>
                      {card.dueDate && (
                        <div className="text-[11px] font-medium px-2 py-1 rounded-md bg-white/5 text-white/50">
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

          {/* Progress Widget */}
          <section className="bg-gradient-to-b from-brand-900/15 to-transparent border border-brand-500/15 rounded-lg p-5 relative overflow-hidden">
            <h2 className="text-[11px] font-bold text-brand-400 uppercase tracking-widest mb-1 relative z-10">Board Progress</h2>
            <div className="flex items-end gap-2 mb-4 relative z-10">
              <span className="text-4xl font-black text-white tracking-tighter">{progressPercent}%</span>
              <span className="text-sm text-white/40 mb-1.5">completed</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2.5 relative z-10 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-brand-600 to-brand-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-white/40 mt-3 relative z-10">
              {doneCardsCount} of {totalCardsCount} cards{doneColumn ? ` in "${doneColumn.title}"` : ''}
            </p>
          </section>

          {/* Members Summary */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4">Team Members ({board?.members?.length || 0})</h2>
            <div className="flex flex-wrap gap-2">
              {board?.members?.map((m) => (
                <div
                  key={m.user._id}
                  title={`${m.user.name || m.user.email} (${m.role})`}
                  className="w-7 h-7 rounded-md border border-[#0c0c0f] flex items-center justify-center text-[10px] font-bold uppercase"
                  style={{ background: `hsl(${(m.user.name?.charCodeAt(0) || 200) * 5 % 360}, 55%, 32%)`, color: '#fff' }}
                >
                  {(m.user.name || m.user.email)?.[0]}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
