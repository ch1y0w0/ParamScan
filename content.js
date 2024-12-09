// content.js

// Get Browser API (Chrome or Firefox)
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

/**
 * Utility function to extract query string parameter keys from a URL.
 * @param {string} url - The URL to extract parameters from.
 * @returns {Array} - An array of query string parameter keys.
 */
function extractQueryStringKeys(url) {
    const params = new URL(url).searchParams;
    return Array.from(params.keys());
}

/**
 * Utility function to find variable names in JavaScript code.
 * @param {string} body - The HTML or script body to search.
 * @returns {Array} - An array of variable names.
 */
function findVariableNames(body) {
    const variableRegex = /(let|const|var)\s+([\w\s,]+)/g;
    const variableNames = [];
    let match;

    while ((match = variableRegex.exec(body)) !== null) {
        const names = match[2].split(',').map(name => name.trim());
        variableNames.push(...names);
    }

    return variableNames;
}

/**
 * Utility function to find keys in a JSON object from JavaScript code.
 * @param {string} body - The JavaScript code containing JSON data.
 * @returns {Array} - An array of JSON keys.
 */
function findJsonKeys(body) {
    const jsonKeyRegex = /["']([\w\-]+)["']\s*:/g;
    const jsonKeys = [];
    let match;

    while ((match = jsonKeyRegex.exec(body)) !== null) {
        jsonKeys.push(match[1]);
    }

    return jsonKeys;
}

/**
 * Utility function to find variables inside string formatting in JavaScript.
 * @param {string} body - The JavaScript code to search for string format variables.
 * @returns {Array} - An array of string format variables.
 */
function findStringFormatVariables(body) {
    const stringFormatRegex = /\${(\s*[\w\-]+)\s*}/g;
    const stringFormats = [];
    let match;

    while ((match = stringFormatRegex.exec(body)) !== null) {
        stringFormats.push(match[1]);
    }

    return stringFormats;
}

/**
 * Utility function to find function parameters in JavaScript.
 * @param {string} body - The JavaScript code to search for function parameters.
 * @returns {Array} - An array of function parameter names.
 */
function findFunctionParameters(body) {
    const funcParamsRegex = /\(\s*["']?([\w\-]+)["']?\s*(,\s*["']?([\w\-]+)["']?\s*)*(,\s*["']?([\w\-]+)["']?\s*)*\)/g;
    const functionParams = [];
    let match;

    while ((match = funcParamsRegex.exec(body)) !== null) {
        for (let i = 1; i < match.length; i += 2) {
            if (match[i]) {
                functionParams.push(match[i]);
            }
        }
    }

    return functionParams;
}

/**
 * Utility function to find dynamic path parameters (e.g., /{id}) in a URL.
 * @param {string} body - The JavaScript code to search for path parameters.
 * @returns {Array} - An array of path parameter names.
 */
function findPathParameters(body) {
    const pathParamRegex = /\/\{(.*?)\}/g;
    const pathParams = [];
    let match;

    while ((match = pathParamRegex.exec(body)) !== null) {
        pathParams.push(match[1]);
    }

    return pathParams;
}

/**
 * Utility function to find query string keys inside the HTML body.
 * @param {string} body - The body of the page to search for query parameters.
 * @returns {Array} - An array of query string parameter keys.
 */
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

/**
 * Utility function to find specific HTML attributes (name, id) in the body.
 * @param {string} body - The body of the page to search.
 * @param {string} attribute - The HTML attribute to search for ('name' or 'id').
 * @returns {Array} - An array of attribute values.
 */
function findHtmlAttributes(body, attribute) {
    const regex = new RegExp(`${attribute}\\s*=\\s*["|']([\\w\\-]+)["|']`, 'g');
    const attributes = [];
    let match;

    while ((match = regex.exec(body)) !== null) {
        attributes.push(match[1]);
    }

    return attributes;
}


