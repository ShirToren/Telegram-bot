var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const bodyParser = require("body-parser");

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

require("dotenv").config();

const fs = require("fs");

const URL = "https://parade.com/968666/parade/chuck-norris-jokes/";

const { createBot } = require("./bot");
let jokesData = [];

var app = express();

const SERVER_URL = "telegram-bot-express-app.azurewebsites.net";

function fetchJokesFromHTMLFile() {
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
  return jokesData;
}

const pageContentFilePath = path.join(__dirname, "page_content.html");

// fetch web page's HTML only one time and save it to a file, to avoid browser blocking.
// fetch only if this file is not exist.

if (!fs.existsSync(pageContentFilePath)) {
  // scrape jokes web page
  try {
    (async () => {
      const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto(URL);
      const htmlContent = await page.content();

      fs.writeFileSync("page_content.html", htmlContent, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log("File saved successfully!");
        }
      });

      jokesData = fetchJokesFromHTMLFile();

      //await browser.close();
    })();
  } catch (error) {
    console.log(error);
  }
} else {
  jokesData = fetchJokesFromHTMLFile();
}

createBot(jokesData);

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

module.exports = app;
