import { Module } from '@nestjs/common';
import { VinculoController } from './vinculo.controller';
import { VinculoService } from './vinculo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VinculoController],
  providers: [VinculoService],
  exports: [VinculoService],
})
export class VinculoModule {}
