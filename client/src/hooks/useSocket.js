import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authSlice';

let socketInstance = null;

const useSocket = () => {
  const { accessToken } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: accessToken },
        autoConnect: true,
        reconnectionAttempts: 5,
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on unmount - keep single instance alive
    };
  }, [accessToken]);

  return socketRef.current;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export default useSocket;
