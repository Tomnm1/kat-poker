const { createDriver } = require("../selenium-setup");
const { By, until } = require("selenium-webdriver");

describe("Login Page Tests", function () {
  let driver;

  // Set a higher timeout for the tests (e.g., 10 seconds)
  this.timeout(10000);

  before(async function () {
    driver = await createDriver();
  });

  after(async function () {
    await driver.quit();
  });

  it("should load the login page and check title", async function () {
    await driver.get("http://localhost:3000/login");
    const title = await driver.getTitle();
    if (title !== "KAT poker") {
      throw new Error("Login page title is incorrect");
    }
  });

  it("should fill in the login form and submit", async function () {
    await driver.get("http://localhost:3000/login");

    const usernameField = await driver.findElement(By.css('input[placeholder="Enter Username"]'));
    const passwordField = await driver.findElement(By.css('input[placeholder="Enter Password"]'));
    const submitButton = await driver.findElement(By.xpath("//button[normalize-space(text())='Log In']"));

    // Input valid credentials and submit
    await usernameField.sendKeys("qwqw");
    await passwordField.sendKeys("qwqw");
    await submitButton.click();

    // Wait for navigation to dashboard or home page
    await driver.wait(until.urlIs("http://localhost:3000/"), 5000);
  });
});
