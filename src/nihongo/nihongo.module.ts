import { Module } from '@nestjs/common';
import { NihongoController } from './nihongo.controller';
import { NihongoService } from './nihongo.service';

@Module({
  controllers: [NihongoController],
  providers: [NihongoService],
})
export class NihongoModule {}
