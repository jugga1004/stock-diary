"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addTrade } from "@/lib/storage";
import { TradeType } from "@/lib/types";
import { calculateFee } from "@/lib/fee";
import { formatKRW } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StockNameInput } from "@/components/StockNameInput";

export default function NewTradePage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<TradeType>("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [feeEdited, setFeeEdited] = useState(false);
  const [note, setNote] = useState("");

  const feeBreakdown = useMemo(
    () => calculateFee(type, Number(quantity) || 0, Number(price) || 0),
    [type, quantity, price],
  );

  useEffect(() => {
    if (feeEdited) return;
    setFee(feeBreakdown.total > 0 ? String(feeBreakdown.total) : "");
  }, [feeBreakdown.total, feeEdited]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !quantity || !price) {
      alert("종목명, 수량, 단가는 필수입니다");
      return;
    }
    addTrade({
      date,
      name: name.trim(),
      symbol: symbol.trim(),
      type,
      quantity: Number(quantity),
      price: Number(price),
      fee: Number(fee) || 0,
      note: note.trim(),
    });
    router.push("/");
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 md:p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">거래 추가</h1>
        <Link href="/">
          <Button variant="ghost">취소</Button>
        </Link>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">거래일</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>종목명 *</Label>
              <StockNameInput
                name={name}
                symbol={symbol}
                onChange={(n, s) => {
                  setName(n);
                  setSymbol(s);
                }}
              />
              <p className="text-xs text-muted-foreground">
                입력하면 자동으로 검색됩니다. 목록에서 선택하면 종목코드가 함께
                저장돼요.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>구분 *</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TradeType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">매수</SelectItem>
                  <SelectItem value="sell">매도</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">수량 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">단가 (원) *</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="fee">수수료 (원)</Label>
                {feeEdited && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setFeeEdited(false)}
                  >
                    자동 계산으로 되돌리기
                  </button>
                )}
              </div>
              <Input
                id="fee"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value);
                  setFeeEdited(true);
                }}
                placeholder="0"
              />
              {feeBreakdown.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {feeEdited ? "자동 계산값: " : "자동 계산: "}
                  {type === "buy" ? (
                    <>수수료 {formatKRW(feeBreakdown.commission)}</>
                  ) : (
                    <>
                      수수료 {formatKRW(feeBreakdown.commission)} + 거래세{" "}
                      {formatKRW(feeBreakdown.tax)} ={" "}
                      {formatKRW(feeBreakdown.total)}
                    </>
                  )}
                  <span className="ml-1 opacity-70">
                    (수수료 0.015% / 매도 거래세 0.18% 기준)
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">매매 근거 / 메모</Label>
              <Textarea
                id="note"
                placeholder="왜 사고 / 팔았는지, 당시 시장 분위기와 감정 등 자유롭게 기록"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
              />
            </div>

            <Button type="submit" className="w-full">
              저장
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
