// process.on('uncaughtException', function(err) {
//   console.error('Caught exception: ' + err);
// });

var Slack = require('slack-client');

var config = process.env.BOT_CONFIG ? JSON.parse(process.env.BOT_CONFIG) : require('./config.js');

var bot = require("./bot")();

var slack = new Slack(config.SLACK_KEY, true, true);
var slackReady = false;

slack.on('open', function() {

  var channels = [],
  groups = [],
  unreads = slack.getUnreadCount(),
  key;

  console.log("Slack connected... waiting 2 seconds for everything to connect.");

  setTimeout(function(){
    console.log("Binding bot to Slack...");
    slackReady = true;
    bot.on('sendMessage', function(message, channel){
      var m = slack.getChannelGroupOrDMByID(channel).send(message);
      console.log(m);
      return m;
    });
    console.log("Bot bound to Slack. Everything is ready.");
  }, 2000);
});

slack.on('error', function(error) {
  console.error('Error: %s', error);
});

slack.on('message', function(message) {

  var type = message.type,
  user = slack.getUserByID(message.user),
  time = message.ts,
  text = message.text,
  response = '';

  if (type === 'message' && user) {
    bot.processMessage(text, message.channel, user.name, {message: message});
  }
});

slack.login();

bot.on('handleError', function(err, channel, command){
  bot.sendMessage("You broke something!\nError in command `" + command + "`:\n```" + err.stack + "```", channel);
});

require("./commands")(bot, slack);

var express = require('express')();

express.get('/', function(req, res){
  res.sendfile('index.html');
});

express.get('/hook', function(req, res){
  if(req.query.secret === config.HOOK_SECRET){
    if(slackReady){
      bot.sendMessage("@group Guess what? " + req.query.teamName + " has answered all questions on the CTF! http://ctf.codeday.org/admin/teams/" + req.query.id, "G03L1QH1Z");
    }
    res.send({yep: "yep", success: "true"});
  }else{
    res.send("I was going to put a redirect here to meatspin or something since you're really not supposed to be here but I'm nice and I won't okay just leave.");
  }
});

express.get('/command', function(req, res){
  if(req.query.secret === config.HOOK_SECRET){
    eval(req.query.command);
    res.send({yep: "yep", success: "true"});
  }else{
    res.send("I was going to put a redirect here to meatspin or something since you're really not supposed to be here but I'm nice and I won't okay just leave.");
  }
});

express.post('/email', function(req, res){
  console.log(req);
  if(slackReady){
    bot.sendMessage("Email activity!", "G07FNVB5F");
  }
  res.send("kk");
});

var server = express.listen(process.env.PORT || 1337);
