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
  getFavicon() {
    // Retourne une réponse vide pour éviter l'erreur 500
    return '';
  }
}
