import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/store/cart-drawer";
import { Footer } from "@/components/store/footer";
import { Announcement, Header } from "@/components/store/header";
import { StoreProviders, type SiteContextValue } from "@/components/store/providers";
import { ThemeStyle } from "@/components/store/theme-style";
import { getSiteConfig } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { general, seo } = await getSiteConfig();
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    metadataBase: base ? new URL(base) : undefined,
    title: { default: seo.title || general.storeName, template: `%s — ${general.storeName}` },
    description: seo.description,
    openGraph: {
      type: "website",
      siteName: general.storeName,
      title: seo.title || general.storeName,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    icons: general.faviconUrl ? { icon: general.faviconUrl } : undefined,
  };
}

function WhatsAppButton({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.100-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.700 2.3.700 3.2.600.5-.1 1.5-.6 1.7-1.2.200-.6.2-1.1.200-1.2-.1-.1-.3-.2-.5-.3z" />
      </svg>
    </a>
  );
}

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const { general, commerce, theme, navigation } = await getSiteConfig();

  const site: SiteContextValue = {
    storeName: general.storeName,
    whatsapp: general.whatsapp,
    commerce: {
      currency: commerce.currency,
      locale: commerce.locale,
      shippingFlat: commerce.shippingFlat,
      freeShippingAbove: commerce.freeShippingAbove,
      taxRate: commerce.taxRate,
      taxInclusive: commerce.taxInclusive,
      deliveryNote: commerce.deliveryNote,
      returnsNote: commerce.returnsNote,
    },
    card: {
      cardAlign: theme.cardAlign,
      cardQuickAdd: theme.cardQuickAdd,
      cardHoverImage: theme.cardHoverImage,
      cardSwatches: theme.cardSwatches,
    },
  };

  return (
    <>
      <ThemeStyle theme={theme} />
      <StoreProviders site={site}>
        <div className="store">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
          >
            Skip to content
          </a>
          {navigation.announcementEnabled && <Announcement messages={navigation.announcements} />}
          <Header
            storeName={general.storeName}
            logoUrl={general.logoUrl}
            logoHeight={general.logoHeight}
            nav={navigation.header}
            layout={theme.headerLayout}
            sticky={theme.headerSticky}
            showSearch={theme.headerSearch}
            showWishlist={theme.headerWishlist}
          />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton number={general.whatsapp} />
        </div>
      </StoreProviders>
    </>
  );
}
