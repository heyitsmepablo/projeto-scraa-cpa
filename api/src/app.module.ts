import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MonitoramentoModule } from './monitoramento/monitoramento.module';
import { InstituicaoModule } from './instituicao/instituicao.module';
import { VinculoModule } from './vinculo/vinculo.module';
import { PlanoOperativoModule } from './plano-operativo/plano-operativo.module';
import { ProducaoModule } from './producao/producao.module';
import { SigtapModule } from './sigtap/sigtap.module';

@Module({
  imports: [
    PrismaModule, 
    MonitoramentoModule,
    InstituicaoModule,
    VinculoModule,
    PlanoOperativoModule,
    ProducaoModule,
    SigtapModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

