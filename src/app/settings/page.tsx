"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BROKER_PRESETS,
  BrokerPreset,
  DEFAULT_FEE_CONFIG,
  FeeConfig,
  getFeeConfig,
  saveFeeConfig,
} from "@/lib/feeConfig";
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

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<FeeConfig>(DEFAULT_FEE_CONFIG);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(getFeeConfig());
  }, []);

  function pickBroker(broker: BrokerPreset) {
    if (broker === "custom") {
      setConfig((c) => ({ ...c, broker }));
    } else {
      const preset = BROKER_PRESETS[broker];
      setConfig((c) => ({
        ...c,
        broker,
        commissionRate: preset.commissionRate,
        sellTaxRate: preset.sellTaxRate,
      }));
    }
  }

  function handleSave() {
    saveFeeConfig(config);
    router.push("/");
  }

  if (!mounted) {
    return (
      <main className="container mx-auto max-w-2xl p-4 md:p-6">
        <div className="text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 md:p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">설정</h1>
        <Link href="/">
          <Button variant="ghost">취소</Button>
        </Link>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <section>
            <h2 className="text-base font-semibold mb-3">수수료 계산 기준</h2>
            <p className="text-xs text-muted-foreground mb-4">
              거래 추가 시 수수료가 자동으로 채워질 때 사용되는 비율입니다.
              기존에 입력해둔 거래는 영향을 받지 않습니다.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>증권사</Label>
                <Select
                  value={config.broker}
                  onValueChange={(v) => pickBroker(v as BrokerPreset)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BROKER_PRESETS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">직접 입력</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="commissionRate">거래수수료 (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    value={config.commissionRate}
                    disabled={config.broker !== "custom"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        commissionRate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sellTaxRate">매도 거래세 (%)</Label>
                  <Input
                    id="sellTaxRate"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    value={config.sellTaxRate}
                    disabled={config.broker !== "custom"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        sellTaxRate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.freeCommission}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      freeCommission: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 mt-0.5"
                />
                <span className="text-sm">
                  수수료 무료 이벤트 적용 중
                  <span className="block text-xs text-muted-foreground">
                    체크하면 거래수수료를 0%로 계산합니다 (매도 거래세는 그대로).
                  </span>
                </span>
              </label>
            </div>
          </section>

          <Button onClick={handleSave} className="w-full">
            저장
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
