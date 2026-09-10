// The panel style repeated across the dashboard, analytics, budget and form screens.
//
// ponytail: only this one primitive is extracted. The landing page's panels use a
// different radius and background and the budget modal is opaque, so forcing them
// through Card would mean prop-driven variants for two one-off cases.
export default function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl border border-edge bg-panel/60 p-6 ${className}`}>
      {children}
    </div>
  );
}
