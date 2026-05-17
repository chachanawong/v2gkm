"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { markSessionActive } from "@/lib/client-session";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    localStorage.setItem("v2g_admin", JSON.stringify(data.admin));
    localStorage.setItem("v2g_admin_token", data.token);
    markSessionActive("admin");
    window.dispatchEvent(new Event("v2g-session"));
    location.href = "/admin/dashboard";
  }

  return (
    <div className="login-page">
      <header className="topbar">
        <Link href="/admin/login" className="brand" aria-label="V2G Admin">
          <Image src="/images/v2g-logo.jpg" alt="V2G Admin" width={40} height={40} priority />
          <span>ADMIN</span>
        </Link>
        <nav className="nav" aria-label="Admin login navigation">
          <Link href="/">User Page</Link>
        </nav>
      </header>
      <main className="login-screen">
        <section className="login-card stack">
        <div className="login-image">
          <Image
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop"
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            priority
          />
        </div>
        <h1 className="section-title">V2G Admin Login</h1>
        <label className="field"><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="field">
          <span>Password</span>
          <div className="password-field">
            <input type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" onClick={() => setShow((value) => !value)} title="Toggle password">{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
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
