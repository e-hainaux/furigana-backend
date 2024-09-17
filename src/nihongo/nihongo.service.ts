import { Injectable, OnModuleInit } from '@nestjs/common';
import Kuroshiro from 'kuroshiro';
import * as KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

@Injectable()
export class NihongoService implements OnModuleInit {
  private kuroshiro: Kuroshiro;

  async onModuleInit() {
    this.kuroshiro = new Kuroshiro();
    await this.kuroshiro.init(new KuromojiAnalyzer());
  }

  async convertToFurigana(
    text: string,
    to: 'furigana' | 'hiragana' | 'romaji' = 'furigana',
  ): Promise<string> {
    try {
      console.log('text : ', text);
      const result = await this.kuroshiro.convert(text, {
        to: to,
        mode: 'furigana',
      });
      console.log('result : ', result);

      return result;
    } catch (error) {
      console.error('Error converting text:', error);
      throw new Error('Failed to convert text');
    }
  }
}
