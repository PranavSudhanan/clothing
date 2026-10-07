import { Mail, MapPin, Phone } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import { getSiteConfig, TAGS } from "@/lib/data";
import { NewsletterForm } from "./forms";
import { SmartLink } from "./ui";

const SOCIAL_PATHS: Record<string, string> = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-9.6a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z",
  facebook:
    "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.2-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9z",
  youtube:
    "M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.400A2.5 2.5 0 002.4 7.2C2 8.8 2 12 2 12s0 3.2.400 4.8a2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5.2 3-5.2 3z",
  x: "M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z",
};

function SocialIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d={SOCIAL_PATHS[name]} />
    </svg>
  );
}

export async function Footer() {
  "use cache";
  cacheTag(TAGS.site);
  cacheLife("hours");

  const { general, navigation } = await getSiteConfig();
  const year = new Date().getFullYear();
  const socials = (["instagram", "facebook", "youtube", "x"] as const)
    .map((name) => ({ name, href: general[name] }))
    .filter((s) => s.href);

  return (
    <footer className="mt-auto" style={{ background: "var(--t-footer-bg)", color: "var(--t-footer-fg)" }}>
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <p className="heading text-3xl tracking-[0.08em]">{general.storeName}</p>
          {navigation.footerAbout && <p className="mt-5 max-w-sm text-sm leading-relaxed opacity-70">{navigation.footerAbout}</p>}
          <ul className="mt-6 space-y-2.5 text-sm opacity-80">
            {general.address && (
              <li className="flex gap-3">
                <MapPin size={16} strokeWidth={1.4} className="mt-0.5 shrink-0" />
                <span>{general.address}</span>
              </li>
            )}
            {general.phone && (
              <li className="flex gap-3">
                <Phone size={16} strokeWidth={1.4} className="mt-0.5 shrink-0" />
                <a href={`tel:${general.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {general.phone}
                </a>
              </li>
            )}
            {general.email && (
              <li className="flex gap-3">
                <Mail size={16} strokeWidth={1.4} className="mt-0.5 shrink-0" />
                <a href={`mailto:${general.email}`} className="hover:underline">
                  {general.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-5">
          {navigation.footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] opacity-60">{column.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.label + link.href}>
                    <SmartLink href={link.href} className="opacity-85 transition-opacity hover:opacity-100 hover:underline">
                      {link.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="md:col-span-3">
          {navigation.footerNewsletter && (
            <>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] opacity-60">Newsletter</p>
              <p className="mb-4 mt-5 text-sm opacity-80">New collections and private fittings, straight to your inbox.</p>
              <NewsletterForm compact />
            </>
          )}
          {socials.length > 0 && (
            <div className="mt-8 flex gap-4">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="opacity-70 transition-opacity hover:opacity-100"
                >
                  <SocialIcon name={social.name} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-current/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs opacity-60 sm:flex-row">
          <p>
            © {year} {general.storeName}. All rights reserved.
          </p>
          {navigation.footerBottom && <p>{navigation.footerBottom}</p>}
        </div>
      </div>
    </footer>
  );
}
