import { Trophy, Users, TicketCheck, Flame } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { icon: Trophy, label: "Anúncios Criados", value: "247", color: "text-primary" },
  { icon: Users, label: "Jogadores", value: "89", color: "text-accent" },
  { icon: TicketCheck, label: "Negociações", value: "134", color: "text-primary" },
  { icon: Flame, label: "Ativos Agora", value: "32", color: "text-accent" },
];

const StatsBar = () => (
  <section className="border-y border-border bg-secondary/30 py-8">
    <div className="container grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          viewport={{ once: true }}
        >
          <stat.icon className={`h-5 w-5 ${stat.color}`} />
          <div>
            <p className={`font-pixel text-sm ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default StatsBar;
