import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { CreateFileUploadDto } from './dto/create-file-upload.dto';
import { UpdateFileUploadDto } from './dto/update-file-upload.dto';
import { CloudinaryService } from 'nestjs-cloudinary';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('file-upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly cloudinaryService: CloudinaryService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() createFileUploadDto: CreateFileUploadDto,
    @UploadedFile() file: Express.Multer.File) {
    const { url } = await this.cloudinaryService.uploadFile(file)

    return {
      success: true,
      message: "Posted brother",
      url
      // url: this.fileUploadService.create(createFileUploadDto, url)
    }
  }

  @Get()
  findAll() {
    return this.fileUploadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileUploadService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileUploadDto: UpdateFileUploadDto) {
    return this.fileUploadService.update(+id, updateFileUploadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileUploadService.remove(+id);
  }
}
