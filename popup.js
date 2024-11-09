// popup.js

// Get Browser
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

async function displayParams(state) {
    try {
        // Get the current tab's hostname
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url); // Get the current tab's URL
        const key = `${url.hostname}_${state}`;

        // Retrieve the parameters from local storage
        const result = await browserAPI.storage.local.get(key);
        const params = result[key]; // Assuming params is an array or object
        console.log(params);

        const list = document.getElementById('matches-list');

        // Clear any existing list items if needed
        list.innerHTML = '';

        // Check if params exist using length for array or object
        if (Array.isArray(params) && params.length > 0) {
            // If params is an array and has elements
            params.forEach(param => {
                const listItem = document.createElement('li');
                listItem.textContent = param;
                list.appendChild(listItem);
            });
        } else if (typeof params === 'object' && Object.keys(params).length > 0) {
            // If params is an object and has keys
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${key}: ${params[key]}`;
                    list.appendChild(listItem);
                }
            }
        } else {
            // If no params exist, display the "No Parameter Found" message
            const listItem = document.createElement('li');
            listItem.textContent = 'No Parameter Found In This Page';
            listItem.classList.add('empty');
            list.appendChild(listItem);
        }
    } catch (error) {
        console.error('Error retrieving params:', error);
    }
}



async function doesRefsExists() {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tabs[0].url); // Get the current tab's URL

    const key = `${url.hostname}_refs`;

    const result = await browserAPI.storage.local.get(key);

    const params = result[key];
    console.log(params);

    // Return true if params exists, otherwise false
    return params ? true : false;
}


document.getElementById('check-button').addEventListener('click', async function () {
    const button = document.getElementById('check-button');
    const title = document.getElementById('list-title');

    if (button.innerHTML === 'Check Reflections') {

    	const exists = await doesRefsExists()
    	console.log(exists);
    	if(exists){
    		button.innerHTML = 'All Parameters';
    		title.innerHTML = 'Reflections';
    		await displayParams('refs');
    	} else{
	        // Query the active tab
	        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
	        // Send a message to the content script on the active tab
	        await browserAPI.tabs.sendMessage(tabs[0].id, { type: 'sendMessageToContent', message: 'check' });
	        
	        button.innerHTML = 'Checking';
	        title.innerHTML = 'Waiting';
    	}
    } else {
        button.innerHTML = 'Check Reflections';
        title.innerHTML = 'Parameters';
        await displayParams('all');
    }
});


// Listen for the connection from the content script
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "content-to-popup") {
    port.onMessage.addListener((message) => {
      if(message.state === 'checked'){
      	const button = document.getElementById('check-button');
    	const title = document.getElementById('list-title');
      	displayParams('refs');
      	button.innerHTML = 'All Parameters';
      	title.innerHTML = 'Reflections';
      }
    });
  }
});


displayParams('all');