const { Builder, By, Key, until } = require('selenium-webdriver');
require('chromedriver');

// Function to set up the driver
async function createDriver() {
    let driver = await new Builder().forBrowser('chrome').build();
    return driver;
}

module.exports = { createDriver };
