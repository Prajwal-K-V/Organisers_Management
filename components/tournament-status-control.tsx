import { updateTournamentStatus } from "@/app/actions/organizer";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import type { TournamentStatus } from "@/types/database";

const LABELS: Record<TournamentStatus, string> = {
  draft: "Draft — still setting up teams and players",
  published: "Live — auction and finance are active",
  completed: "Completed — event finished",
};

export function TournamentStatusControl({
  tournamentId,
  status,
}: {
  tournamentId: string;
  status: TournamentStatus;
}) {
  return (
    <div className="space-y-3">
      <Badge variant={status === "published" ? "success" : status === "completed" ? "muted" : "accent"}>
        {status}
      </Badge>
      <p className="text-sm text-[var(--muted)]">{LABELS[status]}</p>
      {status === "draft" ? (
        <form action={updateTournamentStatus.bind(null, tournamentId)}>
          <input type="hidden" name="status" value="published" />
          <SubmitButton className="w-full sm:w-auto" pendingLabel="Publishing…">
            Publish tournament
          </SubmitButton>
        </form>
      ) : null}
      {status === "published" ? (
        <form action={updateTournamentStatus.bind(null, tournamentId)}>
          <input type="hidden" name="status" value="completed" />
          <SubmitButton variant="secondary" className="w-full sm:w-auto" pendingLabel="Saving…">
            Mark as completed
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
