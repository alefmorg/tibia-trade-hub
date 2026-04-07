-- Função para incrementar likes_count
CREATE OR REPLACE FUNCTION increment_likes(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ads SET likes_count = likes_count + 1 WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar likes_count  
CREATE OR REPLACE FUNCTION decrement_likes(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ads SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants para que usuários autenticados possam chamar as funções
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes(UUID) TO authenticated;
