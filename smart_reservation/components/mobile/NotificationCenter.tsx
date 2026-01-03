import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Bell, Check, X, Trash2, Settings, Calendar, AlertCircle, MessageCircle, CreditCard } from 'lucide-react';
import { getStudentNotifications, markNotificationAsRead, deleteNotification } from '../../lib/supabase/database';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: number;
  type: 'booking_confirmed' | 'booking_cancelled' | 'class_reminder' | 'package_expiring' | 'instructor_message';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reservation_id?: string;
  package_id?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  studentId,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, studentId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getStudentNotifications(studentId);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('알림 읽음 처리에 실패했습니다.');
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('알림이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('알림 삭제에 실패했습니다.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => markNotificationAsRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('모든 알림을 읽음 처리했습니다.');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('알림 읽음 처리에 실패했습니다.');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_confirmed':
        return <Calendar size={20} className="text-orange-600" />;
      case 'booking_cancelled':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'class_reminder':
        return <Bell size={20} className="text-orange-600" />;
      case 'package_expiring':
        return <CreditCard size={20} className="text-orange-600" />;
      case 'instructor_message':
        return <MessageCircle size={20} className="text-orange-600" />;
      default:
        return <Bell size={20} className="text-slate-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-3xl h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Handle bar */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 my-4" />

            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Drawer.Title className="text-xl font-bold text-slate-900">
                    알림
                  </Drawer.Title>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Filter & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === 'unread'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    읽지 않음
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
                  >
                    모두 읽음
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                        notification.is_read
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-orange-50 border-orange-200 hover:border-orange-300'
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-1">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="읽음 처리"
                            >
                              <Check size={16} className="text-slate-600" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Settings Button */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                <Settings size={18} />
                알림 설정
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
