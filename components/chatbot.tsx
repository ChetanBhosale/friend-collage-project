"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, MapPin, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I can help you find the best businesses near you. Ask me about restaurants, cafes, hotels, or any other business type!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        throw new Error("No response from server");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBusinessClick = (businessId: string) => {
    router.push(`/business/${businessId}`);
  };

  interface BusinessData {
    id: string;
    name: string;
    location: string;
    category: string;
    rating: string;
    reviewCount: string;
  }

  const parseBusinessXML = (xmlString: string): BusinessData | null => {
    try {
      const idMatch = xmlString.match(/<id>(.*?)<\/id>/);
      const nameMatch = xmlString.match(/<name>(.*?)<\/name>/);
      const locationMatch = xmlString.match(/<location>(.*?)<\/location>/);
      const categoryMatch = xmlString.match(/<category>(.*?)<\/category>/);
      const ratingMatch = xmlString.match(/<rating>(.*?)<\/rating>/);
      const reviewCountMatch = xmlString.match(/<reviewCount>(.*?)<\/reviewCount>/);

      if (idMatch && nameMatch) {
        return {
          id: idMatch[1],
          name: nameMatch[1],
          location: locationMatch?.[1] || "",
          category: categoryMatch?.[1] || "",
          rating: ratingMatch?.[1] || "0",
          reviewCount: reviewCountMatch?.[1] || "0",
        };
      }
    } catch (error) {
      console.error("Error parsing business XML:", error);
    }
    return null;
  };

  const renderMessage = (content: string) => {
    // Split content by business blocks
    const parts = content.split(/(<business>[\s\S]*?<\/business>)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a business block
      if (part.startsWith("<business>") && part.endsWith("</business>")) {
        const businessData = parseBusinessXML(part);
        if (businessData) {
          return (
            <div
              key={index}
              onClick={() => handleBusinessClick(businessData.id)}
              className="my-3 p-4 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer bg-background"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-base text-foreground hover:text-primary transition-colors">
                  {businessData.name}
                </h4>
                {businessData.rating !== "0" && (
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950 px-2 py-1 rounded">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">{businessData.rating}</span>
                  </div>
                )}
              </div>
              
              {businessData.category && (
                <Badge variant="secondary" className="mb-2 text-xs">
                  {businessData.category}
                </Badge>
              )}
              
              {businessData.location && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="line-clamp-2">{businessData.location}</p>
                </div>
              )}
              
              {businessData.reviewCount !== "0" && (
                <p className="text-xs text-muted-foreground mt-2">
                  {businessData.reviewCount} {parseInt(businessData.reviewCount) === 1 ? "review" : "reviews"}
                </p>
              )}
            </div>
          );
        }
      }
      
      // Regular text content - remove any remaining XML tags
      const cleanText = part.replace(/<\/?business>|<\/?data>/g, "").trim();
      if (cleanText) {
        return (
          <span key={index} className="block mb-2">
            {cleanText}
          </span>
        );
      }
      
      return null;
    });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Business Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {renderMessage(message.content)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about businesses..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
