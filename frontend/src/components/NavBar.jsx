import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/budget", label: "Budgets" },
  { to: "/analytics", label: "Analytics" },
  { to: "/add-transaction", label: "Add Transaction" },
];

export default function NavBar() {
  const location = useLocation();

  return (
    <header className="border-b border-slate-800/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-xl font-bold tracking-tight text-white">
          FinEdge
        </Link>

        <div className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition ${
                location.pathname === link.to
                  ? "text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <input
            type="text"
            placeholder="Search..."
            readOnly
            className="hidden rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-400 placeholder:text-slate-500 focus:outline-none sm:block"
          />

          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Logout
          </Link>

          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white"
            title="Profile"
          >
            U
          </span>
        </div>
      </nav>
    </header>
  );
}
