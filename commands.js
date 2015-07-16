// TODO inherit config from app.js
var config = process.env.BOT_CONFIG ? JSON.parse(process.env.BOT_CONFIG) : require('./config.js');

var blockspring = require('blockspring');

var url = require("url"),
    http = require("http"),
    https = require("https"),
    querystring = require("querystring"),
    Discourse = require("discourse-api"),
    discourse = new Discourse(config.DISCOURSE_URL, config.DISCOURSE_API_KEY, "system"),
    og = require("open-graph");

var Cleverbot = require("./cleverbot"),
    cleverbot = new Cleverbot();

var Clear = require('codeday-clear'),
    S5 = require('s5'),
    clear = new Clear(config.CLEAR_API_TOKEN, config.CLEAR_API_SECRET),
    s5 = new S5(config.S5_API_TOKEN, config.S5_API_SECRET);

var countdown = {
  channel: "C03QGP7PW",
  message: null,
  interval: null,
  js: require("./lib/countdown.js")
};

var every = require('every-moment');

function getEvangelist(msg, args, channel, username, bot){
  clear.getRegionByWebName(args.join("").toLowerCase(), function(region){
    if(!region){bot.sendMessage("That event doesn't exist!", channel);return}
    clear.getEventById(region.current_event.id, function(event){
      if(!event.evangelist){bot.sendMessage("There isn't an evangelist for this event!", channel);return}
      var message = "Here's the Evangelist for CodeDay " + event.region_name + ":";
      message += "\ns5 username: " + event.evangelist.username;
      message += "\nFirst name: " + event.evangelist.first_name;
      message += "\nLast name: " + event.evangelist.last_name;
      message += "\nEmail: " + event.evangelist.email;
      message += "\nPhone: " + event.evangelist.phone;
      bot.sendMessage(message, channel);
    });
  });
}

function getRegionalManager(msg, args, channel, username, bot){
  clear.getRegionByWebName(args.join("").toLowerCase(), function(region){
    if(!region){bot.sendMessage("That event doesn't exist!", channel);return}
    clear.getEventById(region.current_event.id, function(event){
      if(!event.evangelist){bot.sendMessage("There isn't an RM for this event!", channel);return}
      var message = "Here's the Regional Manager for CodeDay " + event.region_name + ":";
      message += "\ns5 username: " + event.manager.username;
      message += "\nFirst name: " + event.manager.first_name;
      message += "\nLast name: " + event.manager.last_name;
      message += "\nEmail: " + event.manager.email;
      message += "\nPhone: " + event.manager.phone;
      bot.sendMessage(message, channel);
    });
  });
}

