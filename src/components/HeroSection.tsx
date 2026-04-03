import { Button } from "@/components/ui/button";
import { Flame, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroLoot from "@/assets/hero-loot.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="container relative flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-active inline-flex items-center gap-1.5 mb-4">
              <Flame className="h-3 w-3" />
              ANÚNCIOS ATIVOS AGORA
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl leading-relaxed">
              Compre e venda itens do{" "}
              <span className="text-accent">Tibia</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed">
              A plataforma mais segura para negociar itens, contas e serviços do Tibia.
              Anuncie grátis e encontre as melhores ofertas.
            </p>
          </motion.div>

          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2"
              onClick={() => navigate("/anuncios")}
            >
              <Flame className="h-4 w-4" />
              VER ANÚNCIOS
            </Button>
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => navigate("/como-funciona")}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              COMO FUNCIONA
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative">
            <div className="absolute inset-0 border border-primary/20 rounded-lg" style={{ margin: "-12px" }} />
            <img
              src={heroLoot}
              alt="Itens do Tibia"
              className="w-64 md:w-80 animate-float"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
