'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileQuestion, TriangleAlert, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiMessage } from '@/lib/api/checkout';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { answerAttempt, getAttempt, getSkills, startAttempt } from '@/lib/api/skills';
import type { AttemptState, SkillTopic } from '@/types/skills';
import { AssessmentIntro, AssessmentIntroSkeleton, BACK_LINK } from './assessment-intro';
import { AssessmentResult } from './assessment-result';
import { AssessmentRunner } from './assessment-runner';

type Intro = {
  state: 'intro';
  topic: SkillTopic;
  nextAvailableAt: string | null;
  resume: { deadlineMs: number; offsetMs: number } | null;
};
// offsetMs: giờ server − giờ máy lúc nhận trạng thái này (bù lệch đồng hồ cho đếm ngược).
type Attempt = { topic: SkillTopic; s: AttemptState; offsetMs: number };
type View =
  | { state: 'loading' }
  | { state: 'missing' }
  | { state: 'error' }
  | Intro
  | ({ state: 'attempt' } & Attempt);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const offsetOf = (s: AttemptState) => (s.state === 'question' ? Date.parse(s.now) - Date.now() : 0);

export function AssessmentView({ topicSlug }: { topicSlug: string }) {
  const [view, setView] = useState<View>({ state: 'loading' });
  const [busy, setBusy] = useState(false);
  const [expireFailed, setExpireFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const topic = (await getSkills()).topics.find((t) => t.slug === topicSlug);
        if (cancelled) return;
        if (!topic) return setView({ state: 'missing' });
        // Lượt dở: lấy deadline thật từ server để hiện "còn m:ss".
        let resume: Intro['resume'] = null;
        if (topic.inProgressAttemptId) {
          const cur = await getAttempt(topic.inProgressAttemptId).catch(() => null);
          if (cancelled) return;
          if (cur?.state === 'question') resume = { deadlineMs: Date.parse(cur.deadlineAt), offsetMs: offsetOf(cur) };
        }
        setView({ state: 'intro', topic, nextAvailableAt: topic.nextAvailableAt, resume });
      } catch {
        if (!cancelled) setView({ state: 'error' });
      }
    })();
    return () => { cancelled = true; };
  }, [topicSlug, nonce]);

  const show = useCallback((topic: SkillTopic, s: AttemptState) => {
    setView({ state: 'attempt', topic, s, offsetMs: offsetOf(s) });
    window.scrollTo({ top: 0 });
  }, []);

  async function start(intro: Intro) {
    setBusy(true);
    try {
      show(intro.topic, await startAttempt(topicSlug));
    } catch (e) {
      if (apiErrorCode(e) === 'SKILL_COOLDOWN') {
        const at = (e as { response?: { data?: { nextAvailableAt?: unknown } } }).response?.data?.nextAvailableAt;
        setView({ ...intro, nextAvailableAt: typeof at === 'string' ? at : intro.nextAvailableAt, resume: null });
      } else {
        toast.error(apiMessage(e));
      }
    } finally {
      setBusy(false);
    }
  }

  async function answer(cur: Attempt, optionIds: string[]) {
    if (cur.s.state !== 'question') return;
    setBusy(true);
    try {
      show(cur.topic, await answerAttempt(cur.s.attemptId, { questionId: cur.s.question.id, optionIds }));
    } catch (e) {
      const code = apiErrorCode(e);
      // Câu đã đổi (giảng viên sửa) hoặc gửi đôi → nạp lại trạng thái thật, không để kẹt.
      if (code === 'SKILL_STALE_QUESTION' || code === 'SKILL_BAD_OPTION') {
        try {
          show(cur.topic, await getAttempt(cur.s.attemptId));
          toast.info('Câu hỏi đã được cập nhật, đây là câu hiện tại');
        } catch (e2) {
          toast.error(apiMessage(e2));
        }
      } else {
        toast.error(apiMessage(e));
      }
    } finally {
      setBusy(false);
    }
  }

  // Hết giờ: lấy kết quả. Server chốt theo giờ của nó nên thử lại vài lần nếu còn báo "question".
  async function expire(cur: Attempt) {
    if (cur.s.state !== 'question') return;
    setExpireFailed(false);
    for (let i = 0; i < 6; i++) {
      try {
        const next = await getAttempt(cur.s.attemptId);
        if (next.state === 'result') return show(cur.topic, next);
      } catch (e) {
        toast.error(apiMessage(e));
        break;
      }
      await sleep(1500);
    }
    setExpireFailed(true); // runner hiện nút "Thử lại" gọi lại hàm này
  }

  if (view.state === 'loading') return <AssessmentIntroSkeleton />;
  if (view.state === 'missing') {
    return (
      <StateMessage icon={FileQuestion} title="Topic này chưa có bài đánh giá">
        <Link href="/skills" className={buttonVariants()}>{BACK_LINK}</Link>
      </StateMessage>
    );
  }
  if (view.state === 'error') {
    return (
      <StateMessage icon={TriangleAlert} title="Không tải được bài đánh giá">
        <Button onClick={() => { setView({ state: 'loading' }); setNonce((n) => n + 1); }}>Thử lại</Button>
        <Link href="/skills" className={buttonVariants({ variant: 'outline' })}>{BACK_LINK}</Link>
      </StateMessage>
    );
  }
  if (view.state === 'intro') {
    return (
      <AssessmentIntro topic={view.topic} nextAvailableAt={view.nextAvailableAt} resume={view.resume} starting={busy} onStart={() => start(view)} />
    );
  }
  if (view.s.state === 'result') return <AssessmentResult result={view.s} />;
  return (
    <AssessmentRunner
      key={view.s.attemptId}
      state={view.s}
      offsetMs={view.offsetMs}
      busy={busy}
      onAnswer={(ids) => answer(view, ids)}
      expireFailed={expireFailed}
      onExpire={() => expire(view)}
    />
  );
}

function StateMessage({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </main>
  );
}
