import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { DatabaseModule } from 'src/core/database/database.module';

@Module({
  imports:[DatabaseModule],
  exports:[FileUploadService],
  controllers: [FileUploadController],
  providers: [FileUploadService],
})
export class FileUploadModule {}
