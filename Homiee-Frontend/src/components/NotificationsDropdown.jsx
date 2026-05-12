import React from 'react';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';

export default function NotificationsDropdown({
  notifications,
  unreadCount,
  isLoading,
  error,
  onRetry,
  onNotificationClick,
  pendingNotificationId,
}) {
  return (
    <div className="absolute right-0 top-full z-[60] mt-4 w-[min(92vw,24rem)] overflow-hidden rounded-[28px] border border-[#e8c9ba] bg-[#fffaf2] shadow-2xl shadow-stone-300/30">
      <div className="border-b border-[#ecd9cd] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-400">Notifications</p>
            <h3 className="mt-1 text-xl font-black text-stone-900">Your updates</h3>
          </div>
          <div className="rounded-full bg-[#fff1e8] px-3 py-1 text-xs font-bold text-[#b85c38]">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </div>
        </div>
      </div>

      <div className="max-h-[28rem] overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[24px] border border-[#f0ddd3] bg-[#fff7ee] p-4">
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-[#f1e4d9]" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f1e4d9]" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-[#f1e4d9]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-[#e8c9ba] bg-[#fff7ee] p-5 text-center">
            <p className="text-base font-semibold text-stone-800">We couldn't load notifications.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-2xl bg-[#b85c38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d36f51]"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[24px] border border-[#e8c9ba] bg-[#fff7ee] px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4d6c8] text-[#b85c38]">
              <Bell size={24} />
            </div>
            <p className="mt-4 text-base font-semibold text-stone-800">No notifications yet</p>
            <p className="mt-2 text-sm text-stone-500">
              Order updates, approvals, and important activity will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isPending = pendingNotificationId === notification.id;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onNotificationClick(notification)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    notification.isRead
                      ? 'border-[#f0ddd3] bg-[#fffaf2] hover:bg-[#fff7ee]'
                      : 'border-[#e8c9ba] bg-[#fff1e8] hover:bg-[#ffe9dc]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-stone-900">{notification.title}</p>
                        {!notification.isRead ? (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#b85c38]" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{notification.message}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>

                    {isPending ? (
                      <LoaderCircle size={16} className="mt-0.5 shrink-0 animate-spin text-[#b85c38]" />
                    ) : notification.isRead ? (
                      <CheckCheck size={16} className="mt-0.5 shrink-0 text-[#3f5143]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatNotificationTime(value) {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date);
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
