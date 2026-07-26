import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/database.service';

export interface TelegramUserData {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertTelegramUser(data: TelegramUserData) {
    return this.prisma.user.upsert({
      where: { telegramId: data.telegramId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      },
      create: {
        telegramId: data.telegramId,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      },
    });
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: { resources: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { _count: { select: { resources: true } } },
    });
  }
}
