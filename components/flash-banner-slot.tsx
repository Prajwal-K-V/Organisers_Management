import { Suspense } from "react";
import { FlashBanner } from "@/components/flash-banner";

export function FlashBannerSlot() {
  return (
    <Suspense fallback={null}>
      <FlashBanner />
    </Suspense>
  );
}
