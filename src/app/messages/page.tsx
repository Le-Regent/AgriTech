'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '@/context/NotificationContext';

// Helper component to render an interactive product preview card inline within chat bubbles
function ChatProductCard({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      try {
        const data = await supabaseService.getProductById(productId);
        if (active) setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product for chat card:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-150 dark:border-slate-700/60 flex items-center gap-3 animate-pulse min-w-[240px] mb-2 shadow-inner">
        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 mb-2">
        <span className="material-symbols-outlined text-sm align-sub mr-1">broken_image</span>
        Product details no longer available
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/60 p-3 rounded-xl border border-slate-150 dark:border-slate-700 flex items-center justify-between gap-3 min-w-[240px] mb-2 shadow-sm transition-all text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-700/50 relative">
          <ResponsiveImage src={product.image_url || 'https://picsum.photos/seed/product/200/200'} alt={product.title} baseWidth={100} baseHeight={100} />
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-black tracking-widest text-primary uppercase block leading-none mb-1">Product Inquiry</span>
          <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate leading-tight mb-0.5">{product.title}</h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-none">{product.price?.toLocaleString()} {product.currency || 'FCFA'}</p>
        </div>
      </div>
      <a 
        href={`/marketplace/${product.id}`}
        className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
      >
        View
        <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
      </a>
    </div>
  );
}

function MessagesContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactId = searchParams.get('contact');
  const productIdParam = searchParams.get('product');
  const { refreshUnreadMessages } = useNotifications();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(contactId);
  const [activeContactProfile, setActiveContactProfile] = useState<any>(null);
  const [activeProductContext, setActiveProductContext] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedContactRef = useRef<string | null>(selectedContact);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Fetch clicked contact's profile immediately if it's passed in query param
  useEffect(() => {
    if (contactId) {
      setSelectedContact(contactId);
      const fetchContactProfile = async () => {
        try {
          const profile = await supabaseService.getProfile(contactId);
          if (profile) {
            setActiveContactProfile(profile);
          }
        } catch (error) {
          console.error("Failed to fetch clicked contact profile:", error);
        }
      };
      fetchContactProfile();
    } else {
      setActiveContactProfile(null);
    }
  }, [contactId]);

  // Fetch product context details if product param is provided in URL query parameters
  useEffect(() => {
    if (productIdParam) {
      const fetchProductDetails = async () => {
        try {
          const detail = await supabaseService.getProductById(productIdParam);
          if (detail) {
            setActiveProductContext(detail);
          }
        } catch (error) {
          console.error("Failed to load product details for context:", error);
        }
      };
      fetchProductDetails();
    } else {
      setActiveProductContext(null);
    }
  }, [productIdParam]);

  // Load initial messages lists once
  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        const data = await supabaseService.getMessages(user.id);
        setMessages(data);
        
        // Select the most recent conversation partner if check none is selected
        if (data.length > 0 && !selectedContact && !contactId) {
          const firstMsg = data[data.length - 1]; // active most recent
          const firstContact = firstMsg.sender_id === user.id ? firstMsg.receiver_id : firstMsg.sender_id;
          setSelectedContact(firstContact);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id, contactId]);

  // Setup real-time message listening and a solid short-polling fallback loop
  useEffect(() => {
    if (!user?.id) return;

    // Real-time changes listener
    const channel = supabase
      .channel(`chat_messages_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Re-fetch message log from database
          try {
            const latestMessages = await supabaseService.getMessages(user.id);
            setMessages(latestMessages);
            
            // If we receive a message from the current open contact, mark read instantly!
            if (payload.eventType === 'INSERT') {
              const newMsg = payload.new as Message;
              const currentContact = selectedContactRef.current;
              if (newMsg.sender_id === currentContact && newMsg.receiver_id === user.id) {
                await supabaseService.markMessagesAsRead(user.id, currentContact);
                refreshUnreadMessages();
              }
            }
          } catch (err) {
            console.error("Failed to fetch fresh realtime messages:", err);
          }
        }
      )
      .subscribe();

    // Solid short-polling fallback (3-second intervals) to guarantee instant receipt regardless of WebSockets
    const interval = setInterval(async () => {
      if (document.hidden) return; // Keep battery and data usage friendly
      try {
        const latestMessages = await supabaseService.getMessages(user.id);
        setMessages(prev => {
          // Light count/id check to prevent redundant re-renders unless there are new developments
          if (prev.length === latestMessages.length && 
              prev[prev.length - 1]?.id === latestMessages[latestMessages.length - 1]?.id &&
              prev[prev.length - 1]?.is_read === latestMessages[latestMessages.length - 1]?.is_read) {
            return prev;
          }
          return latestMessages;
        });
      } catch (err) {
        console.error("Polling message check failed:", err);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, refreshUnreadMessages]);

  // Handle Mark Messages as Read for the active discussion partner
  useEffect(() => {
    if (user?.id && selectedContact) {
      const markAsRead = async () => {
        try {
          await supabaseService.markMessagesAsRead(user.id, selectedContact);
          // Refresh lists
          refreshUnreadMessages();
          // Update local unread statuses
          setMessages(prev => prev.map(m => 
            m.sender_id === selectedContact && m.receiver_id === user.id ? { ...m, is_read: true } : m
          ));
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };
      markAsRead();
    }
  }, [user?.id, selectedContact, refreshUnreadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !user?.id) return;

    let textToSend = newMessage;
    if (activeProductContext) {
      textToSend = `[ProductId: ${activeProductContext.id}] ${newMessage}`;
    }
    setNewMessage('');

    try {
      const msg: Partial<Message> = {
        sender_id: user.id,
        receiver_id: selectedContact,
        message: textToSend,
        is_read: false
      };
      await supabaseService.sendMessage(msg);
      
      // Dynamic local append for lightning fast user experience before DB syncs
      const optimisticMsg: Message = {
        id: Math.random().toString(),
        sender_id: user.id,
        receiver_id: selectedContact,
        message: textToSend,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          full_name: user.full_name || '',
          avatar_url: user.avatar_url || ''
        },
        receiver: activeContactProfile ? {
          full_name: activeContactProfile.full_name || '',
          avatar_url: activeContactProfile.avatar_url || ''
        } : undefined
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      setActiveProductContext(null); // Clear context drawer after message has been sent with context
      
      // Update global count
      refreshUnreadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Helper function to extract productID structures internally from text threads
  const parseMessageContent = (messageText: string) => {
    const match = messageText.match(/^\[ProductId:\s*([a-fA-F0-9-]+)\]\s*(.*)$/s);
    if (match) {
      return {
        productId: match[1],
        content: match[2]?.trim()
      };
    }
    return null;
  };

  // Compile individual conversation partners
  const contacts = Array.from(new Set(messages.map(m => 
    m.sender_id === user?.id ? m.receiver_id : m.sender_id
  ))).map(id => {
    const msg = messages.find(m => m.sender_id === id || m.receiver_id === id);
    const profile = msg?.sender_id === id ? msg.sender : msg?.receiver;
    const contactMessages = messages.filter(m => 
      (m.sender_id === id && m.receiver_id === user?.id) ||
      (m.sender_id === user?.id && m.receiver_id === id)
    );
    const lastMsg = contactMessages[contactMessages.length - 1];
    
    // Unread count specifically sent by this contact to currently active user
    const unreadCount = contactMessages.filter(m => !m.is_read && m.sender_id === id).length;

    return {
      id,
      name: profile?.full_name || 'Unknown User',
      avatar: profile?.avatar_url || `https://picsum.photos/seed/${id}/100/100`,
      lastMessage: lastMsg?.message || '',
      lastMessageTime: lastMsg?.created_at,
      unreadCount
    };
  });

  // Inject current contact profile if query param is set and no messaging logs are found yet
  if (activeContactProfile && !contacts.some(c => c.id === activeContactProfile.id)) {
    contacts.unshift({
      id: activeContactProfile.id,
      name: activeContactProfile.full_name || 'Farmer',
      avatar: activeContactProfile.avatar_url || `https://picsum.photos/seed/${activeContactProfile.id}/100/100`,
      lastMessage: 'Tap to start conversation 🍌',
      lastMessageTime: '',
      unreadCount: 0
    });
  }

  // Active chat profile details
  const activeChatPartner = contacts.find(c => c.id === selectedContact) || 
    (activeContactProfile && selectedContact === activeContactProfile.id ? {
      id: activeContactProfile.id,
      name: activeContactProfile.full_name || 'Farmer',
      avatar: activeContactProfile.avatar_url || `https://picsum.photos/seed/${activeContactProfile.id}/100/100`
    } : null);

  const filteredMessages = messages.filter(m => 
    (m.sender_id === user?.id && m.receiver_id === selectedContact) ||
    (m.sender_id === selectedContact && m.receiver_id === user?.id)
  );

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatContactTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Change contact handler
  const handleSelectContact = (id: string) => {
    setSelectedContact(id);
    // Clear dynamic query param url if active to make route clean
    if (contactId) {
      router.push('/messages');
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-slate-50 dark:bg-[#111b21] rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
      
      {/* Contacts List panel (hidden on mobile if a contact is selected) */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] flex flex-col shrink-0 ${
        selectedContact ? 'hidden md:flex' : 'flex'
      }`}>
        {/* WhatsApp Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black dark:text-white tracking-tight">Kamer Chat</h3>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            </button>
            <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>

        {/* WhatsApp search bar */}
        <div className="p-3 border-b border-slate-100 dark:border-[#222e35] bg-white dark:bg-[#111b21]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full bg-slate-100 dark:bg-[#202c33] dark:text-white text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Contacts scrolling area */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-1 bg-white dark:bg-[#111b21]">
          {contacts.length > 0 ? (
            contacts.map(contact => {
              const isSelected = selectedContact === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 border-b border-slate-50 dark:border-[#222e35]/30 transition-all ${
                    isSelected 
                      ? 'bg-slate-100 dark:bg-[#2a3942]' 
                      : 'hover:bg-slate-50 dark:hover:bg-[#202c33]/50'
                  }`}
                >
                  {/* Portrait Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 relative bg-slate-100 dark:bg-slate-800">
                    <ResponsiveImage src={contact.avatar || ''} alt={contact.name} baseWidth={100} baseHeight={100} />
                  </div>

                  {/* Body Content */}
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{contact.name}</h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {formatContactTime(contact.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <p className="truncate mr-2 max-w-[180px] lg:max-w-none">{contact.lastMessage}</p>
                      
                      {/* Badge count specifically for EACH sender */}
                      <AnimatePresence>
                        {contact.unreadCount > 0 && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="bg-[#25D366] text-white font-black text-[9px] h-5 min-w-5 px-1 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                          >
                            {contact.unreadCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-20 px-6">
              <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-2">forum</span>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-600">No active discussions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Message View Area (hidden on mobile if no active discussion) */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#efeae2] dark:bg-[#0b141a] border-l border-slate-100 dark:border-transparent ${
        !selectedContact ? 'hidden md:flex' : 'flex'
      }`}>
        {activeChatPartner ? (
          <>
            {/* WhatsApp Chat Partner Header Bar */}
            <div className="p-3 px-5 border-b border-slate-200 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button for mobile view screens */}
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-1 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2a3942] rounded-full shrink-0 mr-1"
                  title="Go back"
                >
                  <span className="material-symbols-outlined font-bold">arrow_back</span>
                </button>

                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                  <ResponsiveImage 
                    src={activeChatPartner.avatar || ''} 
                    alt={activeChatPartner.name} 
                    baseWidth={100} 
                    baseHeight={100} 
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{activeChatPartner.name}</h4>
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider">online</p>
                </div>
              </div>
              
              {/* Settings menu without fake call icons */}
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-300">
                <button className="hover:text-primary transition-colors cursor-pointer" title="Settings">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
            </div>

            {/* Platform Security/Escrow transaction guidelines notice */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/55 dark:border-amber-900/40 p-2.5 px-5 flex items-center gap-3 shrink-0 text-left">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl font-bold shrink-0">security</span>
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 font-semibold leading-normal">
                <span className="font-extrabold text-[#d97706] dark:text-amber-400 uppercase tracking-wider text-[9px] bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded mr-1.5 border border-amber-200/40">Security Advisory</span>
                For your payment protection, all transactions must be concluded through the platform escrow system. Do not pay farmers directly off-platform under any circumstances.
              </p>
            </div>

            {/* Bubble Threads container with classical WhatsApp style layout */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 relative"
              style={{
                backgroundImage: `radial-gradient(#dae1e7 1px, transparent 1px), radial-gradient(#dae1e7 1px, #efeae2 1px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
                contentVisibility: 'auto'
              }}
            >
              {/* Subdued Dark Theme Background override */}
              <div className="absolute inset-0 bg-repeat bg-center opacity-6 pointer-events-none dark:opacity-2 bg-[radial-gradient(#1e293b_1px,transparent_1px)] dark:bg-[radial-gradient(#2a3942_1.5px,transparent_1.5px)]" />

              {filteredMessages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} w-full animate-fade-in relative z-10`}
                  >
                    <div 
                      className={`max-w-[75%] sm:max-w-[65%] px-3.5 py-1.5 rounded-2xl shadow-sm border border-slate-200/20 text-sm ${
                        isMine 
                          ? 'bg-[#d9fdd3] dark:bg-[#002f23] text-slate-800 dark:text-emerald-50 rounded-tr-none' 
                          : 'bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {/* Text content with custom inline product card rendering */}
                      {(() => {
                        const parsed = parseMessageContent(msg.message);
                        if (parsed) {
                          return (
                            <div className="flex flex-col">
                              <ChatProductCard productId={parsed.productId} />
                              {parsed.content && (
                                <p className="whitespace-pre-wrap leading-relaxed pr-8 pb-1">{parsed.content}</p>
                              )}
                            </div>
                          );
                        }
                        return <p className="whitespace-pre-wrap leading-relaxed pr-8 pb-1">{msg.message}</p>;
                      })()}
                      
                      {/* Metadata row overlay on the right-bottom */}
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 float-right mt-1 ml-4 select-none flex items-center gap-1 leading-none">
                        <span>{formatMessageTime(msg.created_at)}</span>
                        
                        {/* WhatsApp like checkmark ticks for outgoing messages */}
                        {isMine && (
                          <span className={`material-symbols-outlined text-[14px] leading-none select-none font-bold ${
                            msg.is_read ? 'text-[#53bdeb] dark:text-[#53bdeb]' : 'text-slate-400 dark:text-slate-600'
                          }`}>
                            {msg.is_read ? 'done_all' : 'check'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Context attachment bar displaying active crop inquiry details to buyer */}
            {activeProductContext && (
              <div className="mx-4 my-2 p-3 bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4 animate-fade-in relative z-20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-700/50 relative">
                    <ResponsiveImage src={activeProductContext.image_url || 'https://picsum.photos/seed/product/200/200'} alt={activeProductContext.title} baseWidth={200} baseHeight={200} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[10px] font-black tracking-widest text-primary uppercase block leading-none mb-0.5">Pre-attaching Product Inquiry</span>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate leading-tight mb-0.5">{activeProductContext.title}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-none">{activeProductContext.price?.toLocaleString()} {activeProductContext.currency || 'FCFA'}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveProductContext(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-colors shrink-0"
                  title="Remove product context"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            )}

            {/* Input keyboard bar - WhatsApp themed bottom row */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 dark:bg-[#202c33] flex items-center gap-3 shrink-0 select-none">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                <button type="button" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors cursor-pointer" title="Add emoji">
                  <span className="material-symbols-outlined text-[24px]">sentiment_satisfied</span>
                </button>
                <button type="button" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors cursor-pointer animate-pulse" title="Attach file">
                  <span className="material-symbols-outlined text-[24px]">attach_file</span>
                </button>
              </div>

              {/* Message Input field */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                className="flex-1 bg-white dark:bg-[#2a3942] border-none rounded-xl px-5 py-3 text-sm focus:outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
              />

              {/* WhatsApp Green circular send button (becomes mic when empty, goes to send on active writing!) */}
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 select-none cursor-pointer duration-300 shadow-md ${
                  newMessage.trim() 
                    ? 'bg-[#00a884] hover:bg-[#01755b] rotate-0 scale-100' 
                    : 'bg-[#00a884] hover:bg-[#01755b] scale-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] select-none font-bold">
                  {newMessage.trim() ? 'send' : 'mic'}
                </span>
              </button>
            </form>
          </>
        ) : (
          /* Empty state when no conversation is selected yet */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white dark:bg-[#111b21] px-6 select-none">
            <div className="w-20 h-20 bg-slate-100 dark:bg-[#202c33]/50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-primary animate-bounce">chat_bubble</span>
            </div>
            <h4 className="font-black text-slate-900 dark:text-white mb-2 text-lg">Kamer Chat Desktop</h4>
            <p className="text-xs text-center max-w-sm mt-1 leading-relaxed opacity-75">
              Select or open a grower contact to send direct texts, verify produce details, or arrange local deliveries instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center bg-white dark:bg-slate-900 shadow rounded-[2rem]">Loading chat dashboard...</div>}>
        <MessagesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
