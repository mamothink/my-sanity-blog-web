// src/components/SidebarCard.tsx
import type { ReactNode } from "react";

export type SidebarCardProps = {
  title: string;
  children: ReactNode;
};

export default function SidebarCard({ title, children }: SidebarCardProps) {
  return (
    <section
      className="group rounded-3xl border border-indigo-50 bg-white/95 p-6 shadow-md shadow-indigo-100 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}
