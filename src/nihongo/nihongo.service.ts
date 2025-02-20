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
      console.log('Result :', result);

      // Step 2: Correct furigana IF AI validation is asked
      if (validateWithAI) {
        console.log('Validation avec IA activée');
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
      console.log('Résultat brut Kuroshiro:', kuroshiroResult);
      console.log(
        'Test sur kuroshiroResult:',
        this.extractKanjiFuriganaPairs(kuroshiroResult),
      );

      const testString =
        '<ruby>日本<rt>にほん</rt></ruby>の<ruby>文化<rt>ぶんか</rt></ruby>';
      console.log(
        'Test de extractKanjiFuriganaPairs:',
        this.extractKanjiFuriganaPairs(testString),
      );

      const pairs = this.extractKanjiFuriganaPairs(kuroshiroResult);
      console.log('Paires kanji-furigana envoyées à l’IA:', pairs);

      if (pairs.length === 0) {
        return kuroshiroResult;
      }

      const huggingFacePrompt = `
以下の日本語の文章とフリガナを確認してください。
間違っているフリガナのみを修正し、正しいものだけを返してください。

元の文章:
${originalText}

フリガナ一覧:
${pairs.map((p) => `${p.kanji} → ${p.furigana}`).join('\n')}

**修正が必要な場合のみ**、次のJSON形式で返してください:
{
  "kanji1": "修正後のフリガナ",
  "kanji2": "修正後のフリガナ"
}

**注意**:
- 間違っていないフリガナは含めないでください。
- JSON形式を厳守してください。`;

      // Call Hugging Face API
      console.log('Envoi à Hugging Face:', huggingFacePrompt);
      const response = await this.hf.textGeneration({
        model: 'rinna/japanese-gpt-neox-3.6b',
        inputs: huggingFacePrompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.2,
          return_full_text: false,
        },
      });
      console.log('Réponse de Hugging Face:', response);

      let corrections = {};
      try {
        corrections = JSON.parse(response.generated_text);
      } catch (error) {
        console.error('Erreur lors du parsing JSON:', error);
      }

      let correctedText = kuroshiroResult;
      for (const [kanji, correctedFurigana] of Object.entries(corrections)) {
        const regex = new RegExp(
          `<ruby>${kanji}<rp>.*?</rp><rt>(.*?)</rt><rp>.*?</rp></ruby>`,
          'g',
        );
        correctedText = correctedText.replace(
          regex,
          `<ruby>${kanji}<rp>(</rp><rt>${correctedFurigana}</rt><rp>)</rp></ruby>`,
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

    const regex =
      /<ruby>(.*?)<rp>.*?<\/rp><rt>(.*?)<\/rt><rp>.*?<\/rp><\/ruby>/g;
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
