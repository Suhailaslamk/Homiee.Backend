import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConversations } from '../api/chat';
import { isAuthenticated, getCurrentRole } from '../utils/auth';

const MotionDiv = motion.div;
const MotionSpan = motion.span;

export default function FloatingChatButton() {
  const location = useLocation();
  const role = getCurrentRole();
  const isAuth = isAuthenticated();
  const shouldShow = isAuth && !location.pathname.includes('/chat');

  const { data: conversationsResponse } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: getConversations,
    enabled: shouldShow,
    refetchInterval: 15000, // Refresh every 15s to keep unread count updated
  });

  // Don't show on the chat page itself
  if (!shouldShow) return null;

  const conversations = Array.isArray(conversationsResponse) 
    ? conversationsResponse 
    : (conversationsResponse?.data || []);
    
  const unreadCount = conversations.reduce(
    (sum, conv) => sum + Number(conv.unreadCount || 0), 
    0
  );

  const chatPath = role === 'seller' ? '/seller/chat' : '/chat';

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <MotionDiv
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          to={chatPath}
          className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary-dark)] text-[var(--color-accent)] shadow-2xl shadow-[var(--color-primary-dark)]/40 hover:bg-[var(--color-accent)] hover:text-[var(--color-primary-dark)] transition-all relative group"
        >
          <MessageCircle size={32} />
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <MotionSpan
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-[12px] font-black text-white shadow-lg ring-4 ring-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </MotionSpan>
            )}
          </AnimatePresence>

          {/* Tooltip */}
          <div className="absolute right-20 bg-white/90 backdrop-blur-md border border-[var(--color-stone)]/10 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold text-[var(--color-primary-dark)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-x-2 group-hover:translate-x-0">
            Transmit Signal
          </div>
        </Link>
      </MotionDiv>
    </div>
  );
}
