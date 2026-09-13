import { redirect } from "next/navigation";

export type FlashType = "success" | "error" | "info";

export function redirectWithFlash(path: string, type: FlashType, message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
