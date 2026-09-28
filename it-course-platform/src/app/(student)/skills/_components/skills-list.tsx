'use client';

import { useState } from 'react';
import { SkillMasteryBar } from '@/components/shared/product-ui';
import type { SkillMastery } from '@/types';

export function SkillsList({ skills }: { skills: SkillMastery[] }) {
  const [activeTrack, setActiveTrack] = useState<string>('all');

  const filteredSkills =
    activeTrack === 'all' ? skills : skills.filter((s) => s.track === activeTrack);

  return (
    <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Tất cả kỹ năng</h2>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'frontend', 'backend', 'data', 'devops'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTrack(t)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                background: activeTrack === t ? 'var(--primary)' : 'var(--card)',
                color: activeTrack === t ? '#fff' : 'var(--foreground)',
                borderColor: activeTrack === t ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {t === 'all' ? 'Tất cả' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filteredSkills.map((s) => (
          <SkillMasteryBar key={s.skillId} skill={s} />
        ))}
      </div>
    </div>
  );
}