module.exports = function(bot, slack){
  // function updateCodeDay(){
  //   var codeDay = new Date();
  //
  //   codeDay.setTime(1432407600*1000);
  //
  //   slack._apiCall("channels.setTopic", {topic: countdown.js(codeDay, null, countdown.js.DAYS).toString() + " until CodeDay!", channel: "C024H3105"});
  // }

  // setTimeout(updateCodeDay, 5000);

  // every(1, 'day', updateCodeDay);

  bot.addCommand("s4 countdown", "Show a countdown to CodeDay!", function(msg, args, channel, username){
    var cd = slack.getChannelGroupOrDMByID(countdown.channel);

    if(args[0] === "stop"){
      cd.send("Stopping countdown...");
      clearInterval(countdown.interval);
      slack._apiCall("chat.delete", {ts: countdown.message, channel: countdown.channel});
    }else{
      bot.sendMessage("Countdown started in <#codedaycountdown>.", channel);

      var codeDay = new Date();

      codeDay.setTime(1432407600*1000);

      var codeDayEast = new Date();
          codeDayEast.setTime((1432407600*1000)+(3600000*3));

      var codeDayCentral = new Date();
          codeDayCentral.setTime((1432407600*1000)+(3600000*2));

      var codeDayMountain = new Date();
          codeDayMountain.setTime((1432407600*1000)+(3600000*1));

      cd.send("[countdown_start]");

      countdown.interval = setInterval(function(){
        if(countdown.message){
          // console.log("Tick " + countdown.message);
          var text = "East: " + countdown.js(codeDayEast).toString() + "\n" +
                     "West: " + countdown.js(codeDay).toString() + "\n" +
                     "Central: " + countdown.js(codeDayCentral).toString() + "\n" +
                     "Mountain: " + countdown.js(codeDayMountain).toString();
          slack._apiCall("chat.update", {ts: countdown.message, channel: countdown.channel, text: text});
        }
      }, 1000);
    }
  });

  bot.addCommand("s4 help", "Show this help.", function(msg, args, channel, username){
    var message = "I'm s4, the StudentRND Self-Operating Slack System. Here's what I can do:";
    for(var i in bot.commands){
      var command = bot.commands[i];
      message += "\n" + command.trigger + " - " + command.help;
    }
    bot.sendMessage(message, channel);
  });

  bot.addCommand("s4 ready", "Ready.", function(msg, args, channel, username){
    bot.sendMessage("Ready.", channel);
  });

  bot.addCommand("s4 whois", "Show s5 information of specified user.", function(msg, args, channel, username){
    if(args[0] === "me"){args[0] = username}
    var keys = [
      "First name",
      "Last name",
      "Email",
      "Phone"
    ];
    s5.getUser(args[0], function(user){
      var message = "Here's `" + user.username + "`:" +
                    "\nhttps://s5.studentrnd.org/photo/" + user.username + "_128.jpg";
      for(var i in keys){
        var key = keys[i];
        if(user[key.replace(/ /gi, "_").toLowerCase()]){
          message += "\n" + key + ": " + user[key.replace(/ /gi, "_").toLowerCase()];
        }
      }
      bot.sendMessage(message, channel);
    });
  });

  bot.addCommand("s4 registrations", "Get number of registrations for specified CodeDay.", function(msg, args, channel, username){
    clear.getRegionByWebName(args[0], function(region){
      if(!region){bot.sendMessage("That event doesn't exist!");return}
      clear.getEventById(region.current_event.id, function(event){
        var registrations = (parseInt(event.registration_info.max) - parseInt(event.registration_info.remaining));
        var message = "CodeDay " + event.region_name + " has " + registrations + " registrations.";
        bot.sendMessage(message, channel);
      });
    });
  });

  bot.addCommand("s4 rm", "Get Regional Manager for specified event.", function(msg, args, channel, username){
    getRegionalManager(msg, args, channel, username, bot);
  });

  bot.addCommand("s4 evangelist", "Get Evangelist for specified event.", function(msg, args, channel, username){
    getEvangelist(msg, args, channel, username, bot);
  });

  bot.addCommand("s4 regions", "Get regions that can be used for `s4 rm`, `s4 evangelist`, and `s4 registrations`.", function(msg, args, channel, username){
    clear.getRegions(function(regions){
      var message = "Available regions:";
      for(var i in regions){
        var region = regions[i];
        message += "\n" + region.webname;
      }
      bot.sendMessage(message, channel);
    });
  });

  bot.addCommand("s4 lookup", "Look up a person by their first name, last name, and email. Format: `[first] [last] [email]`", function(msg, args, channel, username){
    blockspring.runParsed("b5bb470b4082254bf538a7bacac3f0cb", { "first_name": args[0], "last_name": args[1], "domain": args[3], "RAPPORTIVE_TOKEN ": null }, { api_key: "br_2046_7608f4f217ab050f599d945f7199f98da91d482e"}, function(res) {
     bot.sendMessage(JSON.stringify(res));
    });
  });

  bot.addCommand("s4 post", "Post to the StudentRND Community. Format: `[title]: [url] in category [category name]`", function(msg, args, channel, username){
    var urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?/gi;

    discourse.get("/users/" + username + ".json", {}, function(err, data){
      if(typeof(data) === "string") data = JSON.parse(data);
      if(data.error_type && data.error_type === "not_found"){
        bot.sendMessage("You aren't a member of the Community!", channel);
      }else{
        try{
          var content = msg.split("in category")[0].trim(),
              wantedCategory = msg.split("in category")[1].trim().toLowerCase(),
              url = content.match(urlRegex)[0],
              title = content.replace(urlRegex, "").replace(":", "").replace("<", "").replace(">", "").trim();
        }catch(e){
          bot.sendMessage("I couldn't understand you, please use this command like `[title]: [url] in category [category name]`.", channel);
          return;
        }

        bot.sendMessage("Looking up category...", channel);
        discourse.get("/categories.json", {}, function(err, data){
          if(typeof(data) === "string") data = JSON.parse(data);
          var postCategory;

          data.category_list.categories.forEach(function(category){
            if(category.name.toLowerCase().indexOf(wantedCategory) !== -1){
              postCategory = category;
            }
          });

          if(postCategory){
            bot.sendMessage("I found a category named \"" + postCategory.name + "\". Is this what you wanted?", channel);
            bot.setIntent(username, channel, function(message, channel, username){
              if(message.toLowerCase().indexOf("y") === 0){
                bot.sendMessage("Alright, I'll post it. Hold on...", channel);
                og(url, function(err, metadata){
                  var body = url + "\n\n";
                  if(metadata.title) body += "# " + metadata.title + "\n";
                  if(metadata.description) body += metadata.description + "\n\n";

                  body += "_(posted automatically via [s4](https://git.io/s4); @" + username + " should add some details!)_";

                  discourse.post("/posts", {api_username: username, title: title, raw: body}, function(err, data){
                    if(typeof(data) === "string") data = JSON.parse(data);
                    if(data.topic_id){
                      discourse.put("/t/" + data.topic_id, {category_id: postCategory.id}, function(err){
                        bot.sendMessage("Done! Here's your post: " + config.DISCOURSE_URL + "/t/" + data.topic_id, channel);
                      });
                    }
                  });
                });
                return true;
              }else if(message.toLowerCase().indexOf("n") === 0){
                bot.sendMessage("Okay, I won't post it.", channel);
                return true;
              }else{
                bot.sendMessage("Sorry, I didn't understand you. Please say yes or no.", channel);
                return false;
              }
            });
          }else{
            bot.sendMessage("Sorry, I couldn't find that category.", channel);
          }
        });
      }
    });
  });

  bot.addTrigger(/(regional manager|rm|evangelist) for ([A-z ]+)/gi, function(msg, matches, channel, username){
    if(matches[2]){
      matches[2] = matches[2].replace(/CodeDay/gi, "").trim();
      switch(matches[1].toLowerCase()){
        case "regional manager":
          getRegionalManager(msg, matches[2].split(" "), channel, username, bot);
          break;
        case "rm":
          getRegionalManager(msg, matches[2].split(" "), channel, username, bot);
          break;
        case "evangelist":
          getEvangelist(msg, matches[2].split(" "), channel, username, bot);
          break;
      }
    }else{
      bot.sendMessage("To search for an Evangelist/RM, use either `s4 rm [region]` or `s4 evangelist [region]`.", channel);
    }
  });

  bot.on('unknownResponse', function(msg, channel, username, extra){
    if(msg.indexOf("s4") === 0){
      cleverbot.write(msg.substr(3).trim(), channel, function(d){
        bot.sendMessage(d.message.replace(/Cleverbot/gi, "s4"), channel);
      });
    }
  });

  slack.on('open', function(){
    slack.ws.on('message', function(message){
      message = JSON.parse(message);
      if(message.text && message.text === "[countdown_start]" && message.ok){
        console.log("Countdown message ts: " + message.ts);
        countdown.message = message.ts;
      }
    });
  });
};
