import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { CloudinaryService } from 'nestjs-cloudinary';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Context } from 'telegraf';

@Controller('file-upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly cloudinaryService: CloudinaryService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file: Express.Multer.File) {
    const UploadFile = await this.cloudinaryService.uploadFile(file)
    // return this.fileUploadService.create(UploadFile)
  }


  @Get(':shortCode')
  findAll(@Param('shortCode') shortCode: string, @Res() res: Response) {
    return this.fileUploadService.getPicture(shortCode, res);
  }


  @Get('stats/:shortCode')
  findOne(@Param('shortCode') shortCode: string) {
    return this.fileUploadService.stats(shortCode);
  }

  @Get('files/:page/:limit')
  files(
    @Param('page') page : string,
    @Param('limit') limit : string
  ){
    // return this.fileUploadService.myFiles(+page,+limit)

  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileUploadService.remove(id);
  }
}
