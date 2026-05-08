"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = id.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      setError("ID는 3~50자여야 합니다");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "로그인 실패");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("네트워크 오류");
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto max-w-md p-4 md:p-6 mt-12">
      <h1 className="text-2xl font-bold mb-1 text-center">📓 주식일기</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        ID로 로그인하세요. 처음 보는 ID면 자동으로 가입됩니다.
      </p>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                placeholder="예: joohwa-stock-x9k7m"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                3~50자. 비밀번호 없이 ID만으로 로그인합니다. ID 자체가 비밀번호
                역할이니 추측 어려운 걸로 정해주세요.
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "들어가는 중..." : "들어가기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
