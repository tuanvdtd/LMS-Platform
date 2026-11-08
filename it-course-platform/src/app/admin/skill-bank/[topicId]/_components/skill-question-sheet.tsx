'use client';

import { useState } from 'react';
import axios from 'axios';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/alert';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createSkillQuestion, updateSkillQuestion } from '@/lib/api/skill-bank';
import { DIFFICULTY_LABEL } from '@/lib/skills';
import type { QuestionPayload, QuizQuestion } from '@/types/curriculum';
import type { AdminSkillQuestion, SkillDifficulty } from '@/types/skills';
import { QuestionForm } from '../../../../instructor/(manage)/courses/[id]/manage/_components/curriculum/question-form';

const DIFFICULTIES = (Object.keys(DIFFICULTY_LABEL) as SkillDifficulty[]).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }));

const toQuizQuestion = (q: AdminSkillQuestion): QuizQuestion => ({
  id: q.id,
  position: 0,
  type: q.type,
  stem: q.stem,
  relatedItemId: null,
  answerCount: q.answerCount,
  options: q.options.map((o, i) => ({ id: o.id, position: i, content: o.content, isCorrect: o.isCorrect, explanation: o.explanation })),
});

// question: null = câu mới. Đóng sheet thì unmount form (key theo câu) để lần mở sau không giữ dữ liệu cũ.
export function SkillQuestionSheet({
  open,
  onOpenChange,
  topicId,
  question,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  question: AdminSkillQuestion | null;
  onSaved: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{question ? 'Sửa câu' : 'Câu mới'}</SheetTitle>
          <SheetDescription className="sr-only">Soạn câu hỏi cho ngân hàng kỹ năng.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {open && <SheetBody key={question?.id ?? 'new'} topicId={topicId} question={question} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  topicId,
  question,
  onClose,
  onSaved,
}: {
  topicId: string;
  question: AdminSkillQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [difficulty, setDifficulty] = useState<SkillDifficulty>(question?.difficulty ?? 'medium');
  const changed = !!question && difficulty !== question.difficulty;

  async function save(body: QuestionPayload) {
    try {
      const payload = { ...body, difficulty };
      if (question) await updateSkillQuestion(question.id, payload);
      else await createSkillQuestion(topicId, payload);
    } catch (e) {
      const code = axios.isAxiosError(e) ? e.response?.data?.code : undefined;
      toast.error(code === 'SKILL_TYPE_LOCKED' ? 'Không đổi được loại của câu đã lưu' : 'Lưu thất bại, thử lại');
      return false;
    }
    toast.success(question ? 'Đã lưu câu hỏi' : 'Đã thêm câu hỏi');
    onSaved();
    onClose();
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel id="skill-difficulty">Độ khó</FieldLabel>
        <Select items={DIFFICULTIES} value={difficulty} onValueChange={(v) => v && setDifficulty(v as SkillDifficulty)}>
          <SelectTrigger className="w-full sm:w-48" aria-labelledby="skill-difficulty">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {changed && (
          <Alert>
            <TriangleAlert />
            Đổi độ khó sẽ đưa R của câu về mốc của nhãn mới và xoá thống kê lượt trả lời.
          </Alert>
        )}
      </Field>
      <QuestionForm
        question={question ? toQuizQuestion(question) : undefined}
        locked={false}
        title={question ? 'Sửa câu' : 'Câu mới'}
        actions={null}
        after={null}
        onSave={save}
        onSkip={() => {}}
        dirty={changed}
      />
    </div>
  );
}
