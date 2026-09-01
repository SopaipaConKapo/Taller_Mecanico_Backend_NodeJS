import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userRolesHeader = request.headers['x-user-roles'];
    
    if (!userRolesHeader) {
      throw new ForbiddenException('No roles provided in header');
    }

    let userRoles: string[] = [];
    try {
      userRoles = JSON.parse(userRolesHeader);
    } catch (e) {
      throw new ForbiddenException('Invalid roles header format');
    }

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(`Require one of roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
