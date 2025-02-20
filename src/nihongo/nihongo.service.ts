import { Injectable, OnModuleInit } from '@nestjs/common';
import Kuroshiro from 'kuroshiro';
import * as KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { HfInference } from '@huggingface/inference';

@Injectable()
export class NihongoService implements OnModuleInit {
  private kuroshiro: Kuroshiro;
  private hf: HfInference;

  async onModuleInit() {
    // Kuroshiro init
    this.kuroshiro = new Kuroshiro();
    await this.kuroshiro.init(new KuromojiAnalyzer());

    // Hugging Face init
    this.hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);
  }

  async convertToFurigana(
    text: string,
    to: 'furigana' | 'hiragana' | 'romaji' = 'furigana',
    position: 'above' | 'below' = 'above',
    validateWithAI: boolean = false,
  ): Promise<string> {
    try {
      // Step 1: Standard conversion with Kuroshiro
      let result = await this.kuroshiro.convert(text, {
        to: to,
        mode: 'furigana',
      });

      // Step 2: Correct furigana IF AI validation is asked
      if (validateWithAI) {
        result = await this.validateFuriganaWithAI(text, result);
      }

      // Step 3: Set furigana position
      if (position === 'below') {
        return result.replace(
          /<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/g,
          '<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>',
        );
      }
      return result;
    } catch (error) {
      console.error('Error converting text:', error);
      throw new Error('Failed to convert text');
    }
  }

  private async validateFuriganaWithAI(
    originalText: string,
    kuroshiroResult: string,
  ): Promise<string> {
    try {
      const pairs = this.extractKanjiFuriganaPairs(kuroshiroResult);

      if (pairs.length === 0) {
        return kuroshiroResult;
      }

      const huggingFacePrompt = `
以下の日本語の文章と生成されたフリガナを確認してください。
間違っているフリガナを修正してください。

元の文章: ${originalText}

フリガナ:
${pairs.map((p) => `${p.kanji} → ${p.furigana}`).join('\n')}

修正したフリガナのみを次の形式で返してください:
kanji1:furigana1
kanji2:furigana2
...`;

      // Call Hugging Face API
      const response = await this.hf.textGeneration({
        model: 'rinna/japanese-gpt-neox-3.6b',
        inputs: huggingFacePrompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.2,
          return_full_text: false,
        },
      });

      const corrections = this.parseAIResponse(response.generated_text);

      let correctedText = kuroshiroResult;
      for (const [kanji, correctedFurigana] of Object.entries(corrections)) {
        const regex = new RegExp(`<ruby>${kanji}<rt>(.*?)</rt></ruby>`, 'g');
        correctedText = correctedText.replace(
          regex,
          `<ruby>${kanji}<rt>${correctedFurigana}</rt></ruby>`,
        );
      }

      return correctedText;
    } catch (error) {
      console.error('Error validating with Hugging Face:', error);
      return kuroshiroResult;
    }
  }

  private extractKanjiFuriganaPairs(
    html: string,
  ): Array<{ kanji: string; furigana: string }> {
    const pairs = [];
    const regex = /<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      pairs.push({
        kanji: match[1],
        furigana: match[2],
      });
    }

    return pairs;
  }

  private parseAIResponse(response: string): Record<string, string> {
    const corrections: Record<string, string> = {};

    const cleanedResponse = response.trim();

    const lines = cleanedResponse.split('\n');
    for (const line of lines) {
      const [key, value] = line.split(':').map((part) => part?.trim());
      if (key && value) {
        corrections[key] = value;
      }
    }

    return corrections;
  }
}
