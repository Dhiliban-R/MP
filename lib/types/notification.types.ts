export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'donation' | 'reservation' | 'user';
}
