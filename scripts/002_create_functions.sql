-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ad duration days from settings
CREATE OR REPLACE FUNCTION get_ad_duration_days()
RETURNS INTEGER AS $$
DECLARE
  duration INTEGER;
BEGIN
  SELECT ad_duration_days INTO duration FROM trade_settings LIMIT 1;
  RETURN COALESCE(duration, 7);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is conversation participant
CREATE OR REPLACE FUNCTION is_conversation_participant(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = _conversation_id 
    AND (buyer_id = _user_id OR seller_id = _user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add balance to wallet
CREATE OR REPLACE FUNCTION add_balance(p_user_id UUID, p_amount INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Create wallet if not exists
  INSERT INTO wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update balance
  UPDATE wallets 
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO wallet_transactions (user_id, amount, type, reason)
  VALUES (p_user_id, p_amount, CASE WHEN p_amount >= 0 THEN 'credit' ELSE 'debit' END, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve deposit request
CREATE OR REPLACE FUNCTION approve_deposit(p_deposit_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_amount_coins INTEGER;
BEGIN
  -- Get deposit details
  SELECT user_id, amount_coins INTO v_user_id, v_amount_coins
  FROM deposit_requests
  WHERE id = p_deposit_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Deposit request not found or already processed';
  END IF;
  
  -- Update deposit status
  UPDATE deposit_requests 
  SET status = 'approved', updated_at = NOW()
  WHERE id = p_deposit_id;
  
  -- Add coins to user wallet
  PERFORM add_balance(v_user_id, v_amount_coins, 'Deposit approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to buy raffle number
CREATE OR REPLACE FUNCTION buy_raffle_number(p_raffle_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS INTEGER[] AS $$
DECLARE
  v_user_id UUID;
  v_price INTEGER;
  v_total_cost INTEGER;
  v_user_balance INTEGER;
  v_available_numbers INTEGER[];
  v_selected_numbers INTEGER[];
  v_num INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Get raffle price
  SELECT price_per_number INTO v_price FROM raffles WHERE id = p_raffle_id AND status = 'active';
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Raffle not found or not active';
  END IF;
  
  v_total_cost := v_price * p_quantity;
  
  -- Check user balance
  SELECT balance INTO v_user_balance FROM wallets WHERE user_id = v_user_id;
  IF COALESCE(v_user_balance, 0) < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Get available numbers
  SELECT ARRAY(
    SELECT n FROM generate_series(1, (SELECT total_numbers FROM raffles WHERE id = p_raffle_id)) n
    WHERE n NOT IN (SELECT number FROM raffle_numbers WHERE raffle_id = p_raffle_id)
    ORDER BY RANDOM()
    LIMIT p_quantity
  ) INTO v_available_numbers;
  
  IF array_length(v_available_numbers, 1) < p_quantity THEN
    RAISE EXCEPTION 'Not enough available numbers';
  END IF;
  
  -- Deduct balance
  PERFORM add_balance(v_user_id, -v_total_cost, 'Raffle purchase');
  
  -- Assign numbers
  FOREACH v_num IN ARRAY v_available_numbers LOOP
    INSERT INTO raffle_numbers (raffle_id, user_id, number) VALUES (p_raffle_id, v_user_id, v_num);
  END LOOP;
  
  RETURN v_available_numbers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to highlight an ad
CREATE OR REPLACE FUNCTION highlight_ad(p_ad_id UUID, p_plan_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_price INTEGER;
  v_duration INTEGER;
  v_user_balance INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Get plan details
  SELECT price_coins, duration_days INTO v_price, v_duration 
  FROM highlight_plans WHERE id = p_plan_id AND active = TRUE;
  
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
  
  -- Check user balance
  SELECT balance INTO v_user_balance FROM wallets WHERE user_id = v_user_id;
  IF COALESCE(v_user_balance, 0) < v_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct balance
  PERFORM add_balance(v_user_id, -v_price, 'Ad highlight');
  
  -- Update ad
  UPDATE ads 
  SET featured = TRUE, expires_at = NOW() + (v_duration || ' days')::INTERVAL
  WHERE id = p_ad_id AND user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete ad with all related data
CREATE OR REPLACE FUNCTION delete_ad_cascade(_ad_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete messages from conversations
  DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE ad_id = _ad_id);
  
  -- Delete conversations
  DELETE FROM conversations WHERE ad_id = _ad_id;
  
  -- Delete favorites
  DELETE FROM favorites WHERE ad_id = _ad_id;
  
  -- Delete offers
  DELETE FROM offers WHERE ad_id = _ad_id;
  
  -- Delete the ad
  DELETE FROM ads WHERE id = _ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
