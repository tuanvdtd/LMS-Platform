# syntax=docker/dockerfile:1

# ---- os: Node + thư viện hệ thống mà Prisma engine cần (libssl) ----
FROM node:24.22.2-slim AS os
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- tools: thêm pnpm, chỉ các stage cài/build dùng ----
FROM os AS tools
# Cài pnpm bằng npm thay vì corepack: corepack không còn đi kèm Node từ bản 25.
# PNPM_HOME cũng là chỗ đặt store (/pnpm/store) mà cache mount bên dưới dùng lại giữa các lần build.
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN npm install -g pnpm@12.3.4
# .pnpmfile.cjs đổi cách giải peer → lockfile chỉ khớp khi có nó; pnpm-workspace.yaml mang allowBuilds cho Prisma.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./

# ---- build: đủ devDependencies để nest build ----
FROM tools AS build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate && pnpm build

# ---- prod-deps: chỉ dependencies chạy thật, kèm Prisma CLI để migrate trên máy ----
FROM tools AS prod-deps
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile
RUN pnpm exec prisma generate

# ---- runtime: không có pnpm/npm, chạy bằng user node ----
FROM os AS runtime
# Vá gói Debian và bỏ npm/corepack/yarn đi kèm image node: lúc chạy chỉ cần `node`,
# bớt dung lượng và bớt lỗ hổng mà máy quét image báo.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
       /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
       /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
# Gắn package GHCR với repo để GITHUB_TOKEN của workflow đẩy image được.
LABEL org.opencontainers.image.source=https://github.com/tuanvdtd/LMS-Platform
ENV NODE_ENV=production
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node package.json ./
USER node
EXPOSE 4000
# Migrate chạy bằng `node_modules/.bin/prisma migrate deploy` (không có npx trong image).
CMD ["node", "--enable-source-maps", "--import", "./dist/instrument.js", "dist/main.js"]
