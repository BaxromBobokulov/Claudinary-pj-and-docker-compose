import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryModule } from 'nestjs-cloudinary';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './core/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService : ConfigService) => ({
        cloud_name : configService.get<string>('CLOUD_NAME'),
        api_key: configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret : configService.get<string>('CLOUDINARY_API_SECRET')
      }),
    }),
    FileUploadModule,
    UsersModule,
    DatabaseModule,
  ]
})
export class AppModule { }
