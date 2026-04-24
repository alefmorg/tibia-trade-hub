import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export const useMyTickets = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SupportTicket[];
    },
  });
};

export const useAllTickets = () => {
  return useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await db
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SupportTicket[];
    },
  });
};

export const useTicketMessages = (ticketId?: string) => {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await db
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SupportTicketMessage[];
    },
  });
};

export const useCreateTicket = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subject, category, priority, message }: { subject: string; category: string; priority: string; message: string }) => {
      const { data: ticket, error } = await db
        .from("support_tickets")
        .insert({ user_id: user!.id, subject, category, priority })
        .select()
        .single();
      if (error) throw error;
      const { error: msgError } = await db
        .from("support_ticket_messages")
        .insert({ ticket_id: ticket.id, sender_id: user!.id, content: message, is_admin: false });
      if (msgError) throw msgError;
      return ticket as SupportTicket;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success("Ticket aberto! Nossa equipe responderá em breve.");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao abrir ticket"),
  });
};

export const useReplyTicket = (isAdmin: boolean) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const { error } = await db
        .from("support_ticket_messages")
        .insert({ ticket_id: ticketId, sender_id: user!.id, content, is_admin: isAdmin });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ticket-messages", vars.ticketId] });
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdateTicketStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await db.from("support_tickets").update({ status }).eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success("Status atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
