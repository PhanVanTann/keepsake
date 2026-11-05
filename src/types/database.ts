/**
 * Khớp tay với supabase/migrations/*.sql — chưa chạy `supabase gen types` vì cần project thật
 * đã link. Khi có CLI link rồi, có thể thay file này bằng lệnh generate để luôn đồng bộ schema.
 * Chỉ khai đủ các bảng đã có repo thật dùng tới. Các bảng còn lại sẽ thêm Row type khi nối repo
 * tương ứng ở đợt sau, tránh để kiểu rỗng không ai dùng.
 *
 * Mọi `Relationships` khai `[]` — các hàm repo dùng `.overrideTypes<T>()` để khẳng định kiểu kết
 * quả select có embed thủ công, thay vì dựa vào parser generic phức tạp của postgrest-js (vốn
 * cần type sinh tự động từ `supabase gen types` mới khớp chính xác).
 */

export type MoneyModeDb = 'PAYDAY' | 'TOP_UP';
export type NotificationToneDb = 'PLAYFUL' | 'SERIOUS';
export type PostPrivacyDb = 'SELF' | 'FRIENDS' | 'SELECTED_FRIENDS';
export type PostTypeDb = 'MOMENT' | 'EXPENSE';
export type ReactionEmojiDb = '❤️' | '😂' | '😮' | '😢' | '🔥';

export type UserProfileRow = {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  email: string | null;
  money_mode: MoneyModeDb;
  next_money_mode: MoneyModeDb | null;
  notification_tone: NotificationToneDb;
  last_moment_toggle: boolean;
  default_post_privacy: PostPrivacyDb;
  cycle_start_day: number;
  next_cycle_start_day: number | null;
  deletion_requested_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfileUpdate = Partial<
  Omit<UserProfileRow, 'user_id' | 'created_at' | 'updated_at'>
>;

export type CategoryRow = {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PostRow = {
  id: string;
  user_id: string;
  post_type: PostTypeDb;
  image_url: string;
  image_thumbnail_url: string | null;
  amount: number;
  content: string | null;
  category_id: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  show_location: boolean;
  privacy_type: PostPrivacyDb;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export type PostUpdate = Partial<
  Pick<PostRow, 'amount' | 'content' | 'category_id' | 'privacy_type' | 'edited_at' | 'deleted_at'>
>;

export type PostReactionRow = {
  post_id: string;
  user_id: string;
  emoji: ReactionEmojiDb;
  created_at: string;
};
export type PostReactionInsert = Pick<PostReactionRow, 'post_id' | 'user_id' | 'emoji'> &
  Partial<Pick<PostReactionRow, 'created_at'>>;

export type PostViewRow = {
  post_id: string;
  viewer_id: string;
  viewed_at: string;
};
export type PostViewInsert = Pick<PostViewRow, 'post_id' | 'viewer_id'> & Partial<Pick<PostViewRow, 'viewed_at'>>;

export type PostVisibilityRow = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};
export type PostVisibilityInsert = Pick<PostVisibilityRow, 'post_id' | 'user_id'> &
  Partial<Pick<PostVisibilityRow, 'id' | 'created_at'>>;

export type ExpenseTransactionRow = {
  id: string;
  user_id: string;
  financial_cycle_id: string;
  category_id: string;
  amount: number;
  transaction_type: 'PHOTO_EXPENSE' | 'RECURRING_EXPENSE';
  post_id: string | null;
  recurring_transaction_id: string | null;
  transaction_date: string;
  created_at: string;
  deleted_at: string | null;
};

export type CreatePostArgs = {
  p_post_type: PostTypeDb;
  p_image_path: string;
  p_amount: number;
  p_content: string | null;
  p_category_id: string | null;
  p_location_name: string | null;
  p_show_location: boolean;
  p_privacy_type: PostPrivacyDb;
  p_selected_friend_ids: string[] | null;
};

export type FriendRequestStatusDb = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type FriendRequestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatusDb;
  created_at: string;
  responded_at: string | null;
};
export type FriendRequestInsert = Pick<FriendRequestRow, 'sender_id' | 'receiver_id'>;

export type FriendshipRow = {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
};

export type InviteLinkRow = {
  code: string;
  inviter_id: string;
  expires_at: string;
  used_by: string | null;
};

export type PublicProfileRow = {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};

export type FinancialCycleRow = {
  id: string;
  user_id: string;
  money_mode: MoneyModeDb;
  start_date: string;
  end_date: string | null;
  status: 'CURRENT' | 'CLOSED' | 'FUTURE';
  carried_over_amount: number;
  created_at: string;
  closed_at: string | null;
};

export type IncomeSourceDb = 'FAMILY' | 'PART_TIME' | 'SCHOLARSHIP' | 'OTHER';
export type IncomeStatusDb = 'RECEIVED' | 'EXPECTED' | 'SKIPPED';

export type IncomeRow = {
  id: string;
  user_id: string;
  financial_cycle_id: string;
  name: string;
  amount: number;
  source: IncomeSourceDb;
  status: IncomeStatusDb;
  expected_date: string | null;
  opens_new_cycle: boolean;
  recurring_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type IncomeUpdate = Partial<Pick<IncomeRow, 'status' | 'amount'>>;

export type SavingGoalRow = {
  id: string;
  user_id: string;
  financial_cycle_id: string;
  target_remaining_amount: number;
  created_at: string;
  updated_at: string;
};

export type RecurringTransactionRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category_id: string | null;
  transaction_kind: 'INCOME' | 'EXPENSE';
  frequency: 'MONTHLY';
  execution_day: number;
  is_active: boolean;
  last_executed_at: string | null;
  next_execution_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AddIncomeArgs = {
  p_cycle_id: string;
  p_name: string;
  p_amount: number;
  p_source: IncomeSourceDb;
  p_opens_new_cycle: boolean;
};

export type ConversationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

export type ConversationMemberRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_message_id: string | null;
  last_read_at: string | null;
};

export type MessageTypeDb = 'TEXT' | 'POST_REPLY';
export type MessageStatusDb = 'SENT' | 'DELIVERED' | 'SEEN';

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageTypeDb;
  content: string | null;
  referenced_post_id: string | null;
  sent_at: string;
  delivered_at: string | null;
  seen_at: string | null;
  deleted_at: string | null;
};
export type MessageInsert = Pick<MessageRow, 'conversation_id' | 'sender_id'> &
  Partial<Pick<MessageRow, 'message_type' | 'content' | 'referenced_post_id' | 'sent_at'>>;

