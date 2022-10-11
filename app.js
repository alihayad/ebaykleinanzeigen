//simple nodejs telegram bot to get the newly added cars their price and phone number on ebaykleinanzeigen
var MongoClient = require("mongodb").MongoClient;
var mongourl = "mongodb://localhost:27017/";
var dbName = "ebaycars";
const schedule = require('node-schedule');
const axios = require("axios");
const cheerio = require("cheerio");
const { Telegraf } = require("telegraf");
const url = "https://www.ebay-kleinanzeigen.de/s-dortmund/autos/k0l1085r20";
const bot = new Telegraf("telegram bot key goes here");
const checkArticle = async (link) => {
  let client, db;
  try {
    client = await MongoClient.connect(mongourl);
    db = client.db(dbName);
    let dCollection = db.collection("cars");
    let result = await dCollection.find();
    resultss = await result.toArray();
    //console.log(resultss);
    let exist = resultss.filter((art) => art.url === link);
    if (exist.length > 0) return Promise.resolve(true);
    return Promise.resolve(false);
  } catch (err) {
    console.error(err);
  } // catch any mongo error here
};

const addArticle = async (link) => {
  MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("ebaycars");
    var myobj = { url: link };
    dbo.collection("cars").insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
};
bot.command("start", (ctx) => {

    schedule.scheduleJob('*/5 * * * *', function(){
        console.log('5');
    
  (async () => {
    try {
      const res = await axios.get(url);
      const html = res.data;
      //loading response data into a Cheerio instance
      let $ = cheerio.load(html);
      const articles = $("article");

      for (const article of articles) {
        const element = $(article);
        let link = element.find('a[class*="ellipsis"]').attr("href");
        let exist =await checkArticle(link);
        if (!exist) {
          const name = element.find('h2[class*="text-module-begin"]').text();
          const price = element
            .find('p[class*="aditem-main--middle--price"]')
            .text();
          const time = element
            .find('div[class*="aditem-main--top--right"]')
            .text();
          addArticle(link);
          link = "https://www.ebay-kleinanzeigen.de/" + link;
          let res1 = await axios.get(link);
          let html1 = res1.data;

          $ = cheerio.load(html1);

          let paragraphs = $("#viewad-description-text");
          let Adescription = paragraphs.text();

          var re = /(?:[-+() ]*\d){10,13}/gm;
          var str = Adescription;
          res21 = "no pohne";
          if (str.match(re))
            res21 = str.match(re).map(function (s) {
              return s.trim();
            });

          bot.telegram.sendMessage(
            ctx.chat.id,
            name +
              "\r\n" +
              price +
              "\r\n" +
              time +
              "\r\n" +
              link +
              "\r\n" +
              res21,
            {}
          );
        } else {
          console.log("link" + "Already Exist");
          
        
        }
      } //end for loop
    } catch (error) {
      console.log(error);
    }
  })();
});

});

bot.launch();
