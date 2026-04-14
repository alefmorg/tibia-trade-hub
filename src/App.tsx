import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import CriarAnuncio from "./pages/CriarAnuncio";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import Mensagens from "./pages/Mensagens";
import Anuncio from "./pages/Anuncio";
import RifaPage from "./pages/Rifa";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/criar-anuncio" element={<CriarAnuncio />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/:userId" element={<Perfil />} />
            <Route path="/mensagens" element={<Mensagens />} />
            <Route path="/anuncio/:id" element={<Anuncio />} />
            <Route path="/rifa" element={<RifaPage />} />
            <Route path="/rifa/:id" element={<RifaPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
