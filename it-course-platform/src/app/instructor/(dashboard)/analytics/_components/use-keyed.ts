'use client';

import { useCallback, useEffect, useState } from 'react';

// Tải dữ liệu theo key (id khoá, id quiz…). Kết quả gắn với key nên đổi khoá không hiện nhầm số của khoá cũ;
// reload giữ số cũ trên màn tới khi có số mới. load phải là hàm ổn định (khai ở cấp module).
// keepPrevious: đổi trang / bộ lọc thì vẫn hiện dữ liệu cũ (loading = true) thay vì nháy skeleton.
export function useKeyed<T>(key: string | null, load: (key: string) => Promise<T>, opts?: { keepPrevious?: boolean }) {
  const [state, setState] = useState<{ key: string; data?: T; error?: true } | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!key) return;
    let alive = true;
    load(key).then(
      (data) => {
        if (alive) setState({ key, data });
      },
      () => {
        if (alive) setState({ key, error: true });
      },
    );
    return () => {
      alive = false;
    };
  }, [key, load, version]);
  const current = state && state.key === key ? state : null;
  const shown = current ?? (opts?.keepPrevious ? state : null);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: shown?.data ?? null, error: !!current?.error, loading: !!key && !current, reload };
}
