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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      brands: {
        Row: {
          banner_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string
          shipping_base_fee: number | null
          shipping_per_item_fee: number | null
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
          store_sale_percent: number | null
          store_sale_ends_at: string | null
          commission_rate: number | null
          platform_debt: number | null
          subscription_tier: string | null
          subscription_expires_at: string | null
          is_hidden: boolean | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          shipping_base_fee?: number | null
          shipping_per_item_fee?: number | null
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          store_sale_percent?: number | null
          store_sale_ends_at?: string | null
          commission_rate?: number | null
          platform_debt?: number | null
          subscription_tier?: string | null
          subscription_expires_at?: string | null
          is_hidden?: boolean | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          shipping_base_fee?: number | null
          shipping_per_item_fee?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          store_sale_percent?: number | null
          store_sale_ends_at?: string | null
          commission_rate?: number | null
          platform_debt?: number | null
          subscription_tier?: string | null
          subscription_expires_at?: string | null
          is_hidden?: boolean | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          updated_at: string
          variant_id: string
          cart_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          variant_id: string
          cart_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
          cart_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          }
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_method: number
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_method: number
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_verifications: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          proof_image_url: string
          reference_number: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          proof_image_url: string
          reference_number?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          proof_image_url?: string
          reference_number?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_verifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          }
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
          variant_id: string | null
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
          variant_id?: string | null
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
          variant_id?: string | null
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
          shipping_address_id: string | null
          shipping_address: string | null
          shipping_name: string
          shipping_phone: string
          total_amount: number
          total_discount: number | null
          total_shipping: number | null
          updated_at: string
          discount_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          shipping_address_id?: string | null
          shipping_address?: string | null
          shipping_name: string
          shipping_phone: string
          total_amount: number
          total_discount?: number | null
          total_shipping?: number | null
          updated_at?: string
          discount_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          shipping_address_id?: string | null
          shipping_address?: string | null
          shipping_name?: string
          shipping_phone?: string
          total_amount?: number
          total_discount?: number | null
          total_shipping?: number | null
          updated_at?: string
          discount_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          brand_id: string
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          is_active: boolean | null
          name: string
          original_price: number | null
          price: number
          slug: string
          updated_at: string
          listing_type: string
          release_date: string | null
          preorder_discount_percent: number | null
          drop_id: string | null
        }
        Insert: {
          brand_id: string
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name: string
          original_price?: number | null
          price: number
          slug: string
          updated_at?: string
          listing_type?: string
          release_date?: string | null
          preorder_discount_percent?: number | null
          drop_id?: string | null
        }
        Update: {
          brand_id?: string
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          slug?: string
          updated_at?: string
          listing_type?: string
          release_date?: string | null
          preorder_discount_percent?: number | null
          drop_id?: string | null
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
      product_variants: {
        Row: {
          created_at: string
          id: string
          product_id: string
          size: string
          stock_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          size: string
          stock_quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          size?: string
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          id: string
          name: string
          description: string | null
          discount_type: string
          discount_value: number
          min_order_amount: number | null
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_user: number | null
          current_uses: number | null
          is_stackable: boolean | null
          starts_at: string
          ends_at: string
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          discount_type: string
          discount_value: number
          min_order_amount?: number | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          current_uses?: number | null
          is_stackable?: boolean | null
          starts_at: string
          ends_at: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          min_order_amount?: number | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          current_uses?: number | null
          is_stackable?: boolean | null
          starts_at?: string
          ends_at?: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_promos: {
        Row: {
          id: string
          discount_id: string
          code: string | null
          scope: string
          deployment_target: string | null
          created_by: string
        }
        Insert: {
          id?: string
          discount_id: string
          code?: string | null
          scope: string
          deployment_target?: string | null
          created_by: string
        }
        Update: {
          id?: string
          discount_id?: string
          code?: string | null
          scope?: string
          deployment_target?: string | null
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_promos_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          }
        ]
      }
      vendor_vouchers: {
        Row: {
          id: string
          discount_id: string
          brand_id: string
          code: string
          source: string | null
          target_audience: string | null
        }
        Insert: {
          id?: string
          discount_id: string
          brand_id: string
          code: string
          source?: string | null
          target_audience?: string | null
        }
        Update: {
          id?: string
          discount_id?: string
          brand_id?: string
          code?: string
          source?: string | null
          target_audience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_vouchers_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_vouchers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          }
        ]
      }
      user_discount_claims: {
        Row: {
          id: string
          user_id: string
          discount_id: string
          status: string
          claimed_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          discount_id: string
          status?: string
          claimed_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          discount_id?: string
          status?: string
          claimed_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_discount_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_discount_claims_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          }
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
          platform_commission: number | null
          platform_shipping_margin: number | null
          total_platform_fee: number | null
          cancelled_at: string | null
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
          platform_commission?: number | null
          platform_shipping_margin?: number | null
          total_platform_fee?: number | null
          cancelled_at?: string | null
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
          platform_commission?: number | null
          platform_shipping_margin?: number | null
          total_platform_fee?: number | null
          cancelled_at?: string | null
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
      platform_transactions: {
        Row: {
          id: string
          brand_id: string
          amount: number
          type: string
          status: string
          description: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          amount: number
          type: string
          status?: string
          description?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          amount?: number
          type?: string
          status?: string
          description?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_boosts: {
        Row: {
          id: string
          brand_id: string
          product_id: string | null
          amount: number
          status: string
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          product_id?: string | null
          amount: number
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          product_id?: string | null
          amount?: number
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_boosts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
          read_at: string | null
          product_id: string | null
          product_name: string | null
          product_image: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
          read_at?: string | null
          product_id?: string | null
          product_name?: string | null
          product_image?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
          read_at?: string | null
          product_id?: string | null
          product_name?: string | null
          product_image?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          id: string
          review_id: string
          media_url: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          media_url: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          media_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_targets: {
        Row: {
          id: string
          promotion_id: string
          target_type: string
          target_id: string
        }
        Insert: {
          id?: string
          promotion_id: string
          target_type: string
          target_id: string
        }
        Update: {
          id?: string
          promotion_id?: string
          target_type?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_targets_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "platform_promos"
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
      brand_aggregates: {
        Row: {
          brand_id: string
          average_rating: number | null
          review_count: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_aggregates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
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
      claim_lucky_promo: { Args: { _user_id: string }; Returns: Json }
      get_brand_owner: { Args: { _brand_id: string }; Returns: string }
      get_lucky_promo_public_info: {
        Args: never
        Returns: {
          active_hours_end: string
          active_hours_start: string
          daily_claim_limit: number
          is_active: boolean
        }[]
      }
      get_profile_display_name: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_voucher: {
        Args: { _order_id: string; _voucher_id: string }
        Returns: boolean
      }
      validate_stock: { Args: { items: Json }; Returns: Json }
      check_active_orders: {
        Args: { v_brand_id: string }
        Returns: boolean
      }
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
};

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
  graphql_public: {
    Enums: {},
  },
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

