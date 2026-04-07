import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAllAdsAdmin, useDeleteAd, useUpdateAdStatus } from "@/hooks/useAds";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Search, Trash2, Shield, Users, BarChart3, Package, Plus, Upload, Image, Star, 
  Ban, CheckCircle, TrendingUp, TrendingDown, Activity, Eye, Clock, AlertTriangle,
  Crown, UserX, UserCheck, RefreshCw, Filter, Download, Settings, MessageSquare,
  ShoppingCart, DollarSign, Calendar, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ads, isLoading: adsLoading } = useAllAdsAdmin();
  const deleteAd = useDeleteAd();
  const updateStatus = useUpdateAdStatus();
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  const [search, setSearch] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [adStatusFilter, setAdStatusFilter] = useState<string>("all");
  const [adTypeFilter, setAdTypeFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Toggle featured
  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("ads").update({ featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["user-ads"] });
      toast.success("Destaque atualizado!");
    },
  });

  // Toggle admin
  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Permissões atualizadas!");
    },
    onError: () => {
      toast.error("Erro ao atualizar permissões");
    },
  });

  // Toggle banned
  const toggleBanned = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_banned: isBanned }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success(variables.isBanned ? "Usuário banido!" : "Usuário desbanido!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando painel...</p>
      </div>
    </div>
  );

  if (!user || !isAdmin) {
    navigate("/");
    return null;
  }

  // Filtered data
  const filteredAds = ads?.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = adStatusFilter === "all" || ad.status === adStatusFilter;
    const matchesType = adTypeFilter === "all" || ad.type === adTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const filteredProfiles = profiles?.filter((p: any) => 
    p.username?.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  // Stats calculations
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const adsToday = ads?.filter(a => new Date(a.created_at) >= today).length || 0;
  const adsThisWeek = ads?.filter(a => new Date(a.created_at) >= weekAgo).length || 0;
  const usersThisWeek = profiles?.filter((p: any) => new Date(p.created_at) >= weekAgo).length || 0;
  const usersThisMonth = profiles?.filter((p: any) => new Date(p.created_at) >= monthAgo).length || 0;

  const stats = {
    totalAds: ads?.length || 0,
    activeAds: ads?.filter(a => a.status === "active").length || 0,
    inactiveAds: ads?.filter(a => a.status === "inactive").length || 0,
    soldAds: ads?.filter(a => a.status === "sold").length || 0,
    featuredAds: ads?.filter(a => a.featured).length || 0,
    sellingAds: ads?.filter(a => a.type === "selling").length || 0,
    buyingAds: ads?.filter(a => a.type === "buying").length || 0,
    totalUsers: profiles?.length || 0,
    bannedUsers: profiles?.filter((p: any) => p.is_banned).length || 0,
    adminUsers: profiles?.filter((p: any) => p.is_admin).length || 0,
    totalItems: items?.length || 0,
    adsToday,
    adsThisWeek,
    usersThisWeek,
    usersThisMonth,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewItemImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await createItem.mutateAsync({ name: newItemName.trim(), imageFile: newItemImage || undefined });
    setNewItemName("");
    setNewItemImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Stats Card Component
  const StatCard = ({ icon: Icon, label, value, subValue, color, trend }: { 
    icon: any; 
    label: string; 
    value: number | string; 
    subValue?: string; 
    color: string;
    trend?: "up" | "down" | null;
  }) => (
    <div className="card-gaming p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-accent" : "text-destructive"}`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </div>
        )}
      </div>
      <p className={`font-pixel text-xl mt-3 ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {subValue && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subValue}</p>}
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-pixel text-foreground">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">Gerencie o Rubin Trade</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-accent/30 text-accent">
              <Activity className="h-3 w-3 mr-1" />
              Sistema Online
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border p-1 h-auto flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Anúncios
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Itens
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={Package} label="Total Anúncios" value={stats.totalAds} subValue={`+${stats.adsToday} hoje`} color="text-primary" trend="up" />
              <StatCard icon={CheckCircle} label="Ativos" value={stats.activeAds} color="text-accent" />
              <StatCard icon={Star} label="Destacados" value={stats.featuredAds} color="text-warning" />
              <StatCard icon={Users} label="Usuários" value={stats.totalUsers} subValue={`+${stats.usersThisWeek} semana`} color="text-primary" trend="up" />
              <StatCard icon={Ban} label="Banidos" value={stats.bannedUsers} color="text-destructive" />
              <StatCard icon={Image} label="Itens" value={stats.totalItems} color="text-muted-foreground" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ads Breakdown */}
              <div className="card-gaming p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Anúncios por Tipo
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      Vendendo
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-destructive rounded-full" 
                          style={{ width: `${stats.totalAds ? (stats.sellingAds / stats.totalAds) * 100 : 0}%` }} 
                        />
                      </div>
                      <span className="text-xs text-foreground font-medium w-8">{stats.sellingAds}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Comprando
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${stats.totalAds ? (stats.buyingAds / stats.totalAds) * 100 : 0}%` }} 
                        />
                      </div>
                      <span className="text-xs text-foreground font-medium w-8">{stats.buyingAds}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="card-gaming p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  Status dos Anúncios
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Ativos
                    </span>
                    <span className="text-xs text-foreground font-medium">{stats.activeAds}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Inativos
                    </span>
                    <span className="text-xs text-foreground font-medium">{stats.inactiveAds}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      Vendidos
                    </span>
                    <span className="text-xs text-foreground font-medium">{stats.soldAds}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card-gaming p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-warning" />
                  Ações Rápidas
                </h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs border-border hover:border-primary/30"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["ads"] });
                      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
                      toast.success("Dados atualizados!");
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Atualizar Dados
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs border-border hover:border-accent/30"
                    onClick={() => navigate("/")}
                  >
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Ver Site
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Ads */}
              <div className="card-gaming p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Anúncios Recentes
                </h3>
                <div className="space-y-2">
                  {ads?.slice(0, 5).map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${ad.type === "selling" ? "bg-destructive" : "bg-primary"}`} />
                        <span className="text-xs text-foreground truncate">{ad.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${ad.status === "active" ? "border-accent/30 text-accent" : "border-muted-foreground/30 text-muted-foreground"}`}>
                          {ad.status === "active" ? "Ativo" : ad.status === "sold" ? "Vendido" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!ads || ads.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum anúncio ainda</p>
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div className="card-gaming p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Usuários Recentes
                </h3>
                <div className="space-y-2">
                  {profiles?.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.username} className="h-6 w-6 object-cover rounded-full" />
                          ) : (
                            <span className="text-primary text-[10px] font-bold">{p.username?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-xs text-foreground truncate">{p.username}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.is_admin && (
                          <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                            <Crown className="h-2.5 w-2.5 mr-0.5" />
                            Admin
                          </Badge>
                        )}
                        {p.is_banned && (
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                            <Ban className="h-2.5 w-2.5 mr-0.5" />
                            Banido
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!profiles || profiles.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuário ainda</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            {/* Filters */}
            <div className="card-gaming p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar anúncios..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-10 bg-secondary border-border" 
                  />
                </div>
                <Select value={adStatusFilter} onValueChange={setAdStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 bg-secondary border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="sold">Vendidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={adTypeFilter} onValueChange={setAdTypeFilter}>
                  <SelectTrigger className="w-full sm:w-36 bg-secondary border-border">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos tipos</SelectItem>
                    <SelectItem value="selling">Vendendo</SelectItem>
                    <SelectItem value="buying">Comprando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{filteredAds.length} anúncios encontrados</p>
              </div>
            </div>

            {/* Ads Table */}
            <div className="card-gaming overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Título</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Tipo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Preço</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Mundo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Usuário</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-center">Destaque</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Data</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAds.map((ad) => (
                      <TableRow key={ad.id} className="border-border">
                        <TableCell className="text-foreground font-medium text-xs max-w-[180px] truncate">{ad.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${ad.type === "selling" ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"}`}>
                            {ad.type === "selling" ? "Venda" : "Compra"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{ad.price || "-"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{ad.world}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{ad.profiles?.username || "-"}</TableCell>
                        <TableCell>
                          <Select value={ad.status} onValueChange={(v) => updateStatus.mutate({ id: ad.id, status: v })}>
                            <SelectTrigger className="w-24 h-7 text-[10px] bg-secondary border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                              <SelectItem value="sold">Vendido</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => toggleFeatured.mutate({ id: ad.id, featured: !ad.featured })}
                            className={`transition-colors ${ad.featured ? "text-warning" : "text-muted-foreground/40 hover:text-warning/60"}`}
                            title={ad.featured ? "Remover destaque" : "Destacar"}
                          >
                            <Star className={`h-4 w-4 ${ad.featured ? "fill-warning" : ""}`} />
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[10px]">
                          {new Date(ad.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" 
                            onClick={() => {
                              if (!confirm("Tem certeza que deseja remover este anúncio?")) return;
                              deleteAd.mutate(ad.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredAds.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhum anúncio encontrado</p>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Search */}
            <div className="card-gaming p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar usuários..." 
                  value={userSearch} 
                  onChange={(e) => setUserSearch(e.target.value)} 
                  className="pl-10 bg-secondary border-border" 
                />
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{filteredProfiles.length} usuários encontrados</p>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Crown className="h-3 w-3 text-warning" /> {stats.adminUsers} admins
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Ban className="h-3 w-3 text-destructive" /> {stats.bannedUsers} banidos
                  </span>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="card-gaming overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Avatar</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Username</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Bio</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Cadastro</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-center">Admin</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-center">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((p: any) => (
                      <TableRow key={p.id} className={`border-border ${p.is_banned ? "opacity-60" : ""}`}>
                        <TableCell>
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.username} className="h-8 w-8 object-cover rounded-full" />
                            ) : (
                              <span className="text-primary text-xs font-bold">{p.username?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground font-medium text-xs">{p.username}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{p.bio || "-"}</TableCell>
                        <TableCell className="text-muted-foreground text-[10px]">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={p.is_admin || false}
                            onCheckedChange={(checked) => {
                              if (p.user_id === user.id) {
                                toast.error("Você não pode alterar suas próprias permissões");
                                return;
                              }
                              toggleAdmin.mutate({ userId: p.user_id, isAdmin: checked });
                            }}
                            disabled={p.user_id === user.id}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {p.is_banned ? (
                            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                              Banido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => navigate(`/perfil/${p.user_id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 w-7 p-0 ${p.is_banned ? "text-accent hover:bg-accent/10" : "text-destructive hover:bg-destructive/10"}`}
                              onClick={() => {
                                if (p.user_id === user.id) {
                                  toast.error("Você não pode se banir");
                                  return;
                                }
                                const action = p.is_banned ? "desbanir" : "banir";
                                if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
                                toggleBanned.mutate({ userId: p.user_id, isBanned: !p.is_banned });
                              }}
                              disabled={p.user_id === user.id}
                            >
                              {p.is_banned ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredProfiles.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhum usuário encontrado</p>
              )}
            </div>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            {/* Add Item Form */}
            <div className="card-gaming p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Adicionar Novo Item
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Nome do item</Label>
                  <Input 
                    value={newItemName} 
                    onChange={(e) => setNewItemName(e.target.value)} 
                    placeholder="Ex: Golden Armor" 
                    className="bg-secondary border-border" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Imagem</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="border-border" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {newItemImage ? "Trocar" : "Upload"}
                    </Button>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="h-10 w-10 object-contain rounded border border-border" />
                    )}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddItem} 
                    disabled={createItem.isPending || !newItemName.trim()} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {createItem.isPending ? "Salvando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="card-gaming overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <p className="text-xs text-muted-foreground">{items?.length || 0} itens cadastrados</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs w-16">Imagem</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Cadastro</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-10 w-10 object-contain" />
                        ) : (
                          <div className="h-10 w-10 bg-secondary rounded flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground font-medium text-xs">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground text-[10px]">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" 
                          onClick={() => {
                            if (!confirm("Tem certeza que deseja remover este item?")) return;
                            deleteItem.mutate(item.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!items || items.length === 0) && (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhum item cadastrado</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
