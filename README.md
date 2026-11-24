# OUR LITTLE CORNER 1.0 ♡
### Nosso Cantinho Digital Privado, Romântico e Interativo

**OUR LITTLE CORNER** é uma aplicação web completa desenvolvida exclusivamente para **duas pessoas** compartilharem um refúgio íntimo, seguro e repleto de afeto. Combina o charme e aconchego de uma papelaria artesanal digital com a robustez de um backend em nuvem com sincronização em tempo real e autenticação persistente.

---

## 🌸 1. Tecnologias Utilizadas

- **Estrutura:** HTML5 semântico e modular.
- **Identidade Visual e Animações:** CSS3 puro, responsivo, com variáveis de tema, suporte a modo claro/lavanda/escuro e efeitos 3D suaves.
- **Comportamento & Interatividade:** JavaScript puro (ES6+ Vanilla), sem frameworks externos (React, Vue, Angular proibidos por especificação).
- **Efeitos Sonoros:** Sintetizados nativamente via **Web Audio API** (sem risco de links quebrados ou falha no carregamento de áudios externos).
- **Backend & Banco de Dados:** **Supabase PostgreSQL** com Row Level Security (RLS) completo.
- **Autenticação:** **Supabase Auth** com credenciais permanentes, recuperação de senha e restrição atômica a 2 usuários.
- **Armazenamento de Arquivos:** **Supabase Storage** (buckets `drawings`, `photos` e `avatars`).
- **Sincronização em Tempo Real:** **Supabase Realtime** para notificações instantâneas e tela de **desenho colaborativo simultâneo**.

---

## 🎨 2. Identidade Visual e Paleta de Cores

A estética foi pensada para transmitir calor, romance e delicadeza:

| Cor | Código Hex | Descrição |
|---|---|---|
| **Rosa Principal** | `#F4B8CC` | Cor de destaque romântica e botões principais |
| **Lavanda** | `#E5D8F5` | Aconchego e toques suaves |
| **Creme** | `#FFF4E8` | Fundo quente de papelaria artesanal |
| **Rosa Antigo** | `#D9B5C7` | Detalhes vintage e bordas elegantes |
| **Verde Sálvia** | `#C8D9D5` | Elementos botânicos e frescor |
| **Azul Suave** | `#B7CDE0` | Calmaria e céus estrelados |
| **Texto Escuro** | `#765D6C` | Tinta sépia de alta legibilidade e contraste |
| **Branco Pérola** | `#FFFCFA` | Superfície pura dos cartões e folhas |

### Tipografia
- **Títulos:** *Playfair Display* (elegância clássica e sofisticação editorial).
- **Textos e Interface:** *Nunito* (alta legibilidade, curvas suaves e amigáveis).
- **Detalhes e Cartas:** *Caveat* (caligrafia manuscrita e bilhetinhos afetuosos).

---

## 💌 3. Estrutura de Páginas

1. **`index.html`**: Ponto de entrada com carregamento inteligente e redirecionamento de sessão.
2. **`login.html`**: Tela de autenticação com logo delicado, frases de boas-vindas, recuperação de senha e aba de cadastro restrita às 2 primeiras contas.
3. **`dashboard.html`**: Painel personalizado com saudação dinâmica, frase de amor do dia, **contador de tempo juntos em tempo real** (dias, horas, minutos e segundos), métricas, últimas cartas e caixa de bilhete rápido.
4. **`cartas.html`**: Caixa de correio particular dividida em abas (Todas, Recebidas, Enviadas, Rascunhos, Favoritas). Leitor imersivo com animação de envelope 3D e lacre de cera que se abre ao som de papel virando.
5. **`editor-carta.html`**: Editor completo com 8 modelos de papéis decorados (Creme, Floral, Corações, Lavanda, Estrelado, Minimalista, Vintage, Ilustrado), seleção de fontes, tintas, adesivos decorativos, fotos anexadas e **salvamento automático de rascunhos** em tempo real.
6. **`desenhos.html`**: Estúdio de arte digital em HTML5 Canvas (pincel comum, caneta fina, marcador fluorescente, giz texturizado, borracha, espessura e paleta romântica). Permite desenhar sobre fotografias importadas e conta com **Desenho Colaborativo em Tempo Real** onde os dois desenham juntos e veem os traços do outro simultaneamente!
7. **`galeria.html`**: Mural fotográfico estilo Polaroid com washi tapes coloridas, visualizador Lightbox em alta resolução, download e filtros.
8. **`presentes.html`**: Espaço de mimos digitais: **Vales do Amor / Cupons interativos** (que o parceiro pode resgatar tocando no botão), **Caixas de Surpresa fechadas** (que se abrem com confetes), cartões de afeto e memes românticos.
9. **`calendario.html`**: Calendário compartilhado de datas importantes (aniversários, encontros, viagens) com contagem regressiva para os próximos marcos do casal.
10. **`lembrancas.html`**: Álbum de memórias favoritadas (reúne todas as cartas, desenhos, fotos e presentes marcados com coração).
11. **`mural.html`**: Mural estilo cortiça pastel com post-its coloridos, notas fixadas com alfinete e sincronização instantânea.
12. **`secreto.html`**: Refúgio noturno estrelado com o **Cadeado do Amor**, cápsulas do tempo, votos e promessas eternas.
13. **`perfil.html`**: Personalização de tema (Rosa & Creme, Lavanda, Noite Estrelada), fotos de avatar, controle de efeitos sonoros e alteração segura de e-mail e senha pelo Supabase Auth.

