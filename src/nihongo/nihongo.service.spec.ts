import { Test, TestingModule } from '@nestjs/testing';
import { NihongoService } from './nihongo.service';

describe('NihongoService', () => {
  let service: NihongoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NihongoService],
    }).compile();

    service = module.get<NihongoService>(NihongoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
