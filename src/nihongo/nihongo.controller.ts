import { Controller, Post, Body } from '@nestjs/common';
import { NihongoService } from './nihongo.service';

@Controller('nihongo')
export class NihongoController {
  constructor(private readonly nihongoService: NihongoService) {}

  @Post('convert')
  async convertToFurigana(
    @Body() body: { text: string; to?: 'furigana' | 'hiragana' | 'romaji' },
  ) {
    const { text, to = 'furigana' } = body;
    return await this.nihongoService.convertToFurigana(text, to);
  }
}
