var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const bodyParser = require("body-parser");

const puppeteer = require("puppeteer");

require("dotenv").config();
const { Telegraf } = require("telegraf");

const cheerio = require("cheerio");
const axios = require("axios");
const request = require("request");
const fs = require("fs");

const URL = "https://parade.com/968666/parade/chuck-norris-jokes/";

let jokesData = [];

let targetLanguage = "";
let targetLanguageCode = "";

const endpoint = "https://api.cognitive.microsofttranslator.com/";
const subscriptionKey = "40d3984a6e53407ba91fbd316ab69d67";

const botToken = process.env.BOT_TOKEN;

const textToTranslate = "No problem";

var app = express();

const SERVER_URL = "telegram-bot-express-app.azurewebsites.net";

let languageCodes;

function readLanguagesCodes() {
  fs.readFile("languageCodes.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    languageCodes = JSON.parse(data);
  });
}

readLanguagesCodes();

// (async () => {
//   // const browser = await puppeteer.connect({
//   //   browserWSEndpoint: "wss://chrome.browserless.io/",
//   // });
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: null,
//   });

//   const page = await browser.newPage();
//   await page.goto(URL);
//   const htmlContent = await page.content();

//   console.log(htmlContent);

//   // Save HTML content to a file
//   fs.writeFile("page_content.html", htmlContent, (err) => {
//     if (err) {
//       console.error("Error writing file:", err);
//     } else {
//       console.log("File saved successfully!");
//     }
//   });

//   const jokesHTML = await page.$$(".m-detail--body li");

//   jokesData = jokesHTML.map((jokeHTML) =>
//     jokeHTML.evaluate((node) => node.textContent)
//   );

//   // Convert the list to a JSON string
//   const jsonData = JSON.stringify(jokesData, null, 2);

//   // Write the JSON string to a file
//   fs.writeFile("jokesList.json", jsonData, "utf8", (err) => {
//     if (err) {
//       console.error("Error writing file:", err);
//     } else {
//       console.log("File saved successfully!");
//     }
//   });
//   // await browser.close;
//   // const pages = await browser.pages();
//   // for (let i = 0; i < pages.length; i++) {
//   //   await pages[i].close();
//   // }
//   //await browser.close();
// })();

function fetchJokesFromPageHTML() {
  const htmlContent = fs.readFileSync("page_content.html", "utf8");
  const $ = cheerio.load(htmlContent);
  const jokesElements = $(".m-detail--body li");

  if (jokesElements.length > 0) {
    jokesElements.each((index, element) => {
      const text = $(element).text().trim();
      jokesData.push(text);
    });
  } else {
    console.log("No elements found with the specified selector.");
  }
}
fetchJokesFromPageHTML();

function translateText(textToTranslate, targetLanguageCode) {
  const translateUrl = `${endpoint}/translate?api-version=3.0&to=${targetLanguageCode}`;
  axios
    .post(translateUrl, [{ text: textToTranslate }], {
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-type": "application/json",
      },
    })
    .then((response) => {
      return response.data[0].translations[0].text;
    })
    .catch((error) => {
      console.error("Translation error:", error.response.data.error.message);
      return "";
    });
}

function findLanguageCode(language) {
  const capitalizedLanguage =
    language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();

  return languageCodes[capitalizedLanguage];
}

function createBot() {
  const bot = new Telegraf(botToken);

  bot.start((ctx) => {
    bot.telegram.sendMessage(ctx.chat.id, "Hello World!");
  });

  bot.command("Hello", (ctx) => ctx.reply("Hello command"));
  bot.hears("hi", (ctx) => ctx.reply("Hey there"));
  bot.hears(/^set language (.+)/i, (ctx) => {
    const message = ctx.message.text;
    const language = message.substring(13);
    targetLanguage = language;
    targetLanguageCode = findLanguageCode(targetLanguage);

    //////
    const translateUrl = `${endpoint}/translate?api-version=3.0&to=${targetLanguageCode}`;
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

  bot.on("text", (ctx) => {
    const userInput = parseInt(ctx.message.text); // Convert input to a number

    if (!isNaN(userInput)) {
      if (!targetLanguageCode) {
        ctx.reply("Please set language first");
      } else {
        try {
          const index = userInput - 1; // Adjust to zero-based index
          if (index >= 0 && index < jokesData.length) {
            const requestedJoke = jokesData[index];
            //////
            // Construct the request URL
            const translateUrl = `${endpoint}/translate?api-version=3.0&to=${targetLanguageCode}`;
            // Send POST request to Azure Translator Text API
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
            ctx.reply("Index out of range. Please enter a valid number.");
          }
        } catch (error) {
          console.error("Error:", error);
          ctx.reply("Failed to retrieve the list.");
        }
      }
    } else {
      ctx.reply("Please enter a valid number.");
    }
  });

  //bot.telegram.getWebhookInfo().then(console.log);
  bot.launch();
}

createBot();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.use(bodyParser.json());

// // Handle incoming webhook updates from Telegram
// app.post("/webhook", (req, res) => {
//   const { message } = req.body;
//   console.log("Received message:", message);
//   // Handle the received message here
//   res.sendStatus(200); // Respond to the Telegram server
// });

module.exports = app;
