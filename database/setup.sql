-- Herbera Admin Database Setup - Updated to match existing schema
-- Run this script in your Supabase SQL editor

-- Create profiles table (for user management including admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipient_name text,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  slug text DEFAULT lower(replace(name, ' '::text, '-'::text)),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT categories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating numeric CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  is_active boolean NOT NULL DEFAULT true,
  sku text UNIQUE,
  ingredients jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  search_vector tsvector DEFAULT (setweight(to_tsvector('simple'::regconfig, COALESCE(name, ''::text)), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, COALESCE(description, ''::text)), 'B'::"char")),
  weight_kg numeric CHECK (weight_kg IS NULL OR weight_kg >= 0::numeric),
  length_cm numeric CHECK (length_cm IS NULL OR length_cm >= 0::numeric),
  breadth_cm numeric CHECK (breadth_cm IS NULL OR breadth_cm >= 0::numeric),
  height_cm numeric CHECK (height_cm IS NULL OR height_cm >= 0::numeric),
  discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0::numeric AND discount_percent <= 100::numeric),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT products_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variant_name text NOT NULL,
  sku text NOT NULL UNIQUE,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_variants_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT product_variants_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_status text NOT NULL DEFAULT 'pending'::text,
  payment_method text,
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  shipping_charges numeric DEFAULT 0 CHECK (shipping_charges >= 0::numeric),
  discount numeric DEFAULT 0 CHECK (discount >= 0::numeric),
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  shipping_address_id uuid,
  billing_address_id uuid,
  courier_name text,
  tracking_id text,
  tracking_url text,
  placed_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_billing_address_id_fkey FOREIGN KEY (billing_address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  sku text,
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  quantity integer NOT NULL CHECK (quantity > 0),
  total numeric NOT NULL CHECK (total >= 0::numeric),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  notes text,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  value numeric NOT NULL CHECK (value >= 0::numeric),
  min_order_amount numeric CHECK (min_order_amount >= 0::numeric),
  max_discount_amount numeric CHECK (max_discount_amount >= 0::numeric),
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone NOT NULL,
  valid_until timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT coupons_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Create coupon_usage table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0::numeric),
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupon_usage_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE,
  CONSTRAINT coupon_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT coupon_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text,
  review_text text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (admin operations)
CREATE POLICY "Service role can do everything" ON profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON addresses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON categories FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON products FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON product_images FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON product_variants FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON orders FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON order_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON order_status_history FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON coupons FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON coupon_usage FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can do everything" ON product_reviews FOR ALL TO service_role USING (true);

-- Create function to handle user registration and profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_search_vector();