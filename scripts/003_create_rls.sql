-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "User roles viewable by owner or admin" ON user_roles FOR SELECT 
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can update wallets" ON wallets FOR ALL USING (true);

-- Wallet transactions policies
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Items policies (public read)
CREATE POLICY "Items are viewable by everyone" ON items FOR SELECT USING (true);
CREATE POLICY "Admins can manage items" ON items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Ads policies
CREATE POLICY "Active ads are viewable by everyone" ON ads FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);

-- Messages policies
CREATE POLICY "Users can view conversation messages" ON messages FOR SELECT 
  USING (is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (is_conversation_participant(conversation_id, auth.uid()) AND auth.uid() = sender_id);

-- Offers policies
CREATE POLICY "Users can view offers on own ads or own offers" ON offers FOR SELECT 
  USING (auth.uid() = sender_id OR ad_id IN (SELECT id FROM ads WHERE user_id = auth.uid()));
CREATE POLICY "Users can create offers" ON offers FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own offers" ON offers FOR UPDATE USING (auth.uid() = sender_id);

-- Deposit requests policies
CREATE POLICY "Users can view own deposits" ON deposit_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposits" ON deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage deposits" ON deposit_requests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Raffles policies (public read)
CREATE POLICY "Raffles are viewable by everyone" ON raffles FOR SELECT USING (true);
CREATE POLICY "Admins can manage raffles" ON raffles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Raffle numbers policies
CREATE POLICY "Users can view own raffle numbers" ON raffle_numbers FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM raffles WHERE id = raffle_id AND status = 'completed'));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Public read-only tables
CREATE POLICY "Filter options viewable by everyone" ON filter_options FOR SELECT USING (active = true);
CREATE POLICY "Nav links viewable by everyone" ON nav_links FOR SELECT USING (active = true);
CREATE POLICY "Site banners viewable by everyone" ON site_banners FOR SELECT USING (active = true);
CREATE POLICY "Highlight plans viewable by everyone" ON highlight_plans FOR SELECT USING (active = true);
CREATE POLICY "Trade settings viewable by everyone" ON trade_settings FOR SELECT USING (true);

-- Admin policies for config tables
CREATE POLICY "Admins can manage filter options" ON filter_options FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage nav links" ON nav_links FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage site banners" ON site_banners FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage highlight plans" ON highlight_plans FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage trade settings" ON trade_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
