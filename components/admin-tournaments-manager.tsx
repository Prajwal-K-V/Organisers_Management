"use client";

import { useState } from "react";
import { createTournament } from "@/app/actions/admin";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { TableWrap } from "@/components/table-wrap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Profile, Tournament } from "@/types/database";

type Row = Tournament & { organizerLabel: string };

export function AdminTournamentsManager({
  tournaments,
  organizers,
}: {
  tournaments: Row[];
  organizers: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const [open, setOpen] = useState(false);
  const canCreate = organizers.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <ListToolbar
          title="Tournaments"
          count={tournaments.length}
          addLabel="Create tournament"
          onAdd={() => setOpen(true)}
        />
      </Card>

      {!tournaments.length ? (
        <EmptyState
          title="No tournaments"
          description={canCreate ? "Create a tournament and assign it to an organizer." : "Activate an organizer first."}
          action={
            canCreate ? (
              <Button type="button" onClick={() => setOpen(true)}>+ Create tournament</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Card className="space-y-2">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-[var(--muted)]">{t.organizerLabel}</p>
                  <Badge variant="accent">{t.status}</Badge>
                </Card>
              </li>
            ))}
          </ul>
          <Card className="hidden md:block">
            <TableWrap>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Organizer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.name}</td>
                      <td>{t.organizerLabel}</td>
                      <td><Badge variant="accent">{t.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create tournament"
        description="Organizers cannot create events themselves."
      >
        {!canCreate ? (
          <p className="text-sm text-[var(--muted)]">Activate an organizer before creating tournaments.</p>
        ) : (
          <form action={createTournament} className="space-y-4" onSubmit={() => setOpen(false)}>
            <Field label="Tournament name" name="name" required placeholder="Ratyotsava Cup 2026" />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Organizer</span>
              <select name="organizer_id" required className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm" defaultValue="">
                <option value="" disabled>Select organizer</option>
                {organizers.map((o) => (
                  <option key={o.id} value={o.id}>{o.full_name || o.email}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <SubmitButton pendingLabel="Creating…">Save tournament</SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
