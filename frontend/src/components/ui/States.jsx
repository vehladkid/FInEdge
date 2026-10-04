export const Loading = ({ label = "Loading…" }) => (
  <p role="status" className="mt-8 text-sm text-slate-400">
    {label}
  </p>
);

export const ErrorMessage = ({ error, onRetry }) => (
  <div role="alert" className="mt-8 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
    {error?.message ?? "Something went wrong."}
    {onRetry && (
      <button onClick={onRetry} className="ml-3 underline hover:text-white">
        Retry
      </button>
    )}
  </div>
);

export const Empty = ({ children }) => <p className="mt-4 text-sm text-slate-400">{children}</p>;

export const fieldClass =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none";
export const labelClass = "mb-1 block text-sm font-medium text-slate-300";
export const primaryButton =
  "rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white";
