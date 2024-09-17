import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NihongoModule } from './nihongo/nihongo.module';

@Module({
  imports: [NihongoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
