"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    localStorage.setItem("v2g_user", JSON.stringify(data.user));
    localStorage.setItem("v2g_user_token", data.token);
    window.dispatchEvent(new Event("v2g-session"));
    location.href = "/home";
  }

  return (
    <div className="login-page">
      <header className="topbar">
        <Link href="/" className="brand">
          <Image src="/images/v2g-logo.jpg" alt="V2G" width={40} height={40} priority />
        </Link>
        <nav className="nav" aria-label="Login navigation">
          <Link href="/admin/login">Admin Login</Link>
        </nav>
      </header>
      <main className="login-screen">
        <section className="login-card stack">
          <div className="login-image">
            <Image
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              priority
            />
          </div>
          <div className="stack-sm center">
            <h1 className="section-title flush">User Login</h1>
            <p className="muted">เข้าสู่ระบบด้วยเบอร์โทรศัพท์</p>
          </div>
        <label className="field">
          <span>Mobile Number</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0811111111" inputMode="numeric" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button onClick={submit} disabled={loading} icon={loading ? <Loader2 size={14} className="spin-icon" /> : undefined}>
          {loading ? "Loading" : "Login"}
        </Button>
        </section>
      </main>
    </div>
  );
}
