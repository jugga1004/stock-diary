"use client";

import { useRouter } from "next/navigation";
import { addTrade } from "@/lib/storage";
import { TradeForm } from "@/components/TradeForm";

export default function NewTradePage() {
  const router = useRouter();
  return (
    <TradeForm
      title="거래 추가"
      submitLabel="저장"
      onSubmit={async (input) => {
        await addTrade(input);
        router.push("/");
        router.refresh();
      }}
    />
  );
}
