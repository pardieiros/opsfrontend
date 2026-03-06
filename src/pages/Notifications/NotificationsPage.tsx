import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { fetchWithAuth } from '../../serviceapi/api';
import PageMeta from "../../components/common/PageMeta";
import Avatar from '../../components/ui/avatar/Avatar';
import defaultAvatar from '../../assets/imagewall.png';
import Button from "../../components/ui/button/Button";

interface NotificationItem {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  sender: {
    name: string;
    photoUrl?: string;
  };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Pagination state
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Load notifications from API
  const loadNotifications = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const res = await fetchWithAuth(`/api/notifications2/list/?limit=${limit}&offset=${currentOffset}`);
      
      if (!res.ok) throw new Error('Failed to fetch notifications');
      
      const json = await res.json();
      const data: NotificationItem[] = json.notifications;
      const more: boolean = json.has_more;
      
      if (reset) {
        setNotifications(data);
        setOffset(data.length);
      } else {
        setNotifications(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }
      
      setHasMore(more);
    } catch (err) {
      console.error('[Notifications]', err);
      setError('Erro ao carregar notificações');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetchWithAuth(`/api/notifications2/mark-as-read/${notificationId}/`, {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Failed to mark as read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('[MarkRead]', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const res = await fetchWithAuth('/api/notifications2/mark-all-as-read/', {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Failed to mark all as read');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('[MarkAllRead]', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(true);
  }, []);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !loadingMore) {
      loadNotifications(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Erro ao carregar notificações
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => loadNotifications(true)}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Notificações - Portal do Trabalhador"
        description="Todas as suas notificações"
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Notificações
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {notifications.length} notificação{notifications.length !== 1 ? 's' : ''}
                {unreadCount > 0 && ` • ${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={markingAll}
              variant="outline"
              size="sm"
            >
              {markingAll ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Marcando...</span>
                </div>
              ) : (
                <span>Marcar todas como lidas</span>
              )}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto"
          onScroll={handleScroll}
        >
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2zM10 7h10V5H10v2zM10 11h10V9H10v2zM10 15h10v-2H10v2zM10 19h10v-2H10v2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Você não tem notificações no momento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notif) => {
                // Compute initials if no photo
                const fullName = notif.sender?.name || '';
                const parts = fullName.split(' ').filter((p) => p.length > 0);
                const initials = parts.map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
                
                return (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors cursor-pointer ${
                      notif.is_read 
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                        : 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-400 dark:hover:bg-blue-900/30'
                    }`}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Avatar
                          src={notif.sender?.photoUrl
                            ? `${import.meta.env.VITE_BACKEND_URL}${notif.sender.photoUrl}`
                            : defaultAvatar
                          }
                          alt={notif.sender?.name || 'User avatar'}
                          size="small"
                          status="none"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${
                              notif.is_read 
                                ? 'text-gray-600 dark:text-gray-300' 
                                : 'text-gray-900 dark:text-gray-100 font-medium'
                            }`}>
                              {notif.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs ${
                                notif.is_read 
                                  ? 'text-gray-500 dark:text-gray-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </span>
                              {!notif.is_read && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Nova
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {!notif.is_read && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {loadingMore && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {!hasMore && notifications.length > 0 && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  Não há mais notificações
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 