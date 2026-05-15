import { useMemo } from 'react';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';

export default function FilesTab() {
  const { cards } = useBoardStore();
  const { openCard } = useUIStore();

  const allFiles = useMemo(() => {
    const files = [];
    Object.values(cards).forEach(card => {
      if (card.isArchived) return;
      if (card.attachments && card.attachments.length > 0) {
        card.attachments.forEach(att => {
          files.push({
            ...att,
            cardId: card._id,
            cardTitle: card.title
          });
        });
      }
    });
    // Sort by newest first
    return files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [cards]);

  const isImage = (url) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex justify-center">
      <div className="max-w-5xl w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Project Files</h1>
            <p className="text-xs text-white/40 mt-1">
              All files attached to cards in this board ({allFiles.length})
            </p>
          </div>
        </div>

        {allFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20 text-sm gap-3 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>No files uploaded yet. Add files to cards to see them here!</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allFiles.map((file, i) => (
              <div key={i} className="group flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:bg-white/[0.04] transition-all hover:border-white/[0.12] shadow-sm hover:shadow-lg">
                
                {/* Preview Thumbnail */}
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="aspect-square bg-black/20 flex items-center justify-center relative overflow-hidden group-hover:bg-black/40 transition-colors">
                  {isImage(file.url) ? (
                    <img src={file.url} alt={file.filename} className="object-cover w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                  ) : (
                    <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  )}
                  {/* Download overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                  </div>
                </a>

                {/* Details */}
                <div className="p-3 flex flex-col gap-1 border-t border-white/[0.04]">
                  <p className="text-[11px] font-medium text-white/90 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-white/40">
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    <button 
                      onClick={() => openCard(file.cardId)}
                      className="hover:text-brand-400 transition-colors truncate max-w-[50%]"
                      title={`Go to card: ${file.cardTitle}`}
                    >
                      {file.cardTitle}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
