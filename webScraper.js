const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const URL = "https://parade.com/968666/parade/chuck-norris-jokes/";
let jokesData = [];

function fetchJokesFromPageHTML() {
  const htmlContent = fs.readFileSync("page_content.html", "utf8");
  console.log("fetched content ::::::::::::::::::::::::::::::" + htmlContent);
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

// async function fetchPageHTML() {
//   //   const browser = await puppeteer.connect({
//   //     browserWSEndpoint: "wss://chrome.browserless.io/",
//   //   });
//   const browser = await puppeteer.launch({
//     headless: true,
//     defaultViewport: null,
//   });

//   const page = await browser.newPage();
//   await page.goto(URL);
//   const htmlContent = await page.content();

//   //console.log(htmlContent);

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
// }

module.exports = {
  fetchJokesFromPageHTML,
  //fetchPageHTML,
};
