'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, Send, ChevronLeft, BookOpen, AlertCircle } from 'lucide-react';
import { instructorConversations } from '@/lib/mocks/chatData';
import type { Conversation, ChatMessage } from '@/lib/mocks/chatData';

export default function MessagesView() {
  const [conversations, setConversations] = useState<Conversation[]>(instructorConversations);
  const [activeId, setActiveId] = useState<string>(instructorConversations[0].id);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, activeId]);

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowChat(true);
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
      id: `im-${Date.now()}`,
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
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const filtered = conversations
    .filter((c) =>
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      (c.courseContext ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => filter === 'all' || c.unread > 0);

  return (
    <div
      className="flex overflow-hidden flex-1"
      style={{ height: 'calc(100vh - 56px)', background: 'var(--background)' }}
    >
      {/* ── Conversation list ── */}
      <aside
        className={`flex flex-col border-r shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
        style={{ width: 300, background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-extrabold" style={{ color: 'var(--foreground)' }}>Tin nhắn</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                {totalUnread} chưa đọc
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-3">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                style={{
                  background: filter === f ? 'var(--primary)' : 'var(--secondary)',
                  color: filter === f ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}
          >
            <Search size={13} style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm học viên..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              Không có tin nhắn nào
            </p>
          )}
          {filtered.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isActive = conv.id === activeId;
            const hasUnanswered = conv.messages[conv.messages.length - 1]?.senderId !== 'me';

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
                <div className="relative shrink-0">
                  <Image
                    src={conv.participantAvatar}
                    alt={conv.participantName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                      {conv.participantName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {hasUnanswered && conv.unread > 0 && (
                        <AlertCircle size={12} className="text-orange-500" />
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {lastMsg?.sentAt}
                      </span>
                    </div>
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
                        maxWidth: 160,
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
          >
            <ChevronLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <Image
            src={active.participantAvatar}
            alt={active.participantName}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
              {active.participantName}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Học viên</p>
          </div>
          {active.courseContext && (
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--secondary)' }}
            >
              <BookOpen size={11} />
              <span className="max-w-[200px] truncate">{active.courseContext}</span>
            </div>
          )}
        </div>

        {/* Unanswered notice */}
        {active.messages[active.messages.length - 1]?.senderId !== 'me' && (
          <div
            className="flex items-center gap-2 px-5 py-2 text-xs border-b"
            style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}
          >
            <AlertCircle size={13} />
            Học viên đang chờ phản hồi của bạn
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {active.messages.map((msg) => {
            const isMe = msg.senderId === 'me';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMe && (
                  <Image
                    src={active.participantAvatar}
                    alt=""
                    width={28}
                    height={28}
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
                    {msg.text.includes('```') ? (
                      <pre
                        className="text-xs overflow-x-auto rounded-lg p-2 mt-1"
                        style={{
                          background: isMe ? 'rgba(0,0,0,0.2)' : 'var(--secondary)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {msg.text.replace(/```\w*\n?/g, '').replace(/```/g, '')}
                      </pre>
                    ) : msg.text}
                  </div>
                  <span className="text-xs mt-1 px-1" style={{ color: 'var(--muted-foreground)' }}>
                    {msg.sentAt}
                    {isMe && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
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
              placeholder={`Trả lời ${active.participantName}...`}
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
    </div>
  );
}
