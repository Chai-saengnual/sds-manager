import { Suspense } from 'react';
import { SdsFormPage } from './sds-form-page';

export default function NewSdsPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SdsFormPage mode="create" />
    </Suspense>
  );
}
