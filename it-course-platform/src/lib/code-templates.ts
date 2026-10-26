import type { Language } from '@/types/exercise';

// Starter có sẵn khung đọc stdin / in stdout. Giảng viên thêm ngôn ngữ → điền mẫu này.
export const STARTER_TEMPLATES: Record<Language, string> = {
  javascript: `const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');

function solve(lines) {
  // TODO: viết code ở đây
  return '';
}

console.log(solve(lines));
`,
  python: `import sys


def solve(lines):
    # TODO: viết code ở đây
    return ''


lines = sys.stdin.read().strip().split('\\n')
print(solve(lines))
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: đọc input từ cin, in kết quả ra cout
    return 0;
}
`,
};
