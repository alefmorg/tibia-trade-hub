export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          expires_at: string | null
          featured: boolean
          id: string
          image_url: string | null
          item_id: string | null
          likes_count: number
          price: string | null
          pvp_type: string
          status: string
          tier: number | null
          title: string
          type: string
          updated_at: string
          user_id: string
          world: string
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          item_id?: string | null
          likes_count?: number
          price?: string | null
          pvp_type?: string
          status?: string
          tier?: number | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          world: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          item_id?: string | null
          likes_count?: number
          price?: string | null
          pvp_type?: string
          status?: string
          tier?: number | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          world?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          ad_id: string
          buyer_id: string
          created_at: string
          id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          buyer_id: string
          created_at?: string
          id?: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          buyer_id?: string
          created_at?: string
          id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_requests: {
        Row: {
          admin_notes: string | null
          amount_coins: number
          amount_gold: number
          created_at: string
          id: string
          reviewed_by: string | null
          screenshot_url: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_coins: number
          amount_gold: number
          created_at?: string
          id?: string
          reviewed_by?: string | null
          screenshot_url: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_coins?: number
          amount_gold?: number
          created_at?: string
          id?: string
          reviewed_by?: string | null
          screenshot_url?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_coins: number
          created_at: string
          id: string
          message: string | null
          user_id: string
        }
        Insert: {
          amount_coins: number
          created_at?: string
          id?: string
          message?: string | null
          user_id: string
        }
        Update: {
          amount_coins?: number
          created_at?: string
          id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_options: {
        Row: {
          active: boolean
          created_at: string
          filter_group: string
          id: string
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          filter_group: string
          id?: string
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          filter_group?: string
          id?: string
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      highlight_plans: {
        Row: {
          active: boolean
          created_at: string
          duration_days: number
          id: string
          name: string
          price_coins: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_days: number
          id?: string
          name: string
          price_coins: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_days?: number
          id?: string
          name?: string
          price_coins?: number
          sort_order?: number
        }
        Relationships: []
      }
      intermediation_requests: {
        Row: {
          admin_notes: string | null
          contact_info: string
          created_at: string
          estimated_value: string | null
          id: string
          item_description: string
          notes: string | null
          reviewed_by: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          contact_info: string
          created_at?: string
          estimated_value?: string | null
          id?: string
          item_description: string
          notes?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          contact_info?: string
          created_at?: string
          estimated_value?: string | null
          id?: string
          item_description?: string
          notes?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          tier: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          tier?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          tier?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_links: {
        Row: {
          active: boolean
          color: string
          created_at: string
          icon_url: string | null
          id: string
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          icon_url?: string | null
          id?: string
          label: string
          sort_order?: number
          url: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          icon_url?: string | null
          id?: string
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          ad_id: string
          amount: string
          created_at: string
          currency: string
          id: string
          message: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          amount: string
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          amount?: string
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          bio: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      raffle_numbers: {
        Row: {
          created_at: string
          id: string
          number: number
          raffle_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          raffle_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          raffle_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_numbers_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_prizes: {
        Row: {
          created_at: string
          delivered: boolean
          delivered_at: string | null
          id: string
          prize_description: string | null
          prize_name: string
          prize_number: number
          raffle_id: string
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          id?: string
          prize_description?: string | null
          prize_name: string
          prize_number: number
          raffle_id: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          id?: string
          prize_description?: string | null
          prize_name?: string
          prize_number?: number
          raffle_id?: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_prizes_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          created_at: string
          description: string | null
          draw_date: string | null
          federal_lottery_ref: string | null
          id: string
          image_url: string | null
          price_per_number: number
          status: string
          title: string
          total_numbers: number
          updated_at: string
          winner_number: number | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          draw_date?: string | null
          federal_lottery_ref?: string | null
          id?: string
          image_url?: string | null
          price_per_number: number
          status?: string
          title: string
          total_numbers?: number
          updated_at?: string
          winner_number?: number | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          draw_date?: string | null
          federal_lottery_ref?: string | null
          id?: string
          image_url?: string | null
          price_per_number?: number
          status?: string
          title?: string
          total_numbers?: number
          updated_at?: string
          winner_number?: number | null
          winner_user_id?: string | null
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          sort_order: number
          title: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          title?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_settings: {
        Row: {
          ad_duration_days: number
          created_at: string
          deposit_char_name: string | null
          gold_to_coins_rate: number | null
          id: string
          updated_at: string
        }
        Insert: {
          ad_duration_days?: number
          created_at?: string
          deposit_char_name?: string | null
          gold_to_coins_rate?: number | null
          id?: string
          updated_at?: string
        }
        Update: {
          ad_duration_days?: number
          created_at?: string
          deposit_char_name?: string | null
          gold_to_coins_rate?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string
          custom_color: string | null
          custom_label: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          custom_color?: string | null
          custom_label?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          custom_color?: string | null
          custom_label?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      raffle_numbers_public: {
        Row: {
          created_at: string | null
          id: string | null
          number: number | null
          raffle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          number?: number | null
          raffle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          number?: number | null
          raffle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_numbers_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_balance: {
        Args: { p_amount: number; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      admin_bulk_delete: {
        Args: { p_older_than_days?: number; p_target: string }
        Returns: number
      }
      approve_deposit: { Args: { p_deposit_id: string }; Returns: undefined }
      buy_raffle_number: {
        Args: { p_quantity?: number; p_raffle_id: string }
        Returns: number[]
      }
      claim_raffle_prize: {
        Args: { p_number: number; p_raffle_id: string; p_user_id: string }
        Returns: undefined
      }
      delete_ad_cascade: { Args: { _ad_id: string }; Returns: undefined }
      donate_coins: {
        Args: { p_amount: number; p_message?: string }
        Returns: string
      }
      draw_raffle_winner: {
        Args: {
          p_lottery_ref?: string
          p_raffle_id: string
          p_winner_number: number
        }
        Returns: string
      }
      get_ad_duration_days: { Args: never; Returns: number }
      get_admin_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      highlight_ad: {
        Args: { p_ad_id: string; p_plan_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_ticket_participant: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      notify_admins: {
        Args: { p_message: string; p_title: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      badge_type:
        | "premium_verified"
        | "trusted_trader"
        | "top_trader"
        | "veteran"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      badge_type: [
        "premium_verified",
        "trusted_trader",
        "top_trader",
        "veteran",
        "custom",
      ],
    },
  },
} as const
