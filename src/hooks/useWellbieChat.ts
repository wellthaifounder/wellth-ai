import { useState, useCallback, useEffect } from "react";
import { streamWellbieChat } from "@/utils/wellbieChatStream";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export const useWellbieChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("wellbie_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
    } else {
      setConversations(data || []);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("wellbie_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data?.map(m => ({ role: m.role as "user" | "assistant", content: m.content })) || []);
    }
  };

  const createNewConversation = async (firstMessage: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to save conversations", variant: "destructive" });
      return null;
    }

    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const { data, error } = await supabase
      .from("wellbie_conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    await loadConversations();
    return data.id;
  };

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("wellbie_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });

    // Update conversation updated_at
    await supabase
      .from("wellbie_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  };

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      let conversationId = currentConversationId;

      // Create new conversation if none exists
      if (!conversationId) {
        conversationId = await createNewConversation(userMessage);
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }

      const newUserMessage: Message = { role: "user", content: userMessage };
      setMessages((prev) => [...prev, newUserMessage]);
      setIsLoading(true);
      setError(null);

      // Save user message
      if (conversationId) {
        await saveMessage(conversationId, "user", userMessage);
      }

      let assistantContent = "";
      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      try {
        await streamWellbieChat({
          messages: [...messages, newUserMessage],
          onDelta: updateAssistant,
          onDone: async () => {
            setIsLoading(false);
            // Save assistant message
            if (conversationId && assistantContent) {
              await saveMessage(conversationId, "assistant", assistantContent);
              await loadConversations(); // Refresh list
            }
          },
          onError: (err) => {
            setError(err.message);
            setIsLoading(false);
          },
          context: {
            page: location.pathname,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setIsLoading(false);
      }
    },
    [messages, isLoading, location.pathname, currentConversationId]
  );

  const switchConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const deleteConversation = async (conversationId: string) => {
    await supabase.from("wellbie_conversations").delete().eq("id", conversationId);
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  };

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    error,
    sendMessage,
    switchConversation,
    startNewConversation,
    deleteConversation,
  };
};
