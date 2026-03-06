// src/hooks/usePusherNotifications.tshttps://plastic.floow.pt
import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';

export function usePusherNotifications() {
  useEffect(() => {
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe('notifications');
    channel.bind('new-notification', (data: { title: string; body: string }) => {
      toast.info(`${data.title}: ${data.body}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('notifications');
      pusher.disconnect();
    };
  }, []);
}