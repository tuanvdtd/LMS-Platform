import type { Metadata } from 'next';
import Link from 'next/link';
import { Target, ArrowRight } from 'lucide-react';
import { demoStudent } from '@/lib/mocks/data';
import { SkillsCharts } from './_components/skills-charts';
import { SkillsList } from './_components/skills-list';

export const metadata: Metadata = { title: 'Hồ sơ năng lực | SkillPath' };

const SKILL_GRAPH_NODES = [
  { id: 'js-basics', label: 'JS Cơ bản', x: 10, y: 50, mastery: 88 },
  { id: 'js-async', label: 'JS Async', x: 30, y: 50, mastery: 72 },
  { id: 'react-basics', label: 'React Cơ bản', x: 50, y: 30, mastery: 65 },
  { id: 'react-hooks', label: 'React Hooks', x: 70, y: 30, mastery: 35 },
  { id: 'react-state', label: 'State Mgmt', x: 70, y: 60, mastery: 28 },
  { id: 'nextjs-routing', label: 'Next.js', x: 88, y: 30, mastery: 0 },
  { id: 'typescript', label: 'TypeScript', x: 50, y: 70, mastery: 55 },
];

const GRAPH_EDGES = [
  ['js-basics', 'js-async'],
  ['js-async', 'react-basics'],
  ['react-basics', 'react-hooks'],
  ['react-hooks', 'react-state'],
  ['react-hooks', 'nextjs-routing'],
  ['js-async', 'typescript'],
];

function skillColor(m: number) {
  return m < 40 ? '#ef4444' : m < 70 ? '#eab308' : '#22c55e';
}

export default function SkillsPage() {
  const student = demoStudent;

  const weakSkills = student.skills.filter((s) => s.mastery < 40).sort((a, b) => a.mastery - b.mastery);
  const midSkills = student.skills.filter((s) => s.mastery >= 40 && s.mastery < 70);
  const strongSkills = student.skills.filter((s) => s.mastery >= 70);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      {/* Summary */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--foreground)' }}>
            Hồ sơ năng lực
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Mục tiêu: Frontend Developer · Trình độ: Trung cấp
          </p>
        </div>
        <div className="md:ml-auto flex gap-4">
          {[
            { count: strongSkills.length, label: 'Kỹ năng vững', color: '#22c55e' },
            { count: midSkills.length, label: 'Đang học', color: '#eab308' },
            { count: weakSkills.length, label: 'Cần củng cố', color: '#ef4444' },
          ].map(({ count, label, color }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <SkillsCharts />

      {/* Skill roadmap graph */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>Sơ đồ lộ trình kỹ năng</h2>
        <div className="relative overflow-x-auto" style={{ height: 140 }}>
          <svg width="100%" height="140" style={{ minWidth: 600 }}>
            {/* Edges */}
            {GRAPH_EDGES.map(([from, to]) => {
              const a = SKILL_GRAPH_NODES.find((n) => n.id === from)!;
              const b = SKILL_GRAPH_NODES.find((n) => n.id === to)!;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={`${a.x}%`} y1={a.y} x2={`${b.x}%`} y2={b.y}
                  stroke="var(--border)" strokeWidth={2}
                />
              );
            })}
            {/* Nodes */}
            {SKILL_GRAPH_NODES.map((n) => {
              const color = n.mastery === 0 ? 'var(--border)' : skillColor(n.mastery);
              const textColor = n.mastery === 0 ? 'var(--muted-foreground)' : 'var(--foreground)';
              return (
                <g key={n.id} style={{ cursor: 'pointer' }}>
                  <circle cx={`${n.x}%`} cy={n.y} r={20} fill={color + '33'} stroke={color} strokeWidth={2} />
                  <text x={`${n.x}%`} y={n.y + 4} textAnchor="middle" fontSize={9} fontWeight={600} fill={textColor}>
                    {n.label}
                  </text>
                  {n.mastery > 0 && (
                    <text x={`${n.x}%`} y={n.y + 14} textAnchor="middle" fontSize={8} fill={color}>
                      {n.mastery}%
                    </text>
                  )}
                  {n.mastery === 0 && (
                    <text x={`${n.x}%`} y={n.y + 14} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">
                      🔒
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
          🟢 Vững (&ge;70%) · 🟡 Trung bình (40–70%) · 🔴 Yếu (&lt;40%) · 🔒 Chưa mở khoá
        </p>
      </div>

      <SkillsList skills={student.skills} />

      {/* Recommendations */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-orange-500" />
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Lộ trình đề xuất tiếp theo</h2>
        </div>
        <ol className="space-y-3">
          {[
            { step: 1, action: 'Củng cố React Hooks', reason: 'Hiện tại 35% — cần đạt 70% trước khi học Next.js', link: '/course/react-mastery-2024', color: '#ef4444' },
            { step: 2, action: 'Học State Management (Zustand)', reason: 'Phụ thuộc vào React Hooks, hiện 28%', link: '/course/react-mastery-2024', color: '#eab308' },
            { step: 3, action: 'Tiến lên Next.js 15', reason: 'Sau khi vững React Hooks + State Mgmt ≥70%', link: '/course/nextjs-fullstack', color: '#22c55e' },
          ].map(({ step, action, reason, link, color }) => (
            <li key={step} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
                style={{ background: color }}
              >
                {step}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{action}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{reason}</p>
              </div>
              <Link href={link} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 shrink-0">
                Xem khoá <ArrowRight size={10} />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
