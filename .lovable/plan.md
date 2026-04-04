## Sistema de Mensagens/Chat

### 1. Banco de dados
- Tabela **conversations**: liga dois usuários a um anúncio específico
- Tabela **messages**: mensagens individuais com texto, remetente e timestamp
- RLS: apenas participantes da conversa podem ler/escrever
- Realtime habilitado na tabela messages

### 2. Funcionalidades
- Botão "Enviar mensagem" nos cards de anúncio (visível para usuários logados, escondido no próprio anúncio)
- Página **/mensagens** com lista de conversas no lado esquerdo e chat no lado direito
- Mensagens em tempo real via Supabase Realtime
- Indicador de mensagens não lidas no Header
- Link para mensagens no header

### 3. Fluxo
1. Usuário clica "Enviar mensagem" no card → cria conversa (ou abre existente) → redireciona para /mensagens
2. Na página de mensagens, lista todas conversas do usuário
3. Ao selecionar conversa, mostra histórico + input para nova mensagem
