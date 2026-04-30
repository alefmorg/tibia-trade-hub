-- Revoke EXECUTE from anon/authenticated on functions that are only meant to be invoked
-- by triggers or by other SECURITY DEFINER functions internally. Admin-guarded RPCs and
-- user-callable RPCs (donate_coins, buy_raffle_number, highlight_ad, has_role,
-- get_user_reputation, is_conversation_participant, is_ticket_participant,
-- get_ad_duration_days used by trigger) keep their grants.

-- Trigger-only functions
REVOKE EXECUTE ON FUNCTION public.guard_ads_privileged_columns() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_messages_read_only_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_offers_owner_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_profiles_privileged_columns() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_likes_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bump_ticket_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_ad_expiration_from_settings() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_ad_tier() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_item_tier() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_item_source() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_trade_settings() FROM anon, authenticated, public;

-- Internal helpers (called only from other SECURITY DEFINER functions)
REVOKE EXECUTE ON FUNCTION public.notify_admins(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.claim_raffle_prize(uuid, uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_read_notifications() FROM anon, authenticated, public;

-- Admin-only RPCs: keep callable (they self-check has_role) but revoke from anon
REVOKE EXECUTE ON FUNCTION public.add_balance(uuid, integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_delete(text, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_deposit(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_storage_and_data() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.draw_raffle_winner(uuid, integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_ad_cascade(uuid) FROM anon, public;

-- User-callable RPCs: revoke from anon (still callable by authenticated)
REVOKE EXECUTE ON FUNCTION public.donate_coins(integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.buy_raffle_number(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.highlight_ad(uuid, uuid) FROM anon, public;
