import { Action, Command, On, Start, Update } from 'nestjs-telegraf';
import { FileUploadService } from '../file-upload/file-upload.service';
import { UsersService } from '../users/users.service';
import { Context, Markup } from 'telegraf';
import { PrismaService } from 'src/core/database/database.service';

@Update()
export class BotUpdate {
    constructor(
        private readonly fileservice: FileUploadService,
        private readonly usersService: UsersService,
        private prisma: PrismaService,
    ) {}

    private async handleUser(ctx: Context) {
        if (ctx.from) {
            await this.usersService.upsertTelegramUser({
                telegramId: ctx.from.id.toString(),
                firstName: ctx.from.first_name,
                lastName: ctx.from.last_name,
                username: ctx.from.username,
            });
        }
    }

    private async checkDailyLimit(userId: string): Promise<boolean> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const uploadCount = await this.prisma.resource.count({
            where: { ownerId: userId, createdAt: { gte: today } },
        });
        return uploadCount >= 3;
    }

    private async uploadFile(
        ctx: Context,
        fileId: string,
        resourceType: 'image' | 'video' | 'raw',
    ) {
        await this.handleUser(ctx);
        const userId = ctx.from?.id.toString();
        if (!userId) return;

        if (await this.checkDailyLimit(userId)) {
            await ctx.reply('⛔ Kunlik limit tugadi (3/3)');
            return;
        }

        const file = await ctx.telegram.getFile(fileId);
        const fullUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
        const statusMsg = await ctx.reply('⏳ Yuklanmoqda...');

        try {
            const result = await this.fileservice.uploadFromUrl(fullUrl, resourceType);
            const end = await this.fileservice.create(result, userId);
            await ctx.telegram.deleteMessage(ctx.chat!.id, statusMsg.message_id);
            await ctx.reply(
                `✅ Saqlandi!\n\n🔗 Link: <code>${end.shortUrl}</code>`,
                { parse_mode: 'HTML' },
            );
        } catch {
            await ctx.reply('❌ Yuklashda xato yuz berdi.');
        }
    }

    @Start()
    async onStart(ctx: Context) {
        await this.handleUser(ctx);

        const welcomeMessage =
            `👋 **Salom, ${ctx.from!.first_name}!**\n\n` +
            `🚀 **CloudVault** — fayllaringizni bulutga yuklovchi va qisqa linklar beruvchi aqlli yordamchi.\n\n` +
            `🛠 **Nimalar qila olaman?**\n` +
            `• 📸 Rasmlarni yuklayman\n` +
            `• 🎬 Videolarni yuklayman\n` +
            `• 📦 3D model va hujjatlarni yuklayman\n` +
            `• 🔗 Qisqa link yarataman\n` +
            `• 📊 Statistikani yuritaman\n\n` +
            `Shunchaki rasm, video yoki fayl yuboring!`;

        const logoUrl = 'https://res.cloudinary.com/dqhktodib/image/upload/v1773309918/u2qqzrem5a2qbcxi93wa.jpg';

        await ctx.replyWithPhoto(logoUrl, {
            caption: welcomeMessage,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📊 Mening fayllarim', 'my_files')],
                [Markup.button.callback('ℹ️ Yordam', 'help_info')],
            ]),
        });
    }

    @Command('files')
    async getMyFiles(ctx: Context) {
        await this.handleUser(ctx);
        const files = await this.fileservice.myFiles(1, 10, ctx);

        if (files.length === 0) {
            return await ctx.reply("Sizda hali yuklangan fayllar yo'q.");
        }

        let responseMessage = '📁 **Sizning yuklangan fayllaringiz:**\n\n';
        files.forEach((file) => {
            responseMessage += `🔗 Link: ${process.env.BASE_URL}/file-upload/${file.shortlink}\n`;
            responseMessage += `👁 Ko'rishlar: ${file.clicks}\n`;
            responseMessage += `------------------------\n`;
        });

        await ctx.reply(responseMessage, { parse_mode: 'HTML' });
    }

    @On('photo')
    async onPhoto(ctx: Context) {
        const photo = ctx.message!['photo'];
        const fileId = photo[photo.length - 1].file_id;
        await this.uploadFile(ctx, fileId, 'image');
    }

    @On('video')
    async onVideo(ctx: Context) {
        const video = ctx.message!['video'];
        await this.uploadFile(ctx, video.file_id, 'video');
    }

    @On('document')
    async onDocument(ctx: Context) {
        const document = ctx.message!['document'];
        const mime = document.mime_type || '';

        let resourceType: 'image' | 'video' | 'raw' = 'raw';
        if (mime.startsWith('image/')) resourceType = 'image';
        else if (mime.startsWith('video/')) resourceType = 'video';

        await this.uploadFile(ctx, document.file_id, resourceType);
    }

    @Action('my_files')
    async my_files(ctx: Context) {
        this.getMyFiles(ctx);
    }

    @Action('help_info')
    async onHelp(ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.reply(
            'Yordam: Menga rasm, video yoki fayl (3D model, PDF, ZIP) yuboring — ' +
            "men uni Cloudinary-ga yuklab, sizga qisqa link qaytaraman.",
        );
    }
}
