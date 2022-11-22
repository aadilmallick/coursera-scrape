const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const courseraURL = "https://www.coursera.org/?authMode=login";
const courses = [];
const fs = require("fs/promises");

async function setup() {
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto("https://accounts.google.com/signin/v2/identifier");
  return { page, browser };
}

async function login(email, password) {
  const { page, browser } = await setup();
  console.log("in login", email, password);
  await page.type('[type="email"]', email);
  await page.click("#identifierNext");
  await page.waitForTimeout(8000);

  await page.type('[type="password"', password);
  await page.click("#passwordNext");

  await page.waitForTimeout(6000);
  return { browser };
}

async function coursera_setup(email, password) {
  const { browser } = await login(email, password);
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1200 });
  await page.goto(courseraURL);

  await Promise.all([
    page.click("._dfm2a9 button:first-child"),
    page.waitForNavigation(),
  ]);

  await Promise.all([
    page.click(".logged-in-home-nav-container ul li:nth-child(2)"),
    page.waitForNavigation(),
  ]);

  return { page, browser };
  //   await browser.close();
}

async function run(email, password) {
  console.log("In run", email, password);
  const { page, browser } = await coursera_setup(email, password);
  let nextIsDisabled = false;
  while (!nextIsDisabled) {
    await page.waitForSelector(".rc-LoggedInHome-CourseCards > div");
    const courseData = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        ".rc-LoggedInHome-CourseCards > div"
      );
      return Array.from(cards, (e) => ({
        title: e.querySelector(".card-title").textContent,
        url: e.querySelector("a:nth-child(2)").href,
        image: {
          src: e.querySelector("img").src,
          alt: e.querySelector("img").alt,
        },
      }));
    });
    courses.push(...courseData);
    await page.waitForSelector("div[role='navigation'] button:last-child");
    nextIsDisabled = await page.evaluate(() => {
      const nextButton = document.querySelector(
        "div[role='navigation'] button:last-child"
      );
      return nextButton.disabled;
    });
    if (nextIsDisabled) {
      break;
    }

    await Promise.all([
      page.click("div[role='navigation'] button:last-child"),
      page.waitForNavigation(),
    ]);
  }

  console.log("courses fetched!");
  await fs.writeFile("courses.json", JSON.stringify(courses));
  console.log("file written!");
  await browser.close();
}

// TODO: create express server. You can choose to upload a json file or fetch courses using puppeteer
// * if fetching from puppeteer, ask for google email and password, and then after fetching, download a json file to the browser
// * Accept file upload json, parse it, navigate to new route showing courses
// * Accept json paste, parse it, navigate to new route showing courses

module.exports = {
  run,
};
