import { Flame } from "lucide-react";
import TradeCard from "./TradeCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAds } from "@/hooks/useAds";
import { Skeleton } from "@/components/ui/skeleton";

const ActiveListings = () => {
  const navigate = useNavigate();
  const { data: ads, isLoading } = useAds({ sortBy: "recent" });
  const listings = ads?.slice(0, 6) || [];

  return (
    <section className="py-16">
      <div className="container">
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-accent font-pixel text-[10px] flex items-center justify-center gap-1.5 mb-2">
            <Flame className="h-3 w-3" />
            ABERTAS
          </span>
          <h2 className="text-xl md:text-2xl">Ofertas Ativas</h2>
          <p className="text-muted-foreground text-sm mt-2">Escolha sua oferta e negocie agora</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((ad, i) => (
              <motion.div key={ad.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
                <TradeCard
                  id={ad.id}
                  title={ad.title}
                  type={ad.type as "selling" | "buying"}
                  price={ad.price}
                  world={ad.world}
                  pvpType={ad.pvp_type}
                  date={ad.created_at}
                  imageUrl={ad.image_url}
                  likes={ad.likes_count}
                  profiles={ad.profiles}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">Nenhum anúncio ativo ainda. Seja o primeiro!</p>
        )}

        <div className="text-center mt-8">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/anuncios")}>
            Ver todos os anúncios
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActiveListings;
