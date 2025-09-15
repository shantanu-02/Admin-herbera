-- Create Admin User for Herbera Admin Panel
-- Run this after setting up the database tables

-- Note: With the new schema, admin users are created through Supabase Auth
-- and their role is managed in the profiles table.

-- Sample categories for testing
INSERT INTO categories (name, description, slug) VALUES
('Skincare', 'Complete skincare solutions including cleansers, serums, moisturizers, and treatments for all skin types.', 'skincare'),
('Haircare', 'Natural hair care products including oils, shampoos, conditioners, and hair masks for healthy hair.', 'haircare'),
('Body Care', 'Nourishing body care essentials including lotions, scrubs, and body oils for smooth, healthy skin.', 'body-care'),
('Wellness', 'Holistic wellness products including supplements, aromatherapy, and self-care essentials.', 'wellness')
ON CONFLICT (name) DO NOTHING;

-- Sample coupons for testing
INSERT INTO coupons (code, name, description, type, value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, is_active) VALUES
('WELCOME20', 'Welcome Discount', '20% off on your first order above ₹500', 'percentage', 20.0, 500.0, 200.0, 1000, NOW(), NOW() + INTERVAL '1 year', true),
('SAVE100', 'Flat ₹100 Off', 'Get ₹100 off on orders above ₹1000', 'fixed_amount', 100.0, 1000.0, 100.0, 500, NOW(), NOW() + INTERVAL '6 months', true),
('FREESHIP', 'Free Shipping', 'Free shipping on all orders above ₹300', 'free_shipping', 0.0, 300.0, 0.0, null, NOW(), NOW() + INTERVAL '1 year', true)
ON CONFLICT (code) DO NOTHING;

-- Instructions for creating admin user:
-- 
-- OPTION 1: Using the Node.js script (recommended)
-- Run: node scripts/create-admin-user.js
-- This will create the user via Supabase Auth and set the admin role
--
-- OPTION 2: Manual creation via Supabase Dashboard
-- 1. Go to Authentication > Users in your Supabase dashboard
-- 2. Click "Add user" and create user with email: shantanupawar101@gmail.com
-- 3. Set password as: Shantanu@123
-- 4. After user is created, run this SQL to set admin role:
--
-- UPDATE profiles 
-- SET role = 'admin', full_name = 'Shantanu Pawar'
-- WHERE email = 'shantanupawar101@gmail.com';
--
-- OPTION 3: Using SQL with auth.users (advanced)
-- This requires service role access and may not work in all environments:
--
-- -- Insert into auth.users (this requires service role)
-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   recovery_sent_at,
--   last_sign_in_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'shantanupawar101@gmail.com',
--   crypt('Shantanu@123', gen_salt('bf')),
--   NOW(),
--   NULL,
--   NULL,
--   '{"provider": "email", "providers": ["email"]}',
--   '{"full_name": "Shantanu Pawar"}',
--   NOW(),
--   NOW(),
--   '',
--   '',
--   '',
--   ''
-- );
--
-- -- Then update the profile
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE email = 'shantanupawar101@gmail.com';