"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrade, updateTrade } from "@/lib/storage";
import { Trade } from "@/lib/types";
import { TradeForm } from "@/components/TradeForm";
import { Button } from "@/components/ui/button";

export default function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTrade(getTrade(id));
  }, [id]);

  if (!mounted) {
    return (
      <main className="container mx-auto max-w-2xl p-4 md:p-6">
        <div className="text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  if (!trade) {
    return (
      <main className="container mx-auto max-w-2xl p-4 md:p-6">
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            거래를 찾을 수 없습니다. 이미 삭제되었거나 잘못된 주소일 수 있어요.
          </p>
          <Link href="/">
            <Button>홈으로</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <TradeForm
      title="거래 수정"
      submitLabel="수정 완료"
      initial={trade}
      onSubmit={(input) => {
        updateTrade(trade.id, input);
        router.push("/");
      }}
    />
  );
}
