'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, Send, ChevronLeft, BookOpen } from 'lucide-react';
import { studentConversations } from '@/lib/mocks/chatData';
import type { Conversation, ChatMessage } from '@/lib/mocks/chatData';

export default function MessagesView({ conversationId }: { conversationId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>(studentConversations);
  const [activeId, setActiveId] = useState<string>(
    studentConversations.find((c) => c.id === conversationId)?.id ?? studentConversations[0].id
  );
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, activeId]);

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowChat(true);
    // mark read
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );
  }

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      text,
      sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, msg] } : c
      )
    );
    setInput('');

    // Simulate instructor reply after delay
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `m-reply-${Date.now()}`,
        senderId: active.participantId,
        text: 'Mình đã nhận được tin nhắn, sẽ trả lời sớm nhé!',
        sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c
        )
      );
    }, 1200);
  }

  const filtered = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(search.toLowerCase()) ||
    (c.courseContext ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 56px)', background: 'var(--background)' }}
    >
      {/* ── Sidebar: conversation list ── */}
      <aside
        className={`flex flex-col border-r shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
        style={{
          width: 320,
          background: 'var(--card)',
          borderColor: 'var(--border)',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-extrabold" style={{ color: 'var(--foreground)' }}>
              Tin nhắn
            </h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}
          >
            <Search size={14} style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{
                  background: isActive ? 'var(--primary-light, #eff6ff)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Image
                    src={conv.participantAvatar}
                    width={40}
                    height={40}
                    alt={conv.participantName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-green-400"
                    style={{ borderColor: 'var(--card)' }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {conv.participantName}
                    </span>
                    <span className="text-xs shrink-0 ml-1" style={{ color: 'var(--muted-foreground)' }}>
                      {lastMsg?.sentAt}
                    </span>
                  </div>
                  {conv.courseContext && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <BookOpen size={10} style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {conv.courseContext}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p
                      className="text-xs truncate"
                      style={{
                        color: conv.unread > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
                        fontWeight: conv.unread > 0 ? 600 : 400,
                        maxWidth: 180,
                      }}
                    >
                      {lastMsg?.senderId === 'me' ? 'Bạn: ' : ''}{lastMsg?.text}
                    </p>
                    {conv.unread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold ml-1">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Chat panel ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}
        style={{ background: 'var(--background)' }}
      >
        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setMobileShowChat(false)}
            aria-label="Quay lại"
          >
            <ChevronLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <Image
            src={active.participantAvatar}
            width={36}
            height={36}
            alt={active.participantName}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
              {active.participantName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {active.participantTitle ?? active.courseContext}
            </p>
          </div>
          {active.courseContext && (
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--secondary)' }}
            >
              <BookOpen size={11} />
              <span className="max-w-[180px] truncate">{active.courseContext}</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {active.messages.map((msg) => {
            const isMe = msg.senderId === 'me';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMe && (
                  <Image
                    src={active.participantAvatar}
                    width={28}
                    height={28}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0 self-end"
                  />
                )}
                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      background: isMe ? 'var(--primary)' : 'var(--card)',
                      color: isMe ? '#fff' : 'var(--foreground)',
                      borderBottomRightRadius: isMe ? 4 : undefined,
                      borderBottomLeftRadius: !isMe ? 4 : undefined,
                      border: isMe ? 'none' : `1px solid var(--border)`,
                    }}
                  >
                    {/* Code block rendering */}
                    {msg.text.includes('```') ? (
                      <pre
                        className="text-xs overflow-x-auto rounded-lg p-2 mt-1"
                        style={{ background: isMe ? 'rgba(0,0,0,0.2)' : 'var(--secondary)', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {msg.text.replace(/```\w*\n?/g, '').replace(/```/g, '')}
                      </pre>
                    ) : msg.text}
                  </div>
                  <span className="text-xs mt-1 px-1" style={{ color: 'var(--muted-foreground)' }}>
                    {msg.sentAt}
                    {isMe && (
                      <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-4 py-3 border-t"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-end gap-3 px-4 py-2.5 rounded-2xl border"
            style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Nhắn tin cho ${active.participantName}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none max-h-32 leading-relaxed"
              style={{ color: 'var(--foreground)' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="shrink-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Gửi"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
          <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--muted-foreground)' }}>
            Enter để gửi · Shift+Enter xuống dòng
          </p>
        </div>
      </div>

      {/* Empty state when no conversation selected on desktop */}
      {!active && (
        <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Chọn một cuộc trò chuyện</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>để bắt đầu nhắn tin với giảng viên</p>
          </div>
        </div>
      )}
    </div>
  );
}
