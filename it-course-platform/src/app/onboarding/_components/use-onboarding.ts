'use client';

import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getPopularTopics, getPreferences, updatePreferences } from '@/lib/api/preferences';
import type { Ref } from '@/types/instructor-course';
import type { LearnerLevel, Occupation, UpdatePreferencesPayload } from '@/types/preferences';

export const STEP_COUNT = 3;
type Step = 0 | 1 | 2;

// Toàn bộ logic wizard /onboarding (spec 2026-10-02-personalize-occupation §5.1); view chỉ render.
// 401 do interceptor của api chuyển /login?redirect=/onboarding — ở đây chỉ không toast.
export function useOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [occupation, setOccupation] = useState<Occupation | null>(null);
  const [topics, setTopics] = useState<Ref[]>([]);
  const [level, setLevel] = useState<LearnerLevel | null>(null);
  // Gắn kèm nghề để không hiện chip của nghề cũ khi đổi nghề / đang tải.
  const [popular, setPopular] = useState<{ occupation: Occupation; list: Ref[] } | null>(null);
  // Chưa đụng vào kỹ năng thì không gửi topicIds — tránh xoá danh sách cũ khi GET chưa về/lỗi.
  const [topicsTouched, setTopicsTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Điền sẵn lựa chọn cũ; lỗi thì bắt đầu với form trống.
  useEffect(() => {
    getPreferences()
      // Chỉ điền khi người dùng chưa kịp chọn gì (response về muộn không ghi đè lựa chọn mới).
      .then((p) => {
        setOccupation((o) => o ?? p.occupation);
        setTopics((t) => (t.length ? t : p.topics));
        setLevel((l) => l ?? p.level);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!occupation) return; // UI không có đường đưa occupation về null
    const ctrl = new AbortController();
    getPopularTopics(occupation, ctrl.signal)
      .then((list) => setPopular({ occupation, list }))
      .catch(() => !ctrl.signal.aborted && setPopular({ occupation, list: [] }));
    return () => ctrl.abort();
  }, [occupation]);

  const popularLoading = occupation !== null && popular?.occupation !== occupation;
  // Chip = topic phổ biến + topic đã chọn từ ô tìm mà không nằm trong danh sách phổ biến.
  const chips = useMemo(() => {
    const list = popular?.occupation === occupation ? popular.list : [];
    return [...list, ...topics.filter((t) => !list.some((p) => p.id === t.id))];
  }, [popular, occupation, topics]);
  const isSelected = (id: string) => topics.some((t) => t.id === id);
  const toggleTopic = (t: Ref) => {
    setTopicsTouched(true);
    setTopics((prev) => (prev.some((x) => x.id === t.id) ? prev.filter((x) => x.id !== t.id) : [...prev, t]));
  };

  const payloadOf = (s: Step): UpdatePreferencesPayload =>
    s === 0 ? { occupation } : s === 1 ? (topicsTouched ? { topicIds: topics.map((t) => t.id) } : {}) : level ? { level } : {};

  async function save(body: UpdatePreferencesPayload): Promise<boolean> {
    setSaving(true);
    try {
      await updatePreferences(body);
      return true;
    } catch (err) {
      if (!(isAxiosError(err) && err.response?.status === 401)) toast.error('Lưu thất bại, thử lại');
      return false;
    } finally {
      setSaving(false);
    }
  }

  const canNext = step !== 0 || occupation !== null;

  async function next() {
    if (!canNext || !(await save(payloadOf(step)))) return;
    if (step < 2) setStep((step + 1) as Step);
    else router.push('/');
  }

  const back = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));

  // Bước 3 "Bỏ qua": không gửi level.
  const skip = () => router.push('/');

  async function saveAndExit() {
    if (step === 0 && !occupation) return router.push('/');
    if (await save(payloadOf(step))) router.push('/');
  }

  return {
    step, occupation, setOccupation, level, setLevel, chips, popularLoading, isSelected, toggleTopic,
    saving, canNext, next, back, skip, saveAndExit,
  };
}
