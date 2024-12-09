
# ParamScan

**ParamScan** is a simple browser extension for web security enthusiasts and pen testers. It helps you find URL parameters in a webpage's source code and check if any of them are reflected on the page. This is super useful for spotting potential XSS vulnerabilities and other security issues.

https://github.com/user-attachments/assets/3119f355-0640-4be3-aafa-7d477db0a628


## Installation

#### Chrome
1.  Download the latest release or clone this repo to your local machine:  
    `git clone https://github.com/ch1y0w0/ParamScan.git`
    
2.  Go to Chrome’s Extensions page (`chrome://extensions/`).
    
3.  Turn on **Developer Mode** (toggle in the top-right corner).
    
4.  Hit **Load unpacked** and select the `ParamScan` folder where the extension is stored.
    
5.  You should now see the extension icon in your Chrome toolbar.

#### Firefox
1.  Download the latest release or clone this repo to your local machine:  
    `git clone https://github.com/ch1y0w0/ParamScan.git`
    
2.  Go to Firefox's Debugging page (`about:debugging`).
    
3.  Navigate to `This Firefox`
    
4.  Hit **Load Temporary Add-on** and select the `ParamScan` folder where the extension is stored.
    
5.  You should now see the extension icon in your Firefox toolbar.


*Note: This extension has been tested on Chrome, Edge and Firefox. While it is mainly developed for Chrome, it is working out of the box on other browsers as well. If you noticed any bug, feel free to open an issue.*

## Usage

1.  Open any webpage you want to check.
2.  Click on the **ParamScan** extension icon in your toolbar.
3.  You’ll see a list of all the parameters it found.
4.  Hit the **Check Reflections** button to see which ones are reflected back into the page.

This helps you find possible XSS entry points and other security issues.

## Example

-   After scanning, you might see parameters like `username`, `session`, or `search`.
-   The reflection check will show if, for example, `username` is reflected back into the HTML. If it is, it could be an XSS vulnerability if not properly sanitized.

## Contributing

Got ideas or want to help out? Feel free to contribute! Here’s how:

1.  Fork the repo.
2.  Create a new branch (`git checkout -b feature-branch`).
3.  Make your changes and commit them (`git commit -am 'Add new feature'`).
4.  Push to your fork (`git push origin feature-branch`).
5.  Submit a pull request.

Just make sure your code follows the existing style and is well tested! 
Feedbacks are also welcome. You can contact me via X!

*Note: ParamScan is still in its early stages so bugs and missing features are normal. If you found any bug or if you have ideas for making ParamScan more useful, feel free to open an issue or contact me via X!*

## Disclaimer

**ParamScan** is for educational and research purposes only. Use it responsibly and only on websites or systems you have permission to test. Unauthorized testing can be illegal.

## ToDo List

 - [ ] Find Dynamically Generated(JS) Reflections
 - [X] ~~Analye JS Files and Find Parameters in JS codes~~
 - [ ] Passive Logging + JS Logging
 - [X] ~~Passive Reflection Test~~
 - [X] ~~Add Scroll Save~~
 - [X] ~~Post Request~~
 - [X] ~~Better Error Handling/Code Improvements~~
 - [X] ~~Settings Menu~~
 - [X] ~~Regex Matching/Filtering~~
 - [X] ~~Add Firefox Support~~
 
 *Note: Huge thanks to [fallparams](https://github.com/ImAyrix/fallparams) for the idea*
