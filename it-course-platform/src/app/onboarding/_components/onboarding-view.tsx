'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, BookOpen, ChevronRight } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';

const GOALS = [
  { id: 'frontend', label: 'Frontend', icon: '⚡', desc: 'React, Vue, TypeScript...' },
  { id: 'backend', label: 'Backend', icon: '⚙️', desc: 'Node.js, Java, Python...' },
  { id: 'fullstack', label: 'Fullstack', icon: '🔗', desc: 'Cả hai hướng' },
  { id: 'data', label: 'Data & AI', icon: '📊', desc: 'SQL, Python, ML...' },
  { id: 'devops', label: 'DevOps', icon: '🚀', desc: 'Docker, K8s, CI/CD...' },
  { id: 'mobile', label: 'Mobile', icon: '📱', desc: 'React Native, Flutter...' },
];

const LEVELS = [
  { id: 'beginner', label: 'Mới bắt đầu', desc: 'Chưa biết lập trình' },
  { id: 'basic', label: 'Cơ bản', desc: 'Biết một số ngôn ngữ cơ bản' },
  { id: 'intermediate', label: 'Trung cấp', desc: 'Đã làm việc 1–3 năm' },
  { id: 'advanced', label: 'Nâng cao', desc: 'Kinh nghiệm 3+ năm' },
];

const SKILLS = [
  'HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Node.js',
  'Python', 'Java', 'SQL', 'PostgreSQL', 'Docker', 'Git',
  'MongoDB', 'Redis', 'GraphQL', 'REST API',
];

export function OnboardingView() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [knownSkills, setKnownSkills] = useState<Set<string>>(new Set(['HTML/CSS', 'JavaScript']));
  const router = useRouter();

  function toggleSkill(s: string) {
    setKnownSkills((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  const steps = [
    {
      title: 'Mục tiêu học tập',
      subtitle: 'Bạn muốn trở thành gì?',
      content: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all hover:shadow-md"
              style={{
                borderColor: goal === g.id ? 'var(--primary)' : 'var(--border)',
                background: goal === g.id ? 'var(--primary-light)' : 'var(--card)',
              }}
            >
              <span className="text-3xl">{g.icon}</span>
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{g.label}</span>
              <span className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>{g.desc}</span>
              {goal === g.id && <CheckCircle size={16} className="text-blue-600" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Trình độ hiện tại',
      subtitle: 'Bạn đang ở cấp độ nào?',
      content: (
        <div className="space-y-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left hover:shadow-md"
              style={{
                borderColor: level === l.id ? 'var(--primary)' : 'var(--border)',
                background: level === l.id ? 'var(--primary-light)' : 'var(--card)',
              }}
            >
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{l.label}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{l.desc}</p>
              </div>
              {level === l.id && <CheckCircle size={18} className="text-blue-600 shrink-0" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Kỹ năng bạn đã có',
      subtitle: 'Chọn những gì bạn đã biết',
      content: (
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSkill(s)}
              className="px-3 py-1.5 rounded-full border-2 text-sm transition-all"
              style={{
                borderColor: knownSkills.has(s) ? 'var(--primary)' : 'var(--border)',
                background: knownSkills.has(s) ? 'var(--primary)' : 'var(--card)',
                color: knownSkills.has(s) ? '#fff' : 'var(--foreground)',
              }}
            >
              {knownSkills.has(s) && '✓ '}{s}
            </button>
          ))}
          <p className="w-full text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
            Đã chọn: {knownSkills.size} kỹ năng
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            Skill<span className="text-blue-600">Path</span>
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 32 : 16,
                background: i <= step ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="border rounded-2xl p-8" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <p className="text-xs font-semibold text-blue-600 mb-1">Bước {step + 1} / {steps.length}</p>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--foreground)' }}>
            {steps[step].title}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {steps[step].subtitle}
          </p>

          {steps[step].content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm hover:underline"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Bỏ qua
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Btn variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Quay lại
              </Btn>
            )}
            {step < steps.length - 1 ? (
              <Btn
                variant="primary"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 0 && !goal) ||
                  (step === 1 && !level)
                }
              >
                Tiếp theo <ChevronRight size={14} />
              </Btn>
            ) : (
              <Btn variant="accent" onClick={() => router.push('/')}>
                Xem lộ trình của tôi ✨
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
