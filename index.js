const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
    headless:false,
  });
    
  const page = await browser.newPage();
    await page.goto('http://192.168.0.1/');

    let password = await page.waitForSelector('#loginPassword');
    await password.type("admin");
    let submit = await page.waitForXPath('//*[@id="content_right"]/table/tbody/tr[2]/td/form/table[1]/tbody/tr[2]/td/table/tbody/tr/td/input');
    await submit.click();
    await page.waitForNavigation().then(async () => {

        if (page.url() == "http://192.168.0.1/RgSwInfo.asp") {
            //  await connectedDevices();
            await ChangePassword(username = "jane", password = "123456789");
            
        } else if (page.url() == "http://192.168.0.1/login.asp") {

            let ok = await page.waitForXPath('//*[@id="content_right"]/table/tbody/tr[2]/td/form/table[2]/tbody/tr[2]/td/input[1]');
            await ok.click();
            await page.waitForNavigation().then( async() => {
                 //   await connectedDevices();
                await ChangePassword(username = "jane", password = "123456789");
            });

        }
        
    });

    function ChangePassword(username,password) {
        (async () => {
           console.log("username : " + username);
           console.log("password : " + password);
        })();
    }
    function connectedDevices(){
        
        ( async () => {
            
            await page.goto('http://192.168.0.1/wlanAccess.asp').then(async () => {

                let listOfdevices = await page.evaluate(() => document.getElementsByTagName('td')[36].innerText);
                console.log(listOfdevices);
                page.goto("http://192.168.0.1/logout.asp").then(async () => await browser.close());
             });
            
        })();

    }

})();




