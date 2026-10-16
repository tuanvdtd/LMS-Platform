'use client';

import type { ComponentProps } from 'react';

// cacheComponents ẩn trang đã rời bằng <Activity> (display:none) nên video vẫn phát tiếng.
// Cleanup của callback ref chạy khi trang bị ẩn (docs preserving-ui-state) → dừng video.
export function PausingVideo(props: Omit<ComponentProps<'video'>, 'ref'>) {
  return <video ref={(v) => () => v?.pause()} {...props} />;
}
