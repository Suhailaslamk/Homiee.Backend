import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  Send,
  Signal,
  Sparkles,
  MessageSquare,
  Search,
  MoreVertical,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Store,
  User,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Zap,
  Info,
  PenTool,
  Check,
  CheckCheck,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getConversationMessages,
  getConversations,
  markConversationAsRead,
  sendMessage,
} from '../api/chat';
import SurfaceCard from '../components/SurfaceCard';
import StatePanel from '../components/StatePanel';
import { useSignalR } from '../hooks/useSignalR';
import { useToast } from '../hooks/useToast';
import { getCurrentRole, getCurrentUserId, isAdminRole } from '../utils/auth';
import { getHubUrl } from '../utils/realtime';

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();
  const messagesEndRef = useRef(null);
  const lastMarkedConversationRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedUserId = Number(userId);
  const hasSelectedUser = Number.isFinite(selectedUserId) && selectedUserId > 0;
  const routeState = location.state ?? {};
  const canUseChat = !isAdminRole() && Boolean(localStorage.getItem('token'));

  // 🔥 Redirection for Sellers/Admins to ensure sidebar persistence
  useEffect(() => {
    const role = getCurrentRole();
    if (role === 'seller' && !location.pathname.startsWith('/seller')) {
      navigate(userId ? `/seller/chat/${userId}` : '/seller/chat', { replace: true, state: location.state });
    } else if (role === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate(userId ? `/admin/chat/${userId}` : '/admin/chat', { replace: true, state: location.state });
    }
  }, [location.pathname, navigate, userId]);

  const {
    data: conversationsResponse,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: getConversations,
    enabled: canUseChat,
  });

  const conversations = useMemo(
    () => normalizeCollection(conversationsResponse, normalizeConversation)
      .filter(item => Number(item.otherUserId) !== Number(currentUserId))
      .filter(item => (item.otherUserName || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [conversationsResponse, currentUserId, searchTerm]
  );

  const selectedConversation = useMemo(
    () => conversations.find((item) => Number(item.otherUserId) === selectedUserId) || null,
    [conversations, selectedUserId]
  );

  const fallbackConversation = useMemo(() => {
    if (!hasSelectedUser || selectedConversation) {
      return null;
    }

    return {
      otherUserId: selectedUserId,
      otherUserName: routeState.name || routeState.otherUserName || routeState.businessName || `User #${selectedUserId}`,
      otherUserAvatar: routeState.avatar || null,
      lastMessage: '',
      lastMessageAt: null,
      unreadCount: 0,
      subtitle: routeState.subtitle || 'Start a conversation',
    };
  }, [hasSelectedUser, routeState.avatar, routeState.name, routeState.otherUserName, routeState.subtitle, selectedConversation, selectedUserId]);

  const activeConversation = selectedConversation || fallbackConversation;

  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chat', 'messages', selectedUserId],
    queryFn: () => getConversationMessages(selectedUserId),
    enabled: canUseChat && hasSelectedUser && Number(selectedUserId) !== Number(currentUserId),
  });

  const messages = useMemo(() => {
    const processed = normalizeCollection(messagesResponse, normalizeMessage);
    console.log('Chat Thread Debug:', {
      selectedUserId,
      currentUserId,
      rawCount: Array.isArray(messagesResponse) ? messagesResponse.length : (messagesResponse?.data?.length || 0),
      processedCount: processed.length,
      firstRaw: messagesResponse?.[0] || messagesResponse?.data?.[0],
      firstProcessed: processed[0]
    });
    return processed;
  }, [messagesResponse, selectedUserId, currentUserId]);

  const markReadMutation = useMutation({
    mutationFn: (senderId) => markConversationAsRead(senderId),
    onSuccess: (_, senderId) => {
      lastMarkedConversationRef.current = Number(senderId);
      queryClient.setQueryData(['chat', 'messages', Number(senderId)], (current) =>
        normalizeCollection(current, normalizeMessage).map((message) =>
          Number(message.senderId) === Number(senderId) ? { ...message, isRead: true } : message
        )
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload) => sendMessage(payload),
    onSuccess: (message) => {
      const normalizedMessage = normalizeMessage(message);

      if (normalizedMessage) {
        queryClient.setQueryData(['chat', 'messages', selectedUserId], (current) =>
          mergeMessages(normalizeCollection(current, normalizeMessage), normalizedMessage)
        );
      }

      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      setDraft('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to transmit message.');
    },
  });

  useSignalR(
    getHubUrl('/chatHub'),
    (incoming) => {
      console.log('[SignalR] Incoming Signal Received:', incoming);
      const normalizedMessage = normalizeMessage(incoming);
      
      if (!normalizedMessage) {
        console.warn('[SignalR] Failed to normalize incoming message:', incoming);
        return;
      }
      
      const otherUserId =
        Number(normalizedMessage.senderId) === Number(currentUserId)
          ? Number(normalizedMessage.receiverId)
          : Number(normalizedMessage.senderId);

      console.log('[SignalR] Updating cache for otherUserId:', otherUserId);
      queryClient.setQueryData(['chat', 'messages', otherUserId], (current) =>
        mergeMessages(normalizeCollection(current, normalizeMessage), normalizedMessage)
      );

      // ❌ REMOVED: queryClient.invalidateQueries({ queryKey: ['chat', 'messages', otherUserId] });
      // This was causing a race condition where the refetch would overwrite the real-time update.
      
      // Keep invalidating conversations to update sidebar unread counts
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

      if (otherUserId === selectedUserId && Number(normalizedMessage.senderId) !== Number(currentUserId)) {
        lastMarkedConversationRef.current = null;
        markReadMutation.mutate(otherUserId);
      }
    },
    { 
      enabled: canUseChat && !isAdminRole(),
      onStatusChange: (status) => console.log('[SignalR] Connection Status:', status)
    }
  );

  useEffect(() => {
    if (hasSelectedUser && Number(selectedUserId) === Number(currentUserId)) {
      toast.warning("You cannot message yourself.");
      navigate('/chat', { replace: true });
    }
  }, [hasSelectedUser, selectedUserId, currentUserId, navigate, toast]);

  useEffect(() => {
    if (!canUseChat) {
      navigate('/login', { replace: true });
    }
  }, [canUseChat, navigate]);

  useEffect(() => {
    if (!hasSelectedUser && conversations.length > 0) {
      navigate(`/chat/${conversations[0].otherUserId}`, { replace: true });
    }
  }, [conversations, hasSelectedUser, navigate]);

  useEffect(() => {
    if (!hasSelectedUser) {
      return;
    }

    const hasUnreadMessages = messages.some(
      (message) => Number(message.senderId) === selectedUserId && !message.isRead
    );

    if (lastMarkedConversationRef.current === selectedUserId) {
      return;
    }

    if ((selectedConversation?.unreadCount || 0) > 0 || hasUnreadMessages) {
      markReadMutation.mutate(selectedUserId);
    }
  }, [hasSelectedUser, messages, selectedConversation?.unreadCount, selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const totalUnread = conversations.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0);

  if (!canUseChat) {
    return null;
  }

  const isNested = location.pathname.startsWith('/seller/chat') || location.pathname.startsWith('/admin/chat');

  return (
    <div className={`${isNested ? 'h-full' : 'h-screen pt-24'} bg-[var(--color-sand)]/20 flex flex-col overflow-hidden relative`}>
      {!isNested && (
        <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-[var(--color-stone)]/10 px-8 flex items-center justify-between z-50">
          <div className="flex items-center gap-6">
            <Link to="/discovery" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
                <ArrowLeft size={18} />
              </div>
              <span className="hidden sm:inline text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-dark)] transition-colors">Back to Marketplace</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Secure Chat</span>
            </div>
          </div>
        </nav>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <div className="flex-1 mx-auto w-full flex overflow-hidden">
          <div className="w-full flex">
          {/* Conversation Sidebar */}
          <div className={`w-full lg:w-[400px] border-r border-[var(--color-stone)]/10 flex flex-col bg-white transition-all ${hasSelectedUser ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-8 border-b border-[var(--color-stone)]/5 bg-white/30 shrink-0">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Messages</p>
                  <h2 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Recent Messages</h2>
                </div>
                <button 
                  onClick={refetchConversations}
                  className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20 transition-all"
                >
                  <Zap size={18} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/40" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search messages..." 
                  className="w-full bg-white border border-[var(--color-stone)]/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/20 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              {conversationsLoading ? (
                <ConversationListLoading />
              ) : conversations.length === 0 && !hasSelectedUser ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-stone)]/30 mb-6">
                    <MessageCircle size={32} />
                  </div>
                  <p className="text-lg font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No messages yet</p>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)] italic leading-relaxed">
                    "Start a conversation by visiting a seller's shop."
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fallbackConversation && (
                    <ConversationItem
                      key={`fallback-${fallbackConversation.otherUserId}`}
                      conversation={fallbackConversation}
                      isActive
                      onClick={() => navigate(`/chat/${fallbackConversation.otherUserId}`, { state: routeState })}
                    />
                  )}

                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={`conv-${conversation.otherUserId}`}
                      conversation={conversation}
                      isActive={Number(conversation.otherUserId) === selectedUserId}
                      onClick={() => navigate(`/chat/${conversation.otherUserId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {totalUnread > 0 && (
              <div className="p-4 bg-[var(--color-accent)]/10 text-[var(--color-primary-dark)] text-center text-[10px] font-bold uppercase tracking-widest shrink-0">
                {totalUnread} Unread Messages
              </div>
            )}
          </div>
 
          {/* Message Thread Canvas */}
          <div className={`flex-1 flex flex-col bg-[#fdfaf6] relative overflow-hidden h-full ${!hasSelectedUser ? 'hidden lg:flex' : 'flex'}`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
            
            {hasSelectedUser ? (
              <>
                <div className="p-6 border-b border-[var(--color-stone)]/5 bg-white/60 backdrop-blur-md relative z-10 shrink-0 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigate('/chat')}
                        className="xl:hidden w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)]"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <Avatar name={activeConversation?.otherUserName} avatarUrl={activeConversation?.otherUserAvatar} size="medium" />
                      <div>
                        <h2 className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
                          {activeConversation?.otherUserName || `User #${selectedUserId}`}
                        </h2>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-[var(--color-sand)] flex items-center justify-center text-[var(--color-primary-dark)] text-[10px] font-bold">H</div>
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-[var(--color-primary-dark)] flex items-center justify-center text-[var(--color-accent)] text-[10px] font-bold">
                          {getInitials(activeConversation?.otherUserName)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-10 relative z-10 scrollbar-hide">
                  <AnimatePresence mode="popLayout">
                    {messagesLoading ? (
                      <MessageThreadLoading />
                    ) : messagesError ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-rose-500 mb-8 shadow-xl">
                          <Zap size={40} />
                        </div>
                        <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Failed to connect</h3>
                        <p className="mt-4 text-sm text-[var(--color-text-muted)] italic leading-relaxed">
                          "Could not load messages. Please try again."
                        </p>
                        <button 
                          onClick={() => refetchMessages()}
                          className="mt-8 px-8 py-3 bg-[var(--color-primary-dark)] text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                        >
                          Retry
                        </button>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-accent)] mb-8 shadow-xl">
                          <Sparkles size={40} />
                        </div>
                        <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Start Chatting</h3>
                        <p className="mt-4 text-sm text-[var(--color-text-muted)] italic leading-relaxed">
                          "Ask about products, delivery, or anything else."
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          {messages.map((message, idx) => {
                            const isOwnMessage = Number(message.senderId) === Number(currentUserId);
                            const prevMessage = idx > 0 ? messages[idx - 1] : null;
                            const showDateDivider = !prevMessage || 
                              new Date(message.sentAt).toDateString() !== new Date(prevMessage.sentAt).toDateString();
                            
                            return (
                              <React.Fragment key={message.id || idx}>
                                {showDateDivider && (
                                  <div className="flex justify-center my-8 sticky top-0 z-10">
                                    <div className="px-4 py-1.5 bg-white/80 backdrop-blur-md border border-[var(--color-stone)]/10 rounded-full text-[10px] font-black text-[var(--color-primary-dark)] uppercase tracking-widest shadow-sm">
                                      {formatDividerDate(message.sentAt)}
                                    </div>
                                  </div>
                                )}
                                <MessageBubble
                                  message={message}
                                  isOwnMessage={isOwnMessage}
                                  activeConversation={activeConversation}
                                />
                              </React.Fragment>
                            );
                          })}
                        </div>
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!draft.trim()) return;
                    sendMessageMutation.mutate({ receiverId: selectedUserId, message: draft.trim() });
                  }}
                  className="p-4 bg-white/80 backdrop-blur-md border-t border-[var(--color-stone)]/10 relative z-10 shrink-0"
                >
                  <div className="max-w-4xl mx-auto flex items-end gap-3">
                    <div className="flex-1 relative group">
                      <textarea
                        rows="1"
                        value={draft}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (draft.trim()) sendMessageMutation.mutate({ receiverId: selectedUserId, message: draft.trim() });
                          }
                        }}
                        onChange={(event) => {
                          setDraft(event.target.value);
                          // Auto-resize textarea
                          event.target.style.height = 'auto';
                          event.target.style.height = `${Math.min(event.target.scrollHeight, 150)}px`;
                        }}
                        placeholder="Type a message..."
                        className="w-full min-h-[50px] max-h-[150px] rounded-[1.5rem] border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 px-6 py-3.5 text-[15px] font-medium text-[var(--color-primary-dark)] outline-none transition-all focus:bg-white focus:border-[var(--color-accent)]/30 focus:shadow-sm resize-none scrollbar-hide"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendMessageMutation.isPending || !draft.trim()}
                      className="w-12 h-12 rounded-full bg-[var(--color-primary-dark)] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all disabled:opacity-30 shrink-0"
                    >
                      {sendMessageMutation.isPending ? <LoaderCircle className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 max-w-md mx-auto">
                <div className="w-24 h-24 rounded-[3rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-stone)]/40 mb-10 shadow-2xl border border-white/50">
                  <MessageSquare size={48} />
                </div>
                <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Select a Chat</h3>
                <p className="mt-6 text-lg text-[var(--color-text-muted)] italic leading-relaxed">
                  "Choose a conversation to start messaging."
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

function ConversationItem({ conversation, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full group rounded-[2rem] p-6 text-left transition-all relative overflow-hidden ${
        isActive
          ? 'bg-[var(--color-primary-dark)] text-white shadow-2xl scale-[1.02]'
          : 'bg-white/50 border border-transparent hover:bg-white hover:border-[var(--color-accent)]/10 hover:shadow-xl'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full -mr-12 -mt-12" />
      )}
      <div className="flex items-center gap-5 relative z-10">
        <Avatar name={conversation.otherUserName} avatarUrl={conversation.otherUserAvatar} isActive={isActive} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className={`truncate text-base font-bold ${isActive ? 'text-white' : 'text-[var(--color-primary-dark)]'}`}>{conversation.otherUserName}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white/40' : 'text-[var(--color-text-muted)]'}`}>{formatMessageTime(conversation.lastMessageAt)}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className={`truncate text-xs font-medium italic ${isActive ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>
              {conversation.lastMessage || conversation.subtitle || 'Start a conversation...'}
            </p>
            {Number(conversation.unreadCount || 0) > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-[10px] font-black shadow-lg">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, isOwnMessage, activeConversation }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
        <div className={`group relative px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
          isOwnMessage 
            ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-tr-none' 
            : 'bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] rounded-tl-none'
        }`}>
          <div className="flex flex-col gap-1">
            <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">
              {message.message}
            </p>
            
            <div className={`flex items-center gap-1 self-end min-w-[50px] justify-end opacity-50 ${isOwnMessage ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-stone)]'}`}>
              <span className="text-[9px] font-bold tracking-tighter">
                {formatMessageTime(message.sentAt)}
              </span>
              {isOwnMessage && (
                message.isRead ? (
                  <div className="flex items-center -space-x-2">
                    <Check size={11} className="text-blue-600 font-black" strokeWidth={4} />
                    <Check size={11} className="text-blue-600 font-black" strokeWidth={4} />
                  </div>
                ) : (
                  <div className="flex items-center -space-x-2">
                    <Check size={11} strokeWidth={3} />
                    <Check size={11} strokeWidth={3} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Avatar({ name, avatarUrl, size = 'medium', isActive = false }) {
  const sizeClasses = size === 'large' ? 'h-16 w-16 text-2xl' : 'h-14 w-14 text-xl';
  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Identity'}
          className={`${sizeClasses} rounded-2xl border-4 ${isActive ? 'border-white/10' : 'border-white'} object-cover shadow-lg group-hover:scale-105 transition-transform`}
        />
      ) : (
        <div className={`${sizeClasses} flex items-center justify-center rounded-[1.2rem] ${isActive ? 'bg-white/10 text-[var(--color-accent)]' : 'bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)]'} font-black shadow-inner border-2 border-white group-hover:scale-105 transition-transform`}>
          {getInitials(name)}
        </div>
      )}
      {!isActive && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
      )}
    </div>
  );
}

function ConversationListLoading() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={`loader-conv-${i}`} className="h-24 rounded-[2rem] bg-white/40 animate-pulse border border-white" />
      ))}
    </div>
  );
}

