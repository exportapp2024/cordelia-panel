import React from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage, fetchChatHistory } from '../lib/api';

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [threadId, setThreadId] = React.useState<string | undefined>(undefined);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Array<{ id?: string; role: 'user'|'assistant'; content: string; created_at?: string }>>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const renderMarkdownHtml = React.useCallback((raw: string): string => {
    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let text = escapeHtml(raw);
    // links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-600 hover:text-blue-800">$1</a>');
    // inline code
    text = text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-gray-800">$1</code>');
    // bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italics
    text = text.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>');
    // line breaks
    text = text.replace(/\n/g, '<br/>');
    return text;
  }, []);

  const onToggle = () => setOpen((v) => !v);

  const loadHistory = React.useCallback(async () => {
    if (!user || !threadId) return;
    try {
      const data = await fetchChatHistory({ userId: user.id, threadId });
      const mapped = (data.messages || []).map((m) => ({ id: m.id, role: m.role as 'user'|'assistant', content: m.content || '', created_at: m.created_at }));
      setMessages(mapped);
    } catch (e) {
      // noop
    }
  }, [user, threadId]);

  React.useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  React.useEffect(() => {
    // Auto-scroll to bottom on new messages
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!user || !input.trim()) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await sendChatMessage({ userId: user.id, threadId, message: text });
      if (!threadId) setThreadId(res.thread_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Üzgünüm, bir hata oluştu.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Chatbotu aç"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[95vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[560px]">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Cordelia Asistan</h3>
              <p className="text-xs text-gray-500">Randevu ve hasta işlemleri için yazın</p>
            </div>
          </div>

          <div className="p-3 space-y-3 overflow-auto flex-1">
            {messages.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-10">
                Merhaba! Bugün nasıl yardımcı olabilirim?
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={m.id || idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg max-w-[80%] text-sm break-normal hyphens-auto`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(m.content) }}
                >
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-1 text-gray-400 pl-1">
                <span className="inline-block h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="inline-block h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="inline-block h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="border-t border-gray-200 p-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Mesaj yazın..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="inline-flex items-center justify-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                aria-label="Gönder"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



