import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LocaleProvider } from "@/hooks/useLocale";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import WelcomeOverlay from "@/components/WelcomeOverlay";

// Code splitting: páginas secundárias só carregam quando acessadas.
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CriarAnuncio = lazy(() => import("./pages/CriarAnuncio"));
const Admin = lazy(() => import("./pages/Admin"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Mensagens = lazy(() => import("./pages/Mensagens"));
const Anuncio = lazy(() => import("./pages/Anuncio"));
const RifaPage = lazy(() => import("./pages/Rifa"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const AffiliateRedirect = lazy(() => import("./pages/AffiliateRedirect"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 1min: dados considerados frescos
      gcTime: 5 * 60_000,          // 5min em cache
      refetchOnWindowFocus: false, // sem refetch ao voltar pra aba
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LocaleProvider>
          <AuthProvider>
            <WelcomeOverlay />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/criar-anuncio" element={<CriarAnuncio />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/perfil/:userId" element={<Perfil />} />
                <Route path="/mensagens" element={<Mensagens />} />
                <Route path="/anuncio/:id" element={<Anuncio />} />
                <Route path="/rifa" element={<RifaPage />} />
                <Route path="/rifa/:id" element={<RifaPage />} />
                <Route path="/suporte" element={<Suporte />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/go/:slug" element={<AffiliateRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </LocaleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
