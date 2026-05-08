"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface SearchItem {
  code: string;
  name: string;
  market: string;
}

interface Props {
  name: string;
  symbol: string;
  onChange: (name: string, symbol: string) => void;
}

export function StockNameInput({ name, symbol, onChange }: Props) {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPickedRef = useRef<string>("");

  useEffect(() => {
    const q = name.trim();
    if (!q || q === lastPickedRef.current) {
      setItems([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/stock-search?query=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        const list = (data.items ?? []) as SearchItem[];
        setItems(list);
        setOpen(list.length > 0);
        setActiveIdx(-1);
      } catch {
        setItems([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(item: SearchItem) {
    lastPickedRef.current = item.name;
    onChange(item.name, item.code);
    setOpen(false);
    setItems([]);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(items[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={name}
        placeholder="예: 삼성전자"
        onChange={(e) => {
          lastPickedRef.current = "";
          onChange(e.target.value, "");
        }}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onKeyDown={handleKey}
        autoComplete="off"
        required
      />
      {symbol && (
        <div className="mt-1 text-xs text-muted-foreground">
          종목코드: <span className="font-mono">{symbol}</span>
        </div>
      )}
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-64 overflow-y-auto">
          {items.map((item, i) => (
            <button
              key={item.code}
              type="button"
              className={`w-full text-left px-3 py-2 hover:bg-accent ${i === activeIdx ? "bg-accent" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.code}
                {item.market ? ` · ${item.market}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
