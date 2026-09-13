"use client";

import Link from "next/link";
import { useState } from "react";
import { createOrganizer, toggleOrganizerActiveForm } from "@/app/actions/admin";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { TableWrap } from "@/components/table-wrap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Profile } from "@/types/database";

export function AdminOrganizersManager({ organizers }: { organizers: Profile[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <ListToolbar title="Organizers" count={organizers.length} addLabel="Create organizer" onAdd={() => setOpen(true)} />
      </Card>

      {!organizers.length ? (
        <EmptyState
          title="No organizers"
          description="Create an organizer account to assign tournaments."
          action={<Button type="button" onClick={() => setOpen(true)}>+ Create organizer</Button>}
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {organizers.map((org) => (
              <li key={org.id}>
                <Card className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/admin/organizers/${org.id}`} className="font-semibold text-[var(--primary)] hover:underline">
                        {org.full_name || "—"}
                      </Link>
                      <p className="text-sm text-[var(--muted)]">{org.email}</p>
                    </div>
                    <Badge variant={org.is_active ? "success" : "muted"}>{org.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <form action={toggleOrganizerActiveForm}>
                    <input type="hidden" name="organizer_id" value={org.id} />
                    <input type="hidden" name="is_active" value={String(!org.is_active)} />
                    <Button type="submit" variant="secondary" className="w-full">
                      {org.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
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
                    <th>Email</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <Link href={`/admin/organizers/${org.id}`} className="font-medium text-[var(--primary)] hover:underline">
                          {org.full_name || "—"}
                        </Link>
                      </td>
                      <td>{org.email}</td>
                      <td>
                        <Badge variant={org.is_active ? "success" : "muted"}>{org.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td>
                        <form action={toggleOrganizerActiveForm}>
                          <input type="hidden" name="organizer_id" value={org.id} />
                          <input type="hidden" name="is_active" value={String(!org.is_active)} />
                          <Button type="submit" variant="secondary" className="text-xs">
                            {org.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create organizer" description="Requires service role key in environment.">
        <form action={createOrganizer} className="space-y-4" onSubmit={() => setOpen(false)}>
          <FieldGroup className="!grid-cols-1">
            <Field label="Full name" name="full_name" placeholder="Jane Doe" />
            <Field label="Email" name="email" type="email" required placeholder="organizer@club.com" />
            <Field label="Temporary password" name="password" type="password" required placeholder="Min. 8 characters" hint="Share securely" />
          </FieldGroup>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