async function correctUrls(arr) {
  // Check if arr is an array and exists
  if (Array.isArray(arr)) {
    return arr.map(item => {
      if (item.startsWith('https://') || item.startsWith('http://')) {
        // If the URL starts with "https://" or "http://", leave it as is
        return item;
      } else if (item.startsWith('/')) {
        // If the URL starts with "/", remove the "/" and add window.location.origin to the start
        return window.location.origin + item;
      } else {
        // If the URL doesn't start with "/" or "https://", add window.location.origin to the start
        return window.location.origin + '/' + item;
      }
    });
  }
  // Return undefined or the original value if arr is not provided or not an array
  return arr;
}

async function findJSFiles(body) {

  const regex = /<script[^>]*\s+src=["']([^"']+\.js)["'][^>]*>/gi;

  let match;

  const sources = [];

  // Extract all .js file sources from the HTML
  while ((match = regex.exec(body)) !== null) {
    sources.push(match[1]);  // match[1] contains the .js file source
  }
  
  try {
    // Wait for corrected URLs (if correctUrls is asynchronous)
    const correctedSources = await correctUrls(sources);

    // Check if correctedSources is a valid array and not empty
    if (Array.isArray(correctedSources) && correctedSources.length > 0) {
      // Iterate over each URL and fetch its content
      for (const url of correctedSources) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const body = await response.text();
            extractParameters(body);  // Pass the body to your function
          } else {
            console.error(`Failed to fetch ${url}: ${response.status}`);
          }
        } catch (error) {
          console.error(`Error fetching ${url}: ${error}`);
        }
      }
    } else {
      console.log('No valid URLs to process');
    }
  } catch (error) {
    console.error('Error processing corrected URLs:', error);
  }
}


// Global array for storing parameters
let params = [];

/**
 * Main function to extract parameters from the page (URL and body).
 * @returns {Promise} - A promise that resolves after parameters are saved to storage.
 */
async function extractParameters(body) {

    const url = window.location.href;
    const allParameters = [];

    // Extract various types of parameters
    allParameters.push(...extractQueryStringKeys(url));
    allParameters.push(...findVariableNames(body));
    allParameters.push(...findJsonKeys(body));
    allParameters.push(...findStringFormatVariables(body));
    allParameters.push(...findFunctionParameters(body));
    allParameters.push(...findPathParameters(body));
    allParameters.push(...findQueryStringKeys(body));

    // Check content type and decide if HTML attributes should be included
    const contentType = document.contentType || "";  // Replace with actual logic to check headers
    if (contentType !== "application/javascript") {
        allParameters.push(...findHtmlAttributes(body, 'name'));
        allParameters.push(...findHtmlAttributes(body, 'id'));
    }

    // Remove duplicates and filter out empty values
    const uniqueParameters = [...new Set(allParameters.filter(param => param))];

    // Save the unique parameters globally for future use
    uniqueParameters.forEach(param => params.push(param));

    // Restore checkbox state
    browserAPI.storage.local.get(`regex_checkbox_${window.location.hostname}`, async function(result){
        const regexCheckBoxState = result[`regex_checkbox_${window.location.hostname}`];

        if(regexCheckBoxState !== null){
            if(regexCheckBoxState === true){
                    // Get regex pattern
                    await browserAPI.storage.local.get(`regex_pattern_${window.location.hostname}`, (result) => {
                        const regexPattern = result[`regex_pattern_${window.location.hostname}`];

                        if(regexPattern !== null){
                            params = params.filter(param => param.match(regexPattern));
                            // Save matched parameters to storage, keyed by hostname
                            const key = `${window.location.hostname}_all`;
                            browserAPI.storage.local.set({ [key]: params });
                            console.log(`Parameters saved for ${key}`);
                        } else {
                            // Save parameters to storage, keyed by hostname
                            const key = `${window.location.hostname}_all`;
                            browserAPI.storage.local.set({ [key]: params });
                            console.log(`Parameters saved for ${key}`);
                        }
                    });
            } else {
                // Save parameters to storage, keyed by hostname
                const key = `${window.location.hostname}_all`;
                browserAPI.storage.local.set({ [key]: params });
                console.log(`Parameters saved for ${key}`);
            }
        } else {
            // Save parameters to storage, keyed by hostname
            const key = `${window.location.hostname}_all`;
            browserAPI.storage.local.set({ [key]: params });
            console.log(`Parameters saved for ${key}`);
        }
    // Retrieve the checkbox state from chrome.storage.local
    await browserAPI.storage.local.get(`ref_checkbox_${window.location.hostname}`, function (result) {
    const refCheckBoxIsChecked = result[`ref_checkbox_${window.location.hostname}`];

    // Auto reflection test if the checkbox is checked
    if (refCheckBoxIsChecked === true){
        setTimeout(async () => await sendRequests(params, window.location.href), 0);
    }
});
});
}

