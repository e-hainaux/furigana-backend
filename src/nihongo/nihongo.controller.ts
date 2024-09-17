import { Controller, Post, Body } from '@nestjs/common';
import { NihongoService } from './nihongo.service';

@Controller('nihongo')
export class NihongoController {
  constructor(private readonly nihongoService: NihongoService) {}

  @Post('convert')
  async convertText(
    @Body('text') text: string,
    @Body('to') to: 'furigana' | 'hiragana' | 'romaji',
    @Body('furiganaPosition') furiganaPosition: 'above' | 'below',
  ) {
    console.log('Received request:', { text, to, furiganaPosition }); // Pour le débogage
    const result = await this.nihongoService.convertToFurigana(
      text,
      to,
      furiganaPosition,
    );
    console.log('Sending response:', result); // Pour le débogage
    return result;
  }
}
