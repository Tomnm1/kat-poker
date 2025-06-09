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

describe('Second Page Tests', function() {
    let driver;

    before(async function() {
        driver = await createDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load the page and show elements', async function() {
        await driver.get('http://localhost:3000/newgame');  // Make sure the page is served correctly

        // Ensure the page title is correct
        const pageTitle = await driver.findElement(By.tagName('h1')).getText();
        if (pageTitle !== 'New Game') {
            throw new Error('Page title is incorrect');
        }

        // Ensure input field for game name is present
        const inputField = await driver.findElement(By.css('input[placeholder="Enter game name"]'));
        if (!inputField) {
            throw new Error('Game name input field not found');
        }

        // Ensure the create game button is present
        const createGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Create Game')]"));
        if (!createGameButton) {
            throw new Error('Create Game button not found');
        }
    });

    it('should display error when game name is empty', async function() {
        await driver.get('http://localhost:3000/newgame');

        const createGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Create Game')]"));
        await createGameButton.click();

        // Wait for error message to be displayed
        const errorMessage = await driver.findElement(By.css('p.text-red-500')).getText();
        if (errorMessage !== 'Game name cannot be empty.') {
            throw new Error('Error message for empty game name not shown');
        }
    });

    it('should create game and redirect to game page', async function() {
        // Simulate logged in state by setting localStorage items
        await setLocalStorage(driver, 'username', 'testuser');
        await setLocalStorage(driver, 'token', 'testtoken');
        
        // Simulate creating a game
        const gameName = 'Test Game';
        await driver.get('http://localhost:3000/newgame');

        const inputField = await driver.findElement(By.css('input[placeholder="Enter game name"]'));
        await inputField.sendKeys(gameName);

        const createGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Create Game')]"));
        await createGameButton.click();

        // Wait for the page to redirect to the new game page
        await driver.wait(until.urlContains('/game/'), 5000);

        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('/game/')) {
            throw new Error('Redirection to game page failed');
        }
    });
it('should navigate back to home page when "Back to Home" is clicked', async function() {
    // Increase the timeout for this specific test
    this.timeout(15000);  // Set timeout to 15 seconds (15000 ms)

    await driver.get('http://localhost:3000/newgame'); // Go to the new game page

    const backToHomeButton = await driver.findElement(By.linkText('Back to Home'));
    await backToHomeButton.click();

    // Wait for an element unique to the home page (like a specific header, logo, etc.)
    // For example, waiting for the "Start a New Game" button to be present on the home page
    await driver.wait(until.elementLocated(By.linkText('Start a New Game')), 5000);  // Adjust based on your page structure

    // Verify the redirection happened
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl !== 'http://localhost:3000/') {
        throw new Error('Failed to navigate to home page. Current URL is ' + currentUrl);
    }
});


});
