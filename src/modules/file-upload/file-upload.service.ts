import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/database.service';
import { nanoid } from 'nanoid';
import { Response } from 'express';
import { CloudinaryService } from 'nestjs-cloudinary';
import { Context } from 'telegraf';

@Injectable()
export class FileUploadService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

async create(payload: any, userId: string) {
    const shortCode = nanoid(6);
    
    const savedResource = await this.prisma.resource.create({
      data: {
        originalUrl: payload.secure_url,
        publicId: payload.public_id,
        shortCode: shortCode,
        ownerId: userId
      }
    });

    return {
      shortUrl: `http://localhost:3000/file-upload/${savedResource.shortCode}`
    };
}



  async getPicture(shortCode: string, res: Response) {
    const resource = await this.prisma.resource.findUnique({
      where: { shortCode }
    });

    if (!resource) {
      throw new NotFoundException('Kechirasiz, bunday link mavjud emas!')
    }

    await this.prisma.resource.update({
      where: { id: resource.id },
      data: { clicks: { increment: 1 } },
    });

    return res.redirect(resource.originalUrl);
  }

  async stats(shortCode: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { shortCode },
      select: {
        clicks: true
      }
    });

    if (!resource) {
      throw new NotFoundException('Kechirasiz, bunday link mavjud emas!')
    }

    return {
      link: `http://localhost:3000/file-upload/${shortCode}`,
      count: resource.clicks
    }
  }

  async myFiles(page: number, limit: number, ctx: Context) {
    const skip = (page - 1) * limit
    const files = await this.prisma.resource.findMany({
      where: { ownerId: ctx.from!.id.toString() },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return files.map(file => ({
      id: file.id,
      clicks: file.clicks,
      shortlink: file.shortCode,
      original: file.originalUrl,
      date: file.createdAt
    }));
  }

  async remove(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id }
    })

    if (!resource) {
      throw new NotFoundException('Fayl topilmadi!');
    }
    if (resource.publicId) {
      await this.cloudinaryService.cloudinary.uploader.destroy(resource.publicId)
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    return {
      message: "File muvaffaqiyatli o'chirildi"
    }
  }

  async uploadFromUrl(url: string) {
    const result = await this.cloudinaryService.cloudinary.uploader.upload(url)
    return result
  }
}
