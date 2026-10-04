import { useCallback, useEffect, useRef, useState } from "react";

// Runs `fn` on mount (and whenever `deps` change) and exposes loading/error/data.
// `reload()` re-runs it, e.g. after a mutation.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current().then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (error) => !cancelled && setState({ data: null, error, loading: false })
    );
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(run, [run, ...deps]);
  return { ...state, reload: run };
}
