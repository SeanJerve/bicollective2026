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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          barangay: string
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          province: string
          street: string
          user_id: string
          zip_code: string
        }
        Insert: {
          barangay: string
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          province: string
          street: string
          user_id: string
          zip_code: string
        }
        Update: {
          barangay?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          province?: string
          street?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string
          rating: number | null
          review_count: number | null
          shipping_base_fee: number | null
          shipping_per_item_fee: number | null
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          store_sale_ends_at: string | null
          store_sale_percent: number | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          rating?: number | null
          review_count?: number | null
          shipping_base_fee?: number | null
          shipping_per_item_fee?: number | null
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          store_sale_ends_at?: string | null
          store_sale_percent?: number | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          rating?: number | null
          review_count?: number | null
          shipping_base_fee?: number | null
          shipping_per_item_fee?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          store_sale_ends_at?: string | null
          store_sale_percent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          refund_amount: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          updated_at: string | null
          vendor_id: string
          vendor_order_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          refund_amount?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
          vendor_id: string
          vendor_order_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          refund_amount?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
          vendor_id?: string
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_progress: {
        Row: {
          id: string
          milestone_10_sellers_claimed: boolean | null
          milestone_5_deliveries_claimed: boolean | null
          total_delivered_orders: number | null
          unique_sellers_purchased: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          milestone_10_sellers_claimed?: boolean | null
          milestone_5_deliveries_claimed?: boolean | null
          total_delivered_orders?: number | null
          unique_sellers_purchased?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          milestone_10_sellers_claimed?: boolean | null
          milestone_5_deliveries_claimed?: boolean | null
          total_delivered_orders?: number | null
          unique_sellers_purchased?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lucky_promo_claims: {
        Row: {
          claimed_date: string
          created_at: string | null
          id: string
          user_id: string
          voucher_id: string | null
        }
        Insert: {
          claimed_date?: string
          created_at?: string | null
          id?: string
          user_id: string
          voucher_id?: string | null
        }
        Update: {
          claimed_date?: string
          created_at?: string | null
          id?: string
          user_id?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lucky_promo_claims_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_promo_settings: {
        Row: {
          active_hours_end: string | null
          active_hours_start: string | null
          daily_claim_limit: number
          id: string
          is_active: boolean
          max_discount: number
          min_discount: number
          probability_percent: number
          shipping_voucher_amount: number
          shipping_voucher_chance: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          daily_claim_limit?: number
          id?: string
          is_active?: boolean
          max_discount?: number
          min_discount?: number
          probability_percent?: number
          shipping_voucher_amount?: number
          shipping_voucher_chance?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          daily_claim_limit?: number
          id?: string
          is_active?: boolean
          max_discount?: number
          min_discount?: number
          probability_percent?: number
          shipping_voucher_amount?: number
          shipping_voucher_chance?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_system_message: boolean
          read_at: string | null
          receiver_id: string
          sender_id: string
          vendor_order_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          read_at?: string | null
          receiver_id: string
          sender_id: string
          vendor_order_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          size: string | null
          vendor_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity: number
          size?: string | null
          vendor_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          size?: string | null
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          platform_voucher_id: string | null
          shipping_address: string
          shipping_name: string
          shipping_phone: string
          total_amount: number
          total_discount: number | null
          total_shipping: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          platform_voucher_id?: string | null
          shipping_address: string
          shipping_name: string
          shipping_phone: string
          total_amount: number
          total_discount?: number | null
          total_shipping?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          platform_voucher_id?: string | null
          shipping_address?: string
          shipping_name?: string
          shipping_phone?: string
          total_amount?: number
          total_discount?: number | null
          total_shipping?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_platform_voucher_id_fkey"
            columns: ["platform_voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          listing_type: string
          name: string
          original_price: number | null
          preorder_discount_percent: number | null
          price: number
          release_date: string | null
          sizes: string[] | null
          slug: string
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          listing_type?: string
          name: string
          original_price?: number | null
          preorder_discount_percent?: number | null
          price: number
          release_date?: string | null
          sizes?: string[] | null
          slug: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          listing_type?: string
          name?: string
          original_price?: number | null
          preorder_discount_percent?: number | null
          price?: number
          release_date?: string | null
          sizes?: string[] | null
          slug?: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          brand_id: string | null
          code: string | null
          created_at: string | null
          created_by: string
          current_uses: number | null
          deployment_target: string | null
          description: string | null
          discount_value: number
          ends_at: string
          id: string
          is_active: boolean | null
          is_stackable: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_order_amount: number | null
          name: string
          scope: Database["public"]["Enums"]["promotion_scope"]
          starts_at: string
          target_category_ids: string[] | null
          target_locations: string[] | null
          target_product_ids: string[] | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          code?: string | null
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          deployment_target?: string | null
          description?: string | null
          discount_value?: number
          ends_at: string
          id?: string
          is_active?: boolean | null
          is_stackable?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_amount?: number | null
          name: string
          scope?: Database["public"]["Enums"]["promotion_scope"]
          starts_at?: string
          target_category_ids?: string[] | null
          target_locations?: string[] | null
          target_product_ids?: string[] | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          deployment_target?: string | null
          description?: string | null
          discount_value?: number
          ends_at?: string
          id?: string
          is_active?: boolean | null
          is_stackable?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_amount?: number | null
          name?: string
          scope?: Database["public"]["Enums"]["promotion_scope"]
          starts_at?: string
          target_category_ids?: string[] | null
          target_locations?: string[] | null
          target_product_ids?: string[] | null
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          brand_id: string | null
          created_at: string
          id: string
          product_id: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          review_id: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          review_id?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          review_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          brand_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_visible: boolean | null
          media_urls: string[] | null
          product_id: string | null
          rating: number
          user_id: string
          vendor_order_id: string | null
        }
        Insert: {
          brand_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          media_urls?: string[] | null
          product_id?: string | null
          rating: number
          user_id: string
          vendor_order_id?: string | null
        }
        Update: {
          brand_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          media_urls?: string[] | null
          product_id?: string | null
          rating?: number
          user_id?: string
          vendor_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vendor_applications: {
        Row: {
          admin_notes: string | null
          business_name: string
          business_permit_url: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          contact_phone: string
          created_at: string | null
          description: string | null
          id: string
          location: string
          proof_of_products_url: string | null
          status:
            | Database["public"]["Enums"]["vendor_application_status"]
            | null
          updated_at: string | null
          user_id: string
          valid_id_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_name: string
          business_permit_url?: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          contact_phone: string
          created_at?: string | null
          description?: string | null
          id?: string
          location: string
          proof_of_products_url?: string | null
          status?:
            | Database["public"]["Enums"]["vendor_application_status"]
            | null
          updated_at?: string | null
          user_id: string
          valid_id_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_name?: string
          business_permit_url?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          contact_phone?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string
          proof_of_products_url?: string | null
          status?:
            | Database["public"]["Enums"]["vendor_application_status"]
            | null
          updated_at?: string | null
          user_id?: string
          valid_id_url?: string | null
        }
        Relationships: []
      }
      vendor_orders: {
        Row: {
          auto_delivery_eligible: boolean | null
          brand_id: string
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          discount_amount: number | null
          for_delivery_at: string | null
          free_shipping_applied: boolean | null
          handed_to_courier_at: string | null
          id: string
          order_id: string
          payment_method: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          promo_code_applied: string | null
          shipping_fee: number | null
          shipping_fee_original: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tracking_number: string | null
          updated_at: string
          voucher_id: string | null
        }
        Insert: {
          auto_delivery_eligible?: boolean | null
          brand_id: string
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number | null
          for_delivery_at?: string | null
          free_shipping_applied?: boolean | null
          handed_to_courier_at?: string | null
          id?: string
          order_id: string
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          promo_code_applied?: string | null
          shipping_fee?: number | null
          shipping_fee_original?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tracking_number?: string | null
          updated_at?: string
          voucher_id?: string | null
        }
        Update: {
          auto_delivery_eligible?: boolean | null
          brand_id?: string
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number | null
          for_delivery_at?: string | null
          free_shipping_applied?: boolean | null
          handed_to_courier_at?: string | null
          id?: string
          order_id?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          promo_code_applied?: string | null
          shipping_fee?: number | null
          shipping_fee_original?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tracking_number?: string | null
          updated_at?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_verifications: {
        Row: {
          additional_docs: string[] | null
          admin_notes: string | null
          bir_certificate_url: string | null
          brand_id: string
          dti_registration_url: string | null
          id: string
          mayor_permit_url: string | null
          reviewed_at: string | null
          status:
            | Database["public"]["Enums"]["vendor_verification_status"]
            | null
          submitted_at: string | null
        }
        Insert: {
          additional_docs?: string[] | null
          admin_notes?: string | null
          bir_certificate_url?: string | null
          brand_id: string
          dti_registration_url?: string | null
          id?: string
          mayor_permit_url?: string | null
          reviewed_at?: string | null
          status?:
            | Database["public"]["Enums"]["vendor_verification_status"]
            | null
          submitted_at?: string | null
        }
        Update: {
          additional_docs?: string[] | null
          admin_notes?: string | null
          bir_certificate_url?: string | null
          brand_id?: string
          dti_registration_url?: string | null
          id?: string
          mayor_permit_url?: string | null
          reviewed_at?: string | null
          status?:
            | Database["public"]["Enums"]["vendor_verification_status"]
            | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_verifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_value: number
          expires_at: string
          id: string
          max_discount_amount: number | null
          min_order_amount: number | null
          name: string
          source: string | null
          source_promotion_id: string | null
          status: Database["public"]["Enums"]["voucher_status"] | null
          target_audience: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          used_at: string | null
          used_on_order_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_value: number
          expires_at: string
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name: string
          source?: string | null
          source_promotion_id?: string | null
          status?: Database["public"]["Enums"]["voucher_status"] | null
          target_audience?: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          used_at?: string | null
          used_on_order_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_value?: number
          expires_at?: string
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name?: string
          source?: string | null
          source_promotion_id?: string | null
          status?: Database["public"]["Enums"]["voucher_status"] | null
          target_audience?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          used_at?: string | null
          used_on_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_source_promotion_id_fkey"
            columns: ["source_promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_used_on_order_id_fkey"
            columns: ["used_on_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_free_shipping_discount: {
        Args: { _shipping_fee: number }
        Returns: number
      }
      award_loyalty_voucher: {
        Args: {
          _milestone: Database["public"]["Enums"]["loyalty_milestone"]
          _user_id: string
        }
        Returns: string
      }
      calculate_shipping_fee: {
        Args: {
          _buyer_location: string
          _item_count: number
          _seller_location: string
        }
        Returns: number
      }
      get_brand_owner: { Args: { _brand_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_stock: { Args: { items: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "vendor" | "customer"
      business_type: "established" | "aspiring"
      dispute_status:
        | "pending"
        | "under_review"
        | "resolved_refund"
        | "resolved_replacement"
        | "resolved_dismissed"
        | "escalated"
      loyalty_milestone:
        | "first_purchase"
        | "five_deliveries"
        | "ten_unique_sellers"
      order_status:
        | "pending_payment"
        | "payment_uploaded"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "confirmed"
        | "handed_to_courier"
        | "for_delivery"
        | "disputed"
      promotion_scope: "platform" | "seller" | "location" | "product"
      promotion_type: "percentage_discount" | "fixed_discount" | "free_shipping"
      vendor_application_status:
        | "pending"
        | "approved"
        | "needs_resubmission"
        | "rejected"
      vendor_status: "pending" | "approved" | "verified" | "suspended"
      vendor_verification_status:
        | "pending"
        | "verified"
        | "needs_resubmission"
        | "rejected"
      voucher_status: "active" | "used" | "expired" | "cancelled"
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
      app_role: ["admin", "vendor", "customer"],
      business_type: ["established", "aspiring"],
      dispute_status: [
        "pending",
        "under_review",
        "resolved_refund",
        "resolved_replacement",
        "resolved_dismissed",
        "escalated",
      ],
      loyalty_milestone: [
        "first_purchase",
        "five_deliveries",
        "ten_unique_sellers",
      ],
      order_status: [
        "pending_payment",
        "payment_uploaded",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "confirmed",
        "handed_to_courier",
        "for_delivery",
        "disputed",
      ],
      promotion_scope: ["platform", "seller", "location", "product"],
      promotion_type: [
        "percentage_discount",
        "fixed_discount",
        "free_shipping",
      ],
      vendor_application_status: [
        "pending",
        "approved",
        "needs_resubmission",
        "rejected",
      ],
      vendor_status: ["pending", "approved", "verified", "suspended"],
      vendor_verification_status: [
        "pending",
        "verified",
        "needs_resubmission",
        "rejected",
      ],
      voucher_status: ["active", "used", "expired", "cancelled"],
    },
  },
} as const
