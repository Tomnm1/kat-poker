const { createDriver } = require('../selenium-setup');
const { By, until } = require('selenium-webdriver');

// Helper function to simulate localStorage for the test
async function setLocalStorage(driver, key, value) {
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.startsWith('http://localhost:3000')) {
        throw new Error('Test is not running on the expected domain. Please start the app on http://localhost:3000');
    }

    await driver.executeScript(`window.localStorage.setItem("${key}", "${value}");`);
}

describe('Game Page Tests', function() {
    let driver;

    this.beforeEach(async function() {
        driver = await createDriver();
    });

    this.afterEach(async function() {
    await driver.quit();
    });

    it('should load the page and show elements', async function() {
        await driver.get('http://localhost:3000/game/session-1749479161005338900');  // Load the Game page

        // Ensure the page title and game name are displayed correctly
        const pageTitle = await driver.findElement(By.tagName('h1')).getText();
        if (!pageTitle.includes('Game:')) {
            throw new Error('Game title is incorrect');
        }

        // Ensure players list is present
        const playersList = await driver.findElement(By.xpath("//h3[text()='Players']"));
        if (!playersList) {
            throw new Error('Players list not found');
        }

        // Ensure the "Start Round" button is visible when round is not started
        const startRoundButton = await driver.findElement(By.xpath("//button[contains(text(), 'Start Round')]"));
        if (!startRoundButton) {
            throw new Error('Start Round button not found');
        }
    });

   it('should display error when game ID is missing', async function() {
    // Simulate a missing game ID by visiting an incorrect page
    await driver.get('http://localhost:3000/game/aaa');
 const usernameInput = await driver.findElement(By.css('input[placeholder="Enter your username"]'));
    if (!usernameInput) {
        throw new Error('Username input field not found');
    }

    // Enter a username into the input field
    const username = 'testuser';
    await usernameInput.sendKeys(username);

    // Simulate joining the game by clicking the "Join Game" button
    const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
    await joinGameButton.click();
    // Verify error message
    const errorMessageElement = await driver.findElement(By.css('.text-red-500.mb-4'));
    const errorMessage = await errorMessageElement.getText();
   if (errorMessage !== 'Sesja nie znaleziona') {
        throw new Error('Error message for missing game ID not shown');
    }
});

   it('should join the game successfully', async function() {
    await driver.get('http://localhost:3000/game/session-1749479181458540500');  // Simulate accessing game page

    // Ensure the username input field is visible
    const usernameInput = await driver.findElement(By.css('input[placeholder="Enter your username"]'));
    if (!usernameInput) {
        throw new Error('Username input field not found');
    }

    // Enter a username into the input field
    const username = 'aaa';
    await usernameInput.sendKeys(username);

    // Simulate joining the game by clicking the "Join Game" button
    const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
    await joinGameButton.click();

    // Ensure player is added successfully by checking if the player's name appears in the players list
    await driver.wait(until.elementLocated(By.xpath("//h3[text()='Players']")), 5000);
    const playersList = await driver.findElement(By.xpath("//ul/li[text()='aaa']"));
    if (!playersList) {
        throw new Error('Player did not join the game');
    }
});


    
    it('should quit the game', async function() {
    await driver.get('http://localhost:3000/game/session-1749478619132070100');  // Game page

 const usernameInput = await driver.findElement(By.css('input[placeholder="Enter your username"]'));
    if (!usernameInput) {
        throw new Error('Username input field not found');
    }

    // Enter a username into the input field
    const username = 'test';
    await usernameInput.sendKeys(username);

    // Simulate joining the game by clicking the "Join Game" button
    const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
    await joinGameButton.click();
    // Wait for the Quit Game button to be visible and clickable
    const quitButton = await driver.findElement(By.xpath("//button[contains(text(), 'Quit Game')]"));
    await driver.wait(until.elementIsVisible(quitButton), 5000);
    await driver.wait(until.elementIsEnabled(quitButton), 5000);  // Ensure the button is enabled

    // Click the Quit Game button
    await quitButton.click();

    // Ensure user is redirected to home page
   await driver.wait(until.elementLocated(By.linkText('Start a New Game')), 5000);  // Adjust based on your page structure

    // Verify the redirection happened
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl !== 'http://localhost:3000/') {
        throw new Error('Failed to navigate to home page. Current URL is ' + currentUrl);
    }
});
});
