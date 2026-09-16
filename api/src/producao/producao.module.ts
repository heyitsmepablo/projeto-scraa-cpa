import { Module } from '@nestjs/common';
import { ProducaoController } from './producao.controller';
import { ProducaoService } from './producao.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProducaoController],
  providers: [ProducaoService],
  exports: [ProducaoService],
})
export class ProducaoModule {}
