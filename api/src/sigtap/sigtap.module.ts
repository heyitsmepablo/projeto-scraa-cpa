import { Module } from '@nestjs/common';
import { SigtapController } from './sigtap.controller';
import { SigtapService } from './sigtap.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SigtapController],
  providers: [SigtapService],
  exports: [SigtapService],
})
export class SigtapModule {}
