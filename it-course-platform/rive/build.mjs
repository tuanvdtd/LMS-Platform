// Sinh public/rive/guest-home.riv (artboard Lumi, Study, Teach, Ask) từ lumi-spec.mjs + scenes.mjs
// và public/rive/celebrate.riv (artboard Graduate + Confetti, chúc mừng hoàn thành khoá) từ graduate.mjs
// và public/rive/lumi.riv (artboard Coder, Examiner) từ moments.mjs
// bằng rive-mcp-server (công cụ cộng đồng, ghi thẳng .riv, không qua Rive Editor nên không có màn splash của gói Free).
// Cài 1 lần ngoài repo: npm i --prefix ../tools/rive-mcp rive-mcp-server@0.12.0 --ignore-scripts
// Chạy: node rive/build.mjs   (RIVE_MCP=<đường dẫn dist/index.js> nếu cài chỗ khác)
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lumiArtboard } from './lumi-spec.mjs';
import { sceneArtboards } from './scenes.mjs';
import { graduateArtboard, confettiArtboard } from './graduate.mjs';
import { coderArtboard, examinerArtboard } from './moments.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const server = process.env.RIVE_MCP ?? path.resolve(here, '../../tools/rive-mcp/node_modules/rive-mcp-server/dist/index.js');
const sdk = path.resolve(path.dirname(server), '../../@modelcontextprotocol/sdk/dist/esm/client');
const { Client } = await import(pathToFileURL(path.join(sdk, 'index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(path.join(sdk, 'stdio.js')).href);

const outputs = {
  'guest-home.riv': [lumiArtboard, ...sceneArtboards],
  'celebrate.riv': [graduateArtboard, confettiArtboard],
  'lumi.riv': [coderArtboard, examinerArtboard],
};
// node rive/build.mjs lumi.riv → chỉ build file được nêu
const only = process.argv.slice(2);
const client = new Client({ name: 'aolumi-rive-build', version: '1' });
await client.connect(new StdioClientTransport({ command: 'node', args: [server], stderr: 'ignore' }));
try {
  const call = async (name, args) => {
    const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 300000 });
    const text = r.content?.filter((c) => c.type === 'text').map((c) => c.text).join('\n') ?? '';
    if (r.isError) throw new Error(`${name}: ${text.slice(0, 1500)}`);
    return text;
  };
  for (const [file, artboards] of Object.entries(outputs).filter(([f]) => !only.length || only.includes(f))) {
    const out = path.resolve(here, '../public/rive', file);
    await call('riv_create', { outPath: out, scene: { artboards } });
    const lint = JSON.parse((await call('riv_lint', { path: out })).match(/\{[\s\S]*\}/)[0]);
    console.log(`Đã ghi ${out} — lint: ${lint.errorCount} lỗi, ${lint.warningCount} cảnh báo`);
    if (lint.errorCount) process.exitCode = 1;
  }
} finally {
  await client.close();
}
