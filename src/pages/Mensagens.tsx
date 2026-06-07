import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, useMessages, useSendMessage, useMarkAsRead, useDeleteMessage, Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Send, ArrowLeft, ExternalLink, Trash2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { safeHref } from "@/lib/safe-url";
import { formatDisplayPrice } from "@/lib/price-utils";

const Mensagens = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get("conv");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { data: messages, isLoading: msgsLoading } = useMessages(selectedConvId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();
  const { getCurrencyIcon, getPvpIcon } = useSiteAssets();
  const [showItemInfo, setShowItemInfo] = useState(false);

  const selectedConv = conversations?.find(c => c.id === selectedConvId);

  // Auto-select conversation from URL param
  useEffect(() => {
    if (initialConvId && !selectedConvId) setSelectedConvId(initialConvId);
  }, [initialConvId]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConvId && selectedConv && selectedConv.unread_count && selectedConv.unread_count > 0) {
      markAsRead.mutate(selectedConvId);
    }
  }, [selectedConvId, selectedConv?.unread_count]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConvId) return;
    await sendMessage.mutateAsync({ conversationId: selectedConvId, content: messageText.trim() });
    setMessageText("");
  };

  const getOtherUser = (conv: Conversation) => {
    if (!user) return { username: "?", avatar_url: null, id: "" };
    const isBuyer = conv.buyer_id === user.id;
    return {
      username: isBuyer ? conv.seller_profile?.username || "Vendedor" : conv.buyer_profile?.username || "Comprador",
      avatar_url: isBuyer ? conv.seller_profile?.avatar_url : conv.buyer_profile?.avatar_url,
      id: isBuyer ? conv.seller_id : conv.buyer_id,
    };
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Faça login para ver suas mensagens.</p>
          <Link to="/login" className="text-primary hover:underline text-sm mt-2 inline-block">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <div className="flex-1 container px-0 sm:px-4 py-0 sm:py-4 flex gap-0 overflow-hidden" style={{ height: "calc(100dvh - 56px)" }}>
        {/* Conversations list */}
        <aside className={`w-full md:w-80 shrink-0 md:border-r border-border flex flex-col ${selectedConvId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border">
            <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Mensagens
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="p-3 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => {
                const other = getOtherUser(conv);
                const isActive = selectedConvId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3 border-b border-border hover:bg-secondary/50 transition-colors flex items-center gap-3 ${isActive ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {other.avatar_url ? <AvatarImage src={other.avatar_url} /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{other.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground truncate">{other.username}</span>
                        {(conv.unread_count ?? 0) > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{conv.unread_count}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{conv.ads?.title}</p>
                      {conv.last_message && <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{conv.last_message}</p>}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma conversa ainda</p>
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <main className={`flex-1 flex flex-col min-w-0 ${!selectedConvId ? "hidden md:flex" : "flex"}`}>
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-border flex items-center gap-3">
                <button onClick={() => setSelectedConvId(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {(() => {
                  const other = getOtherUser(selectedConv);
                  return (
                    <>
                      <Avatar className="h-8 w-8">
                        {other.avatar_url ? <AvatarImage src={other.avatar_url} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{other.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <Link to={`/perfil/${other.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{other.username}</Link>
                        <p className="text-[11px] text-muted-foreground truncate">{selectedConv.ads?.title}</p>
                      </div>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => setShowItemInfo((v) => !v)}
                        title="Ver detalhes do item"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Item
                      </Button>
                    </>
                  );
                })()}
              </div>

              {/* Item info panel */}
              {showItemInfo && selectedConv.ads && (
                <div className="border-b border-border bg-secondary/30 p-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    {selectedConv.ads.image_url && (
                      <img src={selectedConv.ads.image_url} alt="" className="h-16 w-16 object-contain rounded-md bg-secondary p-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground">{selectedConv.ads.title}</h4>
                        {selectedConv.ads.id && (
                          <Link
                            to={`/anuncio/${selectedConv.ads.id}`}
                            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Abrir anúncio <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {selectedConv.ads.price && (
                          <span className="inline-flex items-center gap-1 bg-card px-2 py-0.5 rounded-md border border-border">
                            <img src={getCurrencyIcon(selectedConv.ads.currency || "kk")} alt="" className="h-3.5 w-3.5" />
                            <span className="text-foreground font-semibold">{formatDisplayPrice(selectedConv.ads.price, selectedConv.ads.currency)}</span>
                          </span>
                        )}
                        {selectedConv.ads.world && (
                          <span className="inline-flex items-center gap-1 bg-card px-2 py-0.5 rounded-md border border-border">
                            {selectedConv.ads.pvp_type && (
                              <img src={getPvpIcon(selectedConv.ads.pvp_type)} alt="" className="h-3.5 w-3.5" />
                            )}
                            {selectedConv.ads.world}
                          </span>
                        )}
                      </div>
                      {selectedConv.ads.extra_info && (
                        <p className="text-[11px] text-foreground/80 whitespace-pre-wrap">{selectedConv.ads.extra_info}</p>
                      )}
                      {selectedConv.ads.item_reference_url && (
                        <a
                          href={safeHref(selectedConv.ads.item_reference_url)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          🗺️ Como chegar até o item <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg w-2/3" />)}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`group flex items-end gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                        {isMine && (
                          <button
                            onClick={() => {
                              if (confirm("Apagar esta mensagem?")) {
                                deleteMessage.mutate({ id: msg.id, conversationId: selectedConvId! });
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                            title="Apagar mensagem"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        }`}>
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">Nenhuma mensagem. Comece a conversa!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value.slice(0, 4000))}
                  placeholder="Digite sua mensagem..."
                  className="bg-secondary border-border flex-1"
                  maxLength={4000}
                  autoFocus
                />
                <Button type="submit" disabled={sendMessage.isPending || !messageText.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Mensagens;
