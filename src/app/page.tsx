"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trade } from "@/lib/types";
import { deleteTrade, getTrades } from "@/lib/storage";
import {
  computeHoldings,
  computeSummary,
  formatKRW,
  formatNumber,
} from "@/lib/portfolio";
import type { PriceData } from "@/app/api/stock-price/route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function profitColor(n: number): string {
  if (n > 0) return "text-red-600";
  if (n < 0) return "text-blue-600";
  return "";
}

function formatSigned(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + formatKRW(n);
}

function formatRatio(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setTrades(getTrades());
  }, []);

  const holdings = useMemo(
    () => computeHoldings(trades).filter((h) => h.totalQuantity > 0),
    [trades],
  );
  const summary = useMemo(() => computeSummary(trades), [trades]);
  const recent = useMemo(
    () =>
      [...trades]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20),
    [trades],
  );

  const codesKey = useMemo(
    () =>
      holdings
        .map((h) => h.symbol)
        .filter(Boolean)
        .sort()
        .join(","),
    [holdings],
  );

  const fetchPrices = useCallback(async () => {
    if (!codesKey) {
      setPrices({});
      return;
    }
    setPricesLoading(true);
    try {
      const res = await fetch(`/api/stock-price?codes=${codesKey}`);
      const data = await res.json();
      setPrices(data.prices ?? {});
      setLastFetchedAt(new Date());
    } catch {
      // keep stale prices on error
    } finally {
      setPricesLoading(false);
    }
  }, [codesKey]);

  useEffect(() => {
    if (mounted) fetchPrices();
  }, [mounted, fetchPrices]);

  if (!mounted) {
    return (
      <main className="container mx-auto max-w-5xl p-4 md:p-6">
        <div className="text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  function handleDelete(id: string) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    deleteTrade(id);
    setTrades(getTrades());
  }

  let totalEvalValue = 0;
  let totalUnrealized = 0;
  let priceCovered = true;
  for (const h of holdings) {
    const p = prices[h.symbol];
    if (!p || p.price === 0) {
      priceCovered = false;
      continue;
    }
    totalEvalValue += p.price * h.totalQuantity;
    totalUnrealized += (p.price - h.avgBuyPrice) * h.totalQuantity;
  }

  return (
    <main className="container mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📓 주식일기</h1>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              설정
            </Button>
          </Link>
          <Link href="/trades/new">
            <Button>+ 거래 추가</Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 매수원가</CardDescription>
            <CardTitle className="text-base md:text-lg">
              {formatKRW(summary.totalInvested)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              총 평가금액
              {!priceCovered && (
                <span className="ml-1 text-[10px]">(일부 미반영)</span>
              )}
            </CardDescription>
            <CardTitle className="text-base md:text-lg">
              {pricesLoading && totalEvalValue === 0
                ? "—"
                : formatKRW(totalEvalValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>평가 손익 (미실현)</CardDescription>
            <CardTitle
              className={`text-base md:text-lg ${profitColor(totalUnrealized)}`}
            >
              {pricesLoading && totalUnrealized === 0
                ? "—"
                : formatSigned(totalUnrealized)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>실현 손익 (누적)</CardDescription>
            <CardTitle
              className={`text-base md:text-lg ${profitColor(summary.totalRealizedProfit)}`}
            >
              {formatSigned(summary.totalRealizedProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            보유 종목{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({summary.totalHoldings}개)
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastFetchedAt && (
              <span>
                {lastFetchedAt.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                기준
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={fetchPrices}
              disabled={pricesLoading || !codesKey}
            >
              {pricesLoading ? "조회 중..." : "현재가 새로고침"}
            </Button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              아직 보유 종목이 없습니다
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {holdings.map((h) => {
              const p = h.symbol ? prices[h.symbol] : undefined;
              const evalValue = p ? p.price * h.totalQuantity : 0;
              const unrealized = p
                ? (p.price - h.avgBuyPrice) * h.totalQuantity
                : 0;
              const rate =
                p && h.avgBuyPrice > 0
                  ? ((p.price - h.avgBuyPrice) / h.avgBuyPrice) * 100
                  : 0;
              return (
                <Card key={(h.symbol || "") + h.name}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="font-semibold">{h.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {h.symbol || "—"}
                        </div>
                        <div className="text-sm mt-1">
                          {formatNumber(h.totalQuantity)}주 · 평단{" "}
                          {formatKRW(h.avgBuyPrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        {p ? (
                          <>
                            <div className="text-base font-semibold">
                              {formatKRW(p.price)}
                            </div>
                            <div
                              className={`text-xs ${profitColor(p.change)}`}
                            >
                              {formatSigned(p.change)} ({formatRatio(p.ratio)})
                            </div>
                            <div className="text-sm mt-1">
                              평가 {formatKRW(evalValue)}
                            </div>
                            <div
                              className={`text-sm font-medium ${profitColor(unrealized)}`}
                            >
                              {formatSigned(unrealized)} (
                              {formatRatio(rate)})
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {pricesLoading
                              ? "현재가 조회 중..."
                              : h.symbol
                                ? "현재가 없음"
                                : "종목코드 미등록"}
                            <div className="mt-1">
                              매수원가 {formatKRW(h.totalCost)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          현재가 출처: 네이버 금융 (장 시간 외에는 최종 종가). 참고용으로만
          사용하세요.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          최근 거래{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({summary.totalTrades}건)
          </span>
        </h2>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              아직 기록된 거래가 없습니다. 우측 상단 + 거래 추가를 눌러
              시작하세요.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>종목</TableHead>
                    <TableHead>구분</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">
                        {t.date}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t.name}</div>
                        {t.symbol && (
                          <div className="text-xs text-muted-foreground">
                            {t.symbol}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.type === "buy" ? "destructive" : "secondary"
                          }
                        >
                          {t.type === "buy" ? "매수" : "매도"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(t.quantity)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatKRW(t.price)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatKRW(t.quantity * t.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Link href={`/trades/${t.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              수정
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t.id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}
