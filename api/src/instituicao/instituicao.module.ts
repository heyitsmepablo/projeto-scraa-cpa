import { Module } from '@nestjs/common';
import { InstituicaoController } from './instituicao.controller';
import { InstituicaoService } from './instituicao.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstituicaoController],
  providers: [InstituicaoService],
  exports: [InstituicaoService],
})
export class InstituicaoModule {}
