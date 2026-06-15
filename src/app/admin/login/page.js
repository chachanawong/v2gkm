import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <>
      <header className="topbar">
        <Link className="brand" aria-label="V2G" href="/login"><span className="brand-mark">V2G</span><span>KM</span></Link>
        <nav className="nav" aria-label="Admin login navigation"><Link href="/login">User Login</Link></nav>
      </header>
      <main className="login-screen">
        <section className="login-card stack">
          <div className="stack-sm center"><h1 className="section-title">Admin Login</h1><p className="muted">เข้าสู่ระบบสำหรับผู้ดูแล</p></div>
          <form className="stack" action="/admin/dashboard">
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required /></div>
            <button className="button" type="submit">Login</button>
          </form>
        </section>
      </main>
    </>
  );
}