export type MyConversationRow = {
  conversation_id: string;
  friend_id: string;
  friend_display_name: string;
  friend_username: string;
  friend_avatar_url: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
};

export type NotificationKindDb =
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

export type NotificationRow = {
  id: string;
  user_id: string;
  kind: NotificationKindDb;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ReportReasonDb = 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'SCAM' | 'OTHER';

export type ReportRow = {
  id: string;
  reporter_id: string;
  post_id: string;
  reason: ReportReasonDb;
  created_at: string;
};

export type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow;
        Insert: Partial<UserProfileRow> & Pick<UserProfileRow, 'user_id' | 'display_name' | 'username'>;
        Update: UserProfileUpdate;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Partial<CategoryRow> & Pick<CategoryRow, 'name' | 'icon'>;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: Partial<PostRow> & Pick<PostRow, 'user_id' | 'post_type' | 'image_url'>;
        Update: PostUpdate;
        Relationships: [];
      };
      post_reactions: {
        Row: PostReactionRow;
        Insert: PostReactionInsert;
        Update: Partial<PostReactionRow>;
        Relationships: [];
      };
      post_views: {
        Row: PostViewRow;
        Insert: PostViewInsert;
        Update: Partial<PostViewRow>;
        Relationships: [];
      };
      post_visibility: {
        Row: PostVisibilityRow;
        Insert: PostVisibilityInsert;
        Update: Partial<PostVisibilityRow>;
        Relationships: [];
      };
      expense_transactions: {
        Row: ExpenseTransactionRow;
        Insert: Partial<ExpenseTransactionRow> &
          Pick<ExpenseTransactionRow, 'user_id' | 'financial_cycle_id' | 'category_id' | 'amount' | 'transaction_type'>;
        Update: Partial<ExpenseTransactionRow>;
        Relationships: [];
      };
      friend_requests: {
        Row: FriendRequestRow;
        Insert: FriendRequestInsert;
        Update: Partial<FriendRequestRow>;
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: Pick<FriendshipRow, 'user_id_1' | 'user_id_2'>;
        Update: never;
        Relationships: [];
      };
      invite_links: {
        Row: InviteLinkRow;
        Insert: Partial<InviteLinkRow> & Pick<InviteLinkRow, 'inviter_id'>;
        Update: Partial<InviteLinkRow>;
        Relationships: [];
      };
      financial_cycles: {
        Row: FinancialCycleRow;
        Insert: Partial<FinancialCycleRow> & Pick<FinancialCycleRow, 'user_id' | 'money_mode' | 'start_date'>;
        Update: Partial<FinancialCycleRow>;
        Relationships: [];
      };
      incomes: {
        Row: IncomeRow;
        Insert: Partial<IncomeRow> & Pick<IncomeRow, 'user_id' | 'financial_cycle_id' | 'name' | 'amount' | 'source'>;
        Update: IncomeUpdate;
        Relationships: [];
      };
      saving_goals: {
        Row: SavingGoalRow;
        Insert: Partial<SavingGoalRow> & Pick<SavingGoalRow, 'user_id' | 'financial_cycle_id' | 'target_remaining_amount'>;
        Update: Partial<SavingGoalRow>;
        Relationships: [];
      };
      recurring_transactions: {
        Row: RecurringTransactionRow;
        Insert: Partial<RecurringTransactionRow> &
          Pick<RecurringTransactionRow, 'user_id' | 'name' | 'amount' | 'transaction_kind' | 'execution_day' | 'next_execution_date'>;
        Update: Partial<RecurringTransactionRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Partial<ConversationRow>;
        Update: never;
        Relationships: [];
      };
      conversation_members: {
        Row: ConversationMemberRow;
        Insert: Pick<ConversationMemberRow, 'conversation_id' | 'user_id'>;
        Update: Partial<Pick<ConversationMemberRow, 'last_read_message_id' | 'last_read_at'>>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: MessageInsert;
        Update: Partial<Pick<MessageRow, 'delivered_at' | 'seen_at' | 'deleted_at'>>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: never;
        Update: Partial<Pick<NotificationRow, 'read_at'>>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Pick<ReportRow, 'reporter_id' | 'post_id' | 'reason'>;
        Update: never;
        Relationships: [];
      };
      blocks: {
        Row: BlockRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_post: {
        Args: CreatePostArgs;
        Returns: PostRow;
      };
      find_user_by_contact: {
        Args: { p_query: string };
        Returns: PublicProfileRow[];
      };
      get_public_profile: {
        Args: { p_user_id: string };
        Returns: PublicProfileRow[];
      };
      respond_to_friend_request: {
        Args: { p_request_id: string; p_accept: boolean };
        Returns: undefined;
      };
      add_friend_direct: {
        Args: { p_other_user_id: string };
        Returns: undefined;
      };
      redeem_invite_link: {
        Args: { p_code: string };
        Returns: string;
      };
      get_or_create_my_current_cycle: {
        Args: Record<string, never>;
        Returns: FinancialCycleRow;
      };
      add_income: {
        Args: AddIncomeArgs;
        Returns: IncomeRow;
      };
      get_or_create_conversation_with_friend: {
        Args: { p_friend_id: string };
        Returns: string;
      };
      get_my_conversations: {
        Args: Record<string, never>;
        Returns: MyConversationRow[];
      };
      block_user: {
        Args: { p_blocked_id: string };
        Returns: undefined;
      };
    };
  };
};
