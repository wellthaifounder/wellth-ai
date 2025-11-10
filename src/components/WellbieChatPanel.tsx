import { useEffect, useRef, useState } from "react";
import { WellbieAvatar } from "./WellbieAvatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { X, Minimize2, Send, MessageSquarePlus, Trash2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { ScrollArea } from "./ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

interface WellbieChatPanelProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onSwitchConversation: (id: string) => void;
  onStartNew: () => void;
  onDeleteConversation: (id: string) => void;
  onClose: () => void;
  onMinimize: () => void;
}

const quickActionsByPage: Record<string, string[]> = {
  "/dashboard": ["What should I do next?", "Explain my savings potential"],
  "/expenses/new": ["What documents do I need?", "Is this HSA eligible?"],
  "/reports": ["How can I optimize my strategy?", "Explain these charts"],
  "/hsa-reimbursement": ["When should I reimburse?", "What's the tax impact?"],
  "/payment-methods": ["Which card should I use?", "How do rewards work?"],
};

export const WellbieChatPanel = ({
  conversations,
  currentConversationId,
  messages,
  isLoading,
  error,
  onSendMessage,
  onSwitchConversation,
  onStartNew,
  onDeleteConversation,
  onClose,
  onMinimize,
}: WellbieChatPanelProps) => {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const ConversationsList = () => (
    <div className="space-y-2">
      <Button onClick={onStartNew} variant="outline" className="w-full justify-start gap-2">
        <MessageSquarePlus className="h-4 w-4" />
        New Conversation
      </Button>
      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
                currentConversationId === conv.id && "bg-accent"
              )}
            >
              <button
                onClick={() => {
                  onSwitchConversation(conv.id);
                  setSidebarOpen(false);
                }}
                className="flex-1 text-left text-sm truncate"
              >
                {conv.title}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ConversationsList />
              </div>
            </SheetContent>
          </Sheet>
          <WellbieAvatar size="sm" animate={isLoading} state={isLoading ? "thinking" : "default"} className="shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">Wellbie</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">Your HSA strategy guide</p>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={onMinimize} className="h-8 w-8 sm:h-10 sm:w-10">
            <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-4 sm:py-8">
              <WellbieAvatar size="lg" className="mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm px-2">
                Hi! I'm Wellbie. Ask me anything about HSA strategies, expense tracking, or tax optimization!
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-center px-2">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-[10px] sm:text-xs h-7 sm:h-8"
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
                "flex gap-2 sm:gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <WellbieAvatar size="sm" className="shrink-0 hidden sm:block" />
              )}
              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 whitespace-pre-wrap text-xs sm:text-sm",
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
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-destructive">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-card shrink-0">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="text-[10px] sm:text-xs h-7 sm:h-8"
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
            className="min-h-[50px] sm:min-h-[60px] resize-none text-xs sm:text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[50px] w-[50px] sm:h-[60px] sm:w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
