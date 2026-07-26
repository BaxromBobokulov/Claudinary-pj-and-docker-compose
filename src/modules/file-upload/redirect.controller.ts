import { Controller, Get, Param, Res } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import type { Response } from 'express';

@Controller()
export class RedirectController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Get(':shortCode')
  redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    return this.fileUploadService.getPicture(shortCode, res);
  }
}
