"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, Send, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am ChipTrace Copilot. I have access to your quality, logistics, supplier, and inventory data. How can I help you manage your supply chain today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Mock Copilot Logic
    setTimeout(() => {
      let responseText = "I'm sorry, I couldn't understand that query based on the current data.";
      const lowerInput = userMessage.content.toLowerCase();

      if (lowerInput.includes("risk summary") && lowerInput.includes("batch-2026-004821")) {
        responseText = "Batch BATCH-2026-004821 is in transit from Singapore to Germany. Risk level: HIGH — main driver is a customs delay at destination, predicted +2 days. Inventory for MCU-AX45 is critically low, and the supplier Alpha Semiconductor Materials has shown recent delays. Recommended: contact the logistics provider and prepare an alternate delivery route.";
      } else if (lowerInput.includes("where is batch") || lowerInput.includes("batch-2026-004821")) {
         responseText = "Batch BATCH-2026-004821 is currently In Transit via Global Logistics Ltd. Its last known location is the Suez Canal.";
      } else if (lowerInput.includes("at risk")) {
         responseText = "Shipment SHIP-88231 is currently AT RISK due to port congestion and customs delays.";
      } else if (lowerInput.includes("highest defect rate")) {
         responseText = "NexGen Components currently has the highest defect rate at 5.4% over the last 30 days.";
      } else if (lowerInput.includes("enough mcu-ax45")) {
         responseText = "No, MCU-AX45 has a stockout probability of 85%. You have 82,450 units available but predicted demand is 90,000 units. I recommend reordering within 5 days.";
      } else if (lowerInput.includes("why is shipment ship-88231 delayed")) {
         responseText = "Shipment SHIP-88231 has a 78% probability of delay primarily due to port congestion at the destination and pending customs clearance.";
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: responseText }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ChipTrace Copilot</h1>
          <p className="text-sm text-muted-foreground">Cross-domain supply chain intelligence</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center mt-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted text-foreground rounded-tl-sm border border-border'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex flex-shrink-0 items-center justify-center mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center mt-1">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border px-4 py-3 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about batches, shipments, inventory, or suppliers..."
              className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {["Where is Batch BATCH-2026-004821?", "Which shipments are at risk?", "Give me a complete risk summary for BATCH-2026-004821"].map((suggestion, i) => (
              <button 
                key={i}
                type="button"
                onClick={() => setInput(suggestion)}
                className="whitespace-nowrap text-xs bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full text-muted-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
