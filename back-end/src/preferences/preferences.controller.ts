import { Body, Controller, Get, Patch } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { updatePreferencesSchema } from './preferences.schemas.js';
import type { UpdatePreferencesInput } from './preferences.schemas.js';
import { PreferencesService } from './preferences.service.js';

// Onboarding cá nhân hoá (spec 2026-10-02-personalize-occupation §4). Field nào cũng optional
// để "Lưu rồi thoát" lưu được giữa chừng.
@Controller('me/preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get()
  get(@CurrentUser() user: AuthSession['user']) {
    return this.preferences.get(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthSession['user'],
    @Body(new ZodValidationPipe(updatePreferencesSchema)) body: UpdatePreferencesInput,
  ) {
    return this.preferences.update(user.id, body);
  }
}
