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
      daily_reviews: {
        Row: {
          created_at: string
          diet_adherence: number | null
          exercise_adherence: number | null
          exercise_completed: boolean | null
          exercise_planned: boolean
          id: string
          notes: string | null
          profile_id: string
          review_date: string
          sleep_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_adherence?: number | null
          exercise_adherence?: number | null
          exercise_completed?: boolean | null
          exercise_planned?: boolean
          id?: string
          notes?: string | null
          profile_id: string
          review_date?: string
          sleep_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_adherence?: number | null
          exercise_adherence?: number | null
          exercise_completed?: boolean | null
          exercise_planned?: boolean
          id?: string
          notes?: string | null
          profile_id?: string
          review_date?: string
          sleep_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          created_at: string
          food_id: string | null
          food_snapshot: Json
          grams: number
          id: string
          log_date: string
          meal: string
          position: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          food_id?: string | null
          food_snapshot?: Json
          grams?: number
          id?: string
          log_date?: string
          meal?: string
          position?: number
          profile_id: string
        }
        Update: {
          created_at?: string
          food_id?: string | null
          food_snapshot?: Json
          grams?: number
          id?: string
          log_date?: string
          meal?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          calories: number
          carbs: number
          category: string
          created_at: string
          fat: number
          fiber: number
          icon: string
          id: string
          micros: Json
          name: string
          omega3: number
          protein: number
          updated_at: string
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string
          created_at?: string
          fat?: number
          fiber?: number
          icon?: string
          id?: string
          micros?: Json
          name: string
          omega3?: number
          protein?: number
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string
          created_at?: string
          fat?: number
          fiber?: number
          icon?: string
          id?: string
          micros?: Json
          name?: string
          omega3?: number
          protein?: number
          updated_at?: string
        }
        Relationships: []
      }
      meal_templates: {
        Row: {
          created_at: string
          id: string
          items: Json
          meal: string | null
          name: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          meal?: string | null
          name: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          meal?: string | null
          name?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrient_goals: {
        Row: {
          created_at: string
          id: string
          nutrient_key: string
          profile_id: string
          rda: number | null
          updated_at: string
          upper_limit: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          nutrient_key: string
          profile_id: string
          rda?: number | null
          updated_at?: string
          upper_limit?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          nutrient_key?: string
          profile_id?: string
          rda?: number | null
          updated_at?: string
          upper_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrient_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: number
          age: number | null
          body_fat_pct: number | null
          calc_formula: string
          calorie_adjust: number
          calorie_target: number
          carb_target: number
          color: string
          created_at: string
          current_weight: number | null
          diet_goal: string
          fat_pct: number
          fat_target: number
          fiber_target: number
          height_cm: number | null
          id: string
          name: string
          omega3_target: number
          protein_per_kg: number
          protein_target: number
          sex: string
          target_weight: number | null
          theme: string
          updated_at: string
        }
        Insert: {
          activity_level?: number
          age?: number | null
          body_fat_pct?: number | null
          calc_formula?: string
          calorie_adjust?: number
          calorie_target?: number
          carb_target?: number
          color?: string
          created_at?: string
          current_weight?: number | null
          diet_goal?: string
          fat_pct?: number
          fat_target?: number
          fiber_target?: number
          height_cm?: number | null
          id?: string
          name: string
          omega3_target?: number
          protein_per_kg?: number
          protein_target?: number
          sex?: string
          target_weight?: number | null
          theme?: string
          updated_at?: string
        }
        Update: {
          activity_level?: number
          age?: number | null
          body_fat_pct?: number | null
          calc_formula?: string
          calorie_adjust?: number
          calorie_target?: number
          carb_target?: number
          color?: string
          created_at?: string
          current_weight?: number | null
          diet_goal?: string
          fat_pct?: number
          fat_target?: number
          fiber_target?: number
          height_cm?: number | null
          id?: string
          name?: string
          omega3_target?: number
          protein_per_kg?: number
          protein_target?: number
          sex?: string
          target_weight?: number | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          profile_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          profile_id: string
          weight: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          profile_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
