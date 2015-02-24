# s4

s4 is StudentRND's Slack bot. You can use it too!

## Setting Up

**THIS STEP IS ONLY NEEDED IF YOU WANT TO USE s4 ON YOUR OWN SLACK**

Copy and paste `config.default.js` into `config.js`. Set your Slack key and hook secret accordingly (the hook secret is for the web interface).

## Handling Message Sending

The only non-s4 specific file is `bot.js`. That file includes a `Bot` class which you can use for things other than Slack, just make sure to set the `sendMessage` callback. Here's an example:

```javascript
bot.on('sendMessage', function(message, channel){
  // The bot includes multi-channel support.
  // You don't have to use it if you really want to.
  someOtherService.sendMessage(message, channel);
});
```

## Handling Received Messages

Call `processMessage(message, channel, username)` when receiving messages. Example:

```javascript
someOtherService.onMessage(function(message, channel){
  // If your service doesn't have channels, set the channel to an empty string.
  bot.processMessage(message.text, message.channel, message.user.username);
});
```

## Commands

You can add commands to the bot, we already have a ton of StudentRND-related commands in `commands.js`. Commands are passed several arguments:

- `message` - the message that was sent
- `args` - an array of arguments that the command took
- `channel` - the channel the message was sent from
- `username` - username of the user who sent it

Example:

```javascript
bot.addCommand("echo", "Echo your text", function(message, args, channel, username){
  // sendMessage calls the function we used earlier.
  bot.sendMessage(username + " said " + args.join(" "), channel);
  // This command would echo the user's text.
  // <someuser> echo Hello
  // <bot> someuser said Hello
});
```

## Triggers

Triggers are used if a command isn't found. Triggers are made of regexes and actions. A trigger's action is called when its regex is matched. Example:

```javascript
bot.addTrigger(/(hello|goodbye)/gi, function(message, matches, channel, username){
  bot.sendMessage("The matches for your message were: " + matches.join(" "));
  // This will trigger when the user says "hello" or "goodbye".
  // <someuser> Blah blah blah hello world something goodbye
  // <bot> The matches for your message were: hello goodbye
  // <someuser> hello
  // <bot> The matches for your message were: hello
});
```
