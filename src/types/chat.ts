export interface ChatAttachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface PendingAttachment {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export type MessageType = 'text' | 'attachment';

export interface FirestoreMessage {
  text: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  unread: boolean;
  chatId: string;
  receiver: string;
  type: MessageType;
  attachment?: ChatAttachment;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const ALLOWED_EXTENSIONS_LABEL = 'PDF';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_LABEL = '10 MB';
