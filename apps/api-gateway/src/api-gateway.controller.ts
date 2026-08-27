import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('api')
export class ApiGatewayController {
  private inventoryProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/inventory': '' },
    on: { proxyReq: fixRequestBody }
  });

  private workshopProxy = createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/workshop': '' },
    on: { proxyReq: fixRequestBody }
  });

  // Proxy to Inventory Service
  @All('inventory/*')
  @UseGuards(JwtAuthGuard)
  handleInventory(@Req() req: Request, @Res() res: Response, next: any) {
    this.inventoryProxy(req as any, res as any, next);
  }

  // Proxy to Workshop Service
  @All('workshop/*')
  @UseGuards(JwtAuthGuard)
  handleWorkshop(@Req() req: Request, @Res() res: Response, next: any) {
    this.workshopProxy(req as any, res as any, next);
  }
}

