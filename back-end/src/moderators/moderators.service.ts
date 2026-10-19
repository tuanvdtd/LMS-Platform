import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isAPIError } from 'better-auth/api';
import { AUTH, type Auth, isServerError } from '../auth/auth.js';
import { isGuid } from '../common/zod.pipe.js';
import { requireEnv } from '../env.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { CreateModeratorInput } from './moderators.schemas.js';

const FE_URL = requireEnv('FE_URL');
// Chỉ đụng tới user đúng role này: id của admin/học viên → 404, không lỡ tay khoá admin.
const ROLE = 'moderator';
const SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  banned: true,
  moderatorCategories: {
    orderBy: { category: { position: 'asc' } },
    select: { category: { select: { id: true, name: true } } },
  },
  _count: { select: { approvalsReviewed: true } },
} satisfies Prisma.UserSelect;

const present = ({
  banned,
  moderatorCategories,
  _count,
  ...u
}: Prisma.UserGetPayload<{ select: typeof SELECT }>) => ({
  ...u,
  status: banned ? ('locked' as const) : ('active' as const),
  categories: moderatorCategories.map((m) => m.category),
  reviewedCount: _count.approvalsReviewed,
});

const emailTaken = () =>
  new ConflictException({
    statusCode: 409,
    code: 'EMAIL_TAKEN',
    message: 'Email đã được dùng',
  });

// Lỗi 4xx của auth.api.* là APIError, không có filter nào map → lọt ra Nest thành 500.
async function authCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isAPIError(e) || isServerError(e)) throw e;
    throw new HttpException(
      {
        statusCode: e.statusCode,
        code: e.body?.code,
        message: e.body?.message,
      },
      e.statusCode,
    );
  }
}

// Admin quản lý tài khoản moderator. Tạo/khoá đi qua Better Auth để session + cache Redis đúng.
@Injectable()
export class ModeratorsService {
  private readonly logger = new Logger(ModeratorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async list() {
    const rows = await this.prisma.user.findMany({
      where: { role: ROLE },
      orderBy: { createdAt: 'desc' },
      select: SELECT,
    });
    return { items: rows.map(present) };
  }

  async find(id: string) {
    const row = isGuid(id)
      ? await this.prisma.user.findFirst({
          where: { id, role: ROLE },
          select: SELECT,
        })
      : null;
    if (!row) throw new NotFoundException();
    return present(row);
  }

  // createUser không chạy trong transaction Prisma được → kiểm hết trước, ghi danh mục lỗi thì xoá user.
  async create(input: CreateModeratorInput) {
    await this.assertRoots(input.categoryIds);
    if (
      await this.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })
    ) {
      throw emailTaken();
    }
    // Không password: moderator tự đặt qua mail mời (reset password tự tạo credential account).
    // Không truyền headers: guard Nest đã kiểm admin.
    const { user } = await authCall(() =>
      this.auth.api.createUser({
        body: {
          email: input.email,
          name: input.name,
          role: ROLE,
          data: { emailVerified: true },
        },
      }),
    ).catch((e: unknown) => {
      // Hai request cùng email lọt qua bước kiểm trên → vẫn trả đúng mã để FE báo dưới ô email.
      if (
        e instanceof HttpException &&
        (e.getResponse() as { code?: string }).code ===
          'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
      ) {
        throw emailTaken();
      }
      throw e;
    });
    try {
      await this.prisma.moderatorCategory.createMany({
        data: input.categoryIds.map((categoryId) => ({
          userId: user.id,
          categoryId,
        })),
      });
    } catch (e) {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw e;
    }
    // Tài khoản đã tạo xong: gửi mời lỗi thì không trả lỗi (tạo lại sẽ ăn 409), admin bấm "Gửi lại mail mời".
    await this.invite(user.email).catch((e: unknown) =>
      this.logger.error(`Không gửi được mail mời ${user.id}`, e),
    );
    return this.find(user.id);
  }

  async setCategories(id: string, categoryIds: string[]) {
    await this.find(id);
    await this.assertRoots(categoryIds);
    await this.prisma.$transaction([
      this.prisma.moderatorCategory.deleteMany({ where: { userId: id } }),
      // skipDuplicates: hai admin sửa cùng lúc thì không đụng khoá chính → 500.
      this.prisma.moderatorCategory.createMany({
        data: categoryIds.map((categoryId) => ({ userId: id, categoryId })),
        skipDuplicates: true,
      }),
    ]);
    return this.find(id);
  }

  // banUser/unbanUser kiểm quyền bằng session của admin → bắt buộc headers. Ban tự xoá session DB + Redis.
  async lock(id: string, headers: Headers) {
    await this.find(id);
    await authCall(() =>
      this.auth.api.banUser({ body: { userId: id }, headers }),
    );
    return this.find(id);
  }

  async unlock(id: string, headers: Headers) {
    await this.find(id);
    await authCall(() =>
      this.auth.api.unbanUser({ body: { userId: id }, headers }),
    );
    return this.find(id);
  }

  async resendInvite(id: string) {
    await this.invite((await this.find(id)).email);
  }

  // ?invite=1 để sendResetPassword (auth.ts) gửi mail mời thay vì mail đặt lại mật khẩu.
  // Gọi server-side không qua rate limit.
  private invite(email: string) {
    return authCall(() =>
      this.auth.api.requestPasswordReset({
        body: { email, redirectTo: `${FE_URL}/reset-password?invite=1` },
      }),
    );
  }

  // Chỉ nhận danh mục cấp 1: khoá gắn danh mục cấp 2, hàng đợi lọc theo parentId.
  private async assertRoots(ids: string[]) {
    if (!ids.length) return;
    const n = await this.prisma.category.count({
      where: { id: { in: ids }, parentId: null },
    });
    if (n !== ids.length) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_CATEGORY',
        message: 'Danh mục không hợp lệ',
      });
    }
  }
}
