import { DynamicModule, Module } from '@nestjs/common';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { Environment } from './libs/config/environment';

@Module({ imports: [ComponentsModule] })
export class AppModule {
  static register(environment: Environment): DynamicModule {
    return {
      module: AppModule,
      imports: [DatabaseModule.register(environment.databaseUrl)],
    };
  }
}
