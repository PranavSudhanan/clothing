import type { Metadata } from "next";
import { WishlistView } from "@/components/store/cart-page";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="mb-10 text-4xl md:text-6xl">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
