'use client';

import { ServerErrorContent } from '@/components/shared/server-error-content';

export default function StudentError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ServerErrorContent error={error} retry={retry} />;
}
