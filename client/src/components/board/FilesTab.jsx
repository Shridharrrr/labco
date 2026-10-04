import { useMemo, useEffect, useState } from 'react';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import api from '../../services/api';

export default function FilesTab() {
  const { board, cards } = useBoardStore();
  const { openCard } = useUIStore();
  const [messageFiles, setMessageFiles] = useState([]);
  const [messageLinks, setMessageLinks] = useState([]);

  // URL extraction regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  useEffect(() => {
    if (!board?._id) return;
    api.get(`/boards/${board._id}/messages?limit=200`)
      .then(({ data }) => {
        const files = [];
        const links = [];
        data.forEach(msg => {
          const userName = msg.user?.name || msg.user?.email?.split('@')[0];
          
          // Extract attachments
          if (msg.attachments?.length > 0) {
            msg.attachments.forEach(att => {
              files.push({
                ...att,
                source: 'message',
                messageText: msg.text,
                userName,
              });
            });
          }

          // Extract links from text
          if (msg.text) {
            let match;
            while ((match = urlRegex.exec(msg.text)) !== null) {
              links.push({
                url: match[1],
                source: 'message',
                userName,
                createdAt: msg.createdAt,
              });
            }
          }
        });
        setMessageFiles(files);
        setMessageLinks(links);
      })
      .catch(() => {});
  }, [board?._id]);

  // Extract from cards
  const cardData = useMemo(() => {
    const files = [];
    const links = [];
    Object.values(cards).forEach(card => {
      if (card.isArchived) return;
      
      // Attachments
      if (card.attachments && card.attachments.length > 0) {
        card.attachments.forEach(att => {
          files.push({
            ...att,
            source: 'card',
            cardId: card._id,
            cardTitle: card.title
          });
        });
      }

      // Links from description
      if (card.description) {
        let match;
        while ((match = urlRegex.exec(card.description)) !== null) {
          // Avoid matching markdown image/link syntax fully, just get the URL
          let url = match[1];
          if (url.endsWith(')')) url = url.slice(0, -1);
          links.push({
            url,
            source: 'card',
            cardId: card._id,
            cardTitle: card.title,
            createdAt: card.updatedAt || card.createdAt,
          });
        }
      }
    });
    return { files, links };
  }, [cards]);

  const allFiles = useMemo(() => {
    return [...messageFiles, ...cardData.files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [messageFiles, cardData.files]);

  const allLinks = useMemo(() => {
    // deduplicate links by URL
    const unique = [];
    const seen = new Set();
    [...messageLinks, ...cardData.links]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach(link => {
        if (!seen.has(link.url)) {
          seen.add(link.url);
          unique.push(link);
        }
      });
    return unique;
  }, [messageLinks, cardData.links]);

  const isMedia = (url = '') => url.match(/\.(jpeg|jpg|gif|png|webp|svg|mp4|webm|ogg|mp3|wav)($|\?)/i);
  
  const mediaFiles = allFiles.filter(f => isMedia(f.url));
  const docFiles = allFiles.filter(f => !isMedia(f.url));

  const renderFileCard = (file, i) => (
    <div key={i} className="group flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden hover:bg-white/[0.04] transition-all hover:border-white/[0.12]">
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="aspect-square bg-black/20 flex items-center justify-center relative overflow-hidden group-hover:bg-black/40 transition-colors">
        {isMedia(file.url) ? (
          <img src={file.url} alt={file.filename} className="object-cover w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
        ) : (
          <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 rounded-md bg-brand-600 text-white flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </div>
        </div>
      </a>
      <div className="p-3 flex flex-col gap-1 border-t border-white/[0.04]">
        <p className="text-[11px] font-medium text-white/90 truncate" title={file.filename}>
          {file.filename}
        </p>
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
          {file.source === 'card' ? (
            <button onClick={() => openCard(file.cardId)} className="hover:text-brand-400 transition-colors truncate max-w-[50%]" title={`Go to card: ${file.cardTitle}`}>
              {file.cardTitle}
            </button>
          ) : (
            <span className="truncate max-w-[50%]" title={`From ${file.userName} in discussions`}>
              By {file.userName}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5">
      <div className="w-full px-2 sm:px-5 py-2 max-w-7xl mx-auto space-y-8 sm:space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Board Files & Links</h1>
          <p className="text-xs text-zinc-400 mt-1">
            All media, documents, and links shared in this board
          </p>
        </div>

        {allFiles.length === 0 && allLinks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 text-xs gap-3 border border-dashed border-white/[0.08] rounded-lg bg-white/[0.01]">
            <svg className="w-12 h-12 opacity-40 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>No files or links shared yet.</span>
          </div>
        )}

        {/* Media Section */}
        {mediaFiles.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Media
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaFiles.map(renderFileCard)}
            </div>
          </section>
        )}

        {/* Documents Section */}
        {docFiles.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h1.01M9 13h6m-6 4h6" />
              </svg>
              Documents
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {docFiles.map(renderFileCard)}
            </div>
          </section>
        )}

        {/* Links Section */}
        {allLinks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allLinks.map((link, i) => {
                const domain = new URL(link.url).hostname.replace('www.', '');
                return (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-center p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
                    <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center shrink-0 mr-3">
                      <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt={domain} className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-white/90 truncate group-hover:text-brand-400 transition-colors">
                        {link.url}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                        <span className="truncate">{domain}</span>
                        {link.source === 'card' ? (
                          <span className="truncate max-w-[50%]" title={`Found in card: ${link.cardTitle}`}>
                            Card: {link.cardTitle}
                          </span>
                        ) : (
                          <span className="truncate max-w-[50%]" title={`Shared by ${link.userName}`}>
                            By {link.userName}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
