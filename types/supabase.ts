export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          image_url: string | null;
          slug: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
          stock_quantity: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          image_url?: string | null;
          slug?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          stock_quantity?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          image_url?: string | null;
          slug?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          stock_quantity?: number | null;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          interval: 'month' | 'year';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          description?: string | null;
          price: number;
          currency?: string;
          interval?: 'month' | 'year';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          interval?: 'month' | 'year';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plans_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string | null;
          guest_email: string | null;
          amount: number;
          currency: string;
          status: string;
          quantity: number;
          payment_provider: string | null;
          payment_provider_id: string | null;
          phone_number: string | null;
          subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id?: string | null;
          guest_email?: string | null;
          amount: number;
          currency: string;
          status?: string;
          quantity?: number;
          payment_provider?: string | null;
          payment_provider_id?: string | null;
          phone_number?: string | null;
          subscription_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          quantity?: number;
          payment_provider?: string | null;
          payment_provider_id?: string | null;
          phone_number?: string | null;
          subscription_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_plan_id_fkey';
            columns: ['plan_id'];
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_subscription_id_fkey';
            columns: ['subscription_id'];
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string | null;
          guest_email: string | null;
          status: string;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id?: string | null;
          guest_email?: string | null;
          status?: string;
          current_period_start: string;
          current_period_end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'user' | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'user' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'user' | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

