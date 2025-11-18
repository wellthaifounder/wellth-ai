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
      bill_disputes: {
        Row: {
          bill_review_id: string | null
          claim_number: string | null
          created_at: string
          dispute_reason: string | null
          dispute_status: Database["public"]["Enums"]["dispute_status"]
          disputed_amount: number
          id: string
          insurance_company: string | null
          insurance_contact_info: Json | null
          invoice_id: string | null
          original_amount: number
          provider_contact_info: Json | null
          provider_name: string
          resolution_date: string | null
          resolved_amount: number | null
          response_deadline: string | null
          savings_achieved: number | null
          submitted_date: string | null
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_review_id?: string | null
          claim_number?: string | null
          created_at?: string
          dispute_reason?: string | null
          dispute_status?: Database["public"]["Enums"]["dispute_status"]
          disputed_amount: number
          id?: string
          insurance_company?: string | null
          insurance_contact_info?: Json | null
          invoice_id?: string | null
          original_amount: number
          provider_contact_info?: Json | null
          provider_name: string
          resolution_date?: string | null
          resolved_amount?: number | null
          response_deadline?: string | null
          savings_achieved?: number | null
          submitted_date?: string | null
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_review_id?: string | null
          claim_number?: string | null
          created_at?: string
          dispute_reason?: string | null
          dispute_status?: Database["public"]["Enums"]["dispute_status"]
          disputed_amount?: number
          id?: string
          insurance_company?: string | null
          insurance_contact_info?: Json | null
          invoice_id?: string | null
          original_amount?: number
          provider_contact_info?: Json | null
          provider_name?: string
          resolution_date?: string | null
          resolved_amount?: number | null
          response_deadline?: string | null
          savings_achieved?: number | null
          submitted_date?: string | null
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_disputes_bill_review_id_fkey"
            columns: ["bill_review_id"]
            isOneToOne: false
            referencedRelation: "bill_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_disputes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_errors: {
        Row: {
          bill_review_id: string
          created_at: string
          description: string
          error_category: Database["public"]["Enums"]["bill_error_category"]
          error_type: Database["public"]["Enums"]["bill_error_type"]
          evidence: Json | null
          id: string
          line_item_reference: string | null
          potential_savings: number | null
          status: Database["public"]["Enums"]["bill_error_status"]
        }
        Insert: {
          bill_review_id: string
          created_at?: string
          description: string
          error_category?: Database["public"]["Enums"]["bill_error_category"]
          error_type: Database["public"]["Enums"]["bill_error_type"]
          evidence?: Json | null
          id?: string
          line_item_reference?: string | null
          potential_savings?: number | null
          status?: Database["public"]["Enums"]["bill_error_status"]
        }
        Update: {
          bill_review_id?: string
          created_at?: string
          description?: string
          error_category?: Database["public"]["Enums"]["bill_error_category"]
          error_type?: Database["public"]["Enums"]["bill_error_type"]
          evidence?: Json | null
          id?: string
          line_item_reference?: string | null
          potential_savings?: number | null
          status?: Database["public"]["Enums"]["bill_error_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bill_errors_bill_review_id_fkey"
            columns: ["bill_review_id"]
            isOneToOne: false
            referencedRelation: "bill_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_reviews: {
        Row: {
          analyzed_at: string | null
          confidence_score: number | null
          created_at: string
          id: string
          invoice_id: string | null
          review_status: Database["public"]["Enums"]["bill_review_status"]
          total_potential_savings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          review_status?: Database["public"]["Enums"]["bill_review_status"]
          total_potential_savings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          review_status?: Database["public"]["Enums"]["bill_review_status"]
          total_potential_savings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_reviews_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      cpt_code_reference: {
        Row: {
          bundling_rules: Json | null
          category: string | null
          common_modifiers: string[] | null
          cpt_code: string
          created_at: string
          description: string
          id: string
          medicare_rate: number | null
          updated_at: string
        }
        Insert: {
          bundling_rules?: Json | null
          category?: string | null
          common_modifiers?: string[] | null
          cpt_code: string
          created_at?: string
          description: string
          id?: string
          medicare_rate?: number | null
          updated_at?: string
        }
        Update: {
          bundling_rules?: Json | null
          category?: string | null
          common_modifiers?: string[] | null
          cpt_code?: string
          created_at?: string
          description?: string
          id?: string
          medicare_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      dispute_communications: {
        Row: {
          communication_type: Database["public"]["Enums"]["communication_type"]
          contact_person: string | null
          created_at: string
          direction: Database["public"]["Enums"]["communication_direction"]
          dispute_id: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          outcome: string | null
          summary: string
        }
        Insert: {
          communication_type: Database["public"]["Enums"]["communication_type"]
          contact_person?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["communication_direction"]
          dispute_id: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome?: string | null
          summary: string
        }
        Update: {
          communication_type?: Database["public"]["Enums"]["communication_type"]
          contact_person?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["communication_direction"]
          dispute_id?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_communications_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "bill_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_documents: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          receipt_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          receipt_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          receipt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_documents_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "bill_disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_documents_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      expense_decisions: {
        Row: {
          created_at: string | null
          expense_amount: number
          id: string
          payment_strategy: Json
          used_for_expense_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expense_amount: number
          id?: string
          payment_strategy: Json
          used_for_expense_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expense_amount?: number
          id?: string
          payment_strategy?: Json
          used_for_expense_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_decisions_used_for_expense_id_fkey"
            columns: ["used_for_expense_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      hsa_accounts: {
        Row: {
          account_name: string
          closed_date: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          opened_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          closed_date?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          opened_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          closed_date?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          opened_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hsa_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_labels: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          label_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          label_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_labels_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          card_payoff_months: number | null
          category: string
          created_at: string
          date: string
          deductible_met: boolean | null
          deductible_portion: number | null
          hsa_account_id: string | null
          id: string
          insurance_plan_name: string | null
          insurance_plan_type: string | null
          investment_notes: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_hsa_eligible: boolean | null
          is_reimbursed: boolean | null
          network_status: string | null
          notes: string | null
          npi_number: string | null
          payment_method_id: string | null
          payment_plan_installments: number | null
          payment_plan_notes: string | null
          payment_plan_total_amount: number | null
          planned_reimbursement_date: string | null
          reimbursement_reminder_date: string | null
          reimbursement_strategy: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          amount: number
          card_payoff_months?: number | null
          category: string
          created_at?: string
          date: string
          deductible_met?: boolean | null
          deductible_portion?: number | null
          hsa_account_id?: string | null
          id?: string
          insurance_plan_name?: string | null
          insurance_plan_type?: string | null
          investment_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_hsa_eligible?: boolean | null
          is_reimbursed?: boolean | null
          network_status?: string | null
          notes?: string | null
          npi_number?: string | null
          payment_method_id?: string | null
          payment_plan_installments?: number | null
          payment_plan_notes?: string | null
          payment_plan_total_amount?: number | null
          planned_reimbursement_date?: string | null
          reimbursement_reminder_date?: string | null
          reimbursement_strategy?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          amount?: number
          card_payoff_months?: number | null
          category?: string
          created_at?: string
          date?: string
          deductible_met?: boolean | null
          deductible_portion?: number | null
          hsa_account_id?: string | null
          id?: string
          insurance_plan_name?: string | null
          insurance_plan_type?: string | null
          investment_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_hsa_eligible?: boolean | null
          is_reimbursed?: boolean | null
          network_status?: string | null
          notes?: string | null
          npi_number?: string | null
          payment_method_id?: string | null
          payment_plan_installments?: number | null
          payment_plan_notes?: string | null
          payment_plan_total_amount?: number | null
          planned_reimbursement_date?: string | null
          reimbursement_reminder_date?: string | null
          reimbursement_strategy?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: [
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
          {
            foreignKeyName: "invoices_hsa_account_id_fkey"
            columns: ["hsa_account_id"]
            isOneToOne: false
            referencedRelation: "hsa_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_labels: {
        Row: {
          created_at: string
          id: string
          label_id: string
          payment_transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_id: string
          payment_transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label_id?: string
          payment_transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_labels_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_hsa_account: boolean
          name: string
          rewards_rate: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_hsa_account?: boolean
          name: string
          rewards_rate?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_hsa_account?: boolean
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
          hsa_account_id: string | null
          id: string
          invoice_id: string
          is_reimbursed: boolean
          notes: string | null
          payment_date: string
          payment_method_id: string | null
          payment_source: string
          plaid_transaction_id: string | null
          reimbursed_date: string | null
          reimbursement_request_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          hsa_account_id?: string | null
          id?: string
          invoice_id: string
          is_reimbursed?: boolean
          notes?: string | null
          payment_date: string
          payment_method_id?: string | null
          payment_source: string
          plaid_transaction_id?: string | null
          reimbursed_date?: string | null
          reimbursement_request_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          hsa_account_id?: string | null
          id?: string
          invoice_id?: string
          is_reimbursed?: boolean
          notes?: string | null
          payment_date?: string
          payment_method_id?: string | null
          payment_source?: string
          plaid_transaction_id?: string | null
          reimbursed_date?: string | null
          reimbursement_request_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_expense_report_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_hsa_account_id_fkey"
            columns: ["hsa_account_id"]
            isOneToOne: false
            referencedRelation: "hsa_accounts"
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
          {
            foreignKeyName: "payment_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          institution_name: string | null
          item_id: string
          last_synced_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          institution_name?: string | null
          item_id: string
          last_synced_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          institution_name?: string | null
          item_id?: string
          last_synced_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      procedure_insights: {
        Row: {
          average_patient_cost: number
          cpt_code: string
          created_at: string | null
          fair_price_indicator: string | null
          id: string
          median_patient_cost: number | null
          procedure_category: string | null
          procedure_name: string
          provider_id: string | null
          times_performed: number | null
          typical_insurance_payment: number | null
          updated_at: string | null
        }
        Insert: {
          average_patient_cost: number
          cpt_code: string
          created_at?: string | null
          fair_price_indicator?: string | null
          id?: string
          median_patient_cost?: number | null
          procedure_category?: string | null
          procedure_name: string
          provider_id?: string | null
          times_performed?: number | null
          typical_insurance_payment?: number | null
          updated_at?: string | null
        }
        Update: {
          average_patient_cost?: number
          cpt_code?: string
          created_at?: string | null
          fair_price_indicator?: string | null
          id?: string
          median_patient_cost?: number | null
          procedure_category?: string | null
          procedure_name?: string
          provider_id?: string | null
          times_performed?: number | null
          typical_insurance_payment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_insights_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          has_hsa: boolean | null
          hsa_opened_date: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          has_hsa?: boolean | null
          hsa_opened_date?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          has_hsa?: boolean | null
          hsa_opened_date?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_bills: {
        Row: {
          bill_amount: number
          bill_review_id: string | null
          confirmed_errors: Json | null
          created_at: string
          deductible_met: boolean | null
          dispute_outcome: string | null
          error_confirmed_at: string | null
          error_confirmed_by_user: boolean | null
          error_flagged_at: string | null
          errors_found: number | null
          id: string
          insurance_plan_type: string | null
          invoice_id: string
          network_status: string | null
          overcharge_amount: number | null
          provider_id: string
          was_disputed: boolean | null
        }
        Insert: {
          bill_amount: number
          bill_review_id?: string | null
          confirmed_errors?: Json | null
          created_at?: string
          deductible_met?: boolean | null
          dispute_outcome?: string | null
          error_confirmed_at?: string | null
          error_confirmed_by_user?: boolean | null
          error_flagged_at?: string | null
          errors_found?: number | null
          id?: string
          insurance_plan_type?: string | null
          invoice_id: string
          network_status?: string | null
          overcharge_amount?: number | null
          provider_id: string
          was_disputed?: boolean | null
        }
        Update: {
          bill_amount?: number
          bill_review_id?: string | null
          confirmed_errors?: Json | null
          created_at?: string
          deductible_met?: boolean | null
          dispute_outcome?: string | null
          error_confirmed_at?: string | null
          error_confirmed_by_user?: boolean | null
          error_flagged_at?: string | null
          errors_found?: number | null
          id?: string
          insurance_plan_type?: string | null
          invoice_id?: string
          network_status?: string | null
          overcharge_amount?: number | null
          provider_id?: string
          was_disputed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_bills_bill_review_id_fkey"
            columns: ["bill_review_id"]
            isOneToOne: false
            referencedRelation: "bill_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_bills_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_bills_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_charge_benchmarks: {
        Row: {
          average_charge: number
          cpt_code: string
          id: string
          last_updated: string
          max_charge: number | null
          median_charge: number | null
          medicare_rate: number | null
          min_charge: number | null
          procedure_name: string | null
          provider_id: string
          sample_size: number | null
          variance_from_medicare: number | null
          variance_from_national: number | null
        }
        Insert: {
          average_charge: number
          cpt_code: string
          id?: string
          last_updated?: string
          max_charge?: number | null
          median_charge?: number | null
          medicare_rate?: number | null
          min_charge?: number | null
          procedure_name?: string | null
          provider_id: string
          sample_size?: number | null
          variance_from_medicare?: number | null
          variance_from_national?: number | null
        }
        Update: {
          average_charge?: number
          cpt_code?: string
          id?: string
          last_updated?: string
          max_charge?: number | null
          median_charge?: number | null
          medicare_rate?: number | null
          min_charge?: number | null
          procedure_name?: string | null
          provider_id?: string
          sample_size?: number | null
          variance_from_medicare?: number | null
          variance_from_national?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_charge_benchmarks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reviews: {
        Row: {
          billing_clarity_rating: number
          cost_transparency_rating: number
          created_at: string | null
          deductible_met: boolean | null
          flagged_reason: string | null
          id: string
          insurance_plan_type: string | null
          invoice_id: string
          is_flagged: boolean | null
          is_verified_patient: boolean | null
          network_status: string | null
          overall_experience_rating: number
          payment_flexibility_rating: number
          procedure_category: string | null
          provider_id: string
          review_text: string | null
          updated_at: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          billing_clarity_rating: number
          cost_transparency_rating: number
          created_at?: string | null
          deductible_met?: boolean | null
          flagged_reason?: string | null
          id?: string
          insurance_plan_type?: string | null
          invoice_id: string
          is_flagged?: boolean | null
          is_verified_patient?: boolean | null
          network_status?: string | null
          overall_experience_rating: number
          payment_flexibility_rating: number
          procedure_category?: string | null
          provider_id: string
          review_text?: string | null
          updated_at?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          billing_clarity_rating?: number
          cost_transparency_rating?: number
          created_at?: string | null
          deductible_met?: boolean | null
          flagged_reason?: string | null
          id?: string
          insurance_plan_type?: string | null
          invoice_id?: string
          is_flagged?: boolean | null
          is_verified_patient?: boolean | null
          network_status?: string | null
          overall_experience_rating?: number
          payment_flexibility_rating?: number
          procedure_category?: string | null
          provider_id?: string
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          accuracy_rating: number | null
          address: string | null
          average_bill_amount: number | null
          billing_accuracy_score: number | null
          billing_clarity_score: number | null
          city: string | null
          cost_rating: number | null
          cost_transparency_score: number | null
          created_at: string
          data_last_updated: string | null
          disputes_lost: number | null
          disputes_won: number | null
          fair_pricing_score: number | null
          id: string
          insurance_networks: string[] | null
          most_common_procedures: Json | null
          name: string
          network_status: string | null
          npi_number: string | null
          overall_rating: number | null
          payment_flexibility_score: number | null
          phone: string | null
          provider_type: string | null
          regional_pricing_percentile: number | null
          response_rating: number | null
          specialties: string[] | null
          specialties_verified: boolean | null
          state: string | null
          tax_id: string | null
          total_bills_analyzed: number | null
          total_disputes_filed: number | null
          total_overcharges_found: number | null
          total_reviews: number | null
          transparency_score: number | null
          updated_at: string
          verified_patient_reviews: number | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          accuracy_rating?: number | null
          address?: string | null
          average_bill_amount?: number | null
          billing_accuracy_score?: number | null
          billing_clarity_score?: number | null
          city?: string | null
          cost_rating?: number | null
          cost_transparency_score?: number | null
          created_at?: string
          data_last_updated?: string | null
          disputes_lost?: number | null
          disputes_won?: number | null
          fair_pricing_score?: number | null
          id?: string
          insurance_networks?: string[] | null
          most_common_procedures?: Json | null
          name: string
          network_status?: string | null
          npi_number?: string | null
          overall_rating?: number | null
          payment_flexibility_score?: number | null
          phone?: string | null
          provider_type?: string | null
          regional_pricing_percentile?: number | null
          response_rating?: number | null
          specialties?: string[] | null
          specialties_verified?: boolean | null
          state?: string | null
          tax_id?: string | null
          total_bills_analyzed?: number | null
          total_disputes_filed?: number | null
          total_overcharges_found?: number | null
          total_reviews?: number | null
          transparency_score?: number | null
          updated_at?: string
          verified_patient_reviews?: number | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          accuracy_rating?: number | null
          address?: string | null
          average_bill_amount?: number | null
          billing_accuracy_score?: number | null
          billing_clarity_score?: number | null
          city?: string | null
          cost_rating?: number | null
          cost_transparency_score?: number | null
          created_at?: string
          data_last_updated?: string | null
          disputes_lost?: number | null
          disputes_won?: number | null
          fair_pricing_score?: number | null
          id?: string
          insurance_networks?: string[] | null
          most_common_procedures?: Json | null
          name?: string
          network_status?: string | null
          npi_number?: string | null
          overall_rating?: number | null
          payment_flexibility_score?: number | null
          phone?: string | null
          provider_type?: string | null
          regional_pricing_percentile?: number | null
          response_rating?: number | null
          specialties?: string[] | null
          specialties_verified?: boolean | null
          state?: string | null
          tax_id?: string | null
          total_bills_analyzed?: number | null
          total_disputes_filed?: number | null
          total_overcharges_found?: number | null
          total_reviews?: number | null
          transparency_score?: number | null
          updated_at?: string
          verified_patient_reviews?: number | null
          website?: string | null
          zip_code?: string | null
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
          file_path: string
          file_type: string
          id: string
          invoice_id: string | null
          payment_transaction_id: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          document_type?: string | null
          file_path: string
          file_type: string
          id?: string
          invoice_id?: string | null
          payment_transaction_id?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          display_order?: number | null
          document_type?: string | null
          file_path?: string
          file_type?: string
          id?: string
          invoice_id?: string | null
          payment_transaction_id?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_expense_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      regional_benchmarks: {
        Row: {
          cpt_code: string
          id: string
          last_updated: string | null
          median_charge: number
          p25_charge: number | null
          p75_charge: number | null
          p90_charge: number | null
          procedure_name: string | null
          region_code: string
          sample_size: number | null
        }
        Insert: {
          cpt_code: string
          id?: string
          last_updated?: string | null
          median_charge: number
          p25_charge?: number | null
          p75_charge?: number | null
          p90_charge?: number | null
          procedure_name?: string | null
          region_code: string
          sample_size?: number | null
        }
        Update: {
          cpt_code?: string
          id?: string
          last_updated?: string | null
          median_charge?: number
          p25_charge?: number | null
          p75_charge?: number | null
          p90_charge?: number | null
          procedure_name?: string | null
          region_code?: string
          sample_size?: number | null
        }
        Relationships: []
      }
      reimbursement_items: {
        Row: {
          id: string
          invoice_id: string
          reimbursement_request_id: string
        }
        Insert: {
          id?: string
          invoice_id: string
          reimbursement_request_id: string
        }
        Update: {
          id?: string
          invoice_id?: string
          reimbursement_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursement_items_expense_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      review_moderation_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          review_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          review_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_moderation_log_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string | null
          id: string
          is_featured: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          rating: number
          review_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          rating: number
          review_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          rating?: number
          review_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          goal_type: string
          id: string
          is_active: boolean
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_type: string
          id?: string
          is_active?: boolean
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_invoice_suggestions: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          invoice_id: string
          match_reason: string | null
          transaction_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          invoice_id: string
          match_reason?: string | null
          transaction_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          invoice_id?: string
          match_reason?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_invoice_suggestions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_invoice_suggestions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_splits: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          hsa_account_id: string | null
          id: string
          notes: string | null
          parent_transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          hsa_account_id?: string | null
          id?: string
          notes?: string | null
          parent_transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          hsa_account_id?: string | null
          id?: string
          notes?: string | null
          parent_transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_hsa_account_id_fkey"
            columns: ["hsa_account_id"]
            isOneToOne: false
            referencedRelation: "hsa_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string | null
          is_hsa_eligible: boolean | null
          is_medical: boolean | null
          is_split: boolean | null
          notes: string | null
          payment_method_id: string | null
          plaid_transaction_id: string | null
          reconciliation_status: string | null
          source: string | null
          split_parent_id: string | null
          transaction_date: string
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id?: string | null
          is_hsa_eligible?: boolean | null
          is_medical?: boolean | null
          is_split?: boolean | null
          notes?: string | null
          payment_method_id?: string | null
          plaid_transaction_id?: string | null
          reconciliation_status?: string | null
          source?: string | null
          split_parent_id?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string | null
          is_hsa_eligible?: boolean | null
          is_medical?: boolean | null
          is_split?: boolean | null
          notes?: string | null
          payment_method_id?: string | null
          plaid_transaction_id?: string | null
          reconciliation_status?: string | null
          source?: string | null
          split_parent_id?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transparency_metrics: {
        Row: {
          common_overcharge_trends: Json | null
          created_at: string | null
          id: string
          metric_date: string
          regional_insights: Json | null
          top_overcharging_providers: Json | null
          top_transparent_providers: Json | null
        }
        Insert: {
          common_overcharge_trends?: Json | null
          created_at?: string | null
          id?: string
          metric_date?: string
          regional_insights?: Json | null
          top_overcharging_providers?: Json | null
          top_transparent_providers?: Json | null
        }
        Update: {
          common_overcharge_trends?: Json | null
          created_at?: string | null
          id?: string
          metric_date?: string
          regional_insights?: Json | null
          top_overcharging_providers?: Json | null
          top_transparent_providers?: Json | null
        }
        Relationships: []
      }
      user_vendor_preferences: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          is_medical: boolean
          times_confirmed: number | null
          updated_at: string
          user_id: string
          vendor_pattern: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_medical?: boolean
          times_confirmed?: number | null
          updated_at?: string
          user_id: string
          vendor_pattern: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_medical?: boolean
          times_confirmed?: number | null
          updated_at?: string
          user_id?: string
          vendor_pattern?: string
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
      calculate_billing_accuracy_score: {
        Args: { p_provider_id: string }
        Returns: number
      }
      calculate_fair_pricing_score: {
        Args: { p_provider_id: string }
        Returns: number
      }
      can_view_provider_review: {
        Args: { review_is_flagged: boolean; review_user_id: string }
        Returns: boolean
      }
      update_provider_statistics: {
        Args: { p_provider_id: string }
        Returns: undefined
      }
    }
    Enums: {
      bill_error_category:
        | "high_priority"
        | "medium_priority"
        | "low_priority"
        | "informational"
      bill_error_status:
        | "identified"
        | "user_confirmed"
        | "user_dismissed"
        | "disputed"
        | "resolved"
      bill_error_type:
        | "duplicate_charge"
        | "upcoding"
        | "unbundling"
        | "incorrect_quantity"
        | "balance_billing"
        | "out_of_network_surprise"
        | "wrong_insurance_info"
        | "coding_error"
        | "uncovered_service"
        | "other"
      bill_review_status:
        | "pending"
        | "analyzing"
        | "reviewed"
        | "disputed"
        | "resolved"
      communication_direction: "outbound" | "inbound"
      communication_type:
        | "phone_call"
        | "email"
        | "letter"
        | "portal_message"
        | "in_person"
      dispute_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "appealed"
        | "resolved_favorable"
        | "resolved_unfavorable"
        | "withdrawn"
      document_type:
        | "original_bill"
        | "insurance_eob"
        | "price_comparison"
        | "medical_records"
        | "correspondence"
        | "appeal_letter"
        | "resolution_letter"
        | "other"
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
      bill_error_category: [
        "high_priority",
        "medium_priority",
        "low_priority",
        "informational",
      ],
      bill_error_status: [
        "identified",
        "user_confirmed",
        "user_dismissed",
        "disputed",
        "resolved",
      ],
      bill_error_type: [
        "duplicate_charge",
        "upcoding",
        "unbundling",
        "incorrect_quantity",
        "balance_billing",
        "out_of_network_surprise",
        "wrong_insurance_info",
        "coding_error",
        "uncovered_service",
        "other",
      ],
      bill_review_status: [
        "pending",
        "analyzing",
        "reviewed",
        "disputed",
        "resolved",
      ],
      communication_direction: ["outbound", "inbound"],
      communication_type: [
        "phone_call",
        "email",
        "letter",
        "portal_message",
        "in_person",
      ],
      dispute_status: [
        "draft",
        "submitted",
        "in_review",
        "appealed",
        "resolved_favorable",
        "resolved_unfavorable",
        "withdrawn",
      ],
      document_type: [
        "original_bill",
        "insurance_eob",
        "price_comparison",
        "medical_records",
        "correspondence",
        "appeal_letter",
        "resolution_letter",
        "other",
      ],
    },
  },
} as const
