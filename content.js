// content.js

// Get Browser
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Utility function to extract query string keys from a URL
function queryStringKeys(url) {
    const params = new URL(url).searchParams;
    return Array.from(params.keys());
}

// Utility function to find variable names from JavaScript
function findVariableNames(body) {
    const variableNamesRegex = /(let|const|var)\s+([\w\s,]+)/g;
    const variableNames = [];
    let match;

    while ((match = variableNamesRegex.exec(body)) !== null) {
        const names = match[2].split(',').map(name => name.trim());
        variableNames.push(...names);
    }

    return variableNames;
}

// Utility function to find JSON keys
function findJsonKeys(body) {
    const jsonObjectKeyRegex = /["']([\w\-]+)["']\s*:/g;
    const jsonKeys = [];
    let match;

    while ((match = jsonObjectKeyRegex.exec(body)) !== null) {
        jsonKeys.push(match[1]);
    }

    return jsonKeys;
}

// Utility function to find string format variables
function findStringFormatVariables(body) {
    const stringFormatRegex = /\${(\s*[\w\-]+)\s*}/g;
    const stringFormats = [];
    let match;

    while ((match = stringFormatRegex.exec(body)) !== null) {
        stringFormats.push(match[1]);
    }

    return stringFormats;
}

// Utility function to find function parameters
function findFunctionParameters(body) {
    const funcInputRegex = /\(\s*["']?([\w\-]+)["']?\s*(,\s*["']?([\w\-]+)["']?\s*)*(,\s*["']?([\w\-]+)["']?\s*)*\)/g;
    const functionParams = [];
    let match;

    while ((match = funcInputRegex.exec(body)) !== null) {
        for (let i = 1; i < match.length; i += 2) {
            if (match[i]) {
                functionParams.push(match[i]);
            }
        }
    }

    return functionParams;
}

// Utility function to find path parameters
function findPathParameters(body) {
    const pathInputRegex = /\/\{(.*?)\}/g;
    const pathParams = [];
    let match;

    while ((match = pathInputRegex.exec(body)) !== null) {
        pathParams.push(match[1]);
    }

    return pathParams;
}

// Utility function to find query string keys in the body
function findQueryStringKeys(body) {
    const queryStringRegex = /(\?([\w\-]+)=)|(\&([\w\-]+)=)/g;
    const queryKeys = [];
    let match;

    while ((match = queryStringRegex.exec(body)) !== null) {
        if (match[2]) queryKeys.push(match[2]);
        if (match[4]) queryKeys.push(match[4]);
    }

    return queryKeys;
}

// Utility function to find HTML name and ID attributes
function findHtmlAttributes(body, attribute) {
    const regex = new RegExp(`${attribute}\\s*=\\s*["|']([\\w\\-]+)["|']`, 'g');
    const attributes = [];
    let match;

    while ((match = regex.exec(body)) !== null) {
        attributes.push(match[1]);
    }

    return attributes;
}

// Global array for parameters (useful for checking reflections)
let params = [];

// Main function to find all parameters
async function findParameters() {
    const url = window.location.href;
    const body = document.body.innerHTML;

    const allParameters = [];

    // Extract parameters
    allParameters.push(...queryStringKeys(url));
    allParameters.push(...findVariableNames(body));
    allParameters.push(...findJsonKeys(body));
    allParameters.push(...findStringFormatVariables(body));
    allParameters.push(...findFunctionParameters(body));
    allParameters.push(...findPathParameters(body));
    allParameters.push(...findQueryStringKeys(body));

    // Assuming we are checking for application/javascript header (not available directly in JS, but for example)
    const contentType = document.contentType || ""; // Replace this with actual logic to check header

    if (contentType !== "application/javascript") {
        allParameters.push(...findHtmlAttributes(body, 'name'));
        allParameters.push(...findHtmlAttributes(body, 'id'));
    }

    // Remove duplicates and filter out empty values
    const uniqueParameters = [...new Set(allParameters.filter(param => param))];

    // Save all parameters into a global array to use it in the future
    uniqueParameters.forEach((param) => params.push(param));

    // Get the hostname of the current tab directly from the location
    const key = `${window.location.hostname}_all`;

    // Save the data to chrome.storage with the hostname as the key
    await browserAPI.storage.local.set({ [key]: params });
    console.log(`Data saved for ${key}`);
}

// Function to generate a random string of specified length
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Function to send requests with parameters
async function sendRequests(parameters, baseUrl) {
    const chunkSize = 30;
    const reflections = [];

    // Split parameters into chunks
    for (let i = 0; i < parameters.length; i += chunkSize) {
        const chunk = parameters.slice(i, i + chunkSize);

        // Create a dictionary to store the random values that are generated for each parameter
        const paramValues = chunk.map(param => {
            const randomValue = generateRandomString(5);  // Generate the random value for each parameter
            return { param, randomValue };  // Return both the parameter and its random value
        });

        // Construct the query string using the generated random values
        const queryString = paramValues.map(({ param, randomValue }) => `${encodeURIComponent(param)}=${encodeURIComponent(randomValue)}`).join('&');
        const url = `${baseUrl}?${queryString}`;
        try {
            const response = await fetch(url);
            const text = await response.text();

            // Check for reflections using the same random values that were sent in the request
            paramValues.forEach(({ param, randomValue }) => {
                if (text.includes(randomValue)) {
                    //console.log(`Parameter ${param} with value ${randomValue} is reflected in the response.`);
                    reflections.push(param);
                }
            });

        } catch (error) {
            console.error(`Error fetching URL: ${url}`, error);
        }
    }
    console.log(reflections);
    const key = `${window.location.hostname}_refs`;
    browserAPI.storage.local.set({ [key]: reflections });
    console.log('Saved Reflections');
    // Connect to the popup
    const port = chrome.runtime.connect({ name: "content-to-popup" });

    // Send a message to the popup
    port.postMessage({ state: "checked" });
}

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendMessageToContent') {
        if (message.message === "check") {
            setTimeout(sendRequests(params, window.location.href), 0);
        }
    }
});

// Execute the findParameters function when the page is fully loaded
window.addEventListener('load', findParameters);

// Clear the local storage whenever the webpage gets closed
window.addEventListener('beforeunload', async function () {

    const refsKey = `${window.location.hostname}_refs`;
    const allKey = `${window.location.hostname}_all`;
    const scrollKey = `${window.location.hostname}_scrollPosition`;
    // Remove Parameters
    await browserAPI.storage.local.remove(refsKey);
    await browserAPI.storage.local.remove(allKey);
    console.log('Storage cleared');
});
