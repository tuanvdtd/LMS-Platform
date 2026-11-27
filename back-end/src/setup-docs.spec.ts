import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from './common/zod.pipe.js';
import { documentZodRoutes, isAuthorized } from './setup-docs.js';

const createSchema = z.object({
  title: z.string().min(1),
  price: z.number().optional(),
});
const listSchema = z.object({
  page: z.coerce.number().default(1),
  q: z.string(),
});

@Controller('demo')
class DemoController {
  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) body: unknown) {
    return body;
  }
  @Get()
  list(@Query(new ZodValidationPipe(listSchema)) query: unknown) {
    return query;
  }
}

describe('documentZodRoutes', () => {
  it('body + query lấy từ schema zod', async () => {
    const mod = await Test.createTestingModule({
      controllers: [DemoController],
    }).compile();
    const app = mod.createNestApplication();
    await app.init();
    documentZodRoutes(app);
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    await app.close();

    const body = doc.paths['/demo'].post?.requestBody as {
      content: Record<
        string,
        { schema: { properties: object; required: string[] } }
      >;
    };
    const schema = body.content['application/json'].schema;
    expect(Object.keys(schema.properties)).toEqual(['title', 'price']);
    expect(schema.required).toEqual(['title']);

    const params = doc.paths['/demo'].get?.parameters as {
      name: string;
      in: string;
      required: boolean;
    }[];
    expect(params.map((p) => [p.name, p.in, p.required])).toEqual([
      ['page', 'query', false],
      ['q', 'query', true],
    ]);
  });
});

const basic = (s: string) => `Basic ${Buffer.from(s).toString('base64')}`;

describe('isAuthorized', () => {
  it('đúng user + pass', () => {
    expect(isAuthorized(basic('admin:p:ss'), 'admin', 'p:ss')).toBe(true);
  });
  it('sai pass', () => {
    expect(isAuthorized(basic('admin:x'), 'admin', 'p:ss')).toBe(false);
  });
  it('sai user', () => {
    expect(isAuthorized(basic('root:p:ss'), 'admin', 'p:ss')).toBe(false);
  });
  it('thiếu header / không phải Basic / không có dấu :', () => {
    expect(isAuthorized(undefined, 'admin', 'p')).toBe(false);
    expect(isAuthorized('Bearer abc', 'admin', 'p')).toBe(false);
    expect(isAuthorized(basic('adminp'), 'admin', 'p')).toBe(false);
  });
});
