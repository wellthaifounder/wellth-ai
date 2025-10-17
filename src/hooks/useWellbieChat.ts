import { useState, useCallback } from "react";
import { streamWellbieChat } from "@/utils/wellbieChatStream";
import { useLocation } from "react-router-dom";

type Message = { role: "user" | "assistant"; content: string };

export const useWellbieChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const newUserMessage: Message = { role: "user", content: userMessage };
      setMessages((prev) => [...prev, newUserMessage]);
      setIsLoading(true);
      setError(null);

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
          onDone: () => setIsLoading(false),
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
    [messages, isLoading, location.pathname]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
