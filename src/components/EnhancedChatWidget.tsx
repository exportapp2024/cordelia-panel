import React from "react";
import { MessageCircle, X, Send, Download, History, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { sendChatMessage, fetchChatHistory } from "../lib/api";
import { MedicalFileData } from "../types/medicalFile";
import {
  generateEpicrisisDocument,
  generateFitToFlightDocument,
  generateRestReportDocument,
} from "../utils/documentGenerator";

interface ChatHistoryItem {
  threadId: string;
  title: string;
  createdAt: number;
  lastMessageAt: number;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    id?: string;
    created_at?: string;
  }>;
}

const STORAGE_KEY = "cordelia-chat-history";
const MAX_TITLE_LENGTH = 40;

interface EnhancedChatWidgetProps {
  medicalFileData?: MedicalFileData;
  patientData?: Record<string, unknown>;
  patientId?: string;
}

export const EnhancedChatWidget: React.FC<EnhancedChatWidgetProps> = ({
  medicalFileData,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [threadId, setThreadId] = React.useState<string | undefined>(undefined);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<
    Array<{
      id?: string;
      role: "user" | "assistant";
      content: string;
      created_at?: string;
    }>
  >([]);
  const [chatHistory, setChatHistory] = React.useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const chatPanelRef = React.useRef<HTMLDivElement | null>(null);
  const floatingButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const historyDropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Local Storage Utility Functions
  const loadChatHistory = React.useCallback((): ChatHistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatHistoryItem[];
        // Sort by lastMessageAt descending (newest first)
        return parsed.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
    return [];
  }, []);

  const saveChatToHistory = React.useCallback(
    (chat: ChatHistoryItem) => {
      try {
        const history = loadChatHistory();
        const existingIndex = history.findIndex(
          (item) => item.threadId === chat.threadId
        );
        
        if (existingIndex >= 0) {
          // Update existing chat
          history[existingIndex] = chat;
        } else {
          // Add new chat
          history.push(chat);
        }
        
        // Sort by lastMessageAt descending
        history.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        setChatHistory(history);
      } catch (error) {
        console.error("Error saving chat to history:", error);
      }
    },
    [loadChatHistory]
  );

  const deleteChatFromHistory = React.useCallback((threadIdToDelete: string) => {
    try {
      const history = loadChatHistory();
      const filtered = history.filter(
        (item) => item.threadId !== threadIdToDelete
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      setChatHistory(filtered);
      
      // If deleted chat was active, clear it
      if (threadId === threadIdToDelete) {
        setThreadId(undefined);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting chat from history:", error);
    }
  }, [loadChatHistory, threadId]);

  const getChatById = React.useCallback(
    (threadIdToFind: string): ChatHistoryItem | undefined => {
      const history = loadChatHistory();
      return history.find((item) => item.threadId === threadIdToFind);
    },
    [loadChatHistory]
  );

  const createChatTitle = React.useCallback((firstMessage: string): string => {
    const trimmed = firstMessage.trim();
    if (trimmed.length <= MAX_TITLE_LENGTH) {
      return trimmed;
    }
    return trimmed.substring(0, MAX_TITLE_LENGTH) + "...";
  }, []);

  const renderMarkdownHtml = React.useCallback((raw: string): string => {
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let text = escapeHtml(raw);
    // links [text](url)
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="underline text-blue-600 hover:text-blue-800">$1</a>'
    );
    // inline code
    text = text.replace(
      /`([^`]+)`/g,
      '<code class="px-1 py-0.5 bg-gray-100 rounded text-gray-800">$1</code>'
    );
    // bold
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italics
    text = text.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, "$1<em>$2</em>");
    // line breaks
    text = text.replace(/\n/g, "<br/>");
    return text;
  }, []);

  const onToggle = () => setOpen((v) => !v);

  const loadChat = React.useCallback(
    (threadIdToLoad: string) => {
      const chat = getChatById(threadIdToLoad);
      if (chat) {
        setThreadId(threadIdToLoad);
        setMessages(chat.messages);
        setIsHistoryOpen(false);
      }
    },
    [getChatById]
  );

  const startNewChat = React.useCallback(() => {
    setThreadId(undefined);
    setMessages([]);
    setIsHistoryOpen(false);
    textareaRef.current?.focus();
  }, []);

  const adjustTextareaHeight = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // Approximate line height in pixels
      const maxHeight = lineHeight * 4; // Maximum 4 lines

      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.height = `${scrollHeight}px`;
        textareaRef.current.style.overflowY = "hidden";
      } else {
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflowY = "auto";
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
        let content = m.content || "";
        content = content.replace(/\[PATIENTS:\[.+?\]\]\n?/g, "");
        return {
          id: m.id,
          role: m.role as "user" | "assistant",
          content,
          created_at: m.created_at,
        };
      });
      setMessages(mapped);
      
      // Update local storage with API data
      const existingChat = getChatById(threadId);
      if (mapped.length > 0) {
        const chatItem: ChatHistoryItem = {
          threadId,
          title: existingChat?.title || createChatTitle(mapped[0]?.content || ""),
          createdAt: existingChat?.createdAt || Date.now(),
          lastMessageAt: Date.now(),
          messages: mapped,
        };
        saveChatToHistory(chatItem);
      }
    } catch {
      // If API fails, try to load from local storage
      const localChat = getChatById(threadId);
      if (localChat) {
        setMessages(localChat.messages);
      }
    }
  }, [user, threadId, getChatById, createChatTitle, saveChatToHistory]);

  // Load chat history on mount
  React.useEffect(() => {
    const history = loadChatHistory();
    setChatHistory(history);
  }, [loadChatHistory]);

  React.useEffect(() => {
    if (open) {
      loadHistory();
      // Auto-focus input when chatbot opens
      textareaRef.current?.focus();
    }
  }, [open, loadHistory]);

  React.useEffect(() => {
    // Auto-scroll to bottom on new messages
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close chatbot when clicking outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking inside the chat panel or on the floating button
      if (
        chatPanelRef.current?.contains(target) ||
        floatingButtonRef.current?.contains(target)
      ) {
        return;
      }
      
      // Close the chatbot
      setOpen(false);
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close history dropdown when clicking outside
  React.useEffect(() => {
    if (!isHistoryOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (historyDropdownRef.current?.contains(target)) {
        return;
      }
      
      setIsHistoryOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHistoryOpen]);

  const sendMessage = async () => {
    if (!user || !input.trim()) return;
    const text = input.trim();
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
    
    const userMessage = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        userId: user.id,
        threadId,
        message: text,
      });
      
      const newThreadId = res.thread_id;
      const isNewChat = !threadId;
      
      if (isNewChat) {
        setThreadId(newThreadId);
      }

      let displayMessage = res.message;

      // Handle document generation
      if (res.documentData) {
        const { documentType, patientData, language, patientName } =
          res.documentData;

        // Store document info for download button
        const docInfo = {
          documentType,
          language,
          patientData,
          patientName,
          timestamp: Date.now(),
        };

        // Embed in message for download button
        displayMessage += `\n\n[DOCUMENT:${JSON.stringify(docInfo)}]`;
      }

      const assistantMessage = { role: "assistant" as const, content: displayMessage };
      setMessages((prev) => {
        const updatedMessages = [...prev, assistantMessage];
        
        // Save to local storage
        const finalThreadId = newThreadId || threadId;
        if (finalThreadId) {
          const existingChat = getChatById(finalThreadId);
          
          const chatItem: ChatHistoryItem = {
            threadId: finalThreadId,
            title: isNewChat
              ? createChatTitle(text)
              : existingChat?.title || createChatTitle(text),
            createdAt: isNewChat ? Date.now() : (existingChat?.createdAt || Date.now()),
            lastMessageAt: Date.now(),
            messages: updatedMessages,
          };
          
          saveChatToHistory(chatItem);
        }
        
        return updatedMessages;
      });
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = { role: "assistant" as const, content: "Üzgünüm, bir hata oluştu." };
      setMessages((prev) => {
        const updatedMessages = [...prev, errorMessage];
        
        // Save error message to history if threadId exists
        if (threadId) {
          const existingChat = getChatById(threadId);
          
          const chatItem: ChatHistoryItem = {
            threadId,
            title: existingChat?.title || createChatTitle(text),
            createdAt: existingChat?.createdAt || Date.now(),
            lastMessageAt: Date.now(),
            messages: updatedMessages,
          };
          
          saveChatToHistory(chatItem);
        }
        
        return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        ref={floatingButtonRef}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Chatbotu aç"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div 
          ref={chatPanelRef}
          className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50 md:z-40 w-full md:w-96 md:max-w-[95vw] bg-white md:rounded-xl md:shadow-2xl md:border md:border-gray-200 overflow-hidden flex flex-col h-full md:h-[560px]"
        >
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 relative">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Cordelia AI
              </h3>
              <p className="text-xs text-gray-500 hidden md:block">
                {medicalFileData
                  ? "Belge oluşturma ve hasta işlemleri için yazın"
                  : "Randevu ve hasta işlemleri için yazın"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={historyDropdownRef}>
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Chat geçmişi"
                >
                  <History className="w-5 h-5" />
                </button>
                {isHistoryOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={startNewChat}
                        className="w-full px-3 py-2 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        + Yeni Sohbet
                      </button>
                    </div>
                    {chatHistory.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        Henüz chat geçmişi yok
                      </div>
                    ) : (
                      <div className="border-t border-gray-200">
                        {chatHistory.map((chat) => (
                          <div
                            key={chat.threadId}
                            className={`group flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors ${
                              threadId === chat.threadId ? "bg-emerald-50" : ""
                            }`}
                          >
                            <button
                              onClick={() => loadChat(chat.threadId)}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {chat.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(chat.lastMessageAt).toLocaleDateString(
                                  "tr-TR",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChatFromHistory(chat.threadId);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              aria-label="Chat'i sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onToggle}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3 overflow-auto flex-1">
            {messages.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-10">
                {medicalFileData ? (
                  <div>
                    <p>Merhaba! Bugün nasıl yardımcı olabilirim?</p>
                    <p className="mt-2 text-emerald-600">
                      💡 "Epicrisis belgesi oluştur", "Uçuşa uygunluk belgesi
                      hazırla" veya "İstirahat raporu çıkar" yazabilirsiniz.
                    </p>
                  </div>
                ) : (
                  "Merhaba! Bugün nasıl yardımcı olabilirim?"
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
                  messageContent = m.content
                    .replace(/\[DOCUMENT:[\s\S]*?\]/, "")
                    .trim();
                } catch (e) {
                  console.error("Failed to parse document info:", e);
                }
              }

              return (
                <div
                  key={m.id || idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`${
                      m.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    } px-3 py-2 rounded-lg max-w-[80%] text-sm break-normal hyphens-auto`}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownHtml(messageContent),
                      }}
                    />
                    {hasDocument && documentInfo && (
                      <button
                        onClick={async () => {
                          try {
                            // Use EXACT same functions as manual document creation
                            const { documentType, language, patientData } =
                              documentInfo;

                            if (!patientData || !patientData.medical_file) {
                              alert(
                                "Belge oluşturmak için gerekli tıbbi veriler bulunamadı."
                              );
                              return;
                            }

                            // Default to Turkish if language is not specified
                            const documentLanguage = (language === 'en' || language === 'tr') ? language : 'tr';

                            let pdfResult;
                            const medicalData = patientData.medical_file;

                            if (documentType === "epicrisis") {
                              pdfResult = await generateEpicrisisDocument(
                                medicalData,
                                patientData,
                                documentLanguage
                              );
                            } else if (documentType === "fit_to_flight") {
                              pdfResult = await generateFitToFlightDocument(
                                medicalData,
                                patientData,
                                documentLanguage
                              );
                            } else if (documentType === "rest_report") {
                              pdfResult = await generateRestReportDocument(
                                medicalData,
                                patientData,
                                documentLanguage
                              );
                            } else {
                              alert("Bilinmeyen belge türü.");
                              return;
                            }

                            if (pdfResult) {
                              const link = document.createElement("a");
                              link.href = pdfResult.url;
                              link.download = pdfResult.filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(pdfResult.url);
                            } else {
                              alert("Belge oluşturulamadı.");
                            }
                          } catch (error) {
                            console.error("Document generation error:", error);
                            alert(
                              "Belge oluşturulurken hata oluştu: " +
                                (error as Error).message
                            );
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
                <span
                  className="inline-block h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="inline-block h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="inline-block h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="border-t border-gray-200 p-2">
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                placeholder={
                  medicalFileData
                    ? "Belge oluşturmak için yazın..."
                    : "Mesaj yazın..."
                }
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none min-h-[40px] max-h-[96px]"
                rows={1}
                style={{ height: "40px" }}
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
