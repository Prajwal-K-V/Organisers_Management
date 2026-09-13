"use server";

import { requireSuperAdmin } from "@/utils/supabase/utility/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirectWithFlash } from "@/lib/flash";

const ORGANIZERS_PATH = "/admin/organizers";
const TOURNAMENTS_PATH = "/admin/tournaments";

export async function createTournament(formData: FormData) {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const organizerId = String(formData.get("organizer_id") ?? "");
  if (!name) redirectWithFlash(TOURNAMENTS_PATH, "error", "Enter a tournament name.");
  if (!organizerId) redirectWithFlash(TOURNAMENTS_PATH, "error", "Select an organizer.");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("tournaments").insert({
    name,
    organizer_id: organizerId,
    status: "draft",
  });
  if (error) redirectWithFlash(TOURNAMENTS_PATH, "error", error.message);
  redirectWithFlash(TOURNAMENTS_PATH, "success", `Tournament “${name}” created.`);
}

export async function toggleOrganizerActiveForm(formData: FormData) {
  const organizerId = String(formData.get("organizer_id") ?? "");
  const isActive = String(formData.get("is_active") ?? "false") === "true";
  await toggleOrganizerActive(organizerId, isActive);
}

export async function toggleOrganizerActive(organizerId: string, isActive: boolean) {
  await requireSuperAdmin();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", organizerId)
    .eq("role", "organizer");
  if (error) redirectWithFlash(ORGANIZERS_PATH, "error", error.message);
  redirectWithFlash(ORGANIZERS_PATH, "success", isActive ? "Organizer activated." : "Organizer deactivated.");
}

export async function createOrganizer(formData: FormData) {
  await requireSuperAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) {
    redirectWithFlash(ORGANIZERS_PATH, "error", "Email and password are required.");
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) redirectWithFlash(ORGANIZERS_PATH, "error", error.message);

    if (data.user) {
      await admin.from("profiles").update({
        full_name: fullName || null,
        role: "organizer",
        is_active: true,
      }).eq("id", data.user.id);
    }
    redirectWithFlash(ORGANIZERS_PATH, "success", `Organizer ${email} created and activated.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const message = e instanceof Error ? e.message : "Failed to create organizer";
    redirectWithFlash(ORGANIZERS_PATH, "error", message);
  }
}

export async function updateOrganizerProfile(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", id)
    .eq("role", "organizer");
  if (error) redirectWithFlash(`${ORGANIZERS_PATH}/${id}`, "error", error.message);
  redirectWithFlash(`${ORGANIZERS_PATH}/${id}`, "success", "Profile updated.");
}
