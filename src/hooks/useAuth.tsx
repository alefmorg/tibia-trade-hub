import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profile: { username: string; avatar_url: string | null } | null;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

  const fetchUserData = async (userId: string) => {
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    setProfile(profileData ?? null);
    setIsAdmin(!!roleData);
  };

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setLoading(true);
      setSession(nextSession);

      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        await fetchUserData(nextUser.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }

      if (mounted) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    toast.success("Conta criada com sucesso!");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast.success("Login realizado com sucesso!");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    toast.info("Você saiu da conta.");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, profile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const defaultContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  profile: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context ?? defaultContext;
};
