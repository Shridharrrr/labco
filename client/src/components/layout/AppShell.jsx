import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import * as boardService from '../../services/boardService';

// Simple event bus so child pages can notify AppShell to refresh boards
const boardListeners = new Set();
export const notifyBoardCreated = (board) => boardListeners.forEach((fn) => fn(board));

/**
 * AppShell - persistent layout shell with sidebar.
 * Fetches boards once and passes them down to the Sidebar.
 * Child pages can call notifyBoardCreated(board) to push a new board
 * into the sidebar without a full refetch.
 */
export default function AppShell({ children }) {
  const [boards, setBoards] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    boardService.getBoards()
      .then(({ data }) => setBoards(data))
      .catch(() => {});
  }, []);

  // Register listener so Home.jsx can push new boards here
  const handleNewBoard = useCallback((board) => {
    setBoards((prev) => {
      // Avoid duplicates
      if (prev.find((b) => b._id === board._id)) return prev;
      return [...prev, board];
    });
  }, []);

  useEffect(() => {
    boardListeners.add(handleNewBoard);
    return () => boardListeners.delete(handleNewBoard);
  }, [handleNewBoard]);

  return (
    <div className="flex h-screen bg-[#f8f9fb] dark:bg-[#07080b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors">
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
