-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for app_role
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT DEFAULT 'credit',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  image_url TEXT,
  tier INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID REFERENCES items(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  price TEXT,
  currency TEXT DEFAULT 'gold',
  world TEXT NOT NULL,
  pvp_type TEXT DEFAULT 'open',
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  tier INTEGER,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_id UUID NOT NULL REFERENCES ads(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES ads(id),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES ads(id),
  sender_id UUID NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT DEFAULT 'gold',
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deposit_requests table
CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_gold INTEGER NOT NULL,
  amount_coins INTEGER NOT NULL,
  screenshot_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create raffles table
CREATE TABLE IF NOT EXISTS raffles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_per_number INTEGER NOT NULL,
  total_numbers INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  draw_date TIMESTAMPTZ,
  federal_lottery_ref TEXT,
  winner_number INTEGER,
  winner_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create raffle_numbers table
CREATE TABLE IF NOT EXISTS raffle_numbers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES raffles(id),
  user_id UUID NOT NULL,
  number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raffle_id, number)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create filter_options table
CREATE TABLE IF NOT EXISTS filter_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filter_group TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nav_links table
CREATE TABLE IF NOT EXISTS nav_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_url TEXT,
  color TEXT DEFAULT '#ffffff',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create site_banners table
CREATE TABLE IF NOT EXISTS site_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create highlight_plans table
CREATE TABLE IF NOT EXISTS highlight_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price_coins INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trade_settings table
CREATE TABLE IF NOT EXISTS trade_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_duration_days INTEGER DEFAULT 7,
  deposit_char_name TEXT,
  gold_to_coins_rate INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default trade settings
INSERT INTO trade_settings (ad_duration_days, gold_to_coins_rate) 
VALUES (7, 1000)
ON CONFLICT DO NOTHING;
