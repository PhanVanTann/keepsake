export type ReportReason = 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'SCAM' | 'OTHER';

export type Report = {
  id: string;
  reporterId: string;
  postId: string;
  reason: ReportReason;
  createdAt: string;
};

export type Block = {
  blockerId: string;
  blockedId: string;
  createdAt: string;
};
