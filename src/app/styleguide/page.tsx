import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";

export const metadata = { title: "Styleguide — V2G KM" };

/**
 * Internal design reference — single source of truth for V2G KM UI.
 * เพิ่ม component ใหม่ที่นี่ก่อนใช้งานจริง.
 */
export default function StyleguidePage() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <span className="brand">V2G KM · DESIGN SYSTEM</span>
        <nav style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
          {NAV_ITEMS.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="topbar-nav-link">{label}</a>
          ))}
          <Link className="btn btn-ghost btn-sm" href="/home" style={{ marginLeft: 8 }}>← User</Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/dashboard">← Admin</Link>
        </nav>
      </header>

      <main className="content-wrap sg">
        {/* Intro */}
        <section className="section-head" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">Design System</p>
            <h1>V2G KM Global Design</h1>
          </div>
        </section>
        <p className="sg-intro" style={{ marginBottom: 4 }}>
          ภาษาออกแบบ: <strong>Monochrome editorial บนโครง Material 3</strong> — สะอาด นิ่ง ให้คอนเทนต์นำ.
        </p>
        <p className="sg-intro">
          กฎเหล็ก: feature ใหม่ <strong>ประกอบจากชิ้นส่วนในหน้านี้เท่านั้น</strong> — ไม่วาดสีหรือ component ใหม่.{" "}
          <strong>ฝั่ง Admin ใช้ token ชุดเดียวกับ User</strong>, ต่างกันเฉพาะ density (compact กว่า).
        </p>

        {/* ─────────────────── 1 · COLOR ─────────────────── */}
        <Block id="color" title="1 · สี (Color tokens)" note="Monochrome เป็นค่าตั้งต้น. สีใช้เพื่อ 'ความหมาย' (state) เท่านั้น ไม่ใช่ตกแต่ง.">
          <div className="sg-swatches">
            {COLOR_TOKENS.map(({ token, hex, label }) => (
              <div className="sg-swatch" key={token}>
                <div className="sg-swatch-chip" style={{ background: `var(${token})` }} />
                <code>{token}</code>
                <small>{hex}</small>
                {label ? <em>{label}</em> : null}
              </div>
            ))}
          </div>
        </Block>

        {/* ─────────────────── 2 · TYPOGRAPHY ─────────────────── */}
        <Block id="type" title="2 · ตัวอักษร (Typography)" note="Google Sans + Thai. base 14px / 1.6. ปุ่ม 11px UPPERCASE 700.">
          <div className="sg-stack">
            <div><h1 style={{ margin: 0 }}>H1 — 22px / 700 / ls -0.01em</h1><code>h1</code></div>
            <div><h2 style={{ margin: 0 }}>H2 — 18px / 600</h2><code>.section-head.slim h2</code></div>
            <div><p style={{ fontSize: 13, margin: 0 }}>H3 — 13px / 1.35</p><code>h3</code></div>
            <div><p style={{ margin: 0 }}>Body — 14px / 1.6 ตัวเนื้อหาทั่วไป ฝั่ง User ใช้เป็นหลัก</p><code>body</code></div>
            <div><p className="eyebrow" style={{ margin: 0 }}>EYEBROW · 12px / 600 / ls 0.04em</p><code>.eyebrow</code></div>
            <div><small style={{ color: "var(--secondary)" }}>Caption / Meta — 11px / secondary</small><code>small, .meta</code></div>
            <div>
              <p style={{ fontFamily: "monospace", fontSize: 12, color: "var(--secondary)", margin: 0 }}>
                Monospace — path ID, code
              </p>
              <code>fontFamily: &apos;monospace&apos;</code>
            </div>
          </div>
        </Block>

        {/* ─────────────────── 3 · SPACING ─────────────────── */}
        <Block id="space" title="3 · ระยะห่าง & มุม & เงา" note="ใช้สเกลเดิมเท่านั้น — ห้ามใส่ตัวเลขอื่นนอกสเกล.">
          <div className="sg-spaces">
            {[4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32, 40].map((px) => (
              <div className="sg-space" key={px}>
                <span style={{ width: px, height: px }} />
                <small>{px}</small>
              </div>
            ))}
          </div>
          <div className="sg-row-demo" style={{ marginTop: 16 }}>
            <div className="sg-radius" style={{ borderRadius: "var(--radius)" }}>--radius<br /><small>10px</small></div>
            <div className="sg-radius" style={{ borderRadius: "var(--radius-sm)" }}>--radius-sm<br /><small>6px</small></div>
            <div className="sg-radius" style={{ boxShadow: "var(--shadow-sm)" }}>--shadow-sm</div>
            <div className="sg-radius" style={{ boxShadow: "var(--shadow)" }}>--shadow</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Grid & Gutter</p>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", maxWidth: 520 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  {["Token", "Value", "ใช้ที่ไหน"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "4px 10px", color: "var(--secondary)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["--margin-mobile", "20px", "topbar / content-wrap padding บน mobile"],
                  ["--margin-desktop", "64px", "topbar / content-wrap padding บน ≥768px"],
                  ["--gutter", "32px", "gap ระหว่าง column ใน grid"],
                  ["--container-max", "1280px", "max-width ของ content-wrap"],
                ].map(([token, val, desc]) => (
                  <tr key={token} style={{ borderTop: "1px solid var(--outline-variant)" }}>
                    <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 11 }}>{token}</td>
                    <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 11, color: "var(--secondary)" }}>{val}</td>
                    <td style={{ padding: "6px 10px", color: "var(--secondary)", fontSize: 12 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>

        {/* ─────────────────── 4 · BUTTON ─────────────────── */}
        <Block id="button" title="4 · ปุ่ม (Buttons)" note="ห้ามสร้าง style ปุ่มใหม่. ใช้ <Button variant size> เท่านั้น.">
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Variants</p>
              <div className="sg-row-demo">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Sizes</p>
              <div className="sg-row-demo" style={{ alignItems: "center" }}>
                <Button>Default (40px)</Button>
                <Button size="sm">Small (34px)</Button>
              </div>
            </div>
            <DontBox
              do="ใช้ variant ที่มีเท่านั้น: primary, secondary, ghost, danger"
              dont="อย่าใส่ style inline บน button หรือสร้าง class ใหม่"
            />
          </div>
        </Block>

        {/* ─────────────────── 5 · BADGE & TAG ─────────────────── */}
        <Block id="badge" title="5 · Badge & Tag" note="สีเฉพาะ state. ห้ามใช้สีเพื่อ brand หรือตกแต่ง.">
          <div className="sg-stack">
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Status badges — &lt;Badge tone&gt;</p>
              <div className="sg-row-demo">
                <Badge tone="green">Published</Badge>
                <Badge tone="blue">Scheduled</Badge>
                <Badge tone="amber">Draft</Badge>
                <Badge tone="neutral">Unpublished</Badge>
                <Badge tone="red">Error / ปิด</Badge>
                <Badge tone="dark">Platinum / Active</Badge>
              </div>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Content tags — .tag</p>
              <div className="sg-row-demo">
                <span className="tag">หมวดหมู่</span>
                <span className="tag">ธุรกิจ</span>
                <span className="tag tag-large">tag-large</span>
                <VisibilityBadge value="general" />
                <VisibilityBadge value="silver" />
                <VisibilityBadge value="platinum" />
              </div>
            </div>
          </div>
        </Block>

        {/* ─────────────────── 6 · FORMS ─────────────────── */}
        <Block id="form" title="6 · ฟอร์ม (Form fields)" note="ทุก input ใช้ CSS global. label ใช้ .field > span. ห้ามสร้าง custom input ใหม่.">
          <div style={{ maxWidth: 480, display: "grid", gap: 14 }}>
            <label className="field">
              <span>Text input</span>
              <input type="text" placeholder="พิมพ์ข้อความ..." defaultValue="" />
            </label>
            <label className="field">
              <span>Textarea</span>
              <textarea rows={3} placeholder="ข้อความยาว..." defaultValue="" />
            </label>
            <label className="field">
              <span>Select</span>
              <select defaultValue="general">
                <option value="general">General</option>
                <option value="silver">Silver</option>
                <option value="platinum">Platinum</option>
              </select>
            </label>
            <label className="field" style={{ flexDirection: "row", alignItems: "center", display: "flex", gap: 10 }}>
              <input type="checkbox" defaultChecked style={{ width: 16, height: 16, padding: 0 }} />
              <span style={{ margin: 0 }}>Checkbox label</span>
            </label>
            <label className="field">
              <span>Datetime</span>
              <input type="datetime-local" defaultValue="" />
            </label>
            <div className="field">
              <span>Password field</span>
              <div className="password-field">
                <input type="password" placeholder="รหัสผ่าน" defaultValue="" />
                <button type="button">👁</button>
              </div>
            </div>
            <p className="form-error">ข้อความ error — .form-error</p>
          </div>
        </Block>

        {/* ─────────────────── 7 · USER CARDS ─────────────────── */}
        <Block id="card" title="7 · User · Cards & Layout" note="หน่วยหลักฝั่ง User. image-led. ใช้ ContentCard เสมอ — ห้ามสร้าง card ใหม่.">
          <div style={{ display: "grid", gap: 24 }}>
            {/* Grid */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Grid layout — .home-grid / .news-grid</p>
              <div className="home-grid" style={{ maxWidth: 560 }}>
                {["ข่าวสาร — V2G Weekly Update", "ความรู้ — Leadership Framework"].map((t) => (
                  <div key={t} className="card-button" style={{ cursor: "default" }}>
                    <ContentCard
                      title={t}
                      image="/images/v2g-logo.jpg"
                      meta={<><VisibilityBadge value="general" /><span>14 มิ.ย. 2026</span></>}
                      imageTags={["ข่าว"]}
                    >
                      <p className="line-clamp two-line">คำอธิบายย่อของเนื้อหา ตัดบรรทัดด้วย line-clamp ให้สูงเท่ากันทุกการ์ด.</p>
                    </ContentCard>
                  </div>
                ))}
              </div>
            </div>
            {/* List mode */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>List mode — .home-list</p>
              <div className="home-grid home-list" style={{ maxWidth: 560 }}>
                <div className="card-button" style={{ cursor: "default" }}>
                  <ContentCard
                    title="รายการในโหมด List — แนวนอน"
                    image="/images/v2g-logo.jpg"
                    meta={<><VisibilityBadge value="silver" /></>}
                  >
                    <p className="line-clamp two-line">ใช้เมื่อเนื้อหาเยอะ สแกนเร็วกว่า grid.</p>
                  </ContentCard>
                </div>
              </div>
            </div>
            {/* Highlight banner */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Highlight banner</p>
              <div className="highlight-banner" style={{ maxWidth: 480 }}>
                <div className="highlight-track">
                  <button type="button" className="highlight-slide" style={{ background: "linear-gradient(135deg,#111,#555)" }}>
                    <div className="highlight-caption">
                      <span className="highlight-eyebrow">highlight</span>
                      <h2>ชื่อเนื้อหาหลัก — ใช้บน /home</h2>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Block>

        {/* ─────────────────── 8 · USER ↔ ADMIN MAPPING ─────────────────── */}
        <Block id="mapping" title="8 · User ↔ Admin — Pattern Mapping" note="Token เดียวกัน, density ต่างกัน. Admin compact กว่า, ไม่มีภาพขนาดใหญ่.">
          <div style={{ display: "grid", gap: 32 }}>
            {/* News */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>ข่าวสาร</p>
              <div className="sg-compare">
                <div className="sg-compare-side">
                  <p className="sg-compare-label">USER — ContentCard</p>
                  <div className="card-button" style={{ cursor: "default", maxWidth: 260 }}>
                    <ContentCard title="V2G Weekly Update" image="/images/v2g-logo.jpg" meta={<span>14 มิ.ย. 2026</span>} imageTags={["ข่าว"]}>
                      <p className="line-clamp two-line">เนื้อหาข่าวประจำสัปดาห์สำหรับสมาชิก</p>
                    </ContentCard>
                  </div>
                </div>
                <div className="sg-compare-divider">→</div>
                <div className="sg-compare-side">
                  <p className="sg-compare-label">ADMIN — admin-row</p>
                  <div className="list-panel" style={{ padding: 12, maxWidth: 320 }}>
                    <div className="admin-list">
                      <div className="admin-row admin-row-news">
                        <div className="row-summary row-summary-content">
                          <span className="row-thumb-placeholder" />
                          <div>
                            <strong>V2G Weekly Update</strong>
                            <p className="line-clamp two-line" style={{ fontSize: 12, margin: 0 }}>เนื้อหาข่าวประจำสัปดาห์</p>
                            <small>14/06/2026</small>
                          </div>
                        </div>
                        <Badge tone="green">Published</Badge>
                        <div className="row-actions">
                          <button type="button" className="btn btn-ghost btn-sm">✏</button>
                          <button type="button" className="btn btn-sm" style={{ background: "var(--error)", borderColor: "var(--error)" }}>🗑</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Events */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>กิจกรรม</p>
              <div className="sg-compare">
                <div className="sg-compare-side">
                  <p className="sg-compare-label">USER — Event card</p>
                  <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", overflow: "hidden", maxWidth: 260 }}>
                    <div style={{ height: 120, background: "linear-gradient(135deg,#111,#555)", position: "relative" }}>
                      <span className="card-image-tag" style={{ position: "absolute", top: 8, right: 8 }}>สัมมนา</span>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <strong style={{ fontSize: 14 }}>V2G Business Seminar</strong>
                      <p style={{ fontSize: 12, color: "var(--secondary)", margin: "4px 0 0" }}>📍 BITEC · 15 ก.ค. 2569</p>
                    </div>
                  </div>
                </div>
                <div className="sg-compare-divider">→</div>
                <div className="sg-compare-side">
                  <p className="sg-compare-label">ADMIN — admin-row-events</p>
                  <div className="list-panel" style={{ padding: 12, maxWidth: 320 }}>
                    <div className="admin-list">
                      <div className="admin-row admin-row-events">
                        <div className="row-summary row-summary-content">
                          <span className="row-thumb-placeholder" />
                          <div>
                            <strong>V2G Business Seminar</strong>
                            <div style={{ fontSize: 11, color: "var(--secondary)" }}>seminar · 2026-07-15 · BITEC</div>
                          </div>
                        </div>
                        <Badge tone="green">Published</Badge>
                        <div className="row-actions">
                          <button type="button" className="btn btn-ghost btn-sm">✏</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Learning */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>การเรียนรู้</p>
              <div className="sg-compare">
                <div className="sg-compare-side">
                  <p className="sg-compare-label">USER — Path card</p>
                  <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", overflow: "hidden", maxWidth: 260 }}>
                    <div style={{ height: 120, background: "linear-gradient(135deg,#1a1a1a,#444)" }} />
                    <div style={{ padding: "12px 14px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 14 }}>V2G Starter Path</strong>
                      <div style={{ height: 4, background: "var(--surface-container)", borderRadius: 2 }}>
                        <div style={{ width: "40%", height: "100%", background: "var(--primary)", borderRadius: 2 }} />
                      </div>
                      <small style={{ color: "var(--secondary)" }}>2 / 5 บทเรียน</small>
                    </div>
                  </div>
                </div>
                <div className="sg-compare-divider">→</div>
                <div className="sg-compare-side">
                  <p className="sg-compare-label">ADMIN — admin-row learning_paths</p>
                  <div className="list-panel" style={{ padding: 12, maxWidth: 320 }}>
                    <div className="admin-list">
                      <div className="admin-row">
                        <div className="row-summary row-summary-content">
                          <span className="row-thumb-placeholder" />
                          <div>
                            <strong>V2G Starter Path</strong>
                            <div style={{ fontSize: 11, color: "var(--secondary)" }}>Order: 1 · general</div>
                          </div>
                        </div>
                        <Badge tone="green">Published</Badge>
                        <div className="row-actions">
                          <button type="button" className="btn btn-ghost btn-sm">✏</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Block>

        {/* ─────────────────── 9 · ADMIN LAYOUT ─────────────────── */}
        <Block id="admin-layout" title="9 · Admin · Layout templates" note="ทุกหน้า Admin ใช้ AdminShell + AdminResourceManager. ห้าม inline โครงสร้างใหม่.">
          <div style={{ display: "grid", gap: 24 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Admin page anatomy</p>
              <div style={{
                border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)",
                background: "var(--surface-low)", padding: 16, fontSize: 12,
                display: "grid", gap: 2, maxWidth: 480,
              }}>
                {[
                  ["AdminShell", "allowed={[...roles]}", "bg: surface, auth guard"],
                  ["  TopNav", "admin={true} role={role}", "topbar sticky"],
                  ["  main.content-wrap", "", "max-width 1280px, padding"],
                  ["    AdminResourceManager", 'title="..." resource="..."', "CRUD panel"],
                  ["      .section-head", "", "eyebrow + h1 + Add button"],
                  ["      .toolbar", "", "search + filter"],
                  ["      .list-panel", "", "grouped by status"],
                  ["        .admin-row", "", "summary + badge + actions"],
                  ["    [ExtraPanel]", "", "Registrations, Broadcast, Reference…"],
                ].map(([el, props, note]) => (
                  <div key={el} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr", gap: 6, padding: "3px 0", borderBottom: "1px solid var(--outline-variant)" }}>
                    <code style={{ color: "var(--primary)", whiteSpace: "nowrap", fontSize: 11 }}>{el}</code>
                    <code style={{ color: "var(--secondary)", fontSize: 10, alignSelf: "center" }}>{props}</code>
                    <span style={{ color: "var(--secondary)", fontSize: 11 }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Admin section header — .section-head</p>
              <div className="admin-section" style={{ maxWidth: 480 }}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Content Management</p>
                    <h1>Events</h1>
                  </div>
                  <Button size="sm">+ Add</Button>
                </div>
              </div>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Metric cards — dashboard</p>
              <div className="metric-grid" style={{ maxWidth: 480 }}>
                {[["สมาชิก", "1,284"], ["คอนเทนต์", "342"], ["ยอดวิว", "58.1k"], ["กิจกรรม", "12"]].map(([label, value]) => (
                  <div className="metric-card panel" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Block>

        {/* ─────────────────── 10 · ADMIN ROWS ─────────────────── */}
        <Block id="admin-row" title="10 · Admin · Row variants" note="ทุก resource มี row variant ของตัวเอง. เพิ่มใน AdminResourceManager.tsx เท่านั้น.">
          <div style={{ display: "grid", gap: 20 }}>
            {[
              {
                label: "Content row (news / knowledge / profiles / events)",
                el: (
                  <div className="admin-row">
                    <div className="row-summary row-summary-content">
                      <span className="row-thumb-placeholder" style={{ width: 72, aspectRatio: "4/3" }} />
                      <div>
                        <strong>ชื่อเนื้อหา</strong>
                        <p className="line-clamp two-line" style={{ fontSize: 12, margin: 0, color: "var(--secondary)" }}>คำอธิบายย่อ 2 บรรทัด</p>
                        <small>14/06/2026</small>
                      </div>
                    </div>
                    <Badge tone="green">Published</Badge>
                    <div className="row-actions"><Button variant="ghost" size="sm">Preview</Button><Button variant="ghost" size="sm">Edit</Button><Button variant="danger" size="sm">Del</Button></div>
                  </div>
                ),
              },
              {
                label: "Users / Staff row — .row-summary-table",
                el: (
                  <div className="admin-row admin-row-users">
                    <div className="row-summary row-summary-table row-summary-users">
                      <strong data-label="Name">สมชาย มั่งมี</strong>
                      <span data-label="Phone">083XXX3333</span>
                      <span data-label="Membership" className="badge badge-neutral">platinum</span>
                      <span data-label="Upline">สมหญิง</span>
                    </div>
                    <div className="status-stack"><Badge tone="dark">Active</Badge></div>
                    <div className="row-actions"><Button variant="ghost" size="sm">Edit</Button></div>
                  </div>
                ),
              },
              {
                label: "Category row",
                el: (
                  <div className="admin-row">
                    <div className="row-summary row-summary-category"><strong>ธุรกิจ</strong></div>
                    <span className="category-status">Active</span>
                    <div className="row-actions"><Button variant="ghost" size="sm">Edit</Button><Button variant="danger" size="sm">Del</Button></div>
                  </div>
                ),
              },
            ].map(({ label, el }) => (
              <div key={label}>
                <p style={{ fontSize: 12, color: "var(--secondary)", marginBottom: 6 }}>{label}</p>
                <div className="list-panel" style={{ padding: 10 }}>
                  <div className="admin-list">{el}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* ─────────────────── 11 · MODAL ─────────────────── */}
        <Block id="modal" title="11 · Modal" note="ใช้ <Modal> component เสมอ. ห้าม custom dialog ใหม่.">
          <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
            <div style={{ border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <div className="modal-head">
                <strong>Modal title</strong>
                <button type="button" style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--secondary)" }}>✕</button>
              </div>
              <div style={{ padding: "18px 18px 10px" }}>
                <div className="form-grid" style={{ paddingBottom: 0 }}>
                  <label className="field">
                    <span>Field ซ้าย</span>
                    <input type="text" defaultValue="" placeholder="value..." />
                  </label>
                  <label className="field">
                    <span>Field ขวา</span>
                    <select defaultValue="general"><option>general</option><option>silver</option></select>
                  </label>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    <span>Full-width field</span>
                    <textarea rows={3} defaultValue="" placeholder="description..." />
                  </label>
                </div>
              </div>
              <div className="modal-foot">
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button variant="secondary" size="sm">Preview</Button>
                <Button size="sm">Save</Button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--secondary)" }}>
              กฎ: ปุ่มใน modal foot เรียง Cancel → Preview (ถ้ามี) → Save (primary ขวาสุด).{" "}
              Form 2-col grid ยกเว้น title/description/images/categories ที่ span full width.
            </p>
          </div>
        </Block>

        {/* ─────────────────── 12 · NAVIGATION ─────────────────── */}
        <Block id="nav" title="12 · Navigation" note="User ไม่มี nav bar ด้านข้าง. Admin ใช้ hamburger menu ขวาบน.">
          <div style={{ display: "grid", gap: 24 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Admin hamburger menu structure</p>
              <div style={{
                border: "1px solid var(--outline-variant)", background: "var(--surface)",
                borderRadius: "var(--radius)", padding: 12, maxWidth: 280, display: "grid", gap: 2,
              }}>
                {[
                  ["Analytics", "Admin only"],
                  ["── Content Management ──", "group label"],
                  ["  Knowledge", "Admin, Content"],
                  ["  News", "Admin, Content"],
                  ["  Profiles", "Admin, Content"],
                  ["  Categories", "Admin, Content"],
                  ["── Programs ──", "group label"],
                  ["  Events", "Admin, Content"],
                  ["  Learning", "Admin, Content"],
                  ["── User Management ──", "group label"],
                  ["  Users", "Admin, Account"],
                  ["  Staff", "Admin only"],
                  ["  Permissions", "Admin only"],
                  ["Account System ↗", "Admin, Account"],
                  ["Styleguide ↗", "Admin only"],
                  ["User Home ↗", "all"],
                  ["Logout", "all"],
                ].map(([item, role]) => (
                  <div key={item} style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", fontSize: 12 }}>
                    <span style={{ color: item.startsWith("──") ? "var(--secondary)" : "var(--on-background)", fontWeight: item.startsWith("──") ? 700 : 400, fontSize: item.startsWith("──") ? 10 : 12 }}>{item}</span>
                    <span style={{ color: "var(--outline)", fontSize: 10 }}>{role}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>User topbar — right side</p>
              <div style={{
                border: "1px solid var(--outline-variant)", background: "var(--surface)",
                borderRadius: "var(--radius)", padding: "10px 16px", display: "flex", gap: 12, alignItems: "center", maxWidth: 360,
              }}>
                <span style={{ fontSize: 12, color: "var(--secondary)" }}>📅 CalendarWidget</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span className="badge badge-dark" style={{ fontSize: 10 }}>PLATINUM</span>
                  <small style={{ color: "var(--secondary)", fontSize: 11 }}>083XXX3333</small>
                </div>
                <button type="button" className="topbar-logout">Logout</button>
              </div>
            </div>
          </div>
        </Block>

        {/* ─────────────────── 13 · MOTION ─────────────────── */}
        <Block id="motion" title="13 · Motion" note="transition 140ms linear. เข้าจอ rise-up. ห้าม bounce / สไลด์แรง / delay > 300ms.">
          <div className="sg-stack">
            <div>
              <div className="sg-row-demo">
                <div className="sg-radius" style={{ animation: "rise-up 0.4s ease both" }}>rise-up enter</div>
                <div className="sg-radius" style={{ animation: "loading-enter 0.18s ease both" }}>modal enter</div>
                <div className="sg-radius" style={{ animation: "shimmer 1.2s linear infinite", background: "linear-gradient(90deg,var(--surface-container) 25%,var(--surface) 40%,var(--surface-container) 70%)", backgroundSize: "240% 100%" }}>skeleton shimmer</div>
              </div>
            </div>
            <table style={{ borderCollapse: "collapse", fontSize: 12, maxWidth: 480 }}>
              <tbody>
                {[
                  ["--speed", "140ms", "button hover, border, color"],
                  ["rise-up", "0.4s ease", "card grid entrance"],
                  ["loading-enter", "0.18s ease", "modal / dropdown"],
                  ["shimmer", "1.2s linear ∞", "skeleton placeholder"],
                  ["loading-spin", "0.76s linear ∞", "spinner icon"],
                ].map(([name, dur, use]) => (
                  <tr key={name} style={{ borderTop: "1px solid var(--outline-variant)" }}>
                    <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 11 }}>{name}</td>
                    <td style={{ padding: "6px 10px", color: "var(--secondary)", fontSize: 11 }}>{dur}</td>
                    <td style={{ padding: "6px 10px", color: "var(--secondary)", fontSize: 12 }}>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>

        {/* ─────────────────── 14 · DOS & DONTS ─────────────────── */}
        <Block id="rules" title="14 · กฎที่ต้องจำ (Do / Don't)">
          <div style={{ display: "grid", gap: 10, maxWidth: 640 }}>
            {RULES.map(({ do: d, dont }) => (
              <DontBox key={d} do={d} dont={dont} />
            ))}
          </div>
        </Block>
      </main>

      {/* Sticky bottom back links */}
      <footer style={{
        position: "sticky", bottom: 0, background: "rgba(251,251,251,0.92)", backdropFilter: "blur(8px)",
        borderTop: "1px solid var(--outline-variant)", padding: "10px var(--margin-mobile)",
        display: "flex", gap: 8, justifyContent: "flex-end",
      }}>
        <a href="#" className="btn btn-ghost btn-sm">↑ ด้านบน</a>
        <Link className="btn btn-ghost btn-sm" href="/home">← User home</Link>
        <Link className="btn btn-ghost btn-sm" href="/admin/dashboard">← Admin</Link>
      </footer>
    </div>
  );
}

/* ─── helpers ─── */
function Block({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="sg-block" id={id}>
      <div className="section-head slim">
        <h2>{title}</h2>
        <a href={`#${id}`} style={{ color: "var(--outline)", fontSize: 12, textDecoration: "none" }}>#</a>
      </div>
      {note ? <p className="sg-note">{note}</p> : null}
      {children}
    </section>
  );
}

function DontBox({ do: doText, dont }: { do: string; dont: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ border: "1px solid #155724", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#155724", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>✓ Do</p>
        <p style={{ fontSize: 12, margin: 0 }}>{doText}</p>
      </div>
      <div style={{ border: "1px solid var(--error)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "var(--error)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>✕ Don&apos;t</p>
        <p style={{ fontSize: 12, margin: 0 }}>{dont}</p>
      </div>
    </div>
  );
}

/* ─── data ─── */
const NAV_ITEMS = [
  { id: "color", label: "สี" },
  { id: "type", label: "ตัวอักษร" },
  { id: "space", label: "ระยะห่าง" },
  { id: "button", label: "ปุ่ม" },
  { id: "badge", label: "Badge" },
  { id: "form", label: "ฟอร์ม" },
  { id: "card", label: "User Cards" },
  { id: "mapping", label: "User↔Admin" },
  { id: "admin-layout", label: "Admin Layout" },
  { id: "admin-row", label: "Admin Rows" },
  { id: "modal", label: "Modal" },
  { id: "nav", label: "Nav" },
  { id: "motion", label: "Motion" },
  { id: "rules", label: "กฎ" },
];

const COLOR_TOKENS = [
  { token: "--primary", hex: "#000000", label: "หลัก / ปุ่ม" },
  { token: "--on-background", hex: "#1a1c1c", label: "ตัวอักษร" },
  { token: "--secondary", hex: "#6b6b6b", label: "meta / label" },
  { token: "--outline", hex: "#9a9a9a", label: "hint text" },
  { token: "--outline-variant", hex: "#e4e4e4", label: "เส้น / border" },
  { token: "--background", hex: "#fbfbfb", label: "พื้นหลัง" },
  { token: "--surface", hex: "#ffffff", label: "card / modal" },
  { token: "--surface-low", hex: "#f6f6f6", label: "input bg" },
  { token: "--surface-container", hex: "#f1f1f1", label: "badge / tag bg" },
  { token: "--surface-high", hex: "#e9e9e9", label: "hover state" },
  { token: "--success", hex: "#155724", label: "published / done" },
  { token: "--error", hex: "#ba1a1a", label: "error / danger" },
];

const RULES = [
  { do: "ใช้ CSS token (--primary, --surface ฯลฯ) เสมอ", dont: "ห้าม hard-code สีเช่น #000, rgba(0,0,0,...) โดยตรง" },
  { do: "ใช้ <Button variant> และ <Badge tone> จาก components/ui", dont: "ห้ามสร้าง button หรือ badge ด้วย inline style หรือ className ใหม่" },
  { do: "Admin page ต้องห่อด้วย <AdminShell allowed={[...]}> เสมอ", dont: "ห้าม check session หรือทำ redirect ด้วยตัวเองใน page" },
  { do: "ฟอร์มใน modal ใช้ .form-grid 2-col, field ยาวใช้ gridColumn: '1/-1'", dont: "ห้ามจัด layout ฟอร์มด้วย flex หรือ grid inline นอก .form-grid" },
  { do: "เพิ่ม ResourceType, canAccessResource, resourceToSheet ทุกครั้งที่เพิ่ม resource ใหม่", dont: "ห้ามเพิ่ม route API admin โดยไม่ map permission และ sheet" },
  { do: "ใช้ rise-up 0.4s สำหรับ card grid, loading-enter 0.18s สำหรับ modal", dont: "ห้ามใส่ animation ที่ duration > 400ms หรือใช้ bounce" },
  { do: "ใส่ publishable={false} เมื่อ resource ไม่มี status (users, admins, categories)", dont: "ห้ามปล่อย default publishable=true บน resource ที่ไม่มี publish flow" },
];
