"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Step = "phone" | "enter-pin" | "set-pin";
const PHONE_DIGITS = 10;
const PIN_DIGITS = 6;

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, PHONE_DIGITS);
}

function formatPhoneGuide(value: string) {
  const digits = normalizePhoneInput(value);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function normalizePinInput(value: string) {
  return value.replace(/\D/g, "").slice(0, PIN_DIGITS);
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setPin(""); setConfirmPin(""); setError(""); setNotice(""); setShowPin(false); setShowConfirm(false);
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (normalizePhoneInput(phone).length !== PHONE_DIGITS) {
      setError("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก");
      return;
    }
    setLoading(true); setError(""); setNotice("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizePhoneInput(phone) }),
    });
    const data = await readJsonSafe<{ status?: string; error?: string }>(res);
    setLoading(false);
    if (!res.ok || data?.status === "not_found") {
      setError(data?.error ?? "ไม่พบเบอร์นี้ในระบบ กรุณาติดต่อผู้ดูแล");
      return;
    }
    reset();
    setStep(data?.status === "has_pin" ? "enter-pin" : "set-pin");
  }

  async function handleEnterPin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (normalizePinInput(pin).length !== PIN_DIGITS) {
      setError("PIN ต้องเป็นตัวเลข 6 หลัก");
      return;
    }
    setLoading(true); setError(""); setNotice("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizePhoneInput(phone), loginPin: normalizePinInput(pin) }),
    });
    const data = await readJsonSafe<{ user?: object; token?: string; error?: string }>(res);
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? "Login PIN ไม่ถูกต้อง"); return; }
    if (!data?.user || !data.token) {
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
    if (!/^\d{6}$/.test(pin)) { setError("PIN ต้องเป็นตัวเลข 6 หลัก"); return; }
    setLoading(true); setError(""); setNotice("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizePhoneInput(phone), newPin: normalizePinInput(pin) }),
    });
    const data = await readJsonSafe<{ user?: object; token?: string; error?: string }>(res);
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? "เกิดข้อผิดพลาด"); return; }
    if (!data?.user || !data.token) {
      setError("ข้อมูล session ไม่ครบ กรุณาลองเข้าสู่ระบบใหม่");
      return;
    }
    localStorage.setItem("v2g_user", JSON.stringify(data.user));
    localStorage.setItem("v2g_user_token", data.token);
    window.dispatchEvent(new Event("v2g-session"));
    location.href = "/home";
  }

  async function handleRequestReset() {
    if (loading) return;
    setLoading(true); setError(""); setNotice("");
    const res = await fetch("/api/auth/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizePhoneInput(phone), requestReset: true }),
    });
    const data = await readJsonSafe<{ success?: boolean; message?: string; error?: string }>(res);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "ส่งคำขอรีเซ็ต PIN ไม่สำเร็จ");
      return;
    }
    setNotice(data?.message ?? "ส่งคำขอรีเซ็ต PIN ไปยัง Admin แล้ว");
  }

  return (
    <div className="login-page">
      <header className="topbar">
        <Link className="brand" aria-label="V2G LEARNING CENTER" href="/login">
          <Image src="/images/v2g-logo-circle.png" alt="V2G LEARNING CENTER" width={40} height={40} priority />
          <span>V2G LEARNING CENTER</span>
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
                    placeholder="0XX-XXX-XXXX"
                    value={formatPhoneGuide(phone)}
                    onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                    maxLength={12}
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
                <p className="muted">เบอร์ {formatPhoneGuide(phone)}</p>
              </div>
              <form className="stack" onSubmit={handleEnterPin}>
                <label className="field">
                  <span>Login PIN</span>
                  <div className="password-field">
                    <input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="กรอก PIN 6 หลัก"
                      value={pin}
                      onChange={(e) => setPin(normalizePinInput(e.target.value))}
                      maxLength={PIN_DIGITS}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPin((v) => !v)}>
                      {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                {notice ? <p className="form-notice">{notice}</p> : null}
                <Button type="submit" disabled={loading} icon={loading ? <Loader2 size={14} className="spin-icon" /> : undefined}>
                  {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                </Button>
                <button type="button" className="link-btn" onClick={handleRequestReset}>
                  ลืม PIN
                </button>
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
                <p className="muted">เบอร์ {formatPhoneGuide(phone)} — ยังไม่มี PIN กรุณาตั้งค่า</p>
              </div>
              <form className="stack" onSubmit={handleSetPin}>
                <label className="field">
                  <span>Login PIN ใหม่ (6 หลัก)</span>
                  <div className="password-field">
                    <input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="กรอก PIN 6 หลัก"
                      value={pin}
                      onChange={(e) => setPin(normalizePinInput(e.target.value))}
                      maxLength={PIN_DIGITS}
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
                      placeholder="กรอก PIN 6 หลักอีกครั้ง"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(normalizePinInput(e.target.value))}
                      maxLength={PIN_DIGITS}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                {notice ? <p className="form-notice">{notice}</p> : null}
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
