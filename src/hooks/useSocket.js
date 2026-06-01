import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Shared Socket.IO hook — reusable across LecturerDashboard, ClassroomWorkspace, etc.
 * Handles connect, join-room, reconnect, and cleanup on unmount/roomId change.
 * 
 * Security: Sends JWT auth token with every Socket.io connection for server-side
 * authentication (see services/socket.service.js middleware).
 * 
 * @param {string} apiUrl - Backend URL (e.g. 'http://localhost:3000')
 * @param {string|null} roomId - Room UUID to join. Pass null to skip connection.
 * @returns {{ socket: Socket|null, isConnected: boolean, onlineCount: number }}
 */
export default function useSocket(apiUrl, roomId) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!apiUrl || !roomId) return;

    const token = localStorage.getItem('auth_token');
    
    const sock = io(apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      auth: { token }, // Send JWT token for Socket.io authentication
    });

    socketRef.current = sock;
    setSocket(sock);

    sock.on('connect', () => {
      setIsConnected(true);
      sock.emit('join-room', roomId);
    });

    sock.on('connect_error', (err) => {
      console.error('🔌 Socket Connect Error:', err.message);
      setIsConnected(false);
      
      // If auth error, don't retry — token is invalid
      if (err.message?.includes('Authentication') || err.message?.includes('token')) {
        console.warn('🔑 Socket auth failed — check auth_token in localStorage');
        sock.disconnect();
      }
    });

    sock.on('disconnect', (reason) => {
      console.log('🔌 Socket Disconnected:', reason);
      setIsConnected(false);
    });

    sock.on('room:online-count', (count) => {
      setOnlineCount(count);
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineCount(0);
    };
  }, [apiUrl, roomId]);

  return { socket, isConnected, onlineCount };
}
