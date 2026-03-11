import { Module } from '@nestjs/common';
import { PrismaService } from './database.service';

@Module({
  providers: [PrismaService]
})
export class DatabaseModule {}
