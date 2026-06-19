import { Suspense } from 'react';
import { SdsFormPage } from '../../new/sds-form-page';

export default async function EditSdsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SdsFormPage mode="edit" id={id} />
    </Suspense>
  );
}
