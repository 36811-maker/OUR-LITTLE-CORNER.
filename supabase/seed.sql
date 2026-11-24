-- ==============================================================================
-- OUR LITTLE CORNER 1.0 ♡ - INICIALIZAÇÃO AUTOMÁTICA DAS DUAS CONTAS
-- ==============================================================================
-- Este arquivo descreve os métodos oficiais para criar as 2 contas automáticas
-- no Supabase Authentication, com senhas fortes e sem cadastro manual no Dashboard.
--
-- Contas Iniciais Padrão:
--   * Conta 1: conta1@ourlittlecorner.com
--   * Conta 2: conta2@ourlittlecorner.com
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MÉTODO 1 (RECOMENDADO): VIA SUPABASE EDGE FUNCTION (init-accounts)
-- ------------------------------------------------------------------------------
-- A Edge Function localizada em "supabase/functions/init-accounts/index.ts"
-- utiliza a SUPABASE_SERVICE_ROLE_KEY no lado do servidor para:
--   1. Verificar se as duas contas já existem (não sobrescreve senhas existentes).
--   2. Gerar senhas fortes e aleatórias automaticamente.
--   3. Criar os usuários já com email_confirm = true (sem travar por email pendente).
--   4. Criar e associar os respectivos perfis na tabela profiles.
--   5. Retornar as credenciais geradas apenas ao administrador que a executou.
--
-- Como implantar e executar via Supabase CLI:
--   1. supabase functions deploy init-accounts --no-verify-jwt
--   2. Executar a função (exemplo via curl):
--      curl -i --location --request POST 'https://<SEU-PROJETO>.supabase.co/functions/v1/init-accounts' \
--        --header 'Content-Type: application/json' \
--        --header 'x-admin-secret: <SEU_ADMIN_INIT_SECRET>'
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- MÉTODO 2: VIA SUPABASE SQL EDITOR (SCRIPT ATÔMICO)
-- Caso prefira inicializar diretamente pelo SQL Editor do Supabase Dashboard,
-- execute o script abaixo. Ele cria as contas com senhas seguras e perfis associados:
-- ------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  uid_1 UUID := gen_random_uuid();
  uid_2 UUID := gen_random_uuid();
  user1_exists UUID;
  user2_exists UUID;
  -- Senhas fortes iniciais geradas aleatoriamente
  pass_1 TEXT := 'LoveCorner#' || substr(md5(random()::text), 1, 10);
  pass_2 TEXT := 'LoveCorner#' || substr(md5(random()::text), 1, 10);
BEGIN
  -- 1. Conta 1 (conta1@ourlittlecorner.com)
  SELECT id INTO user1_exists FROM auth.users WHERE email = 'conta1@ourlittlecorner.com';
  
  IF user1_exists IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token
    ) VALUES (
      uid_1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'conta1@ourlittlecorner.com', crypt(pass_1, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Meu Amor 1","username":"conta1"}'::jsonb,
      now(), now(), ''
    );
    RAISE NOTICE 'Conta 1 criada! E-mail: conta1@ourlittlecorner.com | Senha: %', pass_1;
  ELSE
    uid_1 := user1_exists;
    RAISE NOTICE 'Conta 1 já existia. Senha preservada com segurança.';
  END IF;

  INSERT INTO public.profiles (id, email, username, display_name, bio, theme)
  VALUES (uid_1, 'conta1@ourlittlecorner.com', 'conta1', 'Meu Amor 1', 'No nosso cantinho especial ♡', 'light')
  ON CONFLICT (id) DO UPDATE SET display_name = 'Meu Amor 1', updated_at = now();

  -- 2. Conta 2 (conta2@ourlittlecorner.com)
  SELECT id INTO user2_exists FROM auth.users WHERE email = 'conta2@ourlittlecorner.com';
  
  IF user2_exists IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token
    ) VALUES (
      uid_2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'conta2@ourlittlecorner.com', crypt(pass_2, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Meu Amor 2","username":"conta2"}'::jsonb,
      now(), now(), ''
    );
    RAISE NOTICE 'Conta 2 criada! E-mail: conta2@ourlittlecorner.com | Senha: %', pass_2;
  ELSE
    uid_2 := user2_exists;
    RAISE NOTICE 'Conta 2 já existia. Senha preservada com segurança.';
  END IF;

  INSERT INTO public.profiles (id, email, username, display_name, bio, theme)
  VALUES (uid_2, 'conta2@ourlittlecorner.com', 'conta2', 'Meu Amor 2', 'A outra metade deste cantinho ♡', 'light')
  ON CONFLICT (id) DO UPDATE SET display_name = 'Meu Amor 2', updated_at = now();

END $$;

-- ------------------------------------------------------------------------------
-- VERIFICAÇÃO FINAL:
-- ------------------------------------------------------------------------------
SELECT id, email, created_at, email_confirmed_at FROM auth.users;
SELECT id, username, display_name, email FROM public.profiles;
