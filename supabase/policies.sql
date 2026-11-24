-- ==============================================================================
-- OUR LITTLE CORNER 1.0 ♡ - ROW LEVEL SECURITY (RLS) & STORAGE POLICIES
-- ==============================================================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_vault ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS: PROFILES
DROP POLICY IF EXISTS "Consulta pública de contagem para registro" ON public.profiles;
DROP POLICY IF EXISTS "Perfis visíveis para usuários autenticados" ON public.profiles;
CREATE POLICY "Perfis visíveis para usuários autenticados"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Usuário atualiza apenas o próprio perfil" ON public.profiles;
CREATE POLICY "Usuário atualiza apenas o próprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. POLÍTICAS: LETTERS
DROP POLICY IF EXISTS "Visualizar cartas permitidas" ON public.letters;
CREATE POLICY "Visualizar cartas permitidas"
ON public.letters FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  (status != 'draft' AND (recipient_id = auth.uid() OR recipient_id IS NULL))
);

DROP POLICY IF EXISTS "Criar novas cartas" ON public.letters;
CREATE POLICY "Criar novas cartas"
ON public.letters FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Atualizar cartas" ON public.letters;
CREATE POLICY "Atualizar cartas"
ON public.letters FOR UPDATE
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
)
WITH CHECK (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
);

DROP POLICY IF EXISTS "Excluir próprias cartas" ON public.letters;
CREATE POLICY "Excluir próprias cartas"
ON public.letters FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- 4. POLÍTICAS: LETTER_VERSIONS
DROP POLICY IF EXISTS "Visualizar versões de cartas" ON public.letter_versions;
CREATE POLICY "Visualizar versões de cartas"
ON public.letter_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.letters l
    WHERE l.id = letter_versions.letter_id
    AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Inserir versões de cartas" ON public.letter_versions;
CREATE POLICY "Inserir versões de cartas"
ON public.letter_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.letters l
    WHERE l.id = letter_versions.letter_id
    AND l.sender_id = auth.uid()
  )
);

-- 5. POLÍTICAS: DRAWINGS
DROP POLICY IF EXISTS "Visualizar desenhos" ON public.drawings;
CREATE POLICY "Visualizar desenhos"
ON public.drawings FOR SELECT
TO authenticated
USING (
  auth.uid() = author_id OR 
  is_shared = true OR 
  recipient_id = auth.uid()
);

DROP POLICY IF EXISTS "Salvar desenhos" ON public.drawings;
CREATE POLICY "Salvar desenhos"
ON public.drawings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Atualizar próprios desenhos ou favoritar" ON public.drawings;
CREATE POLICY "Atualizar próprios desenhos ou favoritar"
ON public.drawings FOR UPDATE
TO authenticated
USING (auth.uid() = author_id OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Excluir próprios desenhos" ON public.drawings;
CREATE POLICY "Excluir próprios desenhos"
ON public.drawings FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 6. POLÍTICAS: DRAWING SESSIONS & EVENTS (COLABORATIVO EM TEMPO REAL)
DROP POLICY IF EXISTS "Ver sessões de desenho ativas" ON public.drawing_sessions;
CREATE POLICY "Ver sessões de desenho ativas"
ON public.drawing_sessions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Sincronizar eventos de desenho" ON public.drawing_events;
CREATE POLICY "Sincronizar eventos de desenho"
ON public.drawing_events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. POLÍTICAS: GIFTS (PRESENTES DIGITAIS)
DROP POLICY IF EXISTS "Visualizar presentes enviados ou recebidos" ON public.gifts;
CREATE POLICY "Visualizar presentes enviados ou recebidos"
ON public.gifts FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR recipient_id IS NULL);

DROP POLICY IF EXISTS "Enviar presentes" ON public.gifts;
CREATE POLICY "Enviar presentes"
ON public.gifts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Atualizar presentes (resgatar ou abrir)" ON public.gifts;
CREATE POLICY "Atualizar presentes (resgatar ou abrir)"
ON public.gifts FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR recipient_id IS NULL);

DROP POLICY IF EXISTS "Excluir próprios presentes" ON public.gifts;
CREATE POLICY "Excluir próprios presentes"
ON public.gifts FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- 8. POLÍTICAS: WALL_POSTS (MURAL COMPARTILHADO)
DROP POLICY IF EXISTS "Visualizar publicações do mural" ON public.wall_posts;
CREATE POLICY "Visualizar publicações do mural"
ON public.wall_posts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Criar publicações no mural" ON public.wall_posts;
CREATE POLICY "Criar publicações no mural"
ON public.wall_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Editar próprias publicações no mural" ON public.wall_posts;
CREATE POLICY "Editar próprias publicações no mural"
ON public.wall_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Excluir próprias publicações no mural" ON public.wall_posts;
CREATE POLICY "Excluir próprias publicações no mural"
ON public.wall_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 9. POLÍTICAS: CALENDAR_EVENTS
DROP POLICY IF EXISTS "Ver datas do calendário" ON public.calendar_events;
CREATE POLICY "Ver datas do calendário"
ON public.calendar_events FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Criar evento no calendário" ON public.calendar_events;
CREATE POLICY "Criar evento no calendário"
ON public.calendar_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Atualizar evento no calendário" ON public.calendar_events;
CREATE POLICY "Atualizar evento no calendário"
ON public.calendar_events FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Excluir evento do calendário" ON public.calendar_events;
CREATE POLICY "Excluir evento do calendário"
ON public.calendar_events FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- 10. POLÍTICAS: NOTIFICATIONS
DROP POLICY IF EXISTS "Ver próprias notificações" ON public.notifications;
CREATE POLICY "Ver próprias notificações"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Atualizar próprias notificações" ON public.notifications;
CREATE POLICY "Atualizar próprias notificações"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Criar notificações para o parceiro" ON public.notifications;
CREATE POLICY "Criar notificações para o parceiro"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 11. POLÍTICAS: SECRET_VAULT
DROP POLICY IF EXISTS "Ver itens do cofre secreto" ON public.secret_vault;
CREATE POLICY "Ver itens do cofre secreto"
ON public.secret_vault FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Criar item no cofre secreto" ON public.secret_vault;
CREATE POLICY "Criar item no cofre secreto"
ON public.secret_vault FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Atualizar item no cofre secreto" ON public.secret_vault;
CREATE POLICY "Atualizar item no cofre secreto"
ON public.secret_vault FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Excluir item no cofre secreto" ON public.secret_vault;
CREATE POLICY "Excluir item no cofre secreto"
ON public.secret_vault FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 12. CONFIGURAÇÃO DE BUCKETS DE STORAGE DO SUPABASE
-- Insere os buckets caso não existam
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('drawings', 'drawings', true),
  ('photos', 'photos', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para upload e download
DROP POLICY IF EXISTS "Acesso público a arquivos do cantinho" ON storage.objects;
CREATE POLICY "Acesso público a arquivos do cantinho"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('drawings', 'photos', 'avatars'));

DROP POLICY IF EXISTS "Upload por usuários autenticados" ON storage.objects;
CREATE POLICY "Upload por usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('drawings', 'photos', 'avatars'));

DROP POLICY IF EXISTS "Atualizar arquivos próprios" ON storage.objects;
CREATE POLICY "Atualizar arquivos próprios"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('drawings', 'photos', 'avatars'));

DROP POLICY IF EXISTS "Excluir arquivos" ON storage.objects;
CREATE POLICY "Excluir arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('drawings', 'photos', 'avatars'));