function MessageThreadLoading() {
  return (
    <div className="space-y-12">
      {[1, 2, 3].map(i => (
        <div key={`loader-msg-${i}`} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="h-24 w-full max-w-sm rounded-[2.5rem] bg-[var(--color-sand)]/20 animate-pulse border border-white/50" />
        </div>
      ))}
    </div>
  );
}

// ── 1. For ChatMessage objects (from /chat/{userId} and SignalR) ─────────
function normalizeMessage(data) {
  if (!data) return null;
  const item = data?.data?.data || data?.data || data;
  if (!item) return null;

  return {
    id:         item.id         ?? item.Id,
    senderId:   Number(item.senderId   ?? item.SenderId),
    senderName: item.senderName ?? item.SenderName,
    receiverId: Number(item.receiverId ?? item.ReceiverId),
    message:    item.message    ?? item.Message,
    sentAt:     item.sentAt     ?? item.SentAt,
    isRead:     item.isRead     ?? item.IsRead ?? false,
  };
}

// ── 2. For ConversationSummaryDto objects (from /chat/inbox) ─────────────
function normalizeConversation(data) {
  if (!data) return null;
  const item = data?.data?.data || data?.data || data;
  if (!item) return null;

  return {
    otherUserId:    Number(item.otherUserId   ?? item.OtherUserId),
    otherUserName:  item.otherUserName  ?? item.OtherUserName  ?? 'Unknown',
    otherUserAvatar:item.otherUserAvatar ?? item.OtherUserAvatar ?? null,
    lastMessage:    item.lastMessage    ?? item.LastMessage    ?? '',
    lastMessageAt:  item.lastMessageAt  ?? item.LastMessageAt  ?? null,
    unreadCount:    Number(item.unreadCount ?? item.UnreadCount ?? 0),
  };
}

// ── 3. Generic collection normalizer (takes a normalizer fn) ─────────────
function normalizeCollection(response, normalizerFn) {
  const raw = Array.isArray(response)
    ? response
    : (response?.data?.data || response?.data || []);
  return raw.map(normalizerFn).filter(Boolean);
}

function mergeMessages(currentMessages, newMessage) {
  const existingMessages = Array.isArray(currentMessages) ? currentMessages : [];
  const nextMessages = [...existingMessages];
  
  const existingIndex = nextMessages.findIndex(
    (msg) => Number(msg.id) === Number(newMessage.id)
  );

  if (existingIndex >= 0) {
    nextMessages[existingIndex] = newMessage;
  } else {
    nextMessages.push(newMessage);
  }

  return nextMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
}

function formatDividerDate(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}


function formatMessageTime(value) {
  if (!value) return 'Active';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date);
  }
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);
}

function formatDateTime(value) {
  if (!value) return 'Date';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getInitials(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'H';
}
