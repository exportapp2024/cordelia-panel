import React from 'react';
import { MessageCircle, X, Send, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage, fetchChatHistory } from '../lib/api';
import { MedicalFileData } from '../types/medicalFile';
import { generateEpicrisisDocument, generateFitToFlightDocument, generateRestReportDocument } from '../utils/documentGenerator';

interface EnhancedChatWidgetProps {
  medicalFileData?: MedicalFileData;
  patientData?: Record<string, unknown>;
  patientId?: string;
}

export const EnhancedChatWidget: React.FC<EnhancedChatWidgetProps> = ({
  medicalFileData
}) => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [threadId, setThreadId] = React.useState<string | undefined>(undefined);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Array<{ id?: string; role: 'user'|'assistant'; content: string; created_at?: string }>>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

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

  const adjustTextareaHeight = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // Approximate line height in pixels
      const maxHeight = lineHeight * 4; // Maximum 4 lines
      
      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.height = `${scrollHeight}px`;
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflowY = 'auto';
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const loadHistory = React.useCallback(async () => {
    if (!user || !threadId) return;
    try {
      const data = await fetchChatHistory({ userId: user.id, threadId });
      const mapped = (data.messages || []).map((m) => {
        // Remove embedded patient data tags from display
        let content = m.content || '';
        content = content.replace(/\[PATIENTS:\[.+?\]\]\n?/g, '');
        return { id: m.id, role: m.role as 'user'|'assistant', content, created_at: m.created_at };
      });
      setMessages(mapped);
    } catch {
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
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    
    try {
      const res = await sendChatMessage({ userId: user.id, threadId, message: text });
      if (!threadId) setThreadId(res.thread_id);
      
      let displayMessage = res.message;
      
      // Handle document generation
      if (res.documentData) {
        const { documentType, patientData, language, patientName } = res.documentData;
        
        // Store document info for download button
        const docInfo = {
          documentType,
          language,
          patientData,
          patientName,
          timestamp: Date.now()
        };
        
        // Embed in message for download button
        displayMessage += `\n\n[DOCUMENT:${JSON.stringify(docInfo)}]`;
      }
      
      setMessages((prev) => [...prev, { role: 'assistant', content: displayMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
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
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50 md:z-40 w-full md:w-96 md:max-w-[95vw] bg-white md:rounded-xl md:shadow-2xl md:border md:border-gray-200 overflow-hidden flex flex-col h-full md:h-[560px]">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Cordelia AI</h3>
              <p className="text-xs text-gray-500 hidden md:block">
                {medicalFileData ? 'Belge oluşturma ve hasta işlemleri için yazın' : 'Randevu ve hasta işlemleri için yazın'}
              </p>
            </div>
            <button
              onClick={onToggle}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 space-y-3 overflow-auto flex-1">
            {messages.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-10">
                {medicalFileData ? (
                  <div>
                    <p>Merhaba! Bugün nasıl yardımcı olabilirim?</p>
                    <p className="mt-2 text-emerald-600">
                      💡 "Epicrisis belgesi oluştur", "Uçuşa uygunluk belgesi hazırla" veya "İstirahat raporu çıkar" yazabilirsiniz.
                    </p>
                  </div>
                ) : (
                  'Merhaba! Bugün nasıl yardımcı olabilirim?'
                )}
              </div>
            )}
            {messages.map((m, idx) => {
              // Check for document download in message
              const docMatch = m.content.match(/\[DOCUMENT:([\s\S]*?)\]/);
              const hasDocument = docMatch !== null;
              let messageContent = m.content;
              let documentInfo = null;
              
              if (hasDocument && docMatch) {
                try {
                  documentInfo = JSON.parse(docMatch[1]);
                  messageContent = m.content.replace(/\[DOCUMENT:[\s\S]*?\]/, '').trim();
                } catch (e) {
                  console.error('Failed to parse document info:', e);
                }
              }
              
              return (
                <div key={m.id || idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg max-w-[80%] text-sm break-normal hyphens-auto`}>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(messageContent) }} />
                    {hasDocument && documentInfo && (
                      <button
                        onClick={async () => {
                          try {
                            // Use EXACT same functions as manual document creation
                            const { documentType, language, patientData } = documentInfo;
                            
                            if (!patientData || !patientData.medical_file) {
                              alert('Belge oluşturmak için gerekli tıbbi veriler bulunamadı.');
                              return;
                            }
                            
                            let pdfResult;
                            const medicalData = patientData.medical_file;
                            
                            if (documentType === 'epicrisis') {
                              pdfResult = await generateEpicrisisDocument(medicalData, patientData, language);
                            } else if (documentType === 'fit_to_flight') {
                              pdfResult = await generateFitToFlightDocument(medicalData, patientData, language);
                            } else if (documentType === 'rest_report') {
                              pdfResult = await generateRestReportDocument(medicalData, patientData, language);
                            } else {
                              alert('Bilinmeyen belge türü.');
                              return;
                            }
                            
                            if (pdfResult) {
                              const link = document.createElement('a');
                              link.href = pdfResult.url;
                              link.download = pdfResult.filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(pdfResult.url);
                            } else {
                              alert('Belge oluşturulamadı.');
                            }
                          } catch (error) {
                            console.error('Document generation error:', error);
                            alert('Belge oluşturulurken hata oluştu: ' + (error as Error).message);
                          }
                        }}
                        className="mt-2 inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Belgeyi İndir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                placeholder={medicalFileData ? "Belge oluşturmak için yazın..." : "Mesaj yazın..."}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none min-h-[40px] max-h-[96px]"
                rows={1}
                style={{ height: '40px' }}
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
