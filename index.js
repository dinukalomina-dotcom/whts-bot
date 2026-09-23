const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const crypto = require('crypto');

const app = express();
app.get('/', (req, res) => res.send('Bot Running!'));
app.listen(3000);

const bannedHashes = [];
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
    console.log('\n=== QR CODE ===');
    qrcode.generate(qr, { small: true });
    console.log('Scan කරන්න!\n');
});

client.on('ready', () => console.log('✅ Bot Online!'));

client.on('message_create', async (msg) => {
    if (msg.hasQuotedMsg && msg.body === '!bansticker') {
        const quoted = await msg.getQuotedMessage();
        if (quoted.type === 'sticker') {
            const media = await quoted.downloadMedia();
            const buffer = Buffer.from(media.data, 'base64');
            const hash = crypto.createHash('md5').update(buffer).digest('hex');
            
            bannedHashes.push(hash);
            await msg.reply('✅ Sticker banned!');
        }
    }

    if (msg.type === 'sticker') {
        const media = await msg.downloadMedia();
        const buffer = Buffer.from(media.data, 'base64');
        const hash = crypto.createHash('md5').update(buffer).digest('hex');

        if (bannedHashes.includes(hash)) {
            await msg.delete(true);
        }
    }
});

client.initialize();
