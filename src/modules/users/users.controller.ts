import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':telegramId')
  findOne(@Param('telegramId') telegramId: string) {
    return this.usersService.findByTelegramId(telegramId);
  }
}
