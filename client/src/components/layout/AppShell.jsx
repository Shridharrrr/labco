import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import * as boardService from '../../services/boardService';

/**
 * AppShell — persistent layout shell with sidebar.
 * Fetches boards once and passes them down to both the Sidebar
 * and the page content (via React context-like prop drilling).
 */
export default function AppShell({ children }) {
  const [boards, setBoards] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    boardService.getBoards()
      .then(({ data }) => setBoards(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden">
      <Sidebar
        boards={boards}
        setBoards={setBoards}
        creating={creating}
        setCreating={setCreating}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
