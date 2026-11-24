-- ==============================================================================
-- OUR LITTLE CORNER 1.0 ♡ - SUPABASE SCHEMA PRINCIPAL
-- ==============================================================================
-- Este script configura todas as tabelas, tipos, funções, triggers de segurança
-- e a restrição atômica e estrita de no máximo 2 usuários cadastrados.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÃO E TRIGGER PARA LIMITAR CADASTROS A EXATAMENTE 2 CONTAS NO SUPABASE AUTH
-- Isso é executado no banco antes de criar um novo usuário no auth.users,
-- tornando o bloqueio estrito, atômico e imune a race conditions no frontend.
CREATE OR REPLACE FUNCTION public.check_user_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT count(*) INTO current_count FROM auth.users;
  IF current_count >= 2 THEN
    RAISE EXCEPTION 'O limite máximo de 2 usuários para este cantinho já foi atingido. Novos cadastros estão bloqueados.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica o trigger em auth.users
DROP TRIGGER IF EXISTS tr_check_user_limit ON auth.users;
CREATE TRIGGER tr_check_user_limit
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.check_user_limit();

-- 3. TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT 'No nosso cantinho especial ♡',
  theme TEXT DEFAULT 'light', -- 'light', 'lavender', 'dark'
  sound_enabled BOOLEAN DEFAULT true,
  sound_volume NUMERIC DEFAULT 0.7,
  relationship_start_date DATE DEFAULT '2024-01-01',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Função para consultar se novos cadastros são permitidos (< 2 usuários)
CREATE OR REPLACE FUNCTION public.is_registration_open()
RETURNS BOOLEAN AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  RETURN user_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar o perfil automaticamente ao cadastrar um usuário no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABELA DE CARTAS (LETTERS)
CREATE TABLE IF NOT EXISTS public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Uma carta com amor ♡',
  content TEXT NOT NULL DEFAULT '',
  paper_style TEXT NOT NULL DEFAULT 'cream', -- floral, hearts, lavender, cream, stars, minimalist, vintage, illustrated
  font_family TEXT NOT NULL DEFAULT 'caveat', -- caveat, playfair, nunito, cursive
  font_size TEXT NOT NULL DEFAULT 'medium', -- small, medium, large
  text_color TEXT NOT NULL DEFAULT '#765D6C',
  text_align TEXT NOT NULL DEFAULT 'left', -- left, center, justify
  decorations JSONB DEFAULT '[]'::jsonb, -- selos, carimbos, adesivos {type, id, x, y}
  attachments JSONB DEFAULT '[]'::jsonb, -- lista de URLs de imagens
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'archived'
  is_favorite BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- 5. HISTÓRICO DE VERSÕES DAS CARTAS (LETTER_VERSIONS)
CREATE TABLE IF NOT EXISTS public.letter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABELA DE DESENHOS (DRAWINGS)
CREATE TABLE IF NOT EXISTS public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Nosso desenho ♡',
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  background_url TEXT DEFAULT '',
  is_shared BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. SESSÕES DE DESENHO COLABORATIVO (DRAWING_SESSIONS)
CREATE TABLE IF NOT EXISTS public.drawing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Tela Compartilhada em Tempo Real',
  canvas_data TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EVENTOS DE DESENHO EM TEMPO REAL (DRAWING_EVENTS)
-- Para persistência e sincronização de traços na sessão colaborativa
CREATE TABLE IF NOT EXISTS public.drawing_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES public.drawing_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'stroke', 'clear', 'image', 'sticker'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABELA DE PRESENTES DIGITAIS (GIFTS)
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gift_type TEXT NOT NULL, -- 'coupon', 'card', 'surprise', 'sticker', 'meme', 'photo_note'
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  color TEXT DEFAULT '#F4B8CC',
  icon TEXT DEFAULT 'heart',
  expiration_date DATE,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  is_opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. MURAL COMPARTILHADO (WALL_POSTS)
CREATE TABLE IF NOT EXISTS public.wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'note', -- 'note', 'polaroid', 'sticker', 'quote'
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  color TEXT DEFAULT '#FFF4E8',
  rotation NUMERIC DEFAULT 0,
  pos_x NUMERIC DEFAULT 0,
  pos_y NUMERIC DEFAULT 0,
  stickers JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. CALENDÁRIO DE DATAS ESPECIAIS (CALENDAR_EVENTS)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TIME,
  category TEXT DEFAULT 'special', -- 'anniversary', 'date', 'travel', 'memory', 'surprise'
  color TEXT DEFAULT '#F4B8CC',
  icon TEXT DEFAULT 'heart',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. NOTIFICAÇÕES (NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'letter', 'drawing', 'gift', 'wall', 'calendar'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. COFRE / PÁGINA SECRETA (SECRET_VAULT)
CREATE TABLE IF NOT EXISTS public.secret_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  secret_content TEXT NOT NULL,
  category TEXT DEFAULT 'vow', -- 'vow', 'memory', 'letter', 'promise'
  unlock_date DATE,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. FUNÇÃO PARA DISPARAR NOTIFICAÇÃO AUTOMÁTICA AO ENVIAR CARTA
CREATE OR REPLACE FUNCTION public.notify_on_letter_sent()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  IF NEW.status = 'sent' AND (OLD.status IS DISTINCT FROM 'sent') THEN
    SELECT display_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
    IF sender_name IS NULL THEN
      sender_name := 'Seu amor';
    END IF;

    -- Se não houver destinatário definido, envia para o outro usuário
    IF NEW.recipient_id IS NULL THEN
      SELECT id INTO NEW.recipient_id FROM public.profiles WHERE id != NEW.sender_id LIMIT 1;
    END IF;

    IF NEW.recipient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, sender_id, type, title, message, link_url)
      VALUES (
        NEW.recipient_id,
        NEW.sender_id,
        'letter',
        'Nova carta para você! ♡',
        sender_name || ' acabou de te enviar uma carta: "' || NEW.title || '"',
        'cartas.html?id=' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_letter_sent ON public.letters;
CREATE TRIGGER tr_notify_on_letter_sent
BEFORE INSERT OR UPDATE ON public.letters
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_letter_sent();

-- 15. ATIVAR REALTIME NAS TABELAS PRINCIPAIS
ALTER PUBLICATION supabase_realtime ADD TABLE public.letters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drawings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drawing_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

