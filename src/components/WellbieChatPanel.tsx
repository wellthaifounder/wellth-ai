import { useEffect, useRef, useState } from "react";
import { WellbieAvatar } from "./WellbieAvatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { X, Minimize2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

type Message = { role: "user" | "assistant"; content: string };

interface WellbieChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onMinimize: () => void;
}

const quickActionsByPage: Record<string, string[]> = {
  "/dashboard": ["What should I do next?", "Explain my savings potential"],
  "/expenses/new": ["What documents do I need?", "Is this HSA eligible?"],
  "/analytics": ["How can I optimize my strategy?", "Explain these charts"],
  "/hsa-reimbursement": ["When should I reimburse?", "What's the tax impact?"],
  "/payment-methods": ["Which card should I use?", "How do rewards work?"],
};

export const WellbieChatPanel = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClose,
  onMinimize,
}: WellbieChatPanelProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const quickActions = quickActionsByPage[location.pathname] || [
    "How does Wellth.ai work?",
    "What are HSA tax benefits?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleQuickAction = (action: string) => {
    onSendMessage(action);
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <WellbieAvatar size="sm" animate={isLoading} state={isLoading ? "thinking" : "default"} />
          <div>
            <h3 className="font-semibold text-foreground">Wellbie</h3>
            <p className="text-xs text-muted-foreground">Your HSA strategy guide</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onMinimize}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <WellbieAvatar size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Hi! I'm Wellbie. Ask me anything about HSA strategies, expense tracking, or tax optimization!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <WellbieAvatar size="sm" className="shrink-0" />
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="text-xs"
                disabled={isLoading}
              >
                {action}
              </Button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Wellbie anything..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
