// TODO inherit config from app.js
var config = process.env.BOT_CONFIG ? JSON.parse(process.env.BOT_CONFIG) : require('./config.js');

var url = require("url");
var http = require("http");
var https = require("https");
var querystring = require("querystring");

var Cleverbot = require("./cleverbot");
var cleverbot = new Cleverbot();

var Clear = require('codeday-clear');
var S5 = require('s5');

var countdown = {
  channel: "C03QGP7PW",
  message: null,
  interval: null,
  js: require("./lib/countdown.js")
};

var every = require('every-moment');

var clear = new Clear(config.CLEAR_API_TOKEN, config.CLEAR_API_SECRET);
var s5 = new S5(config.S5_API_TOKEN, config.S5_API_SECRET);

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
  function updateCodeDay(){
    var codeDay = new Date();

    codeDay.setTime(1432407600*1000);

    slack._apiCall("channels.setTopic", {topic: countdown.js(codeDay, null, countdown.js.DAYS).toString() + " until CodeDay!", channel: "C024H3105"});
  }

  setTimeout(updateCodeDay, 5000);

  every(1, 'day', updateCodeDay);

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
