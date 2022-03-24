const functions = require("firebase-functions");
const {Client} = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');
const http = require('http');

exports.helloWorld = functions
    .runWith({
      timeoutSeconds: 120,
      memory: "2GB",
    })
    .https.onRequest((request, response) => {
      functions.logger.info("Hello logs!", { structuredData: true });
        // open a new browser
      const client = new Client({ args: ["--no-sandbox"] });
      // take data from the url (id)(list of contacts,name and phone numbers)
      const data = request.query.data || "data";

      const json_data = JSON.parse(data)
      console.log(json_data);

      // Usage!
      sleep(500).then(() => {
      client.on("qr", (qr) => {
        
        console.log(qr);
        console.log(`user id : ${json_data.id}`);
        console.log(`qr code : ${qr}`);


        // SEND THE QR CODE TO THE DATA BASE USING A DJANGO
        // REST API WHARE THE REACT APP WILL TAKE IT AND
        // PRSENT IT TO THE USER TO SCAN

        // qrcode.generate(qr, { small: true });
            
        });
                
      });

      client.on('ready', () => {
        
          console.log('Client is ready!');
          response.send("done")

        });

        client.initialize();

    });

/**
 * Adds two numbers together.
 * @sleep {int} num1 The first number.
 * @param {int} time The second number.
 * @return {int} The sum of the two numbers.
 */
function sleep(time) {
  // do the sleep
  return new Promise((resolve) => setTimeout(resolve, time));
}



exports.sendQrFunction = functions.https.onRequest((request, response) => {
  response.send("hello from firebase");
});










/* global document */

const express = require('express');
const functions = require('firebase-functions');
// const mime = require('mime');
const puppeteer = require('puppeteer');

const app = express();
app.use(function cors(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  // res.header('Content-Type', 'application/json;charset=utf-8');
  // res.header('Cache-Control', 'private, max-age=300');
  next();
});

// const beforeMB = process.memoryUsage().heapUsed / 1e6;
// puppeteer.launch().then(browser => {
//   app.locals.browser = browser;
//   const afterMB = process.memoryUsage().heapUsed / 1e6;
//   console.log('used', beforeMB - afterMB + 'MB');
// })

app.get('/test', (req, res) => {
  res.status(200).send('test');
});

// Init code that gets run before all request handlers.
app.all('*', async (req, res, next) => {
  res.locals.browser = await puppeteer.launch({args: ['--no-sandbox']});
  next(); // pass control on to router.
});

app.get('/render', async function renderHandler(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send(
      'Please provide a URL. Example: ?url=https://example.com');
  }

  const browser = res.locals.browser;

  try {
    const page = await browser.newPage();
    const response = await page.goto(url, {waitUntil: 'networkidle2'});

    // Inject <base> on page to relative resources load properly.
    await page.evaluate(url => {
      const base = document.createElement('base');
      base.href = url;
      document.head.prepend(base); // Add to top of head, before all other resources.
    }, url);

    // Remove scripts and html imports. They've already executed.
    await page.evaluate(() => {
      const elements = document.querySelectorAll('script, link[rel="import"]');
      elements.forEach(e => e.remove());
    });

    const html = await page.content();
    // await page.close();

    res.status(response.status).send(html);
  } catch (e) {
    res.status(500).send(e.toString());
  }

  await browser.close();
});

