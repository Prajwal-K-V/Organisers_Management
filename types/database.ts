export type UserRole = "super_admin" | "organizer";
export type TournamentStatus = "draft" | "published" | "completed";
export type PlayerStatus = "available" | "sold" | "unsold";
export type AuctionSessionStatus = "scheduled" | "live" | "paused" | "ended";
export type LedgerEntryType =
  | "opening_balance"
  | "bid"
  | "adjustment"
  | "expense"
  | "refund"
  | "income";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Tournament = {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: TournamentStatus;
  settings: { min_bid_increment?: number };
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  tournament_id: string;
  name: string;
  purse_total: number;
  purse_remaining: number;
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  tournament_id: string;
  team_id: string | null;
  player_code: string;
  name: string;
  role: string;
  base_price: number;
  sold_price: number | null;
  status: PlayerStatus;
  created_at: string;
  updated_at: string;
};

export type AuctionSession = {
  id: string;
  tournament_id: string;
  status: AuctionSessionStatus;
  current_player_id: string | null;
  created_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Bid = {
  id: string;
  auction_session_id: string;
  player_id: string;
  team_id: string;
  amount: number;
  created_by: string;
  created_at: string;
};

export type FinancialLedgerEntry = {
  id: string;
  tournament_id: string;
  team_id: string | null;
  entry_type: LedgerEntryType;
  amount: number;
  reference_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

type Tables = {
  profiles: {
    Row: Profile;
    Insert: {
      id: string;
      email: string;
      full_name?: string | null;
      role?: UserRole;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      email?: string;
      full_name?: string | null;
      role?: UserRole;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  tournaments: {
    Row: Tournament;
    Insert: {
      id?: string;
      organizer_id: string;
      name: string;
      description?: string | null;
      starts_at?: string | null;
      ends_at?: string | null;
      status?: TournamentStatus;
      settings?: { min_bid_increment?: number };
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables["tournaments"]["Insert"]>;
    Relationships: [];
  };
  teams: {
    Row: Team;
    Insert: {
      id?: string;
      tournament_id: string;
      name: string;
      purse_total?: number;
      purse_remaining?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables["teams"]["Insert"]>;
    Relationships: [];
  };
  players: {
    Row: Player;
    Insert: {
      id?: string;
      tournament_id: string;
      team_id?: string | null;
      player_code?: string;
      name: string;
      role?: string;
      base_price?: number;
      sold_price?: number | null;
      status?: PlayerStatus;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables["players"]["Insert"]>;
    Relationships: [];
  };
  auction_sessions: {
    Row: AuctionSession;
    Insert: {
      id?: string;
      tournament_id: string;
      status?: AuctionSessionStatus;
      current_player_id?: string | null;
      created_by?: string;
      started_at?: string | null;
      ended_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables["auction_sessions"]["Insert"]>;
    Relationships: [];
  };
  bids: {
    Row: Bid;
    Insert: {
      id?: string;
      auction_session_id: string;
      player_id: string;
      team_id: string;
      amount: number;
      created_by: string;
      created_at?: string;
    };
    Update: Partial<Tables["bids"]["Insert"]>;
    Relationships: [
      {
        foreignKeyName: "bids_team_id_fkey";
        columns: ["team_id"];
        isOneToOne: false;
        referencedRelation: "teams";
        referencedColumns: ["id"];
      },
    ];
  };
  financial_ledger: {
    Row: FinancialLedgerEntry;
    Insert: {
      id?: string;
      tournament_id: string;
      team_id?: string | null;
      entry_type: LedgerEntryType;
      amount: number;
      reference_id?: string | null;
      description?: string | null;
      created_by?: string | null;
      created_at?: string;
    };
    Update: Partial<Tables["financial_ledger"]["Insert"]>;
    Relationships: [];
  };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: {
      place_bid: {
        Args: {
          p_auction_session_id: string;
          p_team_id: string;
          p_amount: number;
        };
        Returns: string;
      };
      close_lot: {
        Args: {
          p_auction_session_id: string;
          p_mark_unsold?: boolean;
        };
        Returns: undefined;
      };
      ensure_profile: {
        Args: Record<string, never>;
        Returns: Profile;
      };
    };
    Enums: {
      user_role: UserRole;
      tournament_status: TournamentStatus;
      player_status: PlayerStatus;
      auction_session_status: AuctionSessionStatus;
      ledger_entry_type: LedgerEntryType;
    };
    CompositeTypes: Record<string, never>;
  };
};
