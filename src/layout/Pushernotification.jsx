import React, { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/ui/avatar/Avatar';
import defaultAvatar from '../assets/imagewall.png';

const PusherNotification = () => {
  const accessToken = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('user');
  const userObj = userData ? JSON.parse(userData) : null;
  const userId = userObj?.id ?? null;

  const [toasts, setToasts] = useState([]);

  const addToast = (notif) => {
    setToasts((prev) => [...prev, notif]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 10000);
  };

  useEffect(() => {
    if (!accessToken || !userId) return;
    Pusher.logToConsole = true;
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      forceTLS: true,
      authEndpoint: `${import.meta.env.VITE_BACKEND_URL}/api/pusher/auth/`,
      auth: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    pusher.connection.bind('error', err => {
      console.error('[PUSHER] connection error', err);
    });
    const channel = pusher.subscribe(`private-notifications2-${userId}`);
    channel.bind('new-notification', data => {
      addToast(data);
    });
    channel.bind('pusher:subscription_error', status => {
      console.error('[PUSHER] subscription error', status);
    });
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [accessToken, userId]);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
      {toasts.map((notif) => {
        return (
          <div
            key={notif.id}
            className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
              notif.is_read ? '' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <div className="mr-3">
              <Avatar
                src={
                  notif.sender?.photoUrl
                    ? `${import.meta.env.VITE_BACKEND_URL}${notif.sender.photoUrl}`
                    : defaultAvatar
                }
                alt={notif.sender?.name || 'User avatar'}
                size="xsmall"
                status="none"
              />
            </div>
            {!notif.is_read && (
              <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
                <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping" />
              </span>
            )}
            <span className="block">
              <span
                className={`mb-1.5 block text-theme-sm ${
                  notif.is_read
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {notif.message}
              </span>
              <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                <span>
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </span>
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PusherNotification;