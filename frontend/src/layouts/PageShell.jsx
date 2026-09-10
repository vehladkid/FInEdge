import NavBar from "../components/NavBar";

// The page frame (background, nav, centred main, heading) that Dashboard,
// Analytics, Budget and AddTransaction each repeated verbatim.
//
// `maxWidth` stays a prop because the screens genuinely differ — the charts need
// max-w-6xl, the budget list max-w-4xl, the form max-w-xl.
export default function PageShell({ title, maxWidth = "max-w-6xl", action, children }) {
  return (
    <div className="min-h-screen bg-surface font-sans text-slate-100">
      <NavBar />

      <main className={`mx-auto ${maxWidth} px-6 py-10`}>
        {action ? (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {action}
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        )}

        {children}
      </main>
    </div>
  );
}
