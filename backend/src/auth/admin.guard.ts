import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '@prisma/client';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuth = await super.canActivate(context);
    if (!isAuth) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const adminRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.CONTENT_MANAGER,
      Role.MODERATOR,
      Role.SUPPORT_STAFF
    ];

    if (!user || !adminRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }

    return true;
  }
}
