// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

export interface ChatMessageResponse {
  thread_id: string;
  message: string;
}

export async function sendChatMessage(params: { userId: string; threadId?: string; message: string }): Promise<ChatMessageResponse> {
  const res = await fetch(buildApiUrl('/chat/message'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: params.userId, thread_id: params.threadId, message: params.message })
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function fetchChatHistory(params: { userId: string; threadId: string }) {
  const url = buildApiUrl(`/chat/history/${params.threadId}?user_id=${encodeURIComponent(params.userId)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch history failed');
  return res.json() as Promise<{ messages: Array<{ id: string; role: 'user'|'assistant'|'system'|'tool'; content: string; created_at: string }> }>;
}
