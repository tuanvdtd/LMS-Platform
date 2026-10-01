import { api } from '@/lib/api/client';
import type { CurriculumResponse, ItemType, UpdateItemPayload } from '@/types/curriculum';

// API khung chương trình (spec 2026-10-01-curriculum-upload §4.2). Mọi mutation trả cây mới + checklist.
const base = (courseId: string) => `/instructor/courses/${courseId}`;
const tree = (req: Promise<{ data: CurriculumResponse }>) => req.then((r) => r.data);

export const getCurriculum = (courseId: string) => tree(api.get(`${base(courseId)}/curriculum`));

export const addSection = (courseId: string, title: string) =>
  tree(api.post(`${base(courseId)}/sections`, { title }));

export const renameSection = (courseId: string, sectionId: string, title: string) =>
  tree(api.patch(`${base(courseId)}/sections/${sectionId}`, { title }));

export const deleteSection = (courseId: string, sectionId: string) =>
  tree(api.delete(`${base(courseId)}/sections/${sectionId}`));

export const moveSection = (courseId: string, sectionId: string, index: number) =>
  tree(api.post(`${base(courseId)}/sections/${sectionId}/move`, { index }));

export const addItem = (courseId: string, sectionId: string, type: ItemType, title: string) =>
  tree(api.post(`${base(courseId)}/sections/${sectionId}/items`, { type, title }));

export const updateItem = (courseId: string, itemId: string, body: UpdateItemPayload) =>
  tree(api.patch(`${base(courseId)}/items/${itemId}`, body));

export const deleteItem = (courseId: string, itemId: string) => tree(api.delete(`${base(courseId)}/items/${itemId}`));

export const moveItem = (courseId: string, itemId: string, sectionId: string, index: number) =>
  tree(api.post(`${base(courseId)}/items/${itemId}/move`, { sectionId, index }));

export const setContent = (courseId: string, itemId: string, assetId: string) =>
  tree(api.put(`${base(courseId)}/items/${itemId}/content`, { assetId }));

export const removeContent = (courseId: string, itemId: string) =>
  tree(api.delete(`${base(courseId)}/items/${itemId}/content`));

export const addResource = (courseId: string, itemId: string, assetId: string) =>
  tree(api.post(`${base(courseId)}/items/${itemId}/resources`, { assetId }));

export const removeResource = (courseId: string, resourceId: string) =>
  tree(api.delete(`${base(courseId)}/resources/${resourceId}`));
