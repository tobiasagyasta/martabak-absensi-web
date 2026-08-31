import { ChefHat } from "lucide-react";
import { COLORS } from "./constants";

export function AppShell({ children, isDashboardPage, toast }) {
  return (
    <div
      style={{
        background: COLORS.cream,
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        color: COLORS.ink,
        paddingBottom: 40,
      }}
    >
      <GlobalStyles />
      <Header />
      <main className={`${isDashboardPage ? "max-w-3xl" : "max-w-md"} mx-auto px-4 mt-4`}>{children}</main>
      {toast && <Toast message={toast} />}
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      .ticket { position: relative; background: white; border: 1px solid ${COLORS.line}; border-radius: 14px; }
      .ticket::before, .ticket::after {
        content: ''; position: absolute; width: 16px; height: 16px;
        background: ${COLORS.cream}; border-radius: 50%; top: 50%; margin-top: -8px;
      }
      .ticket::before { left: -9px; }
      .ticket::after { right: -9px; }
      .ticket-divider { border-top: 2px dashed ${COLORS.line}; }
      .display-font { font-family: 'Space Grotesk', sans-serif; }
      .mono-font { font-family: 'JetBrains Mono', monospace; }
      input:focus, select:focus, textarea:focus { outline: 2px solid ${COLORS.amber}; outline-offset: 1px; }
    `}</style>
  );
}

function Header() {
  return (
    <div style={{ background: COLORS.espresso }} className="px-4 pt-6 pb-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div style={{ background: COLORS.amber }} className="rounded-xl p-2 flex items-center justify-center">
            <ChefHat size={22} color={COLORS.espresso} />
          </div>
          <div>
            <h1 className="display-font font-bold uppercase leading-none" style={{ color: COLORS.cream, fontSize: 18, letterSpacing: 0.5 }}>
              Martabak Pecenongan 78
            </h1>
            <p className="mono-font" style={{ color: COLORS.amber, fontSize: 11, marginTop: 3 }}>
              sistem absensi dapur · 10 outlet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicTabs({ tab, setTab, tabs }) {
  return (
    <div className="max-w-md mx-auto px-4 -mt-3 mb-4">
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: COLORS.espressoLight }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: active ? COLORS.amber : "transparent", color: active ? COLORS.espresso : COLORS.cream }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Section({ title, eyebrow }) {
  return (
    <div className="mb-4">
      {eyebrow && <p className="mono-font uppercase" style={{ color: COLORS.amberDark, fontSize: 11, letterSpacing: 1 }}>{eyebrow}</p>}
      {title && <h2 className="display-font font-bold" style={{ fontSize: 18, color: COLORS.ink }}>{title}</h2>}
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg" style={{ background: COLORS.espresso, color: COLORS.cream, maxWidth: "90%" }}>
      {message}
    </div>
  );
}
