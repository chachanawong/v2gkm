import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <header className="topbar">
        <Link className="brand" aria-label="V2G" href="/login"><span className="brand-mark">V2G</span><span>KM</span></Link>
        <nav className="nav" aria-label="Login navigation"><Link href="/admin/login">Admin Login</Link></nav>
      </header>
      <main className="login-screen">
        <section className="login-card stack">
          <div className="stack-sm center"><h1 className="section-title">User Login</h1><p className="muted">เข้าสู่ระบบด้วยเบอร์โทรศัพท์</p></div>
          <form className="stack" action="/dashboard">
            <div className="field"><label htmlFor="phone">Mobile Number</label><input id="phone" name="phone" type="tel" required /></div>
            <button className="button" type="submit">Login</button>
          </form>
        </section>
      </main>
    </>
  );
}
