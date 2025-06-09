const { createDriver } = require("../selenium-setup");
const { By, until } = require("selenium-webdriver");

// Helper function to simulate localStorage for the test
async function setLocalStorage(driver, key, value) {
  // Ensure the page is loaded correctly and is served via HTTP
  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.startsWith("http://127.0.0.1:3000")) {
    throw new Error("Test is not running on the expected domain. Please start the app on http://127.0.0.1:3000");
  }

  await driver.executeScript(`window.localStorage.setItem("${key}", "${value}");`);
}

describe("Home Page Tests", function () {
  let driver;

  this.beforeEach(async function () {
    driver = await createDriver();
  });

  this.afterEach(async function () {
    //
  await driver.quit();
  });

  it("should show login link when not logged in", async function () {
    // Simulate logged out state by clearing localStorage

    await driver.get("http://127.0.0.1:3000"); // Ensure it is running on the expected domain

    // Check that the Login link is visible
    const loginLink = await driver.findElement(By.linkText("Login"));
    const loginLinkText = await loginLink.getText();
    if (loginLinkText !== "Login") {
      throw new Error("Login link not found when logged out");
    }
  });

  it("should show logout button when logged in", async function () {
    await driver.get("http://127.0.0.1:3000");
    // Simulate logged in state by setting localStorage items
    await setLocalStorage(driver, "username", "testuser");
    await setLocalStorage(driver, "token", "testtoken");
    await driver.get("http://127.0.0.1:3000");
        const usernameText = await driver.findElement(By.xpath("//p[contains(text(), 'Logged in as')]")).getText();
    if (!usernameText.includes("Logged in as testuser")) {
      throw new Error("Username not displayed when logged in");
    }

    const logoutButton = await driver.findElement(By.xpath("//button[contains(text(), 'Logout')]"));
    if (!logoutButton) {
      throw new Error("Logout button not found when logged in");
    }
  });

  it('should navigate to new game page when "Start a New Game" is clicked', async function () {
    await driver.get("http://127.0.0.1:3000");
    const startNewGameLink = await driver.findElement(By.linkText("Start a New Game"));
    await startNewGameLink.click();

    // Wait for navigation to the new game page
    await driver.wait(until.urlIs("http://127.0.0.1:3000/newgame"), 5000);
  });

  it('should navigate to join game page when "Join an Existing Game" is clicked', async function () {
    await driver.get("http://127.0.0.1:3000");
    const joinGameLink = await driver.findElement(By.linkText("Join an Existing Game"));
    await joinGameLink.click();

    // Wait for navigation to the join game page
    await driver.wait(until.urlIs("http://127.0.0.1:3000/joinGame"), 5000);
  });
});
