"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils";

/** Status tabs + search box for admin list pages. State lives in the URL so links are shareable. */
export function ListFilters({
  basePath,
  status,
  q,
  tabs,
  placeholder,
}: {
  basePath: string;
  status: string;
  q: string;
  tabs: { value: string; label: string; count?: number }[];
  placeholder: string;
}) {
  const router = useRouter();

  const href = (nextStatus: string, nextQ: string) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextQ) params.set("q", nextQ);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(href(status, value));
  }

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={href(tab.value, q)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              status === tab.value ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className={cn("ml-1.5 text-xs", status === tab.value ? "text-zinc-300" : "text-zinc-400")}>{tab.count}</span>}
          </Link>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2.5 md:w-72">
        <Search size={15} className="shrink-0 text-zinc-400" />
        <input name="q" defaultValue={q} key={q} placeholder={placeholder} aria-label="Search" className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none" />
      </form>
    </div>
  );
}
