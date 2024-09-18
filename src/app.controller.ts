import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('favicon.ico')
  @Header('Content-Type', 'image/x-icon')
  getFaviconIco() {
    return '';
  }

  @Get('favicon.png')
  @Header('Content-Type', 'image/png')
  getFaviconPng() {
    return '';
  }
}
