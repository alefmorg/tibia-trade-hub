const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-xs text-destructive">
        Pagamentos em produção ainda não configurados.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-warning/10 border-b border-warning/30 px-4 py-2 text-center text-xs text-warning">
        Modo de teste — use cartão <strong>4242 4242 4242 4242</strong> para simular pagamentos.
      </div>
    );
  }
  return null;
}
