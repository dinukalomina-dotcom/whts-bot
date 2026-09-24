const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const crypto = require('crypto');

const app = express();
app.get('/', (req, res) => res.send('Bot Running!'));
app.listen(3000);

const bannedHashes = new Set();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    console.log('\n=== QR CODE ===');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot Online!');
});

client.on('message', async (msg) => {
    try {
        // 1. Sticker එක Ban කිරීම සඳහා !bansticker command එක භාවිතය
        if (msg.body === '!bansticker' && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.type === 'sticker') {
                const media = await quotedMsg.downloadMedia();
                if (media && media.data) {
                    const buffer = Buffer.from(media.data, 'base64');
                    const hash = crypto.createHash('md5').update(buffer).digest('hex');
                    
                    bannedHashes.add(hash);
                    await msg.reply('✅ Sticker banned successfully!');
                    console.log('Banned Sticker Hash:', hash);
                }
            }
        }

        // 2. ගෘප් එකක Banned කළ ස්ටිකරයක් දැමූ විට Auto-delete කිරීම
        if (msg.type === 'sticker') {
            const media = await msg.downloadMedia();
            if (media && media.data) {
                const buffer = Buffer.from(media.data, 'base64');
                const hash = crypto.createHash('md5').update(buffer).digest('hex');

                if (bannedHashes.has(hash)) {
                    await msg.delete(true);
                    console.log('🗑️ Banned sticker deleted automatically!');
                }
            }
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

client.initialize();
