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

describe('Join Game Page Tests', function() {
    let driver;

    before(async function() {
        driver = await createDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load the page and show elements', async function() {
        await driver.get('http://localhost:3000/joinGame');  // Make sure the page is served correctly

        // Ensure the page title is correct
        const pageTitle = await driver.findElement(By.tagName('h1')).getText();
        if (pageTitle !== 'Join an Existing Game') {
            throw new Error('Page title is incorrect');
        }

        // Ensure input field for game ID is present
        const inputField = await driver.findElement(By.css('input[placeholder="Enter Game ID"]'));
        if (!inputField) {
            throw new Error('Game ID input field not found');
        }

        // Ensure the join game button is present
        const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
        if (!joinGameButton) {
            throw new Error('Join Game button not found');
        }
    });

    it('should display error when game ID is empty', async function() {
        await driver.get('http://localhost:3000/joinGame');

        const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
        await joinGameButton.click();

        // Wait for error message to be displayed
        const errorMessage = await driver.findElement(By.css('p.text-red-500')).getText();
        if (errorMessage !== 'Game ID cannot be empty.') {
            throw new Error('Error message for empty Game ID not shown');
        }
    });

    it('should display error when game ID is invalid', async function() {
        // Simulate invalid Game ID
        await driver.get('http://localhost:3000/joinGame');

        const inputField = await driver.findElement(By.css('input[placeholder="Enter Game ID"]'));
        await inputField.sendKeys('invalid-game-id');  // Invalid Game ID

        const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
        await joinGameButton.click();

        // Wait for error message about non-existing game
        const errorMessage = await driver.findElement(By.css('p.text-red-500')).getText();
        if (errorMessage !== 'Game with the provided ID does not exist.') {
            throw new Error('Error message for invalid Game ID not shown');
        }
    });

    it('should create game and redirect to game page', async function() {
        // Simulate logged in state by setting localStorage items
        await setLocalStorage(driver, 'username', 'testuser');
        await setLocalStorage(driver, 'token', 'testtoken');
        
        // Simulate joining a valid game
        const gameId = 'session-1749478846281121400';
        await driver.get('http://localhost:3000/joinGame');

        const inputField = await driver.findElement(By.css('input[placeholder="Enter Game ID"]'));
        await inputField.sendKeys(gameId);

        const joinGameButton = await driver.findElement(By.xpath("//button[contains(text(), 'Join Game')]"));
        await joinGameButton.click();

        // Wait for the page to redirect to the game page
        await driver.wait(until.urlContains(`/game/${gameId}`), 5000);

        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes(`/game/${gameId}`)) {
            throw new Error('Redirection to game page failed');
        }
    });

    it('should navigate back to home page when "Back to Home" is clicked', async function() {
        await driver.get('http://localhost:3000/joinGame');
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
