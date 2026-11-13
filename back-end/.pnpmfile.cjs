// Gỡ vài peer dependency tuỳ chọn để bản cài --prod (image Docker) không kéo đồ dev:
// pnpm nối peer tuỳ chọn vào bất cứ gói nào có mặt ở gốc dự án, kể cả devDependencies,
// nên vitest (peer của better-auth) và typescript (peer của prisma) lọt vào prod ~57MB.
// Không gói nào cần chúng lúc chạy: better-auth dùng adapter Prisma, prisma chỉ dùng
// typescript cho vài lệnh dev.
const DROP_PEERS = {
  'better-auth': ['vitest'],
  prisma: ['typescript'],
  '@prisma/client': ['typescript'],
};

module.exports = {
  hooks: {
    readPackage(pkg) {
      for (const name of DROP_PEERS[pkg.name] ?? []) {
        delete pkg.peerDependencies?.[name];
        delete pkg.peerDependenciesMeta?.[name];
      }
      return pkg;
    },
  },
};
