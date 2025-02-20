import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { NihongoService } from './nihongo.service';

@Controller('nihongo')
export class NihongoController {
  constructor(private readonly nihongoService: NihongoService) {}

  @Post('convert')
  async convertText(
    @Body('text') text: string,
    @Body('to') to: 'furigana' | 'hiragana' | 'romaji',
    @Body('furiganaPosition') furiganaPosition: 'above' | 'below',
    @Body('validateWithAI') validateWithAI = false,
  ) {
    console.log('Received request:', {
      text,
      to,
      furiganaPosition,
      validateWithAI,
    });
    try {
      return await this.nihongoService.convertToFurigana(
        text,
        to,
        furiganaPosition,
        validateWithAI,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to convert text: ${error.message}`);
    }
  }
}
