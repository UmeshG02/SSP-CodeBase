import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      request.user = await this.authService.validateUser(payload.sub);
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token is invalid or has expired');
    }
  }
}
