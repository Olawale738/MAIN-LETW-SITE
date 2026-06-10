/**
 * 360-Degree Chat Features API Client
 * Reactions, replies, attachments, polls, mentions, presence, etc.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || 'Request failed')
  }
  if (res.status === 204) return {} as T
  return res.json()
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Reaction {
  emoji: string
  count: number
  users: Array<{ id: string; name: string }>
}

export interface MessageAttachment {
  id: string
  attachment_type: 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'event'
  file_url: string
  file_name?: string
  file_size?: number
  mime_type?: string
  thumbnail_url?: string
  duration_seconds?: number
  width?: number
  height?: number
  latitude?: number
  longitude?: number
  transcription?: string
}

export interface PinnedMessage {
  id: string
  message_id: string
  body: string
  sender_name: string
  pinned_at: string
  created_at: string
}

export interface StarredMessage {
  id: string
  message_id: string
  body: string
  sender_name: string
  note?: string
  starred_at: string
}

export interface ConvSettings {
  is_muted: boolean
  muted_until?: string
  is_archived: boolean
  is_pinned: boolean
  custom_nickname?: string
  custom_theme?: string
  notification_sound?: string
  disappearing_messages_seconds?: number
}

export interface UserPresence {
  is_online: boolean
  last_seen_at?: string
  status_message?: string
}

export interface PollResult {
  question: string
  is_closed: boolean
  closes_at?: string
  total_votes: number
  results: Array<{
    index: number
    option: string
    votes: number
    percentage: number
  }>
}

export interface MessageDetails {
  message_id: string
  body: string
  sender_id: string
  edited_at?: string
  edit_count: number
  reactions: Reaction[]
  reply_to?: {
    message_id: string
    quoted_text?: string
    quoted_sender_name?: string
  }
  attachments: MessageAttachment[]
}

export interface QuickReply {
  id: string
  shortcut: string
  content: string
  category?: string
  use_count: number
}

// ─── API ────────────────────────────────────────────────────────────────────

export const chatExtensionsApi = {
  // ─── Reactions ───────────────────────────────────────────────────────────
  addReaction: (messageId: string, emoji: string) =>
    request(`/chat/messages/${messageId}/reactions`, {
      method: 'POST', body: JSON.stringify({ emoji }),
    }),
  getReactions: (messageId: string): Promise<Reaction[]> =>
    request(`/chat/messages/${messageId}/reactions`),
  removeReaction: (messageId: string, emoji: string) =>
    request(`/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    }),

  // ─── Replies ─────────────────────────────────────────────────────────────
  replyToMessage: (conversationId: string, repliesToMessageId: string, body: string) =>
    request(`/chat/conversations/${conversationId}/messages/reply`, {
      method: 'POST',
      body: JSON.stringify({ replies_to_message_id: repliesToMessageId, body }),
    }),

  // ─── Attachments ─────────────────────────────────────────────────────────
  addAttachment: (data: {
    message_id: string
    attachment_type: MessageAttachment['attachment_type']
    file_url: string
    file_name?: string
    file_size?: number
    mime_type?: string
    thumbnail_url?: string
    duration_seconds?: number
    width?: number
    height?: number
    latitude?: number
    longitude?: number
    extra_data?: any
    transcription?: string
  }) =>
    request('/chat/attachments', {
      method: 'POST', body: JSON.stringify(data),
    }),
  listAttachments: (messageId: string): Promise<MessageAttachment[]> =>
    request(`/chat/messages/${messageId}/attachments`),

  // ─── Edit/Delete ─────────────────────────────────────────────────────────
  editMessage: (messageId: string, newBody: string) =>
    request(`/chat/messages/${messageId}/edit`, {
      method: 'PUT', body: JSON.stringify({ new_body: newBody }),
    }),
  getEditHistory: (messageId: string) =>
    request(`/chat/messages/${messageId}/edit-history`),
  deleteMessage: (messageId: string, forEveryone = false) =>
    request(`/chat/messages/${messageId}?for_everyone=${forEveryone}`, {
      method: 'DELETE',
    }),

  // ─── Pin Messages ────────────────────────────────────────────────────────
  pinMessage: (conversationId: string, messageId: string) =>
    request(`/chat/conversations/${conversationId}/messages/${messageId}/pin`, {
      method: 'POST',
    }),
  listPinned: (conversationId: string): Promise<PinnedMessage[]> =>
    request(`/chat/conversations/${conversationId}/pinned`),
  unpinMessage: (conversationId: string, messageId: string) =>
    request(`/chat/conversations/${conversationId}/messages/${messageId}/pin`, {
      method: 'DELETE',
    }),

  // ─── Star Messages ───────────────────────────────────────────────────────
  starMessage: (messageId: string, note?: string) =>
    request(`/chat/messages/${messageId}/star`, {
      method: 'POST', body: JSON.stringify({ note: note || null }),
    }),
  listStarred: (): Promise<StarredMessage[]> =>
    request('/chat/starred'),
  unstarMessage: (messageId: string) =>
    request(`/chat/messages/${messageId}/star`, { method: 'DELETE' }),

  // ─── Conversation Settings ───────────────────────────────────────────────
  getConvSettings: (conversationId: string): Promise<ConvSettings> =>
    request(`/chat/conversations/${conversationId}/settings`),
  updateConvSettings: (conversationId: string, settings: Partial<ConvSettings>) =>
    request(`/chat/conversations/${conversationId}/settings`, {
      method: 'PATCH', body: JSON.stringify(settings),
    }),
  muteConversation: (conversationId: string, hours?: number) =>
    request(`/chat/conversations/${conversationId}/mute${hours ? `?hours=${hours}` : ''}`, {
      method: 'POST',
    }),
  archiveConversation: (conversationId: string) =>
    request(`/chat/conversations/${conversationId}/archive`, { method: 'POST' }),
  pinConversation: (conversationId: string) =>
    request(`/chat/conversations/${conversationId}/pin-conversation`, { method: 'POST' }),

  // ─── User Blocking ───────────────────────────────────────────────────────
  blockUser: (userId: string, reason?: string) =>
    request('/chat/blocks', {
      method: 'POST', body: JSON.stringify({ user_id: userId, reason }),
    }),
  listBlocks: () => request('/chat/blocks'),
  unblockUser: (userId: string) =>
    request(`/chat/blocks/${userId}`, { method: 'DELETE' }),

  // ─── Presence ────────────────────────────────────────────────────────────
  updatePresence: (data: {
    is_online: boolean
    status_message?: string
    last_seen_visibility?: 'everyone' | 'contacts' | 'nobody'
  }) =>
    request('/chat/presence', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getPresence: (userId: string): Promise<UserPresence> =>
    request(`/chat/presence/${userId}`),

  // ─── Polls ───────────────────────────────────────────────────────────────
  createPoll: (data: {
    question: string
    options: string[]
    allow_multiple?: boolean
    is_anonymous?: boolean
    closes_in_hours?: number
    conversation_id: string
  }) =>
    request('/chat/polls', {
      method: 'POST', body: JSON.stringify(data),
    }),
  votePoll: (pollId: string, optionIndex: number) =>
    request(`/chat/polls/${pollId}/vote?option_index=${optionIndex}`, {
      method: 'POST',
    }),
  getPollResults: (pollId: string): Promise<PollResult> =>
    request(`/chat/polls/${pollId}/results`),

  // ─── Message Status ──────────────────────────────────────────────────────
  markDelivered: (messageId: string) =>
    request(`/chat/messages/${messageId}/delivered`, { method: 'POST' }),
  markSeen: (messageId: string) =>
    request(`/chat/messages/${messageId}/seen`, { method: 'POST' }),
  getMessageStatus: (messageId: string) =>
    request(`/chat/messages/${messageId}/status`),

  // ─── Forward ─────────────────────────────────────────────────────────────
  forwardMessage: (originalMessageId: string, targetConversationId: string) =>
    request('/chat/messages/forward', {
      method: 'POST',
      body: JSON.stringify({
        original_message_id: originalMessageId,
        target_conversation_id: targetConversationId,
      }),
    }),

  // ─── Scheduled Messages ──────────────────────────────────────────────────
  scheduleMessage: (data: {
    conversation_id: string
    body: string
    scheduled_for: string  // ISO datetime
  }) =>
    request('/chat/scheduled', {
      method: 'POST', body: JSON.stringify(data),
    }),
  listScheduled: () => request('/chat/scheduled'),
  cancelScheduled: (id: string) =>
    request(`/chat/scheduled/${id}`, { method: 'DELETE' }),

  // ─── Quick Replies ───────────────────────────────────────────────────────
  listQuickReplies: (): Promise<QuickReply[]> =>
    request('/chat/quick-replies'),
  createQuickReply: (shortcut: string, content: string, category?: string) =>
    request('/chat/quick-replies', {
      method: 'POST', body: JSON.stringify({ shortcut, content, category }),
    }),
  useQuickReply: (id: string) =>
    request(`/chat/quick-replies/${id}/use`, { method: 'POST' }),
  deleteQuickReply: (id: string) =>
    request(`/chat/quick-replies/${id}`, { method: 'DELETE' }),

  // ─── Themes ──────────────────────────────────────────────────────────────
  listThemes: () => request('/chat/themes'),

  // ─── Unified Message Details ─────────────────────────────────────────────
  getMessageDetails: (messageId: string): Promise<MessageDetails> =>
    request(`/chat/messages/${messageId}/details`),
}
