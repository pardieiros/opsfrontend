import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from 'date-fns';
import { fetchWithAuth } from '../../serviceapi/api';

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
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router-dom";
import Avatar from '../ui/avatar/Avatar';
import defaultAvatar from '../../assets/imagewall.png';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    // Placeholder; replace with real fetch or subscription later
  ]);

  // Update notifying (show bell dot) when unread notifications exist
  useEffect(() => {
    const hasUnread = notifications.some(n => !n.is_read);
    setNotifying(hasUnread);
  }, [notifications]);

  // Pagination state
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Scroll state for "Ver mais" button
  const [showLoadMore, setShowLoadMore] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const handleScroll = () => {
    const node = listRef.current;
    if (!node) return;
    const { scrollTop, scrollHeight, clientHeight } = node;
    // show button when scrolled to (or near) bottom
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setShowLoadMore(true);
    } else {
      setShowLoadMore(false);
    }
  };

  // Attach scroll listener to list
  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.addEventListener('scroll', handleScroll);
      return () => node.removeEventListener('scroll', handleScroll);
    }
  }, [notifications]);

  // Function to load notifications from API
  const loadNotifications = async (reset: boolean = false) => {
    try {
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
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetchWithAuth('/api/notifications2/mark-all-as-read/', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      
      // Update local state to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotifying(false);
    } catch (err) {
      console.error('[MarkAllRead]', err);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(true);
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    if (!isOpen) {
      loadNotifications(true);
    }
    setNotifying(false);
  };
  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          <div className="flex items-center gap-2">
            {/* Botão para marcar todas como lidas */}
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                title="Marcar todas como lidas"
              >
                Marcar todas
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul
          ref={listRef}
          className="flex flex-col flex-1 overflow-y-auto custom-scrollbar"
        >
          {notifications.map((notif) => {
            // Compute initials if no photo
            const fullName = notif.sender?.name || '';
            const parts = fullName.split(' ').filter((p) => p.length > 0);
            const initials = parts.map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
            return (
            <li key={notif.id}>
              <DropdownItem
                onItemClick={async () => {
                  try {
                    await fetchWithAuth(`/api/notifications2/mark-as-read/${notif.id}/`, {
                      method: 'POST',
                    });
                    // Update local state to mark it read
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === notif.id ? { ...n, is_read: true } : n
                      )
                    );
                  } catch (e) {
                    console.error('[MarkRead]', e);
                  }
                  closeDropdown();
                }}
                className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 transition-colors ${
                  notif.is_read 
                    ? 'hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5' 
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30'
                }`}
              >
                <div className="mr-3">
                  <Avatar
                    src={notif.sender?.photoUrl
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
                  <span className={`mb-1.5 block text-theme-sm font-medium ${
                    notif.is_read 
                      ? 'text-gray-500 dark:text-gray-400' 
                      : 'text-gray-800 dark:text-gray-100'
                  }`}>
                    {notif.message}
                  </span>
                  <span className={`flex items-center gap-2 text-theme-xs ${
                    notif.is_read 
                      ? 'text-gray-500 dark:text-gray-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    <span>{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
            );
          })}
          {hasMore && showLoadMore && (
            <li className="flex justify-center p-2">
              <button
                onClick={() => loadNotifications(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Ver mais
              </button>
            </li>
          )}
        </ul>
        <Link
          to="/notifications"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Ver Todas as Notificações
        </Link>
      </Dropdown>
    </div>
  );
}
