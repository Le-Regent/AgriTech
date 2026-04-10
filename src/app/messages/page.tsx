'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import { Message } from '@/types';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import ResponsiveImage from '@/components/ResponsiveImage';
import { useSearchParams } from 'next/navigation';

function MessagesContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contact');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(contactId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contactId && !selectedContact) {
      setSelectedContact(contactId);
    }
  }, [contactId, selectedContact]);

  useEffect(() => {
    async function fetchMessages() {
      if (user?.id) {
        setLoading(true);
        try {
          const data = await supabaseService.getMessages(user.id);
          setMessages(data);
          
          // Select the first contact if none selected
          if (data.length > 0 && !selectedContact) {
            const firstContact = data[0].sender_id === user.id ? data[0].receiver_id : data[0].sender_id;
            setSelectedContact(firstContact);
          }
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchMessages();
  }, [user?.id, selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !user?.id) return;

    try {
      const msg: Partial<Message> = {
        sender_id: user.id,
        receiver_id: selectedContact,
        message: newMessage,
        is_read: false
      };
      await supabaseService.sendMessage(msg);
      setNewMessage('');
      
      // Refresh messages
      const data = await supabaseService.getMessages(user.id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const contacts = Array.from(new Set(messages.map(m => 
    m.sender_id === user?.id ? m.receiver_id : m.sender_id
  ))).map(id => {
    const msg = messages.find(m => m.sender_id === id || m.receiver_id === id);
    const profile = msg?.sender_id === id ? msg.sender : msg?.receiver;
    return {
      id,
      name: profile?.full_name || 'Unknown User',
      avatar: profile?.avatar_url || `https://picsum.photos/seed/${id}/100/100`,
      lastMessage: messages.filter(m => m.sender_id === id || m.receiver_id === id).pop()?.message || ''
    };
  });

  const filteredMessages = messages.filter(m => 
    (m.sender_id === user?.id && m.receiver_id === selectedContact) ||
    (m.sender_id === selectedContact && m.receiver_id === user?.id)
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Contacts List */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black dark:text-white">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.length > 0 ? (
            contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  selectedContact === contact.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <ResponsiveImage src={contact.avatar} alt={contact.name} baseWidth={100} baseHeight={100} />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-bold text-sm truncate dark:text-white">{contact.name}</h4>
                  <p className="text-xs truncate opacity-60">{contact.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">forum</span>
              <p className="text-sm text-slate-400">No conversations yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedContact ? (
          <>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <ResponsiveImage 
                  src={contacts.find(c => c.id === selectedContact)?.avatar || ''} 
                  alt="Contact" 
                  baseWidth={100} 
                  baseHeight={100} 
                />
              </div>
              <h4 className="font-bold dark:text-white">{contacts.find(c => c.id === selectedContact)?.name}</h4>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                    msg.sender_id === user?.id 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}>
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
            <p className="font-bold">Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center">Loading messages...</div>}>
        <MessagesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
