"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { authMetadataFromProfile } from "@/lib/auth-metadata";
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
  const { data: created, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      organizer_id: organizerId,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !created) redirectWithFlash(TOURNAMENTS_PATH, "error", error?.message ?? "Create failed.");

  const { error: linkError } = await supabase.from("tournament_organizers").insert({
    tournament_id: created.id,
    profile_id: organizerId,
    can_delete_ledger: true,
  });
  if (linkError && linkError.code !== "23505") {
    redirectWithFlash(TOURNAMENTS_PATH, "error", linkError.message);
  }

  redirectWithFlash(TOURNAMENTS_PATH, "success", `Tournament “${name}” created.`);
}

export async function assignTournamentOrganizer(formData: FormData) {
  await requireSuperAdmin();
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const organizerId = String(formData.get("organizer_id") ?? "");
  if (!tournamentId) redirectWithFlash(TOURNAMENTS_PATH, "error", "Tournament missing.");
  if (!organizerId) redirectWithFlash(TOURNAMENTS_PATH, "error", "Select an organizer.");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: organizer } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", organizerId)
    .eq("role", "organizer")
    .single();
  if (!organizer) redirectWithFlash(TOURNAMENTS_PATH, "error", "Organizer not found.");
  if (!organizer.is_active) {
    redirectWithFlash(TOURNAMENTS_PATH, "error", "Activate the organizer before assigning tournaments.");
  }

  const { error } = await supabase.from("tournament_organizers").insert({
    tournament_id: tournamentId,
    profile_id: organizerId,
  });
  if (error) {
    if (error.code === "23505") {
      redirectWithFlash(TOURNAMENTS_PATH, "error", "That organizer is already assigned to this tournament.");
    }
    redirectWithFlash(TOURNAMENTS_PATH, "error", error.message);
  }
  redirectWithFlash(TOURNAMENTS_PATH, "success", "Organizer added to tournament.");
}

export async function removeTournamentOrganizer(formData: FormData) {
  await requireSuperAdmin();
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const organizerId = String(formData.get("organizer_id") ?? "");
  if (!tournamentId || !organizerId) {
    redirectWithFlash(TOURNAMENTS_PATH, "error", "Tournament or organizer missing.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { count, error: countError } = await supabase
    .from("tournament_organizers")
    .select("profile_id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);
  if (countError) redirectWithFlash(TOURNAMENTS_PATH, "error", countError.message);
  if ((count ?? 0) <= 1) {
    redirectWithFlash(TOURNAMENTS_PATH, "error", "Each tournament must keep at least one organizer.");
  }

  const { error } = await supabase
    .from("tournament_organizers")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("profile_id", organizerId);
  if (error) redirectWithFlash(TOURNAMENTS_PATH, "error", error.message);
  redirectWithFlash(TOURNAMENTS_PATH, "success", "Organizer removed from tournament.");
}

export async function setTournamentOrganizerCanDeleteLedger(formData: FormData) {
  await requireSuperAdmin();
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const organizerId = String(formData.get("organizer_id") ?? "");
  const canDelete = String(formData.get("can_delete_ledger") ?? "") === "true";
  if (!tournamentId || !organizerId) {
    redirectWithFlash(TOURNAMENTS_PATH, "error", "Tournament or organizer missing.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("tournament_organizers")
    .update({ can_delete_ledger: canDelete })
    .eq("tournament_id", tournamentId)
    .eq("profile_id", organizerId);
  if (error) redirectWithFlash(TOURNAMENTS_PATH, "error", error.message);
  redirectWithFlash(
    TOURNAMENTS_PATH,
    "success",
    canDelete ? "Ledger delete enabled for organizer." : "Ledger delete disabled for organizer."
  );
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

  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(organizerId, {
      user_metadata: authMetadataFromProfile({ role: "organizer", is_active: isActive }),
    });
  } catch {
    // Profile updated; metadata sync is best-effort until next login.
  }

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
    if (!data.user) {
      redirectWithFlash(ORGANIZERS_PATH, "error", "User was not created. Try again.");
    }

    const userId = data.user.id;
    const profileEmail = data.user.email ?? email;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: profileEmail,
          full_name: fullName || null,
          role: "organizer",
          is_active: true,
        },
        { onConflict: "id" }
      )
      .select("id")
      .single();

    if (profileError || !profile) {
      redirectWithFlash(
        ORGANIZERS_PATH,
        "error",
        profileError?.message ?? "Account created but profile could not be saved. Contact support."
      );
    }

    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: fullName,
        ...authMetadataFromProfile({ role: "organizer", is_active: true }),
      },
    });

    revalidatePath(ORGANIZERS_PATH);
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
