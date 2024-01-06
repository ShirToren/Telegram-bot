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

const fs = require("fs");

const URL = "https://parade.com/968666/parade/chuck-norris-jokes/";

var app = express();

const SERVER_URL = "telegram-bot-express-app.azurewebsites.net";

const { createBot } = require("./bot");
const { fetchPageHTML, fetchJokesFromPageHTML } = require("./webScraper");

const filePath = path.join(__dirname, "page_content.html");

fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    try {
      (async () => {
        // const browser = await puppeteer.connect({
        //   browserWSEndpoint: "wss://chrome.browserless.io/",
        // });
        const browser = await puppeteer.launch({
          headless: true,
          defaultViewport: null,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.goto(URL);
        const htmlContent = await page.content();

        //console.log(htmlContent);

        // Save HTML content to a file
        fs.writeFile("page_content.html", htmlContent, (err) => {
          if (err) {
            console.error("Error writing file:", err);
          } else {
            console.log("File saved successfully!");
            //console.log(htmlContent);
          }
        });

        const jokesHTML = await page.$$(".m-detail--body li");

        jokesData = jokesHTML.map((jokeHTML) =>
          jokeHTML.evaluate((node) => node.textContent)
        );

        // Convert the list to a JSON string
        const jsonData = JSON.stringify(jokesData, null, 2);

        // Write the JSON string to a file
        fs.writeFile("jokesList.json", jsonData, "utf8", (err) => {
          if (err) {
            console.error("Error writing file:", err);
          } else {
            console.log("File saved successfully!");
          }
        });
        // await browser.close;
        // const pages = await browser.pages();
        // for (let i = 0; i < pages.length; i++) {
        //   await pages[i].close();
        // }
        //await browser.close();
      })();
    } catch (error) {
      console.log(error);
    }
  }
});

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
