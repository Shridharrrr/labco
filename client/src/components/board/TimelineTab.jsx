import { useMemo, useState } from 'react';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';

export default function TimelineTab() {
  const { cards, columns, columnOrder } = useBoardStore();
  const { openCard } = useUIStore();

  // Settings
  const [zoom, setZoom] = useState(1); // 1 = days, 2 = weeks (stub)
  const cellWidth = 40 * zoom; // px per day

  const timelineCards = useMemo(() => {
    return Object.values(cards).filter(c => !c.isArchived && c.dueDate);
  }, [cards]);

  // Compute timeline boundaries
  const { minDate, maxDate } = useMemo(() => {
    let allDates = [];
    timelineCards.forEach(c => {
      if (c.createdAt) allDates.push(new Date(c.createdAt).getTime());
      if (c.dueDate) allDates.push(new Date(c.dueDate).getTime());
    });
    const validDates = allDates.filter(t => !isNaN(t));

    if (validDates.length === 0) {
      const today = new Date();
      return { minDate: today, maxDate: new Date(today.getTime() + 14 * 86400000) };
    }
    
    const min = new Date(Math.min(...validDates) - 7 * 86400000);
    const max = new Date(Math.max(...validDates) + 14 * 86400000);
    return { minDate: min, maxDate: max };
  }, [timelineCards]);

  const days = useMemo(() => {
    const d = [];
    let current = new Date(minDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(maxDate);
    end.setHours(0, 0, 0, 0);
    while (current <= end) {
      d.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return d;
  }, [minDate, maxDate]);

  const getPosition = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    const diffTime = date - min;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * cellWidth;
  };

  const todayPos = getPosition(new Date().toISOString());

  return (
    <div className="flex-1 flex flex-col bg-[#0c0c0f] overflow-hidden">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] shrink-0">
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">Board Timeline</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Cards with Due Dates</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          </button>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </button>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 overflow-auto relative">
        
        {/* Timeline Header */}
        <div className="sticky top-0 z-20 flex bg-[#111114] border-b border-white/[0.06] shadow-sm">
          <div className="w-64 shrink-0 border-r border-white/[0.06] bg-[#111114] p-3 sticky left-0 z-30 flex items-end">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Board Columns</span>
          </div>
          <div className="flex relative min-w-max">
            {days.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const isFirstOfMonth = d.getDate() === 1;
              return (
                <div key={i} className="shrink-0 flex flex-col items-center justify-end pb-2 border-r border-white/[0.05]" style={{ width: cellWidth }}>
                  {isFirstOfMonth && <span className="text-[10px] font-bold text-white/50 mb-1 absolute top-1 -ml-10">{d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                  <span className={`text-[10px] ${isToday ? 'bg-brand-500 text-white px-1.5 py-0.5 rounded font-bold' : 'text-white/40 font-medium'}`}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
            
            {/* Today Line Indicator */}
            <div className="absolute top-0 bottom-0 border-l-2 border-brand-500 z-10" style={{ left: todayPos + cellWidth/2 }} />
          </div>
        </div>

        {/* Timeline Rows */}
        <div className="relative">
          {/* Background grid */}
          <div className="absolute top-0 bottom-0 left-64 right-0 flex pointer-events-none opacity-50 z-0 min-w-max">
            {days.map((d, i) => (
              <div key={i} className="shrink-0 border-r border-white/[0.05]" style={{ width: cellWidth }} />
            ))}
          </div>
          
          {/* Today Line Indicator (Body) */}
          <div className="absolute top-0 bottom-0 border-l-2 border-brand-500/20 z-0" style={{ left: 256 + todayPos + cellWidth/2 }} />

          {/* Rows grouped by column */}
          {columnOrder.map((colId) => {
            const col = columns[colId];
            if (!col) return null;
            const colCards = col.cards.map(id => cards[id]).filter(c => c && !c.isArchived && c.dueDate);
            
            return (
              <div key={colId} className="flex border-b border-white/[0.04] group/row hover:bg-white/[0.01] transition-colors relative z-10">
                
                {/* Column Name */}
                <div className="w-64 shrink-0 border-r border-white/[0.06] p-4 sticky left-0 z-20 bg-[#0c0c0f] group-hover/row:bg-[#111114] transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: col.color || '#6366f1' }} />
                    <span className="text-[12px] font-bold text-white/80 truncate">{col.title}</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-medium px-1.5 py-0.5 rounded-md bg-white/5">{colCards.length}</span>
                </div>

                {/* Card Tracks */}
                <div className="flex-1 relative min-h-[60px] py-3">
                  {colCards.map((card, idx) => {
                    const startPos = getPosition(card.createdAt || new Date().toISOString());
                    const endPos = getPosition(card.dueDate);
                    const left = Math.min(startPos, endPos);
                    const right = Math.max(startPos, endPos) + cellWidth;
                    const width = Math.max(right - left, cellWidth);
                    
                    return (
                      <div
                        key={card._id}
                        onClick={() => openCard(card._id)}
                        className="absolute h-8 rounded-lg cursor-pointer flex items-center px-3 overflow-hidden shadow-sm hover:shadow-md hover:brightness-110 transition-all border border-black/20"
                        style={{ 
                          left: `${Math.max(0, left)}px`, 
                          width: `${width}px`,
                          top: `${(idx * 44) + 12}px`,
                          background: card.coverColor || col.color || '#374151',
                        }}
                        title={`${card.title}\nCreated: ${new Date(card.createdAt || Date.now()).toLocaleDateString()}\nDue: ${new Date(card.dueDate).toLocaleDateString()}`}
                      >
                        <span className="text-[11px] font-semibold text-white truncate drop-shadow-md">{card.title}</span>
                      </div>
                    );
                  })}
                  {/* Dynamic row height spacer based on card count */}
                  <div style={{ height: `${Math.max(60, colCards.length * 44 + 24)}px` }} />
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
