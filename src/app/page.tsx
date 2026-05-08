"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trade } from "@/lib/types";
import { deleteTrade, getTrades } from "@/lib/storage";
import {
  computeHoldings,
  computeSummary,
  formatKRW,
  formatNumber,
} from "@/lib/portfolio";
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

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTrades(getTrades());
  }, []);

  if (!mounted) {
    return (
      <main className="container mx-auto max-w-5xl p-4 md:p-6">
        <div className="text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  const summary = computeSummary(trades);
  const holdings = computeHoldings(trades).filter((h) => h.totalQuantity > 0);
  const recent = [...trades]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  function handleDelete(id: string) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    deleteTrade(id);
    setTrades(getTrades());
  }

  return (
    <main className="container mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📓 주식일기</h1>
        <Link href="/trades/new">
          <Button>+ 거래 추가</Button>
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>보유 종목</CardDescription>
            <CardTitle className="text-2xl">
              {summary.totalHoldings}개
            </CardTitle>
          </CardHeader>
        </Card>
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
            <CardDescription>실현 손익</CardDescription>
            <CardTitle
              className={`text-base md:text-lg ${
                summary.totalRealizedProfit > 0
                  ? "text-red-600"
                  : summary.totalRealizedProfit < 0
                    ? "text-blue-600"
                    : ""
              }`}
            >
              {formatKRW(summary.totalRealizedProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 거래 수</CardDescription>
            <CardTitle className="text-2xl">{summary.totalTrades}건</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">보유 종목</h2>
        {holdings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              아직 보유 종목이 없습니다
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {holdings.map((h) => (
              <Card key={(h.symbol || "") + h.name}>
                <CardContent className="p-4 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <div className="font-semibold">{h.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {h.symbol || "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {formatNumber(h.totalQuantity)}주 · 평단{" "}
                      {formatKRW(h.avgBuyPrice)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      매수원가 {formatKRW(h.totalCost)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">최근 거래</h2>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(t.id)}
                        >
                          삭제
                        </Button>
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