/**
 * Generate a random alphanumeric string of the given length.
 * @param {number} length - The length of the random string to generate.
 * @returns {string} - A random string of the specified length.
 */
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Function to send requests with generated random parameters.
 * @param {Array} parameters - The list of parameters to include in the request.
 * @param {string} baseUrl - The base URL to append parameters to.
 */
async function sendRequests(parameters, baseUrl) {
    const chunkSize = 30;
    const reflections = [];

    // Split parameters into chunks and send requests
    for (let i = 0; i < parameters.length; i += chunkSize) {
        const chunk = parameters.slice(i, i + chunkSize);

        // Create random values for each parameter
        const paramValues = chunk.map(param => {
            const randomValue = generateRandomString(5);
            return { param, randomValue };
        });

        // Construct the query string with random values for the GET request
        const queryString = paramValues.map(({ param, randomValue }) => `${encodeURIComponent(param)}=${encodeURIComponent(randomValue)}`).join('&');
        const url = `${baseUrl}?${queryString}`;
        console.log(url);

        // GET request
        try {
            const responseGet = await fetch(url);
            const textGet = await responseGet.text();

            // Check for parameter reflection in the GET response
            paramValues.forEach(({ param, randomValue }) => {
                if (textGet.includes(randomValue)) {
                    reflections.push(param);
                }
            });
        } catch (error) {
            console.error(`Error fetching GET URL: ${url}`, error);
        }

        // POST request
        const formData = new URLSearchParams();
        paramValues.forEach(({ param, randomValue }) => {
            formData.append(param, randomValue);
        });

        try {
            const responsePost = await fetch(url, {
                method: 'POST',
                body: formData
            });
            const textPost = await responsePost.text();

            // Check for parameter reflection in the POST response
            paramValues.forEach(({ param, randomValue }) => {
                if (textPost.includes(randomValue)) {
                    // Check if the parameter is already in the reflections array
                    if (!reflections.includes(param)) {
                        reflections.push(param);  // Add the parameter if it's not already in the array
                    }
                }
            });

        } catch (error) {
            console.error(`Error sending POST request to: ${url}`, error);
        }
    }

    // Save reflections to storage
    const key = `${window.location.hostname}_refs`;
    browserAPI.storage.local.set({ [key]: reflections });
    console.log('Reflections saved');

    // Notify the popup about the status
    const port = browserAPI.runtime.connect({ name: "content-to-popup" });
    port.postMessage({ state: "checked" });
}

// Listen for messages from the popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendMessageToContent' && message.message === "check") {
        setTimeout(() => sendRequests(params, window.location.href), 0);
    }
});

const body = document.documentElement.innerHTML;

// Execute the extractParameters function when the page is fully loaded
window.addEventListener('load', extractParameters(body));

// Clear storage when the page is unloaded
window.addEventListener('beforeunload', async function () {
    const refsKey = `${window.location.hostname}_refs`;
    const allKey = `${window.location.hostname}_all`;

    // Remove stored parameters and reflections
    await browserAPI.storage.local.remove(refsKey);
    await browserAPI.storage.local.remove(allKey);
    console.log('Storage cleared');
});


findJSFiles(body);