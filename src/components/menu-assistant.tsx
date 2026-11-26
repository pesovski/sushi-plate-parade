import { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, ShoppingBag, ArrowUp } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolHeader, ToolContent } from "@/components/ai-elements/tool";
import {
  assistantCartSchema,
  assistantMessageSchema,
  type AssistantCart,
  type AssistantMessage,
} from "@/lib/menu-assistant-model";
import logo from "@/assets/restorani-logo-wide.png.asset.json";

const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({
    type: z.literal("tool"),
    part: assistantMessageSchema.shape.parts.element.options[1],
    cart: assistantCartSchema.optional(),
  }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

interface Props {
  cart: AssistantCart;
  total: number;
  onCartChange: (cart: AssistantCart) => void;
  onReview: () => void;
}

export function MenuAssistant({ cart, total, onCartChange, onReview }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const appliedCalls = useRef(new Set<string>());
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => () => abortRef.current?.abort(), []);
  const focus = () => window.setTimeout(() => inputRef.current?.focus(), 0);
  const stop = () => {
    abortRef.current?.abort();
    setStatus("ready");
    focus();
  };

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    const user: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };
    const assistantId = crypto.randomUUID();
    const history = [...messages, user];
    setMessages([...history, { id: assistantId, role: "assistant", parts: [] }]);
    setDraft("");
    setError("");
    setStatus("submitted");
    focus();
    const abort = new AbortController();
    abortRef.current = abort;
    const receive = (line: string) => {
      if (!line.trim() || abort.signal.aborted) return;
      const event = eventSchema.parse(JSON.parse(line));
      if (event.type === "error") throw new Error(event.message);
      if (event.type === "done") return;
      setStatus("streaming");
      if (event.type === "tool" && event.cart && !appliedCalls.current.has(event.part.callId)) {
        appliedCalls.current.add(event.part.callId);
        onCartChange(event.cart);
      }
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== assistantId) return message;
          if (event.type === "text") {
            const parts = [...message.parts];
            const last = parts.at(-1);
            if (last?.type === "text")
              parts[parts.length - 1] = { type: "text", text: last.text + event.delta };
            else parts.push({ type: "text", text: event.delta });
            return { ...message, parts };
          }
          const index = message.parts.findIndex(
            (part) => part.type === "tool-cart" && part.callId === event.part.callId,
          );
          const parts = [...message.parts];
          if (index >= 0) parts[index] = event.part;
          else parts.push(event.part);
          return { ...message, parts };
        }),
      );
    };
    try {
      const response = await fetch("/api/public/menu-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, cart }),
        signal: abort.signal,
      });
      if (!response.ok) {
        const result = z.object({ error: z.string() }).safeParse(await response.json());
        throw new Error(
          result.success ? result.data.error : "The assistant is temporarily unavailable.",
        );
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("The assistant could not reply.");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        buffer += decoder.decode(next.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) receive(line);
      }
      if (buffer.trim()) receive(buffer);
      if (!abort.signal.aborted) setStatus("ready");
    } catch (cause) {
      if (!abort.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Please try again.");
        setDraft(prompt);
        setStatus("error");
      }
    } finally {
      focus();
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) stop();
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Ordering assistant"
          title="Ordering assistant"
          className="gap-2"
        >
          <MessageCircle />
          <span className="hidden sm:inline">Ask the sushi assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="flex h-dvh w-full min-w-0 flex-col gap-0 p-0 sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focus();
        }}
      >
        <SheetHeader className="shrink-0 border-b px-6 pb-5 pt-7 text-left">
          <img src={logo.url} alt="Restorani.bar" className="mb-3 w-32" />
          <SheetTitle className="menu-title text-2xl">Your sushi assistant</SheetTitle>
          <SheetDescription>What are you in the mood for?</SheetDescription>
        </SheetHeader>
        <Conversation className="min-h-0">
          <ConversationContent className="gap-5 px-6 py-6">
            {messages.length === 0 && (
              <div className="py-8">
                <h3 className="menu-title text-3xl">Let’s find your next favorite.</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Nigiri, a signature roll, or a little sweet finish?
                </p>
                <div className="mt-5 flex flex-col items-start gap-2">
                  {[
                    "What’s on the menu?",
                    "Add two salmon nigiri to my cart",
                    "What vegetarian dishes do you have?",
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      className="h-auto max-w-full whitespace-normal py-2 text-left"
                      onClick={() => void send(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <Message key={message.id} from={message.role} className="max-w-full">
                <MessageContent
                  className={
                    message.role === "user"
                      ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                      : "w-full"
                  }
                >
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    ) : (
                      <Tool key={part.callId} defaultOpen={false} className="mb-0">
                        <ToolHeader
                          type="dynamic-tool"
                          toolName={part.name}
                          state={part.state}
                          title={
                            part.name === "update_cart" ? "Update your cart" : "Review your cart"
                          }
                        />
                        <ToolContent>
                          <p className="text-xs text-muted-foreground">
                            {part.state === "output-error"
                              ? part.output
                              : part.name === "update_cart"
                                ? "Your plate quantities have been updated. Review your order before paying."
                                : "Your current order total has been checked."}
                          </p>
                        </ToolContent>
                      </Tool>
                    ),
                  )}
                </MessageContent>
              </Message>
            ))}
            {status === "submitted" && <Shimmer className="text-sm">Checking the menu…</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton aria-label="Latest message" />
        </Conversation>
        <div className="shrink-0 border-t bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={busy || !cart.length}
              onClick={() => {
                setOpen(false);
                onReview();
              }}
            >
              <ShoppingBag />
              Review order <span className="tabular-nums">${total.toFixed(2)}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="New conversation"
              title="New conversation"
              disabled={busy}
              onClick={() => {
                setMessages([]);
                setDraft("");
                setError("");
                setStatus("ready");
                appliedCalls.current.clear();
                focus();
              }}
            >
              <RotateCcw />
            </Button>
          </div>
          {error && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <PromptInput onSubmit={({ text }) => send(text)}>
            <PromptInputTextarea
              ref={inputRef}
              aria-label="Message the sushi assistant"
              placeholder="Two salmon nigiri and one dragon roll…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={4000}
              className="min-h-20"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                disabled={!busy && !draft.trim()}
                onStop={stop}
                className="size-8 p-0"
              >
                {!busy && <ArrowUp className="size-4" />}
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </SheetContent>
    </Sheet>
  );
}
