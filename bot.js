function Bot(){
  this.commands = [];

  this.triggers = [];

  this.sendMessage = function(){
    console.warn("Message sending not set up!");
  }

  this.handleError = function(err){
    console.warn("Error handling not set up! Error in command: " + err);
  }

  this.unknownResponse = function(){
    console.log("Unknown responses not set up!");
  }

  this.processMessage = function(message, channel, username){
    var command = false;
    this.commands.forEach(function(c){
      var regex = RegExp("^" + c.trigger + "\\b");
      if(regex.test(message)){
        command = true;
        message = message.substr(c.trigger.length+1);
        var args = message.split(" ");
        try{
          c.action(message, args, channel, username);
        }catch(e){
          this.handleError(e, channel, c.trigger);
        }
      }
    });

    if(!command){
      this.triggers.forEach(function(t){
        if(t.trigger.test(message)){
          command = true;
          var matches = new RegExp(t.trigger).exec(message);
          t.action(message, matches, channel, username);
        }
      });
    }

    if(!command){
      this.unknownResponse(message, channel, username);
    }
  }

  this.on = function(action, callback){
    switch(action){
      case 'sendMessage':
        this.sendMessage = callback;
        break;
      case 'handleError':
        this.handleError = callback;
        break;
      case 'unknownResponse':
        this.unknownResponse = callback;
        break;
    }
  }

  this.addCommand = function(trigger, help, action){
    this.commands.push({trigger: trigger, action: action, help: help});
    console.log("Command registered: " + trigger);
    return this.commands;
  }

  this.addTrigger = function(trigger, action){
    this.triggers.push({trigger: trigger, action: action});
    return this.triggers;
  }

  return this;
}

module.exports = Bot;
