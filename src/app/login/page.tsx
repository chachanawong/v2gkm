"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Step = "phone" | "enter-pin" | "set-pin";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setPin(""); setConfirmPin(""); setError(""); setShowPin(false); setShowConfirm(false);
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json() as { status?: string; error?: string };
    setLoading(false);
    if (!res.ok || data.status === "not_found") {
      setError("ไม่พบเบอร์นี้ในระบบ กรุณาติดต่อผู้ดูแล");
      return;
    }
    reset();
    setStep(data.status === "has_pin" ? "enter-pin" : "set-pin");
  }

  async function handleEnterPin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, loginPin: pin }),
    });
    const data = await res.json() as { user?: object; token?: string; error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Login PIN ไม่ถูกต้อง"); return; }
    if (!data.user || !data.token) {
      setError("ข้อมูล session ไม่ครบ กรุณาลองเข้าสู่ระบบใหม่");
      return;
    }
    localStorage.setItem("v2g_user", JSON.stringify(data.user));
    localStorage.setItem("v2g_user_token", data.token);
    window.dispatchEvent(new Event("v2g-session"));
    location.href = "/home";
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (pin !== confirmPin) { setError("PIN ทั้งสองไม่ตรงกัน"); return; }
    if (!/^\d{4,6}$/.test(pin)) { setError("PIN ต้องเป็นตัวเลข 4-6 หลัก"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, newPin: pin }),
    });
    const data = await res.json() as { user?: object; token?: string; error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
    if (!data.user || !data.token) {
      setError("ข้อมูล session ไม่ครบ กรุณาลองเข้าสู่ระบบใหม่");
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
        <Link className="brand" aria-label="V2G" href="/login">
          <span className="brand-mark">V2G</span><span>KM</span>
        </Link>
        <nav className="nav" aria-label="Login navigation">
          <Link href="/admin/login">Admin Login</Link>
        </nav>
      </header>

      <main className="login-screen">
        <section className="login-card stack">
          {/* Step: phone */}
          {step === "phone" && (
            <>
              <div className="stack-sm center">
                <h1 className="section-title">User Login</h1>
                <p className="muted">เข้าสู่ระบบด้วยเบอร์โทรศัพท์</p>
              </div>
              <form className="stack" onSubmit={handlePhoneSubmit}>
                <label className="field">
                  <span>เบอร์โทรศัพท์</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="08XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoFocus
                  />
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <Button type="submit" disabled={loading} icon={loading ? <Loader2 size={14} className="spin-icon" /> : undefined}>
                  {loading ? "กำลังตรวจสอบ..." : "ถัดไป"}
                </Button>
              </form>
            </>
          )}

          {/* Step: enter existing PIN */}
          {step === "enter-pin" && (
            <>
              <div className="stack-sm center">
                <h1 className="section-title">ใส่ Login PIN</h1>
                <p className="muted">เบอร์ {phone}</p>
              </div>
              <form className="stack" onSubmit={handleEnterPin}>
                <label className="field">
                  <span>Login PIN</span>
                  <div className="password-field">
                    <input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="กรอก PIN 4-6 หลัก"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={6}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPin((v) => !v)}>
                      {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <Button type="submit" disabled={loading} icon={loading ? <Loader2 size={14} className="spin-icon" /> : undefined}>
                  {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                </Button>
                <button type="button" className="link-btn" onClick={() => { setStep("phone"); reset(); }}>
                  ← เปลี่ยนเบอร์โทรศัพท์
                </button>
              </form>
            </>
          )}

          {/* Step: set new PIN */}
          {step === "set-pin" && (
            <>
              <div className="stack-sm center">
                <h1 className="section-title">ตั้ง Login PIN</h1>
                <p className="muted">เบอร์ {phone} — ยังไม่มี PIN กรุณาตั้งค่า</p>
              </div>
              <form className="stack" onSubmit={handleSetPin}>
                <label className="field">
                  <span>Login PIN ใหม่ (4-6 หลัก)</span>
                  <div className="password-field">
                    <input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="กรอก PIN 4-6 หลัก"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={6}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPin((v) => !v)}>
                      {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                <label className="field">
                  <span>ยืนยัน PIN</span>
                  <div className="password-field">
                    <input
                      type={showConfirm ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="กรอก PIN อีกครั้ง"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <Button type="submit" disabled={loading} icon={loading ? <Loader2 size={14} className="spin-icon" /> : undefined}>
                  {loading ? "กำลังบันทึก..." : "บันทึก PIN และเข้าสู่ระบบ"}
                </Button>
                <button type="button" className="link-btn" onClick={() => { setStep("phone"); reset(); }}>
                  ← เปลี่ยนเบอร์โทรศัพท์
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
