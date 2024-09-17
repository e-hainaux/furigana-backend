import { Test, TestingModule } from '@nestjs/testing';
import { NihongoController } from './nihongo.controller';

describe('NihongoController', () => {
  let controller: NihongoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NihongoController],
    }).compile();

    controller = module.get<NihongoController>(NihongoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
