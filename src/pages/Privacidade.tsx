import Header from "@/components/Header";
import { Shield, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
            <p className="text-xs text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <article className="prose prose-invert max-w-none space-y-5 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Quem somos</h2>
            <p>O <strong>RubinTrade</strong> é um marketplace independente para a comunidade do servidor RubinOT. Não temos vínculo oficial com a CipSoft ou com a operação do servidor.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Conta:</strong> e-mail, nome de usuário e (opcional) avatar/bio.</li>
              <li><strong>Anúncios e mensagens:</strong> conteúdo publicado por você no site.</li>
              <li><strong>Carteira interna (Coins):</strong> saldo e histórico de transações dentro do site (não envolvem dinheiro real).</li>
              <li><strong>Comprovantes de depósito:</strong> imagens enviadas para validação de coins, acessíveis apenas a admins.</li>
              <li><strong>Dados técnicos:</strong> logs de acesso, navegador e IP para segurança e prevenção de abuso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Como usamos os dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Operar o marketplace, exibir anúncios e processar mensagens.</li>
              <li>Validar depósitos, intermediações e movimentações de coins.</li>
              <li>Prevenir fraudes, banir contas mal-intencionadas e responder a denúncias.</li>
              <li>Enviar notificações relevantes (ofertas recebidas, status de tickets etc.).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Compartilhamento</h2>
            <p>Não vendemos seus dados. Compartilhamos apenas com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provedores de infraestrutura (hospedagem, banco de dados e armazenamento de imagens).</li>
              <li>Autoridades, quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. Seus direitos (LGPD)</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar, corrigir ou excluir seus dados pelo seu perfil.</li>
              <li>Solicitar a exclusão da conta abrindo um <Link to="/suporte" className="text-primary underline">ticket de suporte</Link>.</li>
              <li>Revogar consentimentos e parar de receber notificações.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">6. Cookies e armazenamento local</h2>
            <p>Usamos armazenamento local do navegador apenas para manter sua sessão autenticada e preferências. Não usamos cookies de rastreamento publicitário.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">7. Segurança</h2>
            <p>Aplicamos políticas de acesso (RLS), autenticação obrigatória e validações no servidor para proteger seus dados. Ainda assim, recomendamos senhas fortes e cuidado ao negociar.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">8. Conteúdo de terceiros</h2>
            <p>Anúncios de patrocinadores e links externos seguem políticas próprias. Não nos responsabilizamos pelo conteúdo de sites de terceiros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">9. Contato</h2>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href="mailto:contato@rubintrade.com" className="text-primary underline">contato@rubintrade.com</a>
              {" "} ou abra um <Link to="/suporte" className="text-primary underline">ticket de suporte</Link>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default Privacidade;
