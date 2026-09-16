import { Module } from '@nestjs/common';
import { PlanoOperativoController } from './plano-operativo.controller';
import { PlanoOperativoService } from './plano-operativo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlanoOperativoController],
  providers: [PlanoOperativoService],
  exports: [PlanoOperativoService],
})
export class PlanoOperativoModule {}
