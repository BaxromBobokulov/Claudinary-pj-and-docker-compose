import { Action, Command, Ctx, On, Sender, Start, Update } from 'nestjs-telegraf';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Context, Markup } from 'telegraf';
import { PrismaService } from 'src/core/database/database.service';

@Update()
export class BotUpdate {
    constructor(
        private readonly fileservice: FileUploadService,
        private prisma: PrismaService) { }

    @Start()
    async onStart(ctx: Context) {
        const welcomeMessage =
            `👋 **Salom, ${ctx.from!.first_name}!**\n\n` +
            `🚀 **CloudVault** — bu sizning fayllaringizni bulutga yuklovchi va ularga qisqa linklar beruvchi aqlli yordamchingiz.\n\n` +
            `🛠 **Nimalar qila olaman?**\n` +
            `• Rasmlarni Cloudinary-ga yuklayman.\n` +
            `• Uzun linklarni qisqartirib beraman.\n` +
            `• Yuklamalaringiz statistikasini yuritaman.\n\n` +
            `📸 Shunchaki rasm yuboring va sinab ko'ring!`;

        // Loyihangiz logotipi linki (Cloudinary-ga yuklab olingan bitta chiroyli rasm)
        const logoUrl = 'https://res.cloudinary.com/dqhktodib/image/upload/v1773309918/u2qqzrem5a2qbcxi93wa.jpg';

        await ctx.replyWithPhoto(logoUrl, {
            caption: welcomeMessage,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📊 Mening fayllarim', 'my_files')],
                [Markup.button.callback('ℹ️ Yordam', 'help_info')]
            ])
        });
    }


    @Command('files')
    async getMyFiles(ctx: Context) {
        const files = await this.fileservice.myFiles(1, 10, ctx)

        if (files.length === 0) {
            return await ctx.reply("Siz hali yuklangan fayllar yo'q.")
        }

        let responseMessage = "📁 **Sizning yuklangan fayllaringiz:**\n\n"

        files.forEach((file, index) => {
            responseMessage += `🔗 Link: http://localhost:3000/file-upload/${file.shortlink}\n`;
            responseMessage += `👁 Ko'rishlar: ${file.clicks}\n`;
            responseMessage += `------------------------\n`;
        });

        await ctx.reply(responseMessage, { parse_mode: 'HTML' });
    }

    // @Command('file')
    // async get(ctx: Context) {
    //     const files = await this.fileservice.myFiles(1, 10, ctx);

    //     if (!files || files.length === 0) {
    //         return await ctx.reply("Sizda hali yuklangan fayllar yo'q.");
    //     }

    //     for (const file of files) {
    //         // file.originalUrl - bu Cloudinary-dagi rasm linki bo'lishi kerak
    //         const text = `📄 <b>Fayl:</b> <code>${file.shortlink}</code>\n` +
    //             `👁 <b>Ko'rishlar:</b> ${file.clicks}`;

    //         await ctx.reply(text, {
    //             parse_mode: 'HTML',
    //             ...Markup.inlineKeyboard([
    //                 [
    //                     // 1-tugma: To'g'ridan-to'g'ri rasmga (browserda) olib boradi
    //                     Markup.button.url('Korish 👁', file.original),

    //                     // 2-tugma: Botga 'delete_...' xabarini yuboradi
    //                     Markup.button.callback('Ochirish 🗑', `delete_${file.shortlink}`)
    //                 ]
    //             ])
    //         });
    //     }
    // }

@On('photo')
async postPhoto(ctx: Context) {
    const photo = ctx.message!['photo'];
    const fileId = photo[photo.length - 1].file_id;
    const userId = ctx.from?.id.toString();

    if (!userId) return;

    // 1. Limit tekshiruvi (Buni qoldiramiz, foydalanuvchiga darrov javob berish uchun)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uploadCount = await this.prisma.resource.count({
        where: { ownerId: userId, createdAt: { gte: today } },
    });

    if (uploadCount >= 3) {
    await ctx.reply("⛔ Kunlik limit tugadi (3/3)");
    return
    }

    // 2. Yuklash jarayoni
    const file = await ctx.telegram.getFile(fileId);
    const fullUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    const statusMsg = await ctx.reply("⏳ Yuklanmoqda...");

    try {
        const result = await this.fileservice.uploadFromUrl(fullUrl);
        const end = await this.fileservice.create(result, userId); // Faqat userId uzatamiz

        await ctx.telegram.deleteMessage(ctx.chat!.id, statusMsg.message_id); // "Yuklanmoqda"ni o'chirib tashlaymiz
        
        await ctx.reply(`✅ Saqlandi!\n\n🔗 Link: <code>${end.shortUrl}</code>`, { parse_mode: 'HTML' });
    } catch (e) {
        await ctx.reply("❌ Yuklashda xato yuz berdi.");
    }
}

    @Action('my_files')
    async my_files(ctx: Context) {
        this.getMyFiles(ctx)
    }

    @Action('help_info')
    async onHelp(ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.reply("Yordam: Menga rasm yuboring, men uni Cloudinary-ga yuklab, sizga qisqa link qaytaraman.");
    }


}
