import { createHash, timingSafeEqual } from 'node:crypto';
import { Logger, type INestApplication } from '@nestjs/common';
import { ROUTE_ARGS_METADATA, RouteParamtypes } from '@nestjs/common/internal';
import { ModulesContainer } from '@nestjs/core';
import {
  ApiBody,
  ApiQuery,
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from './common/zod.pipe.js';
import { optionalEnv } from './env.js';

type RouteArg = { index: number; data?: unknown; pipes?: unknown[] };
type JsonSchema = {
  properties?: Record<string, object>;
  required?: string[];
  [k: string]: unknown;
};

// io 'input': tài liệu mô tả dữ liệu client gửi lên (trước transform/default của zod).
function toOpenApi(schema: z.ZodType): JsonSchema {
  const { $schema: _, ...json } = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  }) as JsonSchema;
  return json;
}

// Lấy schema zod từ @Body/@Query(new ZodValidationPipe(x)) khai báo cho Swagger:
// controller không phải lặp lại bằng decorator riêng, endpoint mới tự có tài liệu.
export function documentZodRoutes(app: INestApplication): void {
  const logger = new Logger('Swagger');
  for (const mod of app.get(ModulesContainer).values()) {
    for (const { metatype } of mod.controllers.values()) {
      if (typeof metatype !== 'function') continue;
      const proto = metatype.prototype as object;
      for (const key of Object.getOwnPropertyNames(proto)) {
        const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, metatype, key) as
          Record<string, RouteArg> | undefined;
        if (!args) continue;
        const descriptor = Object.getOwnPropertyDescriptor(proto, key)!;
        for (const [argKey, arg] of Object.entries(args)) {
          const pipe = arg.pipes?.find((p) => p instanceof ZodValidationPipe);
          if (!pipe) continue;
          const type = Number(argKey.split(':')[0]);
          let json: JsonSchema;
          try {
            json = toOpenApi(pipe.schema);
          } catch (err) {
            // Tài liệu không được làm server khởi động lỗi; bỏ qua route này và báo ra log.
            logger.warn(`${metatype.name}.${key}: ${String(err)}`);
            continue;
          }
          if (type === RouteParamtypes.BODY) {
            ApiBody({ schema: json })(proto, key, descriptor);
          } else if (type === RouteParamtypes.QUERY) {
            const required = new Set(json.required);
            for (const [name, schema] of Object.entries(
              json.properties ?? {},
            )) {
              ApiQuery({ name, required: required.has(name), schema })(
                proto,
                key,
                descriptor,
              );
            }
          }
        }
      }
    }
  }
}

// JSON/YAML cũng nằm dưới /api/docs để một middleware Basic Auth che được cả ba.
const DOCS_PATH = 'api/docs';

// Băm trước khi so: hai buffer luôn dài bằng nhau nên timingSafeEqual không ném lỗi
// và thời gian so sánh không lộ độ dài mật khẩu.
function sameSecret(a: string, b: string): boolean {
  const hash = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export function isAuthorized(
  header: string | undefined,
  user: string,
  pass: string,
): boolean {
  if (!header?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString();
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;
  // So cả hai rồi mới gộp, để thời gian phản hồi không cho biết sai user hay sai pass.
  const userOk = sameSecret(decoded.slice(0, sep), user);
  const passOk = sameSecret(decoded.slice(sep + 1), pass);
  return userOk && passOk;
}

// Trang Swagger ở /api/docs. Có DOCS_USER + DOCS_PASSWORD thì khoá bằng Basic Auth;
// production thiếu hai biến này thì không mở trang, tránh lỡ để công khai.
export function setupDocs(app: INestApplication): void {
  const user = optionalEnv('DOCS_USER');
  const pass = optionalEnv('DOCS_PASSWORD');
  const isProd = optionalEnv('SENTRY_ENVIRONMENT') === 'production';

  if (user && pass) {
    app.use(
      `/${DOCS_PATH}`,
      (req: Request, res: Response, next: NextFunction) => {
        if (isAuthorized(req.headers.authorization, user, pass)) return next();
        res.set('WWW-Authenticate', 'Basic realm="API docs"').sendStatus(401);
      },
    );
  } else if (isProd) {
    return;
  }

  documentZodRoutes(app);
  const config = new DocumentBuilder().setTitle('Aolumi API').build();
  SwaggerModule.setup(
    DOCS_PATH,
    app,
    () => SwaggerModule.createDocument(app, config),
    {
      jsonDocumentUrl: `${DOCS_PATH}/json`,
      yamlDocumentUrl: `${DOCS_PATH}/yaml`,
    },
  );
}
