var url = require("url");
var http = require("http");
var https = require("https");
var querystring = require("querystring");

var Cleverbot = require("./cleverbot");
var cleverbot = new Cleverbot();

var Clear = require('codeday-clear');
var S5 = require('s5');

var clear = new Clear();
var s5 = new S5();

function getEvangelist(msg, args, channel, username, bot){
  clear.getRegionByWebName(args.join("").toLowerCase(), function(region){
    if(!region){bot.sendMessage("That event doesn't exist!");return}
    clear.getEventById(region.current_event.id, function(event){
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
    if(!region){bot.sendMessage("That event doesn't exist!");return}
    clear.getEventById(region.current_event.id, function(event){
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

module.exports = function(bot){
  bot.addCommand("s4 help", "Show this help.", function(msg, args, channel, username){
    var message = "I'm s4, the StudentRND Spontaneous Self-Operating System. Here's what I can do:";
    for(var i in bot.commands){
      var command = bot.commands[i];
      message += "\n" + command.trigger + " - " + command.help;
    }
    bot.sendMessage(message, channel);
  });

  bot.addCommand("s4 ready", "Ready.", function(msg, args, channel, username){
    bot.sendMessage("Ready.", channel);
  });

  // bot.addCommand("s4 get", "GET the specified url.", function(msg, args, channel, username){
  //   // fix slack's shit.
  //   var slackSpecialRegex = /<(.*?)>/gi;
  //   var fixedUrl = slackSpecialRegex.exec(args[0])[1].split("|")[0];
  //   var parsedUrl = url.parse(fixedUrl);
  //
  //   http.get({
  //     host: parsedUrl.host,
  //     path: parsedUrl.pathname
  //   }, function(response) {
  //     var body = '';
  //     response.on('data', function(d) {
  //       body += d;
  //     });
  //     response.on('end', function() {
  //       body = body.substr(2000);
  //       bot.sendMessage("Response (up to 2000 characters):\n```\n" + body + "```", channel);
  //     });
  //   });
  // });

  bot.addCommand("s4 whois", "Show s5 information of specified user.", function(msg, args, channel, username){
    if(args[0] === "me"){args[0] = username}
    var keys = [
      "First name",
      "Last name",
      "Email",
      "Phone"
    ];
    s5.getUser(args[0], function(user){
      for(var i in keys){
        var key = keys[i];
        if(user[key.replace(/ /gi, "_").toLowerCase()])){
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
    clear.getRegionWebNames(function(regions){
      var message = "Available regions:";
      for(var i in regions){
        var region = regions[i];
        message += "\n" + region;
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

  bot.on('unknownResponse', function(msg, channel, username){
    if(msg.indexOf("s4") === 0){
      cleverbot.write(msg.substr(3).trim(), channel, function(d){
        bot.sendMessage(d.message.replace(/Cleverbot/gi, "s4"), channel);
      });
    }
  });
};
