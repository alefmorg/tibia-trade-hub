import { Flame } from "lucide-react";
import TradeCard from "./TradeCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const mockListings = [
  { title: "Heavily Bound Book", type: "selling" as const, price: "Aceita ofertas", world: "Gentebra", pvpType: "Optional PvP", username: "vdapedro", date: "02/04/2026", likes: 1 },
  { title: "Crypt Strike", type: "buying" as const, price: "530.000.000", world: "Ombra", pvpType: "Open PvP", username: "thymanka", date: "03/04/2026", likes: 0 },
  { title: "Rainbow Torch", type: "selling" as const, price: "Aceita ofertas", world: "Honbra", pvpType: "Open PvP", username: "mondayhalk", date: "13/09/2025", likes: 10 },
  { title: "The Epic Wisdom", type: "selling" as const, price: "Aceita ofertas", world: "Yonabra", pvpType: "Optional PvP", username: "alfa", date: "02/01/2026", likes: 4 },
  { title: "Ferumbras Doll", type: "selling" as const, price: "Aceita ofertas", world: "Yonabra", pvpType: "Optional PvP", username: "alfa", date: "02/01/2026", likes: 4 },
  { title: "Golden Armor", type: "buying" as const, price: "15.000.000", world: "Antica", pvpType: "Optional PvP", username: "oldschool", date: "01/04/2026", likes: 2 },
];

const ActiveListings = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16">
      <div className="container">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-accent font-pixel text-[10px] flex items-center justify-center gap-1.5 mb-2">
            <Flame className="h-3 w-3" />
            ABERTAS
          </span>
          <h2 className="text-xl md:text-2xl">Ofertas Ativas</h2>
          <p className="text-muted-foreground text-sm mt-2">Escolha sua oferta e negocie agora</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockListings.map((listing, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <TradeCard {...listing} />
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate("/anuncios")}
          >
            Ver todos os anúncios
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActiveListings;
