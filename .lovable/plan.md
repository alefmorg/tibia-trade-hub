## Finalização Avançada do Admin Panel

Vou adicionar 4 grupos de funcionalidades, todos com confirmação dupla onde fizer sentido (digitar "RESETAR" para ações destrutivas em massa).

---

### 1. Nova aba "Resets Manuais" (perigosa, separada da Limpeza)

Aba dedicada com 3 grandes botões vermelhos, cada um exigindo digitação da palavra **RESETAR** para confirmar:

- **Zerar todas as carteiras** — coloca `balance = 0` em todas as wallets, registra transação de débito com motivo "Reset global pelo admin", e avisa todos os usuários por notificação.
- **Encerrar todas as conversas e mensagens** — apaga tudo de `messages` + `conversations` (mensagens de suporte ficam intactas).
- **Resetar curtidas/favoritos** — apaga tudo de `favorites` e zera `likes_count` em todos os anúncios.

Cada ação mostra antes: "Isso vai afetar X usuários / Y registros" para você ter dimensão.

---

### 2. Painel de Rifas — edições avançadas

Dentro do dialog "Prêmios & Detalhes" de cada rifa (que já existe), vou adicionar duas seções novas:

- **Adicionar números manualmente** — escolhe usuário (combobox) + número específico ou quantidade aleatória → cria entrada em `raffle_numbers` sem cobrar coins (útil para promoções/bug fixes).
- **Reembolsar comprador** — na lista de compradores, cada linha ganha botão "Reembolsar" que apaga as entradas de `raffle_numbers` daquele usuário naquela rifa e devolve coins (`preço × quantidade`) na carteira dele, com transação registrada.

---

### 3. Carteira — definir saldo exato

Hoje só dá pra somar/subtrair. Vou adicionar na aba **Saldo / Coins** um segundo formulário "Definir saldo exato": escolhe usuário, digita o valor final desejado, e o sistema calcula a diferença e registra a transação correta (crédito ou débito) com motivo "Ajuste manual: saldo definido para X".

---

### 4. Logs de Auditoria (nova aba "Auditoria")

Tabela nova `admin_audit_log` que grava automaticamente toda ação sensível de admin:
- quem fez (admin user_id + username)
- o que (action: "wallet_reset", "ban_user", "set_balance", "delete_ad", "draw_raffle", "refund_raffle", etc.)
- alvo (user_id afetado / id do recurso)
- detalhes (JSON com valores antes/depois)
- quando (timestamp)

Aba nova com tabela paginada, filtros por admin / tipo de ação / período. Cada nova função criada acima já grava log automaticamente. Ações antigas como banir/desbanir, ajustar carteira, deletar anúncios, sortear rifa também passam a gravar.

---

### Detalhes técnicos

**Banco (migration):**
- Nova tabela `admin_audit_log` (id, admin_id, action, target_type, target_id, details jsonb, created_at). RLS: só admins leem; INSERT permitido só via funções `SECURITY DEFINER`.
- Novas funções RPC `SECURITY DEFINER` (todas validam `has_role(auth.uid(), 'admin')` e gravam audit log):
  - `admin_reset_all_wallets()` → zera `wallets.balance`, registra transações, notifica usuários.
  - `admin_reset_all_conversations()` → DELETE em `messages` + `conversations`.
  - `admin_reset_all_favorites()` → DELETE em `favorites`, UPDATE `ads.likes_count = 0`.
  - `admin_set_user_balance(p_user_id, p_target)` → calcula delta, atualiza wallet, grava transação.
  - `admin_grant_raffle_numbers(p_raffle_id, p_user_id, p_numbers int[])` → insere números sem cobrar.
  - `admin_refund_raffle_user(p_raffle_id, p_user_id)` → apaga números do user, devolve coins.
  - `admin_log(action, target_type, target_id, details)` helper interno.

**Edge function `admin-actions`:** novas actions chamando essas RPCs + retornando contagens prévias para os modais ("vai afetar N usuários").

**Frontend:**
- Novo componente `src/components/admin/ResetsPanel.tsx` (3 cards de reset, cada um com `AlertDialog` exigindo digitar "RESETAR").
- Novo componente `src/components/admin/AuditLogPanel.tsx` (tabela com filtros).
- `RafflesAdminPanel.tsx` → no `RaffleDetailDialog`, adicionar seção "Adicionar números" + botão "Reembolsar" por linha de comprador.
- `Admin.tsx`:
  - novo formulário "Definir saldo exato" na aba `wallet`.
  - novas entradas no sidebar: **Resets Manuais** (em CONFIGURAÇÕES, com ícone vermelho) e **Auditoria** (em CONFIGURAÇÕES).
- `useAdmin.tsx`: novos hooks `useAdminAuditLog`, `useAdminResets`, `useSetUserBalance`, `useGrantRaffleNumbers`, `useRefundRaffleUser`.

**Segurança:** todas as RPCs verificam admin no servidor; o "RESETAR" é só UX. Logs gravam mesmo se a ação falhar parcialmente.