'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle, Circle, GripVertical, Plus, Trash2,
  Video, FileText, HelpCircle, Code2, Paperclip, Upload,
  DollarSign, SendHorizontal, AlertCircle
} from 'lucide-react';
import { courses } from '@/lib/mocks/data';
import { Btn, StatusBadge } from '@/components/shared/product-ui';

const SECTIONS = [
  { id: 'basic', label: 'Thông tin cơ bản', icon: FileText },
  { id: 'goals', label: 'Mục tiêu & Đối tượng', icon: CheckCircle },
  { id: 'skills', label: 'Kỹ năng', icon: Code2 },
  { id: 'curriculum', label: 'Chương trình học', icon: Video },
  { id: 'assessment', label: 'Bài test & Chứng chỉ', icon: HelpCircle },
  { id: 'pricing', label: 'Giá', icon: DollarSign },
  { id: 'submit', label: 'Gửi duyệt', icon: SendHorizontal },
];

const SECTION_DONE: Record<string, boolean> = {
  basic: true,
  goals: true,
  skills: true,
  curriculum: false,
  assessment: false,
  pricing: true,
  submit: false,
};

export default function CourseBuilder({ id, section = 'basic' }: { id?: string; section?: string }) {
  const course = id ? courses.find((c) => c.id === id) ?? courses[0] : courses[0];
  const isNew = !id || id === 'new';

  return (
    <div className="flex-1 flex overflow-hidden" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Builder sidebar */}
      <aside
        className="w-56 shrink-0 border-r overflow-y-auto"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            {isNew ? 'Khoá học mới' : course.title.slice(0, 28) + '…'}
          </p>
          {!isNew && <StatusBadge status={course.status} />}
        </div>
        <nav className="py-2">
          {SECTIONS.map(({ id: sid, label, icon: Icon }) => {
            const active = section === sid;
            const done = SECTION_DONE[sid];
            return (
              <Link
                key={sid}
                href={isNew ? `/instructor/courses/new?section=${sid}` : `/instructor/courses/${id}/edit?section=${sid}`}
                className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{
                  background: active ? 'var(--primary-light)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--foreground)',
                }}
              >
                {done ? (
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                ) : (
                  <Circle size={14} className="shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                )}
                <Icon size={14} className="shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {section === 'basic' && <SectionBasic course={course} />}
          {section === 'goals' && <SectionGoals course={course} />}
          {section === 'skills' && <SectionSkills course={course} />}
          {section === 'curriculum' && <SectionCurriculum course={course} />}
          {section === 'assessment' && <SectionAssessment />}
          {section === 'pricing' && <SectionPricing course={course} />}
          {section === 'submit' && <SectionSubmit course={course} />}
          {!['basic','goals','skills','curriculum','assessment','pricing','submit'].includes(section ?? '') && <SectionBasic course={course} />}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Basic ──────────────────────────────────────────────────────────
function SectionBasic({ course }: { course: typeof courses[0] }) {
  const [title, setTitle] = useState(course.title);
  const [subtitle, setSubtitle] = useState(course.subtitle);
  const [desc, setDesc] = useState(course.description);
  const [level, setLevel] = useState(course.level);
  const [lang, setLang] = useState('Tiếng Việt');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Thông tin cơ bản</h1>
        <Btn variant="primary" size="sm">Lưu</Btn>
      </div>

      <Field label="Tiêu đề khoá học" required>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
        <p className="text-xs mt-1 text-right" style={{ color: 'var(--muted-foreground)' }}>{title.length}/120</p>
      </Field>

      <Field label="Phụ đề" required>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={200}
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>

      <Field label="Mô tả khoá học" required>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={5}
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Track" required>
          <select
            defaultValue={course.track}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          >
            {['frontend', 'backend', 'fullstack', 'data', 'devops', 'mobile'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Trình độ" required>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          >
            <option value="beginner">Mới bắt đầu</option>
            <option value="basic">Cơ bản</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </Field>
      </div>

      <Field label="Ảnh bìa khoá học" required>
        <div className="flex gap-4 items-start">
          <Image src={course.thumbnail} alt="" width={128} height={80} className="w-32 h-20 object-cover rounded-lg shrink-0" />
          <div
            className="flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            <Upload size={18} style={{ color: 'var(--muted-foreground)' }} className="mb-1" />
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Upload ảnh 16:9 (750×422px+)</p>
          </div>
        </div>
      </Field>

      <Field label="Video giới thiệu (tuỳ chọn)">
        <div
          className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          <Video size={18} style={{ color: 'var(--muted-foreground)' }} className="mb-1" />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Upload video giới thiệu (mp4, tối đa 500MB)</p>
        </div>
      </Field>
    </div>
  );
}

// ─── Section: Goals ──────────────────────────────────────────────────────────
function SectionGoals({ course }: { course: typeof courses[0] }) {
  const [outcomes, setOutcomes] = useState(course.learningOutcomes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Mục tiêu & Đối tượng</h1>
        <Btn variant="primary" size="sm">Lưu</Btn>
      </div>

      <Field label="Học viên sẽ học được gì?" required hint="Tối thiểu 4 mục tiêu học tập">
        <div className="space-y-2">
          {outcomes.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={o}
                onChange={(e) => setOutcomes((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
              <button
                onClick={() => setOutcomes((prev) => prev.filter((_, j) => j !== i))}
                className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                aria-label="Xoá"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setOutcomes((prev) => [...prev, ''])}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <Plus size={14} /> Thêm mục tiêu
          </button>
        </div>
      </Field>

      <Field label="Yêu cầu tiên quyết">
        <textarea
          rows={3}
          defaultValue="Kiến thức JavaScript cơ bản (ES6+)\nHiểu biết về HTML/CSS"
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>

      <Field label="Khoá học này dành cho ai?">
        <textarea
          rows={3}
          defaultValue="Developer muốn nâng cao kỹ năng React\nSinh viên IT muốn học React từ nền tảng"
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>
    </div>
  );
}

// ─── Section: Skills ─────────────────────────────────────────────────────────
function SectionSkills({ course }: { course: typeof courses[0] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Kỹ năng</h1>
        <Btn variant="primary" size="sm">Lưu</Btn>
      </div>
      <Field label="Kỹ năng khoá học dạy" required hint="Chọn ≥1 tag kỹ năng. Học viên sẽ đạt được các kỹ năng này.">
        <div className="flex flex-wrap gap-2 mb-2">
          {course.skills.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
              {s.name}
              <button className="hover:text-red-500 transition-colors" aria-label={`Xoá ${s.name}`}>×</button>
            </span>
          ))}
        </div>
        <input
          placeholder="Tìm kiếm hoặc tạo tag kỹ năng mới..."
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>
      <Field label="Kỹ năng tiên quyết" hint="Học viên cần có kỹ năng này trước khi học khoá.">
        <div className="flex flex-wrap gap-2 mb-2">
          {course.prerequisites.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded-full">
              {s.name}
              <button className="hover:text-red-500 transition-colors" aria-label={`Xoá ${s.name}`}>×</button>
            </span>
          ))}
        </div>
        <input
          placeholder="Thêm kỹ năng tiên quyết..."
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>
    </div>
  );
}

// ─── Section: Curriculum ─────────────────────────────────────────────────────
function SectionCurriculum({ course }: { course: typeof courses[0] }) {
  const [chapters, setChapters] = useState(course.curriculum);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Chương trình học</h1>
        <Btn variant="primary" size="sm">Lưu</Btn>
      </div>

      <div className="space-y-3">
        {chapters.map((ch, ci) => (
          <div key={ch.id} className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {/* Chapter header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'var(--secondary)' }}>
              <GripVertical size={14} style={{ color: 'var(--muted-foreground)' }} className="cursor-grab" />
              <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Chương {ci + 1}</span>
              <input
                value={ch.title}
                onChange={(e) =>
                  setChapters((prev) => prev.map((c, i) => i === ci ? { ...c, title: e.target.value } : c))
                }
                className="flex-1 bg-transparent text-sm font-semibold outline-none"
                style={{ color: 'var(--foreground)' }}
              />
              <button
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
                onClick={() => setChapters((prev) => prev.filter((_, i) => i !== ci))}
              >
                Xoá
              </button>
            </div>

            {/* Lessons */}
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {ch.lessons.map((l) => {
                const LIcon = l.type === 'video' ? Video : l.type === 'quiz' ? HelpCircle : l.type === 'coding' ? Code2 : Paperclip;
                return (
                  <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 group">
                    <GripVertical size={12} style={{ color: 'var(--muted-foreground)' }} className="cursor-grab" />
                    <LIcon size={13} style={{ color: 'var(--muted-foreground)' }} />
                    <span className="flex-1 text-sm" style={{ color: 'var(--foreground)' }}>{l.title}</span>
                    <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
                      <input type="checkbox" defaultChecked={l.preview} className="accent-blue-600" />
                      Xem trước
                    </label>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Xoá bài">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add lesson */}
            <div className="px-4 py-2 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>+ Thêm:</span>
              {[
                { label: 'Video', icon: Video },
                { label: 'Bài đọc', icon: FileText },
                { label: 'Trắc nghiệm', icon: HelpCircle },
                { label: 'Bài code', icon: Code2 },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  <Icon size={11} /> {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          setChapters((prev) => [
            ...prev,
            { id: `ch-new-${Date.now()}`, title: 'Chương mới', lessons: [] },
          ])
        }
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        <Plus size={14} /> Thêm chương
      </button>
    </div>
  );
}

// ─── Section: Assessment ─────────────────────────────────────────────────────
function SectionAssessment() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Bài test cuối khoá & Chứng chỉ</h1>
        <Btn variant="primary" size="sm">Lưu</Btn>
      </div>
      <Field label="Bài test cuối khoá">
        <select
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        >
          <option>-- Chọn bài kiểm tra --</option>
          <option>Kiểm tra React Hooks (20 câu)</option>
          <option>Kiểm tra tổng hợp React (40 câu)</option>
        </select>
      </Field>
      <Field label="Điểm đạt (%)">
        <input
          type="number"
          defaultValue={70}
          min={0}
          max={100}
          className="w-32 border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>
      <Field label="Điều kiện cấp chứng chỉ">
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            <span style={{ color: 'var(--foreground)' }}>Hoàn thành ≥ 80% bài học</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            <span style={{ color: 'var(--foreground)' }}>Đạt bài test cuối khoá ≥ 70%</span>
          </label>
        </div>
      </Field>
      <Field label="Xem trước chứng chỉ">
        <div className="border rounded-xl p-4 text-center" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>🏆 Chứng chỉ hoàn thành</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Chứng nhận [Tên học viên] đã hoàn thành khoá học [Tên khoá] tại SkillPath
          </p>
        </div>
      </Field>
    </div>
  );
}

// ─── Section: Pricing ────────────────────────────────────────────────────────
function SectionPricing({ course }: { course: typeof courses[0] }) {
  const [price, setPrice] = useState(course.price);
  const [salePrice, setSalePrice] = useState(course.originalPrice);
  const platform = 0.3;
  const revenue = Math.round(price * (1 - platform));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Giá</h1>
        <Btn variant="primary" size="sm">Lưu</Btn>
      </div>

      <Field label="Giá bán (₫)" required>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>

      <Field label="Giá gốc / Giá khuyến mãi cũ (₫)">
        <input
          type="number"
          value={salePrice}
          onChange={(e) => setSalePrice(Number(e.target.value))}
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
      </Field>

      <div className="border rounded-xl p-4 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
        <p className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Dự kiến doanh thu</p>
        {[
          ['Giá bán', `${price.toLocaleString('vi-VN')}₫`],
          ['Phí nền tảng (30%)', `-${Math.round(price * platform).toLocaleString('vi-VN')}₫`],
          ['Bạn thực nhận', `${revenue.toLocaleString('vi-VN')}₫`],
        ].map(([l, v], i) => (
          <div key={l} className={`flex justify-between text-sm ${i === 2 ? 'font-bold border-t pt-2' : ''}`} style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: i === 2 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{l}</span>
            <span style={{ color: i === 2 ? 'var(--skill-strong)' : 'var(--foreground)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Submit ─────────────────────────────────────────────────────────
function SectionSubmit({ course }: { course: typeof courses[0] }) {
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const checks = [
    { label: 'Tiêu đề và mô tả đã đầy đủ', done: true },
    { label: 'Có ít nhất 5 bài học với video', done: true },
    { label: 'Ảnh bìa đã upload', done: true },
    { label: 'Đã chọn ít nhất 1 kỹ năng', done: true },
    { label: 'Giá đã thiết lập', done: true },
    { label: 'Bài test cuối khoá đã cấu hình', done: false },
  ];

  const allGood = checks.every((c) => c.done);

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Đã gửi duyệt!</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>
          SkillPath sẽ xem xét khoá học trong 3–5 ngày làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Gửi duyệt</h1>

      {course.status === 'rejected' && (
        <div className="border-2 border-red-300 rounded-xl p-4 bg-red-50 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 text-sm">Khoá học bị từ chối</p>
              <p className="text-xs text-red-600 mt-1">
                Lý do: Phần mô tả chưa đủ chi tiết. Vui lòng chỉnh sửa mục &quot;Thông tin cơ bản&quot; và gửi lại.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-xl p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Checklist trước khi gửi</h3>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            {c.done ? (
              <CheckCircle size={14} className="text-green-500 shrink-0" />
            ) : (
              <AlertCircle size={14} className="text-amber-500 shrink-0" />
            )}
            <span style={{ color: c.done ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{c.label}</span>
            {!c.done && (
              <span className="ml-auto text-xs text-amber-600 font-medium">Cần bổ sung</span>
            )}
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-blue-600"
        />
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          <strong>Tôi cam kết sở hữu bản quyền toàn bộ nội dung trong khoá học này</strong> và chịu trách nhiệm pháp lý nếu có vi phạm bản quyền.
        </span>
      </label>

      <Btn
        variant="primary"
        size="lg"
        disabled={!agreed || !allGood}
        onClick={() => setSubmitted(true)}
      >
        Gửi duyệt khoá học
      </Btn>
      {!allGood && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Vui lòng hoàn thành tất cả mục trong checklist trước khi gửi duyệt.
        </p>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>}
      {children}
    </div>
  );
}
