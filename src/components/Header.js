import Link from "next/link";

const userLinks = [
  ["Home", "/dashboard"],
  ["Announcement", "/dashboard#announcements"],
  ["Learning", "/dashboard#learning"],
  ["Profiles", "/dashboard#profiles"]
];

export function Header({ active = "", admin = false }) {
  const links = admin
    ? [["Dashboard", "/admin/dashboard"], ["Content", "/admin/dashboard#content"], ["Users", "/admin/dashboard#users"], ["Permissions", "/admin/dashboard#permissions"], ["User Home", "/dashboard"]]
    : userLinks;
  return (
    <header className="topbar">
      <Link className="brand" href={admin ? "/admin/dashboard" : "/dashboard"} aria-label="V2G">
        <span className="brand-mark">V2G</span><span>KM</span>
      </Link>
      <nav className="nav" aria-label={admin ? "Admin navigation" : "Main navigation"}>
        {links.map(([label, href]) => <Link className={active === href ? "active" : ""} href={href} key={href}>{label}</Link>)}
        {admin ? <a href="https://v2gcenter.up.railway.app" target="_blank" rel="noreferrer">Account System</a> : null}
        <Link href="/login">Logout</Link>
      </nav>
    </header>
  );
}
