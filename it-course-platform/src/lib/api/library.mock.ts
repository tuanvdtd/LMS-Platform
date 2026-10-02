import { AxiosError, AxiosHeaders } from 'axios';
import type { FileUsage, LibraryFile, LibraryPage, LibraryQuery } from '@/types/library';
import { LIBRARY_PAGE_SIZE } from '@/types/library';

// Dữ liệu giả cho trang thư viện khi BE chưa có endpoint (xem library.ts). Giữ trong bộ nhớ trang.
const PY = { courseId: 'c-py', courseTitle: 'Lập trình Python từ số 0' };
const SQL = { courseId: 'c-sql', courseTitle: 'SQL cho người mới bắt đầu' };
const MB = 1024 ** 2;

const USAGES: Record<string, FileUsage[]> = {
  f04: [
    { ...PY, itemId: 'i1', sectionTitle: 'Phần 4: Cấu trúc dữ liệu', lectureTitle: 'Danh sách và từ điển' },
    { ...SQL, itemId: 'i2', sectionTitle: 'Phần 3: Tối ưu truy vấn', lectureTitle: 'Chỉ mục' },
  ],
  f05: [{ ...PY, itemId: 'i3', sectionTitle: 'Phần 1: Giới thiệu', lectureTitle: 'Biến và kiểu dữ liệu' }],
  f07: [{ ...PY, itemId: 'i4', sectionTitle: 'Phần 1: Giới thiệu', lectureTitle: 'Cài đặt môi trường' }],
  f08: [
    { ...PY, itemId: 'i5', sectionTitle: 'Phần 1: Giới thiệu', lectureTitle: 'Giới thiệu' },
    { ...SQL, itemId: 'i6', sectionTitle: 'Phần 1: Làm quen', lectureTitle: 'Giới thiệu khoá học' },
    { ...PY, itemId: 'i7', sectionTitle: 'Phần 6: Tổng kết', lectureTitle: 'Lộ trình tiếp theo' },
  ],
  f09: [{ ...PY, itemId: 'i8', sectionTitle: 'Phần 2: Điều khiển luồng', lectureTitle: 'Vòng lặp for và while' }],
  f11: [{ ...SQL, itemId: 'i9', sectionTitle: 'Phần 2: Truy vấn nhiều bảng', lectureTitle: 'JOIN' }],
};

const BASE: [string, LibraryFile['kind'], number, LibraryFile['status']?][] = [
  ['gioi-thieu-khoa-hoc.mp4', 'video', 512 * MB, 'processing'],
  ['slide-react-hooks.pdf', 'document', 3.1 * MB, 'failed'],
  ['tai-lieu-tham-khao-cau-truc-du-lieu-va-giai-thuat-nang-cao-phan-2.pdf', 'document', 48.6 * MB],
  ['bai-giang-03-bien-va-kieu-du-lieu.mp4', 'video', 1.2 * 1024 * MB],
  ['cheatsheet-git.pdf', 'document', 320 * 1024],
  ['setup-moi-truong-python-windows-mac-linux.pdf', 'document', 5.4 * MB],
  ['de-cuong-khoa-hoc.pdf', 'document', 210 * 1024],
  ['bai-tap-vong-lap.pdf', 'document', 860 * 1024],
  ['cheatsheet-sql.pdf', 'document', 412 * 1024],
  ['bai-tap-sql-join.pdf', 'document', 640 * 1024],
  ['ban-nhap-cu.pdf', 'document', 180 * 1024],
];

let files: LibraryFile[] = [
  ...BASE.map(([fileName, kind, size, status], i) => ({ fileName, kind, size, status, i })),
  // thêm 16 file cũ để có trang 2
  ...Array.from({ length: 16 }, (_, k) => ({ fileName: `bai-tap-tuan-${String(k + 1).padStart(2, '0')}.pdf`, kind: 'document' as const, size: (200 + k * 37) * 1024, status: undefined, i: 11 + k })),
].map(({ fileName, kind, size, status, i }) => {
  const id = `f${String(i + 2).padStart(2, '0')}`;
  return {
    id,
    kind,
    fileName,
    sizeBytes: Math.round(size),
    status: status ?? 'ready',
    createdAt: new Date(Date.UTC(2026, 9, 1) - i * 2 * 86_400_000).toISOString(),
    usageCount: USAGES[id]?.length ?? 0,
  };
});

const wait = (signal?: AbortSignal, ms = 400) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => (clearTimeout(t), reject(new DOMException('Aborted', 'AbortError'))));
  });

export async function listLibraryFiles(query: LibraryQuery, signal?: AbortSignal): Promise<LibraryPage> {
  await wait(signal);
  const q = query.q.trim().toLowerCase();
  const matched = files.filter((f) => f.fileName.toLowerCase().includes(q));
  const counts = {
    all: matched.length,
    used: matched.filter((f) => f.usageCount > 0).length,
    unused: matched.filter((f) => f.usageCount === 0).length,
    failed: matched.filter((f) => f.status === 'failed').length,
  };
  const filtered = matched
    .filter((f) => query.filter === 'all' || (query.filter === 'used' ? f.usageCount > 0 : query.filter === 'unused' ? f.usageCount === 0 : f.status === 'failed'))
    .sort((a, b) => (query.order === 'desc' ? -1 : 1) * a.createdAt.localeCompare(b.createdAt));
  const start = (query.page - 1) * LIBRARY_PAGE_SIZE;
  return {
    items: filtered.slice(start, start + LIBRARY_PAGE_SIZE),
    total: filtered.length,
    counts,
    totalBytes: files.reduce((s, f) => s + f.sizeBytes, 0),
  };
}

export async function getFileUsages(id: string, signal?: AbortSignal) {
  await wait(signal, 300);
  return USAGES[id] ?? [];
}

export async function deleteLibraryFile(id: string) {
  await wait();
  if (files.find((f) => f.id === id)?.usageCount) {
    const res = { status: 409, statusText: 'Conflict', data: {}, headers: {}, config: { headers: new AxiosHeaders() } };
    throw new AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, res);
  }
  files = files.filter((f) => f.id !== id);
}

export async function uploadToLibrary(file: File, { onProgress, signal }: { onProgress?: (p: number) => void; signal?: AbortSignal }) {
  for (let p = 0; p <= 100; p += 10) {
    await wait(signal, 150);
    onProgress?.(p);
  }
  files = [
    { id: crypto.randomUUID(), kind: 'document', fileName: file.name, sizeBytes: file.size, status: 'ready', createdAt: new Date().toISOString(), usageCount: 0 },
    ...files,
  ];
}
