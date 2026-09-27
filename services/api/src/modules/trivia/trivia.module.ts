import { Module } from '@nestjs/common';
import { TriviaService } from './trivia.service';
import { TriviaController } from './trivia.controller';

@Module({
  providers: [TriviaService],
  controllers: [TriviaController],
  exports: [TriviaService],
})
export class TriviaModule {}
