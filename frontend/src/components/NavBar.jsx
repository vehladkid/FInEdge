import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budget", label: "Budgets" },
  { to: "/categories", label: "Categories" },
  { to: "/analytics", label: "Analytics" },
  { to: "/add-transaction", label: "Add Transaction" },
];

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-slate-800/80">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-6 py-5">
        <Link to="/" className="text-xl font-bold tracking-tight text-white">FinEdge</Link>

        <button className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 md:hidden" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>

        <div id="nav-links" className={`${open ? "flex" : "hidden"} w-full flex-col gap-3 md:flex md:w-auto md:flex-row md:items-center md:gap-6`}>
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)} aria-current={location.pathname === link.to ? "page" : undefined}
              className={`text-sm font-medium transition ${location.pathname === link.to ? "text-white" : "text-slate-300 hover:text-white"}`}>
              {link.label}
            </Link>
          ))}
          <button onClick={signOut} className="text-left text-sm font-medium text-slate-300 transition hover:text-white">Logout</button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white" title={user?.email} aria-label={`Signed in as ${user?.name}`}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        </div>
      </nav>
    </header>
  );
}
