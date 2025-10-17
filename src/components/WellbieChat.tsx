import { useState } from "react";
import { WellbieAvatar } from "./WellbieAvatar";
import { WellbieChatPanel } from "./WellbieChatPanel";
import { useWellbieChat } from "@/hooks/useWellbieChat";
import { cn } from "@/lib/utils";

export const WellbieChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { messages, isLoading, error, sendMessage, clearChat } = useWellbieChat();

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    clearChat();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={handleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isOpen && "hidden"
        )}
        aria-label="Open Wellbie chat"
      >
        <div className="p-3">
          <WellbieAvatar size="md" animate={false} />
        </div>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] animate-slide-in-right md:w-[400px] md:h-[600px]">
          <WellbieChatPanel
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSendMessage={sendMessage}
            onClose={handleClose}
            onMinimize={handleMinimize}
          />
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-3 flex items-center gap-2 hover:bg-accent"
        >
          <WellbieAvatar size="sm" />
          <span className="text-sm font-medium">Wellbie</span>
        </button>
      )}
    </>
  );
};
