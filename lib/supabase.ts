import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Client for public operations (browser)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Client for admin operations (server-side only)
export const supabaseAdmin = config.supabase.serviceRoleKey
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey)
  : null;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          recipient_name: string | null;
          phone: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_name?: string | null;
          phone?: string | null;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipient_name?: string | null;
          phone?: string | null;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string;
          price: number;
          stock: number;
          rating: number | null;
          is_active: boolean;
          sku: string | null;
          ingredients: any; // jsonb
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          search_vector: any; // tsvector
          weight_kg: number | null;
          length_cm: number | null;
          breadth_cm: number | null;
          height_cm: number | null;
          discount_percent: number;
          skin_concerns: string[];
          skin_types: string[];
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_id: string;
          price: number;
          stock?: number;
          rating?: number | null;
          is_active?: boolean;
          sku?: string | null;
          ingredients?: any;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          search_vector?: any;
          weight_kg?: number | null;
          length_cm?: number | null;
          breadth_cm?: number | null;
          height_cm?: number | null;
          discount_percent?: number;
          skin_concerns?: string[];
          skin_types?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_id?: string;
          price?: number;
          stock?: number;
          rating?: number | null;
          is_active?: boolean;
          sku?: string | null;
          ingredients?: any;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          search_vector?: any;
          weight_kg?: number | null;
          length_cm?: number | null;
          breadth_cm?: number | null;
          height_cm?: number | null;
          discount_percent?: number;
          skin_concerns?: string[];
          skin_types?: string[];
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          variant_name: string;
          sku: string;
          price: number;
          stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_name: string;
          sku: string;
          price: number;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_name?: string;
          sku?: string;
          price?: number;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: string;
          payment_status: string;
          payment_method: string | null;
          subtotal: number;
          shipping_charges: number;
          discount: number;
          total_amount: number;
          shipping_address_id: string | null;
          billing_address_id: string | null;
          courier_name: string | null;
          tracking_id: string | null;
          tracking_url: string | null;
          placed_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: string;
          payment_status?: string;
          payment_method?: string | null;
          subtotal: number;
          shipping_charges?: number;
          discount?: number;
          total_amount: number;
          shipping_address_id?: string | null;
          billing_address_id?: string | null;
          courier_name?: string | null;
          tracking_id?: string | null;
          tracking_url?: string | null;
          placed_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: string;
          payment_status?: string;
          payment_method?: string | null;
          subtotal?: number;
          shipping_charges?: number;
          discount?: number;
          total_amount?: number;
          shipping_address_id?: string | null;
          billing_address_id?: string | null;
          courier_name?: string | null;
          tracking_id?: string | null;
          tracking_url?: string | null;
          placed_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          sku: string | null;
          name: string;
          price: number;
          quantity: number;
          total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          sku?: string | null;
          name: string;
          price: number;
          quantity: number;
          total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          sku?: string | null;
          name?: string;
          price?: number;
          quantity?: number;
          total?: number;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          notes: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          notes?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          notes?: string | null;
          changed_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          type: string;
          value: number;
          min_order_amount: number | null;
          max_discount_amount: number | null;
          usage_limit: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          type: string;
          value: number;
          min_order_amount?: number | null;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          used_count?: number;
          valid_from: string;
          valid_until: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          type?: string;
          value?: number;
          min_order_amount?: number | null;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      coupon_usage: {
        Row: {
          id: string;
          coupon_id: string;
          order_id: string;
          user_id: string;
          discount_amount: number;
          used_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          order_id: string;
          user_id: string;
          discount_amount: number;
          used_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          order_id?: string;
          user_id?: string;
          discount_amount?: number;
          used_at?: string;
        };
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          title: string | null;
          review_text: string;
          rating: number;
          is_verified_purchase: boolean;
          is_approved: boolean;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          title?: string | null;
          review_text: string;
          rating: number;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          title?: string | null;
          review_text?: string;
          rating?: number;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
