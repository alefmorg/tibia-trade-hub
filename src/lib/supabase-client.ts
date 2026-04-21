// Wrapper resiliente: garante que o Supabase funcione mesmo quando
// import.meta.env.VITE_* não é injetado no bundle de produção.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { env } from "@/lib/env";

export const supabase = createClient<Database>(
  env.SUPABASE_URL!,
  env.SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
