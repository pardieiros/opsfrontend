import React from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import ImageWall from "../../assets/imagewall.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-brand-500/20 via-brand-400/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-gradient-to-tl from-indigo-400/25 via-cyan-300/15 to-transparent blur-3xl dark:from-indigo-500/20 dark:via-cyan-500/10" />
      <div className="flex min-h-screen flex-col lg:grid lg:h-screen lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-0">
          {children}
        </div>
        <div className="relative min-h-[220px] sm:min-h-[280px] shrink-0 lg:min-h-0 lg:h-full">
          <img
            src={ImageWall}
            alt=""
            className="h-full min-h-[220px] sm:min-h-[280px] w-full object-cover lg:min-h-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15" />
          <div className="absolute inset-0 flex flex-col justify-end items-center p-8 pb-10 text-white md:p-12 md:pb-14 lg:p-14">
            <div className="w-full max-w-lg flex flex-col items-center text-center space-y-4">
              <div className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/75">
                <span className="h-px w-8 bg-white/50" />
                Plásticos Dão OPS
                <span className="h-px w-8 bg-white/50" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight drop-shadow-md">
                Coordinate shifts, production, and shop-floor tasks in one place.
              </h2>
              <p className="text-white/85 text-sm md:text-base max-w-md">
                Secure worker access with role-based permissions and traceability for every critical
                operation.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md text-xs md:text-sm pt-1">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 md:p-3.5 space-y-1 text-left">
                  <div className="text-xs text-white/60">Floor uptime</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-semibold">99.9%</span>
                    <span className="text-[11px] text-emerald-200">target</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 md:p-3.5 space-y-1 text-left">
                  <div className="text-xs text-white/60">Active workers</div>
                  <div className="text-xl md:text-2xl font-semibold">24/7</div>
                  <div className="text-[11px] text-white/70">Shift coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}
