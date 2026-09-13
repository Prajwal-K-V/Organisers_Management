import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { TeamRosterExport } from "@/lib/team-roster";
import { pdfFileName, squadSpend } from "@/lib/team-roster";

function renderRosterPage(doc: jsPDF, roster: TeamRosterExport, yStart = 14) {
  let y = yStart;
  doc.setFontSize(16);
  doc.text(roster.tournamentName, 14, y);
  y += 8;
  doc.setFontSize(13);
  doc.text(roster.teamName, 14, y);
  y += 10;

  doc.setFontSize(10);
  const spent = squadSpend(roster.players);
  const lines = [
    `Purse total: ${roster.purseTotal}`,
    `Spent on squad: ${spent}`,
    `Purse remaining: ${roster.purseRemaining}`,
    `Players: ${roster.players.length}`,
  ];
  for (const line of lines) {
    doc.text(line, 14, y);
    y += 5;
  }
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Code", "Name", "Role", "Base", "Sold"]],
    body: roster.players.length
      ? roster.players.map((p) => [
          p.playerCode,
          p.name,
          p.role,
          String(p.basePrice),
          p.soldPrice != null ? String(p.soldPrice) : "—",
        ])
      : [["—", "No players on this team yet", "", "", ""]],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [185, 28, 28] },
    margin: { left: 14, right: 14 },
  });
}

export function buildTeamRosterPdfBlob(roster: TeamRosterExport): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  renderRosterPage(doc, roster);
  return doc.output("blob");
}

export function buildAllTeamsRosterPdfBlob(rosters: TeamRosterExport[]): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  rosters.forEach((roster, index) => {
    if (index > 0) doc.addPage();
    renderRosterPage(doc, roster);
  });
  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTeamRosterPdf(roster: TeamRosterExport) {
  downloadBlob(buildTeamRosterPdfBlob(roster), pdfFileName(roster));
}

export function downloadAllTeamsRosterPdf(tournamentName: string, rosters: TeamRosterExport[]) {
  const safe = tournamentName.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 48);
  downloadBlob(buildAllTeamsRosterPdfBlob(rosters), `${safe || "tournament"}-all-teams.pdf`);
}

export async function sharePdfBlob(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  const file = new File([blob], filename, { type: "application/pdf" });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch {
    return false;
  }
}
