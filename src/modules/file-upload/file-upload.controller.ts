import { Controller, Get, Param, Delete, Res } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { CloudinaryService } from 'nestjs-cloudinary';
import type { Response } from 'express';

@Controller('file-upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  @Get(':shortCode')
  findAll(@Param('shortCode') shortCode: string, @Res() res: Response) {
    return this.fileUploadService.getPicture(shortCode, res);
  }

  @Get('stats/:shortCode')
  findOne(@Param('shortCode') shortCode: string) {
    return this.fileUploadService.stats(shortCode);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileUploadService.remove(id);
  }
}
