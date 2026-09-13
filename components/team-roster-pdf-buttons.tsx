"use client";

import { useState } from "react";
import type { TeamRosterExport } from "@/lib/team-roster";
import { pdfFileName } from "@/lib/team-roster";
import { Button } from "@/components/ui/button";

type Props = {
  roster?: TeamRosterExport;
  allRosters?: TeamRosterExport[];
  tournamentName?: string;
  layout?: "inline" | "stack";
};

export function TeamRosterPdfButtons({ roster, allRosters, tournamentName, layout = "inline" }: Props) {
  const [busy, setBusy] = useState(false);
  const stack = layout === "stack";

  async function run(action: () => void | Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  async function loadPdf() {
    return await import("@/lib/team-roster-pdf");
  }

  return (
    <div className={stack ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
      {roster && (
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className={stack ? "w-full" : undefined}
            onClick={() =>
              run(async () => {
                const pdf = await loadPdf();
                pdf.downloadTeamRosterPdf(roster);
              })
            }
          >
            Download PDF
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className={stack ? "w-full" : undefined}
            onClick={() =>
              run(async () => {
                const pdf = await loadPdf();
                const blob = pdf.buildTeamRosterPdfBlob(roster);
                const shared = await pdf.sharePdfBlob(blob, pdfFileName(roster), `${roster.teamName} roster`);
                if (!shared) pdf.downloadTeamRosterPdf(roster);
              })
            }
          >
            Share PDF
          </Button>
        </>
      )}
      {allRosters && allRosters.length > 0 && tournamentName && (
        <>
          <Button
            type="button"
            disabled={busy}
            className={stack ? "w-full" : undefined}
            onClick={() =>
              run(async () => {
                const pdf = await loadPdf();
                pdf.downloadAllTeamsRosterPdf(tournamentName, allRosters);
              })
            }
          >
            Download all teams (PDF)
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className={stack ? "w-full" : undefined}
            onClick={() =>
              run(async () => {
                const pdf = await loadPdf();
                const blob = pdf.buildAllTeamsRosterPdfBlob(allRosters);
                const name = `${tournamentName.replace(/\s+/g, "-")}-all-teams.pdf`;
                const shared = await pdf.sharePdfBlob(blob, name, `${tournamentName} — all teams`);
                if (!shared) pdf.downloadAllTeamsRosterPdf(tournamentName, allRosters);
              })
            }
          >
            Share all teams (PDF)
          </Button>
        </>
      )}
    </div>
  );
}
