import type { Metadata } from 'next';
import { demoQuiz, skillHeatmapData } from '@/lib/mocks/data';
import { ScoreDistributionChart, CodeVerdictPie } from './_components/assessment-charts';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Chất lượng Bài kiểm tra | SkillPath' };

const CODE_VERDICT = [
  { name: 'Accepted', value: 73, color: '#22c55e' },
  { name: 'Wrong Answer', value: 14, color: '#ef4444' },
  { name: 'TLE', value: 8, color: '#d97706' },
  { name: 'Runtime Error', value: 5, color: '#8b5cf6' },
];

function qualityColor(disc: number, diff: number) {
  if (disc >= 0.4 && diff >= 0.3 && diff <= 0.8) return 'good';
  if (disc < 0.2 || diff < 0.2 || diff > 0.9) return 'bad';
  return 'review';
}

export default function AnalyticsAssessmentsPage() {
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
        Chất lượng Bài kiểm tra
      </h1>

      {/* Score distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            Phân bố điểm — {demoQuiz.title}
          </h2>
          <div className="flex gap-4 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            <span>Điểm TB: <strong style={{ color: 'var(--foreground)' }}>68.4%</strong></span>
            <span>Tỉ lệ đạt: <strong style={{ color: 'var(--skill-strong)' }}>71.2%</strong></span>
          </div>
          <ScoreDistributionChart />
        </div>

        {/* Code verdict */}
        <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Kết quả bài tập lập trình
          </h2>
          <div className="flex items-center gap-6">
            <CodeVerdictPie data={CODE_VERDICT} />
            <div className="flex-1 space-y-2">
              {CODE_VERDICT.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="flex-1" style={{ color: 'var(--foreground)' }}>{d.name}</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--foreground)' }}>{d.value}%</span>
                </div>
              ))}
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Nộp TB đến khi đạt: 2.8 lần
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question quality */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Chất lượng từng câu hỏi
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
                {['#', 'Câu hỏi', 'Kỹ năng', 'Độ khó thực', 'Độ phân biệt', 'Chất lượng', 'Hành động'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {demoQuiz.questions.map((q, i) => {
                const quality = qualityColor(q.discriminationIndex ?? 0, q.difficultyActual ?? 0.5);
                return (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-3 py-2.5 text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{i + 1}</td>
                    <td className="px-3 py-2.5 max-w-48">
                      <p className="text-xs truncate" style={{ color: 'var(--foreground)' }}>{q.content.slice(0, 60)}…</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{q.skills[0]?.name}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                      {((q.difficultyActual ?? 0) * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                      {(q.discriminationIndex ?? 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: quality === 'good' ? '#dcfce7' : quality === 'bad' ? '#fee2e2' : '#fef9c3',
                          color: quality === 'good' ? '#166534' : quality === 'bad' ? '#dc2626' : '#854d0e',
                        }}
                      >
                        {quality === 'good' ? 'Tốt' : quality === 'bad' ? 'Kém' : 'Xem lại'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="text-xs text-blue-600 hover:underline">Phân tích</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skill heatmap */}
      <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Heatmap kỹ năng yếu của lớp
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Kỹ năng</th>
                {['Quiz 1', 'Quiz 2', 'Quiz 3'].map((h) => (
                  <th key={h} className="text-center px-3 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {skillHeatmapData.map((row) => (
                <tr key={row.skill}>
                  <td className="px-3 py-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.skill}</td>
                  {[row.quiz1, row.quiz2, row.quiz3].map((v, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <div
                        className="inline-flex items-center justify-center w-12 h-8 rounded text-xs font-bold"
                        style={{
                          background: v < 40 ? '#fee2e2' : v < 60 ? '#fef9c3' : '#dcfce7',
                          color: v < 40 ? '#dc2626' : v < 60 ? '#854d0e' : '#166534',
                        }}
                      >
                        {v}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> &lt;40% Yếu</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 inline-block" /> 40–60% TB</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> &ge;60% Vững</span>
        </div>
      </div>
    </div>
  );
}
