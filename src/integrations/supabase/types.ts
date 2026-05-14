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
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          product_id: string | null
          product_name: string | null
          product_image: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          product_id?: string | null
          product_name?: string | null
          product_image?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          product_id?: string | null
          product_name?: string | null
          product_image?: string | null
          read_at?: string | null
          created_at?: string
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
          }
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
          }
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
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
          },
          {
            foreignKeyName: "orders_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          }
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
          }
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
      discounts: {
        Row: {
          id: string
          name: string
          discount_type: string
          discount_value: number
          min_order_amount: number | null
          max_discount_amount: number | null
          is_active: boolean
          starts_at: string
          ends_at: string
          current_uses: number | null
        }
        Insert: {
          id?: string
          name: string
          discount_type: string
          discount_value: number
          min_order_amount?: number | null
          max_discount_amount?: number | null
          is_active?: boolean
          starts_at: string
          ends_at: string
          current_uses?: number | null
        }
        Update: {
          id?: string
          name?: string
          discount_type?: string
          discount_value?: number
          min_order_amount?: number | null
          max_discount_amount?: number | null
          is_active?: boolean
          starts_at?: string
          ends_at?: string
          current_uses?: number | null
        }
        Relationships: []
      }
      platform_promos: {
        Row: {
          id: string
          discount_id: string
          deployment_target: string | null
        }
        Insert: {
          id?: string
          discount_id: string
          deployment_target?: string | null
        }
        Update: {
          id?: string
          discount_id?: string
          deployment_target?: string | null
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
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      vendor_orders: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          order_id: string
          shipping_fee: number | null
          shipping_fee_original: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          discount_amount: number | null
          free_shipping_applied: boolean | null
          platform_commission: number | null
          platform_shipping_margin: number | null
          total_platform_fee: number | null
          tracking_number: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          order_id: string
          shipping_fee?: number | null
          shipping_fee_original?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          discount_amount?: number | null
          free_shipping_applied?: boolean | null
          platform_commission?: number | null
          platform_shipping_margin?: number | null
          total_platform_fee?: number | null
          tracking_number?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          order_id?: string
          shipping_fee?: number | null
          shipping_fee_original?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          discount_amount?: number | null
          free_shipping_applied?: boolean | null
          platform_commission?: number | null
          platform_shipping_margin?: number | null
          total_platform_fee?: number | null
          tracking_number?: string | null
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
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_stock: {
        Args: {
          items: Json
        }
        Returns: Json
      }
    }
    Enums: {
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
      vendor_status: "pending" | "approved" | "verified" | "suspended"
      app_role: "admin" | "vendor" | "customer"
      dispute_status:
        | "pending"
        | "under_review"
        | "resolved_refund"
        | "resolved_replacement"
        | "resolved_dismissed"
        | "escalated"
      vendor_verification_status:
        | "pending"
        | "verified"
        | "needs_resubmission"
        | "rejected"
    }
  }
}
