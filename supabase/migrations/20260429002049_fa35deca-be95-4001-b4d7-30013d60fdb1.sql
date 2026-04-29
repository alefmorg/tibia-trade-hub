-- Performance indexes for common query paths
CREATE INDEX IF NOT EXISTS idx_offers_ad_id ON public.offers(ad_id);
CREATE INDEX IF NOT EXISTS idx_offers_sender_id ON public.offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON public.deposit_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_raffle_numbers_user ON public.raffle_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_numbers_raffle ON public.raffle_numbers(raffle_id);

-- Composite for the very common feed query (active + featured + sort)
CREATE INDEX IF NOT EXISTS idx_ads_feed ON public.ads(status, featured DESC, created_at DESC) WHERE status = 'active';

-- Storage cleanup helper: remove old/expired data and orphan files
CREATE OR REPLACE FUNCTION public.cleanup_storage_and_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notif int := 0;
  v_tx int := 0;
  v_msg int := 0;
  v_ads int := 0;
  v_dep int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  -- read notifications older than 7 days
  WITH d AS (DELETE FROM notifications WHERE read = true AND created_at < now() - interval '7 days' RETURNING 1)
  SELECT count(*) INTO v_notif FROM d;

  -- wallet transactions older than 180 days
  WITH d AS (DELETE FROM wallet_transactions WHERE created_at < now() - interval '180 days' RETURNING 1)
  SELECT count(*) INTO v_tx FROM d;

  -- messages older than 90 days
  WITH d AS (DELETE FROM messages WHERE created_at < now() - interval '90 days' RETURNING 1)
  SELECT count(*) INTO v_msg FROM d;

  -- expired ads older than 30 days past expiration
  WITH d AS (DELETE FROM ads WHERE expires_at IS NOT NULL AND expires_at < now() - interval '30 days' RETURNING 1)
  SELECT count(*) INTO v_ads FROM d;

  -- approved/rejected deposits older than 90 days
  WITH d AS (DELETE FROM deposit_requests WHERE status IN ('approved','rejected') AND updated_at < now() - interval '90 days' RETURNING 1)
  SELECT count(*) INTO v_dep FROM d;

  RETURN jsonb_build_object(
    'notifications_deleted', v_notif,
    'transactions_deleted', v_tx,
    'messages_deleted', v_msg,
    'expired_ads_deleted', v_ads,
    'old_deposits_deleted', v_dep
  );
END;
$$;