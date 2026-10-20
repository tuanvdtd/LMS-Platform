import { api } from '@/lib/api/client';
import type { Lecture, LearnOutline, Note, ProgressResult } from '@/types/learn';

// API khung học + bài giảng (spec 2026-10-20-lecture-player §6). Chỉ gọi từ client component.
const base = (slug: string) => `/learn/${encodeURIComponent(slug)}`;
const data = <T>(req: Promise<{ data: T }>) => req.then((r) => r.data);

export const getOutline = (slug: string) => data<LearnOutline>(api.get(base(slug)));

export const setLastItem = (slug: string, itemId: string) =>
  api.put(`${base(slug)}/last-item`, { itemId }).then(() => undefined);

export const getLecture = (slug: string, itemId: string) => data<Lecture>(api.get(`${base(slug)}/lectures/${itemId}`));

export const sendProgress = (slug: string, itemId: string, body: { positionSec: number; buckets: number[] }) =>
  data<ProgressResult>(api.post(`${base(slug)}/lectures/${itemId}/progress`, body));

export const completeLecture = (slug: string, itemId: string) =>
  data<ProgressResult>(api.post(`${base(slug)}/lectures/${itemId}/complete`));

export const getResourceUrl = (slug: string, resourceId: string) =>
  data<{ url: string }>(api.get(`${base(slug)}/resources/${resourceId}`)).then((r) => r.url);

export const listNotes = (slug: string, itemId: string) => data<Note[]>(api.get(`${base(slug)}/lectures/${itemId}/notes`));

export const createNote = (slug: string, itemId: string, body: { positionSec: number; body: string }) =>
  data<Note>(api.post(`${base(slug)}/lectures/${itemId}/notes`, body));

export const updateNote = (slug: string, noteId: string, body: string) =>
  data<Note>(api.patch(`${base(slug)}/notes/${noteId}`, { body }));

export const deleteNote = (slug: string, noteId: string) =>
  api.delete(`${base(slug)}/notes/${noteId}`).then(() => undefined);
