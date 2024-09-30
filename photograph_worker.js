const CLOUDFLARE_ACCOUNT_ID = "747065b1adc6a0ad30cfc001dde4d491";
const CLOUDFLARE_API_TOKEN = "II2XJwvlAGfxxsR_HTpTKd_j3O2X4Z-Gze9pnBQR";
const CLOUDFLARE_BUCKET_NAME = "photos";
const TOKEN = "8033103156:AAF6GGozkz7ImI63EC8atcSjkHFUYb6ztPY";

// Add event listener for fetch
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const update = await request.json();
  const message = update.message;

  // Initialize Telegram class
  const bot = new Telegram(TOKEN);
  // Initialize CloudflareR2 class
  let cloudflareR2 = new CloudflareR2();

  // Handle text messages
  if (message !== undefined && message.text !== undefined) {
    const text = message.text.toLowerCase();
    bot.sendMessage(message.chat.id, "You said: " + text);

    const command = message.text.split(" ");
    switch (command[0]) {
      case "/send":
      // send photo to channel or user

      default:
        return await bot.sendMessage(
          message.from.id,
          "Unknown command",
          "markdown",
          true,
          true,
          message.message_id
        );
    }
  }

  // Handle photo uploads
  if (message !== undefined && message.photo !== undefined) {
    // get the photos from the message
    const fileID = message.photo[message.photo.length - 1].file_id;
    const filePath = await bot.getFile(fileID);
    const filePathJSON = await filePath.json();
    console.log(filePathJSON, "json");
    const url = `https://api.telegram.org/file/bot${TOKEN}/${filePathJSON.result.file_path}`;
    const image = await fetch(url);

    // save to cloudflare R2
    const imageBuffer = await image.arrayBuffer();
    const filename = `image_${Date.now()}.jpg`;
    const result = await cloudflareR2.upload(imageBuffer, filename);
    const resultJSON = await result.json();
    console.log(resultJSON, "resultJSON");
  

    // save imageUrl to D1
    let cloudflareURL = `https://pub-9350f14105fb48d49bb0de3e2822bc9e.r2.dev/${filename}.jpg`;

    console.log(cloudflareURL, "cloudflareURL", url);

    await bot.sendPhoto(message.from.id, cloudflareURL);
  }

  return new Response();
}

// Telegram class definition
class Telegram {
  constructor(token) {
    this.token = token;
    this.api = "https://api.telegram.org/bot" + token;
    this.fileApi = "https://api.telegram.org/file/bot" + token;
  }
  async sendMessage(
    chat_id,
    text,
    parse_mode,
    disable_web_page_preview,
    disable_notification,
    reply_to_message_id,
    reply_markup
  ) {
    return await fetch(this.api + "/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: text,
        parse_mode: parse_mode,
        disable_web_page_preview: disable_web_page_preview,
        disable_notification: disable_notification,
        reply_to_message_id: reply_to_message_id,
        reply_markup: reply_markup,
      }),
    });
  }
  async sendPhoto(chat_id, photo) {
    const apiUrl = `${this.api}/sendPhoto`;
    const params = {
      chat_id: chat_id,
      photo: photo,
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        return new Response("Message sent successfully!", { status: 200 });
      } else {
        return new Response("Failed to send message.", { status: 500 });
      }
    } catch (error) {
      console.error("Error sending photo:", error);
      throw error; // Re-throw the error for the caller to handle
    }
  }
  async getFile(file_id) {
    return await fetch(this.api + "/getFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_id: file_id,
      }),
    });
  }
}

// CloudflareR2 class definition
class CloudflareR2 {
  constructor() {
    this.url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces`;
  }

  async upload(image, filename) {
    const url = `${this.url}/${CLOUDFLARE_BUCKET_NAME}/values/${filename}`;
    const headers = new Headers({
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/octet-stream",
    });

    return await fetch(url, {
      method: "PUT",
      headers: headers,
      body: image,
    });
  }
}

class cloudflareD1 {
  constructor() {
    // this.url = `https://pub-9350f14105fb48d49bb0de3e2822bc9e.r2.dev/`;
  }


}