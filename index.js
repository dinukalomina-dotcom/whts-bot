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
    console.log('✅ Bot Online and Ready!');
});

// message වෙනුවට message_create භාවිත කිරීම
client.on('message_create', async (msg) => {
    try {
        console.log(`[MSG_CREATE] From: ${msg.from} | Body: ${msg.body} | Type: ${msg.type}`);

        // !bansticker විධානය පරීක්ෂා කිරීම
        if (msg.body && msg.body.trim() === '!bansticker' && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            console.log('Quoted message type:', quotedMsg.type);
            
            if (quotedMsg.type === 'sticker') {
                const media = await quotedMsg.downloadMedia();
                if (media && media.data) {
                    const buffer = Buffer.from(media.data, 'base64');
                    const hash = crypto.createHash('md5').update(buffer).digest('hex');
                    
                    bannedHashes.add(hash);
                    await msg.reply('✅ Sticker banned successfully!');
                    console.log('🔒 Banned Sticker Hash Added:', hash);
                } else {
                    await msg.reply('❌ Could not download sticker media.');
                }
            } else {
                await msg.reply('❌ Please reply to a sticker!');
            }
        }

        // ස්ටිකරයක් පැමිණි විට බෑන් කර ඇත්දැයි පරීක්ෂා කර මකා දැමීම (තමන් එවූ ඒවා හැර අනෙක් ඒවා)
        if (msg.type === 'sticker' && !msg.fromMe) {
            const media = await msg.downloadMedia();
            if (media && media.data) {
                const buffer = Buffer.from(media.data, 'base64');
                const hash = crypto.createHash('md5').update(buffer).digest('hex');

                if (bannedHashes.has(hash)) {
                    await msg.delete(true);
                    console.log('🗑️ Banned sticker deleted automatically!');
                } else {
                    console.log('ℹ️ Safe sticker hash:', hash);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error);
    }
});

client.initialize();
