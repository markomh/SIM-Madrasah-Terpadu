"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { services } from "@/services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@mts-terpadu.sch.id");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await services.auth.login(email, password);
      // force reload to trigger getMe in auth-context and get new tokens applied
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Gagal login. Periksa kembali kredensial Anda.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-paper/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl relative z-10 transition-all duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">SIM Madrasah</h1>
          <p className="text-muted mt-2 text-sm">Selamat datang kembali. Silakan login ke akun Anda.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-danger-soft border border-danger/20 text-danger rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@madrasah.sch.id"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
              <span className="text-muted group-hover:text-ink transition-colors">Ingat saya</span>
            </label>
            <a href="#" className="text-primary hover:underline font-medium transition-colors">
              Lupa password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            className="py-3.5 rounded-xl font-semibold shadow-lg shadow-primary/25"
          >
            Masuk ke Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}
