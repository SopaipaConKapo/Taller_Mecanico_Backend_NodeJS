import { Controller, All, Req, Res, UseGuards, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody, Options } from 'http-proxy-middleware';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('api')
export class ApiGatewayController {
  private injectAuthHeaders = (proxyReq: any, req: any, res: any) => {
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.userId);
      proxyReq.setHeader('x-user-roles', JSON.stringify(req.user.roles || []));
    }
    fixRequestBody(proxyReq, req);
  };

  private inventoryProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/inventory': '' },
    on: { proxyReq: this.injectAuthHeaders }
  });

  private workshopProxy = createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/workshop': '' },
    on: { proxyReq: this.injectAuthHeaders }
  });

  private authProxy = createProxyMiddleware({
    target: 'http://localhost:3002', // auth belongs to workshop-service
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
    on: { proxyReq: fixRequestBody }
  });

  // Test endpoint para Rate Limit
  @Get('ping')
  ping() {
    return 'pong';
  }

  // Proxy to Inventory Service
  @All('inventory/*')
  @UseGuards(JwtAuthGuard)
  handleInventory(@Req() req: Request, @Res() res: Response, next: any) {
    this.inventoryProxy(req as any, res as any, next);
  }

  // Proxy to Auth Service (Workshop handles this)
  @All('auth/*')
  handleAuth(@Req() req: Request, @Res() res: Response, next: any) {
    this.authProxy(req as any, res as any, next);
  }

  // Proxy to Workshop Service
  @All('workshop/*')
  @UseGuards(JwtAuthGuard)
  handleWorkshop(@Req() req: Request, @Res() res: Response, next: any) {
    this.workshopProxy(req as any, res as any, next);
  }
}

