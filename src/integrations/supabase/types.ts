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
      admin_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          administrator_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          license_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          administrator_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          license_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          administrator_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          license_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          handle: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          handle?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          handle?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      license_activations: {
        Row: {
          activated_at: string
          deactivated_at: string | null
          device_hash: string
          id: string
          last_seen_at: string
          license_id: string
          product_identifier: string
        }
        Insert: {
          activated_at?: string
          deactivated_at?: string | null
          device_hash: string
          id?: string
          last_seen_at?: string
          license_id: string
          product_identifier: string
        }
        Update: {
          activated_at?: string
          deactivated_at?: string | null
          device_hash?: string
          id?: string
          last_seen_at?: string
          license_id?: string
          product_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_activations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          amount_paid: number | null
          archived_at: string | null
          created_at: string
          created_by: string
          customer_id: string
          device_limit: number
          duration_seconds: number
          expires_at: string | null
          id: string
          key_ciphertext: string
          key_hash: string
          key_preview: string
          license_type: Database["public"]["Enums"]["license_type"]
          notes: string | null
          payment_reference: string | null
          product_id: string
          revoked_at: string | null
          state: Database["public"]["Enums"]["license_state"]
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          amount_paid?: number | null
          archived_at?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          device_limit?: number
          duration_seconds: number
          expires_at?: string | null
          id?: string
          key_ciphertext: string
          key_hash: string
          key_preview: string
          license_type: Database["public"]["Enums"]["license_type"]
          notes?: string | null
          payment_reference?: string | null
          product_id: string
          revoked_at?: string | null
          state?: Database["public"]["Enums"]["license_state"]
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          amount_paid?: number | null
          archived_at?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          device_limit?: number
          duration_seconds?: number
          expires_at?: string | null
          id?: string
          key_ciphertext?: string
          key_hash?: string
          key_preview?: string
          license_type?: Database["public"]["Enums"]["license_type"]
          notes?: string | null
          payment_reference?: string | null
          product_id?: string
          revoked_at?: string | null
          state?: Database["public"]["Enums"]["license_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          id: string
          identifier: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validation_rate_limits: {
        Row: {
          attempt_count: number
          bucket_key: string
          window_start: string
        }
        Insert: {
          attempt_count?: number
          bucket_key: string
          window_start: string
        }
        Update: {
          attempt_count?: number
          bucket_key?: string
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_license: {
        Args: {
          _amount_paid: number
          _customer_name: string
          _customer_notes: string
          _device_limit: number
          _duration_seconds: number
          _email: string
          _handle: string
          _key_ciphertext: string
          _key_hash: string
          _key_preview: string
          _license_notes: string
          _license_type: Database["public"]["Enums"]["license_type"]
          _payment_reference: string
          _phone: string
          _product_identifier: string
        }
        Returns: string
      }
      admin_license_action: {
        Args: { _action: string; _license_id: string; _seconds?: number }
        Returns: Json
      }
      admin_set_device_limit: {
        Args: { _device_limit: number; _license_id: string }
        Returns: Json
      }
      admin_update_customer: {
        Args: {
          _amount_paid: number
          _email: string
          _handle: string
          _license_id: string
          _license_notes: string
          _name: string
          _notes: string
          _payment_reference: string
          _phone: string
        }
        Returns: undefined
      }
      claim_first_admin: { Args: { _display_name: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_license_operation: {
        Args: {
          _bucket_key: string
          _device_hash: string
          _key_hash: string
          _operation: string
          _product_identifier: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin"
      audit_action:
        | "license_created"
        | "license_activated"
        | "license_revoked"
        | "license_reactivated"
        | "license_extended"
        | "device_reset"
        | "customer_updated"
        | "license_archived"
        | "license_deactivated"
        | "device_limit_updated"
      license_state: "active" | "revoked"
      license_type: "trial" | "paid" | "custom"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      audit_action: [
        "license_created",
        "license_activated",
        "license_revoked",
        "license_reactivated",
        "license_extended",
        "device_reset",
        "customer_updated",
        "license_archived",
        "license_deactivated",
        "device_limit_updated",
      ],
      license_state: ["active", "revoked"],
      license_type: ["trial", "paid", "custom"],
    },
  },
} as const