app.get('/screenshot', async function screenshotHandler(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send(
      'Please provide a URL. Example: ?url=https://example.com');
  }

  const viewport = {
    width: 1280,
    height: 1024,
    deviceScaleFactor: 1
  };

  let fullPage = false;
  const size = req.query.size;
  if (size) {
    const [width, height] = size.split(',').map(item => Number(item));
    if (!(isFinite(width) && isFinite(height))) {
      return res.status(400).send('Malformed size parameter. Example: ?size=800,600');
    }
    viewport.width = width;
    viewport.height = height;
  } else {
    fullPage = true;
  }

  // res.writeHead(200, {
  //   // 'Content-Type': 'text/event-stream',
  //   'Cache-Control': 'no-cache',
  //   'Connection': 'keep-alive',
  //   'Access-Control-Allow-Origin': '*',
  //   'X-Accel-Buffering': 'no' // Forces Flex App Engine to keep connection open for SSE.
  // });
  // res.write('Test');
  // res.status(200).end();

  const browser = res.locals.browser;

  try {
    const page = await browser.newPage();

    // // TODO: client hints don't appear to work.
    // await page.setExtraHTTPHeaders(new Map(Object.entries({
    //   'Accept-CH': 'DPR, Viewport-Width, Width',
    // })));

    // page.on('request', req => {
    //   console.log(req.headers.get('Accept-CH'));
    // });
    // page.on('response', res => {
    //   const type = res.headers.get('Content-Type');
    //   if (type && type.startsWith('image') || type.includes('text/css')) {
    //     console.log(res.headers)
    //   }
    // });

    // const devices = require('puppeteer/DeviceDescriptors');
    // const iPhone = devices['iPhone 6'];
    // await page.emulate(iPhone);

    // const metrics = await page._client.send('Page.getLayoutMetrics');
    // const width = Math.ceil(metrics.contentSize.width);
    // const height = Math.ceil(metrics.contentSize.height);

    // await page.setViewport({width, height});

    // await page.setViewport(viewport);

    // // Fetch viewport of page.
    // const viewport = await page.evaluate(() => {
    //   return {
    //     width: document.documentElement.clientWidth,
    //     height: document.documentElement.clientHeight,
    //     deviceScaleFactor: window.devicePixelRatio
    //   };
    // });

    await page.goto(url, {waitUntil: 'networkidle2'});

    const opts = {
      fullPage,
      clip: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height
      },
      // omitBackground: true
    };
    if (fullPage) {
      delete opts.clip;
    }

    const buffer = await page.screenshot(opts);
    // const mimeType = mime.lookup('screenshot.png');
    // await page.close();

    res.type('image/png').send(buffer);
  } catch (e) {
    res.status(500).send(e.toString());
  }

  await browser.close();
});

app.get('/version', async function versionHandler(req, res) {
  const browser = res.locals.browser;
  res.status(200).send(await browser.version());
  await browser.close();
});

const beefyOpts = {memory: '2GB', timeoutSeconds: 60};
exports.screenshot = functions.runWith(beefyOpts).https.onRequest(app);
exports.render = functions.runWith(beefyOpts).https.onRequest(app);
exports.version = functions.https.onRequest(app);
exports.test = functions.https.onRequest(app);

// exports.test = functions.https.onRequest(async (req, res) => {
//   const {exec} = require('child_process');
//   const os = require('os');

//   exec('uname -a', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`exec error: ${error}`);
//     }
//     const str = stdout;
//     res.status(200).send(str + '\n' + `${process.platform}, ${String(os.release())}, ${os.arch()}`);
//   });

//   // res.status(200).send(`${process.platform}, ${String(os.release())}, ${os.arch()}`);
// });




const functions = require("firebase-functions");
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from index');
});
app.get('/home', (req, res) => {
  res.send('Hello from home');
});

const beefyOpts = {memory: '2GB', timeoutSeconds: 120};
exports.index = functions.runWith(beefyOpts).https.onRequest(app);
exports.home = functions.runWith(beefyOpts).https.onRequest(app);








































// const functions = require("firebase-functions");
// const {Client} = require("whatsapp-web.js");
// const client = new Client({args: ["--no-sandbox"]});
// client.initialize();

// exports.trigerBrowser = functions
//     .runWith({
//       timeoutSeconds: 120,
//       memory: "2GB",
//     })
//     .https.onRequest(async (request, response) => {

//     sleep(500).then(() => {
      
//       client.on('qr', (qr) => {
//         response.send(qr);
//         console.log('QR RECEIVED', qr);
//       });

//     });

//     // client.on('ready', () => {
//     //   console.log('Client is ready!');
//     //   response.send("done");
//     // });

// });




// function sleep(time) {
//   // do the sleep
//   return new Promise((resolve) => setTimeout(resolve, time));
// }



// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});

//   response.send("hello from firebase!");
//   console.log('sent');


// });




































const functions = require("firebase-functions");
const puppeteer = require("puppeteer");

// https://us-central1-zuku-app-47887.cloudfunctions.net/helloWorld
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions
    .runWith({
      timeoutSeconds: 120,
      memory: "2GB",
    })
    .https.onRequest((request, response)=>{
      (async () => {
        console.log("browser");
        const browser = await puppeteer.launch(
          {
            args: ['--no-sandbox'],
            headless:false,
          }
        );
        console.log("page");
        const page = await browser.newPage();
        console.log("goto");
        await page.goto('https://example.com/').then(() => {
          
          functions.logger.info("helloWorld...", { structuredData: true });
    
          response.send(
            {
              msg: puppeteer,
            }
          );

        })  
        
      })();

    });




