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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      email_sequence_sends: {
        Row: {
          clicked_at: string | null
          email_type: string
          id: string
          opened_at: string | null
          sent_at: string
          sequence_day: number
          subscriber_id: string
        }
        Insert: {
          clicked_at?: string | null
          email_type: string
          id?: string
          opened_at?: string | null
          sent_at?: string
          sequence_day: number
          subscriber_id: string
        }
        Update: {
          clicked_at?: string | null
          email_type?: string
          id?: string
          opened_at?: string | null
          sent_at?: string
          sequence_day?: number
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          calculator_data: Json | null
          email: string
          estimated_savings: number | null
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string
        }
        Insert: {
          calculator_data?: Json | null
          email: string
          estimated_savings?: number | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          calculator_data?: Json | null
          email?: string
          estimated_savings?: number | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      expense_reports: {
        Row: {
          amount: number
          category: string
          complexity_level: string
          created_at: string
          date: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_hsa_eligible: boolean | null
          is_reimbursed: boolean | null
          medical_incident_id: string | null
          notes: string | null
          payment_method_id: string | null
          payment_plan_installments: number | null
          payment_plan_notes: string | null
          payment_plan_total_amount: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          amount: number
          category: string
          complexity_level?: string
          created_at?: string
          date: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_hsa_eligible?: boolean | null
          is_reimbursed?: boolean | null
          medical_incident_id?: string | null
          notes?: string | null
          payment_method_id?: string | null
          payment_plan_installments?: number | null
          payment_plan_notes?: string | null
          payment_plan_total_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          amount?: number
          category?: string
          complexity_level?: string
          created_at?: string
          date?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_hsa_eligible?: boolean | null
          is_reimbursed?: boolean | null
          medical_incident_id?: string | null
          notes?: string | null
          payment_method_id?: string | null
          payment_plan_installments?: number | null
          payment_plan_notes?: string | null
          payment_plan_total_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_reports_medical_incident_id_fkey"
            columns: ["medical_incident_id"]
            isOneToOne: false
            referencedRelation: "medical_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_date: string
          incident_type: string
          is_hsa_eligible: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_date: string
          incident_type?: string
          is_hsa_eligible?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          is_hsa_eligible?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          name: string
          rewards_rate: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rewards_rate?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rewards_rate?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          expense_report_id: string
          id: string
          is_reimbursed: boolean
          notes: string | null
          payment_date: string
          payment_method_id: string | null
          payment_source: string
          plaid_transaction_id: string | null
          reimbursed_date: string | null
          reimbursement_request_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expense_report_id: string
          id?: string
          is_reimbursed?: boolean
          notes?: string | null
          payment_date: string
          payment_method_id?: string | null
          payment_source: string
          plaid_transaction_id?: string | null
          reimbursed_date?: string | null
          reimbursement_request_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_report_id?: string
          id?: string
          is_reimbursed?: boolean
          notes?: string | null
          payment_date?: string
          payment_method_id?: string | null
          payment_source?: string
          plaid_transaction_id?: string | null
          reimbursed_date?: string | null
          reimbursement_request_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_expense_report_id_fkey"
            columns: ["expense_report_id"]
            isOneToOne: false
            referencedRelation: "expense_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_reimbursement_request_id_fkey"
            columns: ["reimbursement_request_id"]
            isOneToOne: false
            referencedRelation: "reimbursement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipt_ocr_data: {
        Row: {
          confidence_score: number | null
          extracted_amount: number | null
          extracted_category: string | null
          extracted_date: string | null
          extracted_vendor: string | null
          id: string
          processed_at: string
          raw_response: string | null
          receipt_id: string
        }
        Insert: {
          confidence_score?: number | null
          extracted_amount?: number | null
          extracted_category?: string | null
          extracted_date?: string | null
          extracted_vendor?: string | null
          id?: string
          processed_at?: string
          raw_response?: string | null
          receipt_id: string
        }
        Update: {
          confidence_score?: number | null
          extracted_amount?: number | null
          extracted_category?: string | null
          extracted_date?: string | null
          extracted_vendor?: string | null
          id?: string
          processed_at?: string
          raw_response?: string | null
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_ocr_data_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          description: string | null
          display_order: number | null
          document_type: string | null
          expense_id: string | null
          file_path: string
          file_type: string
          id: string
          payment_transaction_id: string | null
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          document_type?: string | null
          expense_id?: string | null
          file_path: string
          file_type: string
          id?: string
          payment_transaction_id?: string | null
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          display_order?: number | null
          document_type?: string | null
          expense_id?: string | null
          file_path?: string
          file_type?: string
          id?: string
          payment_transaction_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expense_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_items: {
        Row: {
          expense_id: string
          id: string
          reimbursement_request_id: string
        }
        Insert: {
          expense_id: string
          id?: string
          reimbursement_request_id: string
        }
        Update: {
          expense_id?: string
          id?: string
          reimbursement_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursement_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expense_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursement_items_reimbursement_request_id_fkey"
            columns: ["reimbursement_request_id"]
            isOneToOne: false
            referencedRelation: "reimbursement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_requests: {
        Row: {
          created_at: string
          hsa_provider: string | null
          id: string
          notes: string | null
          pdf_file_path: string | null
          status: string
          submission_email: string | null
          submission_method: string | null
          submitted_at: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          hsa_provider?: string | null
          id?: string
          notes?: string | null
          pdf_file_path?: string | null
          status?: string
          submission_email?: string | null
          submission_method?: string | null
          submitted_at?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          hsa_provider?: string | null
          id?: string
          notes?: string | null
          pdf_file_path?: string | null
          status?: string
          submission_email?: string | null
          submission_method?: string | null
          submitted_at?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      wellbie_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellbie_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellbie_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wellbie_conversations"
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
