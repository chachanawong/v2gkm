"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/Cards";
import { announcements, categories, googleConfig, learning, permissions, profiles, staff, users } from "@/lib/data";

const contentTabs = [["Announcement", announcements], ["Learning", learning], ["Profile", profiles]];

function StatusList({ title, items }) {
  return <div className="panel-muted stack-sm"><h4>{title}</h4>{items.length ? items.map((item) => <p className="meta" key={item.id}>{item.title || item.name}</p>) : <p className="meta">No items</p>}</div>;
}

function PasswordField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return <div className="field password-field"><label>{label}</label><input type={visible ? "text" : "password"} value={value} onChange={onChange} /><button type="button" onClick={() => setVisible((next) => !next)}>{visible ? "Hide" : "Show"}</button></div>;
}

function StaffCreateForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword && password !== confirmPassword;
  return (
    <form className="admin-form">
      {["Name", "Email"].map((label) => <div className="field" key={label}><label>{label}</label><input type={label === "Email" ? "email" : "text"} /></div>)}
      <div className="field"><label>Role</label><select><option>Content Staff</option><option>Account Staff</option><option>Admin</option></select></div>
      <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <PasswordField label="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      <div className="actions wide"><button className="button" type="button" disabled={Boolean(mismatch)}>Create staff</button>{mismatch ? <span className="form-error">Passwords must match</span> : null}</div>
    </form>
  );
}

function ContentManager({ type, items }) {
  const isLearning = type === "Learning";
  const isProfile = type === "Profile";
  return (
    <article className="admin-block" id={type.toLowerCase()}>
      <div className="admin-block-head"><div><p className="eyebrow">Content Management</p><h3>{type}</h3></div><button className="button" type="button">Create</button></div>
      <form className="admin-form">
        <div className="field"><label>{isProfile ? "Name" : "Title"}</label><input placeholder={isProfile ? "Profile name" : "Content title"} /></div>
        {isProfile ? <div className="field"><label>Pin</label><input inputMode="numeric" placeholder="0000" /></div> : null}
        <div className="field"><label>Visibility</label><select><option>All members</option><option>General</option><option>Silver</option><option>Platinum</option><option>Admin</option></select></div>
        {isLearning ? <><div className="field wide"><label>Youtube URL</label><input placeholder="https://www.youtube.com/watch?v=..." /></div><div className="field wide"><label>Categories drag and drop</label><div className="drag-list">{categories.slice(0, 5).map((category) => <span className="badge" draggable key={category}>{category}</span>)}</div></div></> : null}
        {!isProfile ? <><div className="field"><label>Publish Time</label><input type="datetime-local" /></div><div className="field"><label>Publish until</label><input type="datetime-local" /></div></> : null}
        {!isLearning ? <div className="field wide"><label>Image upload {isProfile ? "(4:3 vertical only)" : "(4:3 horizontal and vertical)"}</label><input type="file" accept="image/*" /></div> : null}
        <div className="field wide"><label>{isProfile ? "BIO" : "Description"}</label><textarea rows="4" /></div>
        <div className="actions wide"><button className="button" type="button">Publish</button><button className="button secondary" type="button">Save draft</button><button className="button ghost" type="button">Preview</button></div>
      </form>
      <div className="field"><label>Search tab</label><input placeholder={`Search ${type.toLowerCase()}`} /></div>
      <div className="grid grid-3"><StatusList title="Published list" items={items.filter((item) => item.status === "Published")} /><StatusList title="Unpublished list" items={items.filter((item) => item.status === "Unpublished")} /><StatusList title="Draft list" items={items.filter((item) => item.status === "Draft")} /></div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const totalViews = learning.reduce((sum, item) => sum + item.views, 0);
  const staffByRole = ["Content Staff", "Account Staff", "Admin"];
  return (
    <>
      <Header active="/admin/dashboard" admin />
      <main className="shell admin-shell">
        <section className="home-hero"><div><p className="eyebrow">Admin Backend</p><h1 className="section-title">Dashboard</h1><p className="muted">Google Sheet DB: {googleConfig.sheetId} · Google Drive: {googleConfig.driveFolderId}</p></div><div className="grid grid-4"><StatCard label="Users" value={users.length} /><StatCard label="Announcements" value={announcements.length} /><StatCard label="Learning Views" value={totalViews} /><StatCard label="Profiles" value={profiles.length} /></div></section>
        <section id="content" className="admin-section"><div className="section-head"><div><p className="eyebrow">Group 1</p><h2 className="section-title">Content Management</h2></div><div className="drag-list">{["Announcement", "Learning", "Profile", "Categories"].map((label) => <span className="badge" key={label}>{label}</span>)}</div></div>{contentTabs.map(([type, items]) => <ContentManager type={type} items={items} key={type} />)}<article className="admin-block" id="categories"><div className="admin-block-head"><div><p className="eyebrow">Content Management</p><h3>Categories Management</h3></div><button className="button" type="button">Create category</button></div><div className="drag-list">{categories.map((category) => <span className="badge" draggable key={category}>{category}</span>)}</div></article></section>
        <section id="users" className="admin-section"><div className="section-head"><div><p className="eyebrow">Group 2</p><h2 className="section-title">User Management</h2></div></div><article className="admin-block"><div className="admin-block-head"><h3>User</h3><button className="button" type="button">Create user</button></div><form className="admin-form">{["Name", "Phone", "Pin", "Upline Platinum"].map((label) => <div className="field" key={label}><label>{label}</label><input /></div>)}<div className="field"><label>Membership</label><select><option>General</option><option>Silver</option><option>Platinum</option></select></div><div className="actions wide"><button className="button" type="button">Create</button></div></form><div className="field"><label>Search tab</label><input placeholder="Search user" /></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Membership</th><th>Upline Platinum</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.phone}</td><td>{user.membership}</td><td>{user.uplinePlatinum}</td><td><button className="text-button">Edit</button> <button className="text-button danger">Delete</button></td></tr>)}</tbody></table></div></article><article className="admin-block" id="staff"><div className="admin-block-head"><h3>Admin</h3><button className="button" type="button">Create staff</button></div><StaffCreateForm /><div className="field"><label>Search tab</label><input placeholder="Search staff" /></div><div className="grid grid-3">{staffByRole.map((role) => <StatusList title={role} items={staff.filter((item) => item.role === role)} key={role} />)}</div></article></section>
        <section id="permissions" className="admin-section"><div className="section-head"><div><p className="eyebrow">Group 2</p><h2 className="section-title">Permission</h2></div></div><div className="table-wrap"><table><thead><tr><th>Role</th>{permissions.map((permission) => <th key={permission}>{permission}</th>)}</tr></thead><tbody>{staffByRole.map((role) => <tr key={role}><td>{role}</td>{permissions.map((permission, index) => <td key={permission}><input type="checkbox" defaultChecked={role === "Admin" || index < 3} /></td>)}</tr>)}</tbody></table></div></section>
        <section className="admin-section"><div className="admin-links"><a className="button" href="https://v2gcenter.up.railway.app" target="_blank" rel="noreferrer">Account System</a><a className="button secondary" href="/dashboard">User Home</a><a className="button ghost" href="/login">Logout</a></div></section>
      </main>
    </>
  );
}
