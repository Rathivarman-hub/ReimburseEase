import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch (error) {
          console.error('Auth error', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      newSocket.emit('join', user._id);
      
      newSocket.on('new_expense', (data) => {
        setNotifications((prev) => [...prev, { type: 'new_expense', data }]);
      });
      
      newSocket.on('approval_request', (data) => {
        setNotifications((prev) => [...prev, { type: 'approval_request', data }]);
      });
      
      newSocket.on('expense_update', (data) => {
        setNotifications((prev) => [...prev, { type: 'expense_update', data }]);
      });

      return () => newSocket.disconnect();
    }
  }, [user]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const clearNotification = (index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, notifications, clearNotification }}>
      {children}
    </AuthContext.Provider>
  );
};
