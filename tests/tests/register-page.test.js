const { createDriver } = require('../selenium-setup');
const { By, until } = require('selenium-webdriver');

function generateRandomUsername() {
    const randomString = Math.random().toString(36).substring(2, 10); // Generate a random alphanumeric string
    return `user_${randomString}`;
}

describe('Registration Page Tests', function() {
    let driver;

    before(async function() {
        driver = await createDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load the registration page and check title', async function() {
        await driver.get('http://localhost:3000/register');
        const title = await driver.getTitle();
        if (title !== 'KAT poker') {
            throw new Error('Register page title is incorrect');
        }
    });

    it('should display error if fields are left empty', async function() {
        await driver.get('http://localhost:3000/register');

        const submitButton = await driver.findElement(By.xpath("//button[normalize-space(text())='Register']"));
        await submitButton.click();

        // Wait for the error message
        const errorMessage = await driver.findElement(By.css('p.text-red-500')).getText();
        if (errorMessage !== 'All fields are required.') {
            throw new Error('Error message for empty fields not shown');
        }
    });

    it('should display error if passwords do not match', async function() {
        await driver.get('http://localhost:3000/register');

        const usernameField = await driver.findElement(By.css('input[placeholder="Enter Username"]'));
        const passwordField = await driver.findElement(By.css('input[placeholder="Enter Password"]'));
        const confirmPasswordField = await driver.findElement(By.css('input[placeholder="Confirm Password"]'));

        // Fill out the form with mismatching passwords
       const randomUsername = generateRandomUsername();

        // Fill out the form with mismatching passwords
        await usernameField.sendKeys(randomUsername);
        await passwordField.sendKeys('password123');
        await confirmPasswordField.sendKeys('differentpassword123');

        const submitButton = await driver.findElement(By.xpath("//button[normalize-space(text())='Register']"));
        await submitButton.click();

        // Wait for the error message about passwords not matching
        const errorMessage = await driver.findElement(By.css('p.text-red-500')).getText();
        if (errorMessage !== 'Passwords do not match.') {
            throw new Error('Error message for password mismatch not shown');
        }
    });

    it('should successfully register and redirect to login page', async function() {
        await driver.get('http://localhost:3000/register');

        const usernameField = await driver.findElement(By.css('input[placeholder="Enter Username"]'));
        const passwordField = await driver.findElement(By.css('input[placeholder="Enter Password"]'));
        const confirmPasswordField = await driver.findElement(By.css('input[placeholder="Confirm Password"]'));

        // Fill out the form with matching passwords
        const randomUsername = generateRandomUsername();

        // Fill out the form with mismatching passwords
        await usernameField.sendKeys(randomUsername);
        await passwordField.sendKeys('password123');
        await confirmPasswordField.sendKeys('password123');

        const submitButton = await driver.findElement(By.xpath("//button[normalize-space(text())='Register']"));
        await submitButton.click();

        // Wait for the navigation to the login page
        await driver.wait(until.urlIs('http://localhost:3000/login'), 5000);
    });
});
