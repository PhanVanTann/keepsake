export type NotificationKind =
  | 'BUDGET_80_PERCENT'
  | 'BUDGET_100_PERCENT'
  | 'BUDGET_EXCEEDED'
  | 'GOAL_AT_RISK'
  | 'NEW_MESSAGE'
  | 'FRIEND_REQUEST'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'INCOME_RECEIVED'
  | 'REACTION'
  | 'POST_REPLY';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
};
