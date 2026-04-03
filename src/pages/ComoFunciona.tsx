import Header from "@/components/Header";
import { Shield, Search, Handshake, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Search, title: "1. Busque", desc: "Encontre o item que procura nos anúncios ativos." },
  { icon: Handshake, title: "2. Negocie", desc: "Entre em contato com o vendedor e combine os detalhes." },
  { icon: Shield, title: "3. Trade Seguro", desc: "Realize a troca dentro do jogo com segurança." },
  { icon: CheckCircle, title: "4. Confirme", desc: "Confirme a negociação e avalie o vendedor." },
];

const ComoFunciona = () => (
  <div className="min-h-screen">
    <Header />
    <div className="container py-16 max-w-2xl">
      <h1 className="text-xl text-center mb-2">Como Funciona</h1>
      <p className="text-center text-muted-foreground text-sm mb-12">
        Negociar itens nunca foi tão fácil
      </p>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="card-gaming p-6 flex items-start gap-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <step.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-pixel text-xs text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default ComoFunciona;
