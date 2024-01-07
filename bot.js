require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");
const axios = require("axios");
const translatorEndpoint = "https://api.cognitive.microsofttranslator.com/";
const subscriptionKey = "40d3984a6e53407ba91fbd316ab69d67";
const botToken = process.env.BOT_TOKEN;
const textToTranslate = "No problem";

let languageCodes;
let targetLanguage;
let targetLanguageCode;

function findLanguageCode(language) {
  const capitalizedLanguage =
    language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();

  return languageCodes[capitalizedLanguage];
}

function readLanguagesCodes() {
  fs.readFile("languageCodes.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    languageCodes = JSON.parse(data);
  });
}

function createBot(jokesData) {
  readLanguagesCodes();

  const bot = new Telegraf(botToken);

  bot.start((ctx) => {
    bot.telegram.sendMessage(ctx.chat.id, "Welcome!");
  });

  bot.hears("hi", (ctx) => ctx.reply("Hey there"));
  // set language
  bot.hears(/^set language (.+)/i, (ctx) => {
    const message = ctx.message.text;
    const language = message.substring(13);
    targetLanguage = language;
    targetLanguageCode = findLanguageCode(targetLanguage);

    // translate response "No problem"
    const translateUrl = `${translatorEndpoint}/translate?api-version=3.0&to=${targetLanguageCode}`;
    axios
      .post(translateUrl, [{ text: textToTranslate }], {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-type": "application/json",
        },
      })
      .then((response) => {
        ctx.reply(response.data[0].translations[0].text);
      })
      .catch((error) => {
        console.error("Translation error:", error.response.data.error.message);
        ctx.reply(error.response.data.error.message);
      });
  });
  // show a joke by number
  bot.on("text", (ctx) => {
    const userInput = parseInt(ctx.message.text);

    if (!isNaN(userInput)) {
      if (!targetLanguageCode) {
        // the user asked for a joke without setting language before
        ctx.reply("Please set language first");
      } else {
        try {
          const index = userInput - 1; // Adjust to zero-based index
          if (index >= 0 && index < jokesData.length) {
            const requestedJoke = jokesData[index];
            // translate the requested joke
            const translateUrl = `${translatorEndpoint}/translate?api-version=3.0&to=${targetLanguageCode}`;
            axios
              .post(translateUrl, [{ text: requestedJoke }], {
                headers: {
                  "Ocp-Apim-Subscription-Key": subscriptionKey,
                  "Content-type": "application/json",
                },
              })
              .then((response) => {
                ctx.reply(
                  `${userInput}. ${response.data[0].translations[0].text}`
                );
              })
              .catch((error) => {
                console.error(
                  "Translation error:",
                  error.response.data.error.message
                );
              });
          } else {
            // index out of range
            const translateUrl = `${translatorEndpoint}/translate?api-version=3.0&to=${targetLanguageCode}`;
            axios
              .post(
                translateUrl,
                [{ text: "Index out of range. Please enter a valid number." }],
                {
                  headers: {
                    "Ocp-Apim-Subscription-Key": subscriptionKey,
                    "Content-type": "application/json",
                  },
                }
              )
              .then((response) => {
                ctx.reply(`${response.data[0].translations[0].text}`);
              })
              .catch((error) => {
                console.error(
                  "Translation error:",
                  error.response.data.error.message
                );
              });
          }
        } catch (error) {
          console.error("Error:", error);
          ctx.reply("Failed to retrieve the list.");
        }
      }
    } else {
      ctx.reply("Set a language for start reading some jokes");
    }
  });

  bot.launch();
}
module.exports = {
  createBot,
};