---

## 🔒 4. Sistema de Segurança e Limite Estrito de 2 Contas

- O limite de exatamente 2 usuários é protegido **no nível do banco de dados**:
  - Foi criado um trigger PostgreSQL `BEFORE INSERT ON auth.users` que consulta a contagem de contas e rejeita atômica e permanentemente qualquer terceira tentativa de cadastro.
  - No frontend, a interface consulta a RPC `is_registration_open()` e bloqueia a aba de registro assim que as 2 contas existirem.
- **Persistência de Credenciais:** Os e-mails e senhas nunca são redefinidos automaticamente ou perdidos em logout. A autenticação é 100% gerenciada pelo Supabase Auth.
- **Row Level Security (RLS):** Cada tabela do banco possui regras estritas de acesso para que nenhum visitante ou terceiro possa visualizar conteúdos particulares.

---

## 🚀 5. Como Configurar e Executar

### Passo 1: Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um novo projeto (ex: `our-little-corner`).

### Passo 2: Executar o Schema do Banco de Dados
1. No painel do seu projeto Supabase, acesse **SQL Editor**.
2. Abra e copie todo o conteúdo do arquivo `supabase/schema.sql`.
3. Cole no SQL Editor e clique em **Run**.
4. Em seguida, copie todo o conteúdo do arquivo `supabase/policies.sql`, cole no SQL Editor e clique em **Run**.

*(Pronto! As tabelas, triggers, restrição de 2 contas, realtime e storage buckets estarão 100% configurados).*

### Passo 3: Conectar a Aplicação
Você pode conectar de duas formas:
- **Opção A (Interface Gráfica):** Ao abrir o site pela primeira vez no navegador, uma janela bonita aparecerá solicitando sua **Supabase URL** e a **Anon / Public Key** (obtidas em *Project Settings → API*).
- **Opção B (Arquivo de Configuração):** Abra o arquivo `js/config.js` e preencha:
  ```javascript
  SUPABASE_URL: "https://seu-projeto.supabase.co",
  SUPABASE_ANON_KEY: "sua-chave-anon-aqui"
  ```

### Passo 4: Executar Localmente
Como o projeto utiliza tecnologias web puras e sem dependência de build compilado, basta servir a pasta com qualquer servidor estático HTTP. Exemplos:

- **Via Python:**
  ```powershell
  python -m http.server 8080
  ```
- **Via VS Code:** Clique com botão direito em `index.html` e selecione *Open with Live Server*.
- **Via Node.js (npx):**
  ```powershell
  npx serve .
  ```

Abra `http://localhost:8080` no navegador!

---

## 💍 6. O Primeiro Acesso do Casal

1. O primeiro parceiro abre a aplicação, vai na aba **Criar Conta**, escolhe seu nome de exibição, username, e-mail, senha e avatar fofo.
2. O segundo parceiro abre a aplicação e faz o mesmo para criar sua própria conta.
3. Assim que a segunda conta for criada, o sistema tranca automaticamente o cadastro no backend e na interface!
4. A partir daí, os dois acessam com suas respectivas credenciais a qualquer momento, de computadores ou celulares, desfrutando do seu próprio cantinho particular. ♡

