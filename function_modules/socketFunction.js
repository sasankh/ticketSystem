var mongo = require('mongodb').MongoClient;
var cookieParser = require('cookie-parser');

//var onlineList = [];
var onlineUserList = [];
var activePrivateRooms = [];
var nameSpaceRefresh = "";

//authorization
//socket authentication function
function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  //  enterUserToOnlineList(data.user.username,function(){
  // If you use socket.io@1.X the callback looks different
  accept();
  //  });
}

function onAuthorizeFail(data, message, error, accept){
  if(error)
  throw new Error(message);
  console.log('failed connection to socket.io:', message);

  // If you don't want to accept the connection
  if(error)
  accept(new Error(message));
  // this error will be sent to the user as a special error-package
}

//------------------------------------------------------------------------------

//public Chat area
function publicChat(publicChat){
  mongo.connect('mongodb://127.0.0.1/test', function(err, db){
    if(err) throw err;

    publicChat.on('connection', function(socket){
      enterSocketInfo(socket, function(){
        getOnlineUsers(function(usersOnline){
          publicChat.emit('output',[{name: "SERVER", message: socket.client.request.user.username + " logged in", type:"message"}]);
          publicChat.emit('output',[{users: usersOnline, type:"onlineUsers"}]);
        });
      });


      var col = db.collection('messages'),
      sendStatus = function(s){
        socket.emit('status', s);
      };

      //emit all messages
      col.find().limit(100).sort({_id:1}).toArray(function(err, res){
        if(err) throw err;
        publicChat.emit('output', res);
      });

      //wait for input
      socket.on('input', function(data){
        var name = data.name;
        var message = data.message;
        var whitespacePattern = /^\s*$/;

        if( whitespacePattern.test(name) ||  whitespacePattern.test(message)){
          sendStatus('Name and message is required');
        }else{
          col.insert({name:name, message: message, type:data.type}, function(){

            //Emit all message to all clients
            publicChat.emit('output', [data]);

            sendStatus({
              message: "Message Sent",
              clear: true
            });
          });
        }
      });

      socket.on('disconnect', function(){
        checkRemoveSocketInfo(socket, function(){
          getOnlineUsers(function(usersOnline){
            publicChat.emit('output',[{name: "SERVER", message: socket.client.request.user.username + " logged off", type:"message"}]);
            publicChat.emit('output',[{users: usersOnline, type:"onlineUsers"}]);
          });
        });
      });
    });
  });
};

//enter user related socket info
function enterSocketInfo(socket, callback){
  var user = socket.client.request.user.username;
  var exist = false;
  if(onlineUserList.length > 0){
    for(var x = 0; x < onlineUserList.length; x++){
      if(onlineUserList[x].username == user){
        onlineUserList[x].socketList.push(socket);
        exist = true;
        break;
      }
    }
    if(exist === false){
      onlineUserList.push({username:user, socketList:[socket]});
      exist = true;
    }
  }else{
    onlineUserList.push({username:user, socketList:[socket]});
  }
  callback();
}

//check and remove online user and socket
function checkRemoveSocketInfo(socket, callback){
  var user = socket.client.request.user.username;
  if(onlineUserList.length > 0){
    for(var x = 0; x < onlineUserList.length; x++){
      if(onlineUserList[x].username == user){
        if(onlineUserList[x].socketList.length == 1){
          onlineUserList.splice(x,1);
          break;
        }else{
          if(onlineUserList[x].socketList.length > 1){
            for(var y = 0; y < onlineUserList[x].socketList.length; y++){
              if (onlineUserList[x].socketList[y] === socket){
                onlineUserList[x].socketList.splice(y,1);
                break;
              }
            }
          }
        }
      }
    }
  }else{
    console.log("Online User is empty?!");
  }
  callback();
}

function getOnlineUsers(callback){
  var usersOnline = [];
  if(onlineUserList.length > 0){
    for(var x = 0; x < onlineUserList.length; x++){
      usersOnline.push(onlineUserList[x].username);
    }
    callback(usersOnline);
  }else{
    callback(usersOnline);
  }
}

//------------------------------------------------------------------------------

//for privateChat Room

function checkActivePrivateRooms(io,fromUser,toUser,callback){
  var chatRoom1 = String(fromUser +"-"+ toUser);
  var chatRoom2 = String(toUser +"-"+ fromUser);
  var users = [fromUser, toUser];

  if((activePrivateRooms.indexOf(chatRoom1) > -1) || (activePrivateRooms.indexOf(chatRoom2) > -1)){
    if(activePrivateRooms.indexOf(chatRoom1) > -1){
      callback(chatRoom1);
    }else{
      callback(chatRoom2);
    }
  }else{
    createChatRoom(io, chatRoom1, users, function(chatRoomName){
      callback(chatRoomName);
    });
  }
}

function createChatRoom(io, chatRoomName, authorizedUsers, callback){

  var onlineUsers = [];
  var room = "/" + chatRoomName;
  var privateChat = io.of(room);
  activePrivateRooms.push(chatRoomName);
  if(activePrivateRooms.indexOf(chatRoomName) > -1){
    callback(chatRoomName);
  }
  privateChat.on('connection', function(socket){
    if(authorizedUsers.indexOf(socket.client.request.user.username > -1)){
      privateChat.emit('output',[{name: "SERVER", message: socket.client.request.user.username + " opened the private room"}]);

      if(onlineUsers.length == 0){
        onlineUsers.push({username:socket.client.request.user.username, socketList:[socket]});
      }else if(onlineUsers.length == 1){
        if(onlineUsers[0].username == socket.client.request.user.username){
          onlineUsers[0].socketList.push(socket);
        }else{
          onlineUsers.push({username:socket.client.request.user.username, socketList:[socket]});
        }
      }else{
        for(var x = 0; x < onlineUsers.length; x++){
          if(onlineUsers[x].username == socket.client.request.user.username){
            onlineUsers[x].socketList.push(socket);
          }
        }
      }

      // socket chat functions
      var sendStatus = function(s){
        socket.emit('status', s);
      };

      //wait for input
      socket.on('input', function(data){
        var name = data.name;
        var message = data.message;
        var whitespacePattern = /^\s*$/;

        if( whitespacePattern.test(name) ||  whitespacePattern.test(message)){
          sendStatus('Name and message is required');
        }else{
          if(onlineUsers.length == 1){
            var toUser = "";
            for(var x = 0; x < authorizedUsers.length; x++){
              if(authorizedUsers[x] != socket.client.request.user.username){
                popPrivateWindow(authorizedUsers[x], socket.client.request.user.username, chatRoomName, function(opened){
                  if(opened){
                    //set certain delay but remove when database is used
                    setTimeout(function(){                                 //remove this line after database added
                      for(var x = 0; x < onlineUsers.length; x++){
                        for(var y = 0; y < onlineUsers[x].socketList.length; y++){
                          onlineUsers[x].socketList[y].emit('output', [data]);
                        }
                      }

                      sendStatus({
                        message: "Message Sent",
                        clear: true
                      });
                    }, 500);    //remove this line when database added
                  }else{
                    for(var x = 0; x < onlineUsers.length; x++){
                      for(var y = 0; y < onlineUsers[x].socketList.length; y++){
                        onlineUsers[x].socketList[y].emit('output', [data]);
                        onlineUsers[x].socketList[y].emit('output', [{name: "SERVER", message: "Sorry, User is not online. Message not sent"}]);
                      }
                    }
                    sendStatus({
                      message: "Message Sent",
                      clear: true
                    });
                  }
                });
                break;
              }
            }
          }else{
            for(var x = 0; x < onlineUsers.length; x++){
              for(var y = 0; y < onlineUsers[x].socketList.length; y++){
                onlineUsers[x].socketList[y].emit('output', [data]);
              }
            }
            sendStatus({
              message: "Message Sent",
              clear: true
            });
          }
        }
      });

      socket.on('disconnect', function(){
        if(onlineUsers.length > 0){
          for(var x = 0; x < onlineUsers.length; x++){
            if(onlineUsers[x].username === socket.client.request.user.username){
              var remove = onlineUsers[x].socketList.indexOf(socket);
              onlineUsers[x].socketList.splice(remove,1);
              if(onlineUsers[x].socketList.length == 0){
                onlineUsers.splice(x,1);
              }
              privateChat.emit('output',[{name: "SERVER", message: socket.client.request.user.username + " closed the private room"}]);
              break;
            }
          }
        }
        if(onlineUsers.length == 0){
          privateChat = null;
          delete io.nsps[room];
          activePrivateRooms.splice(activePrivateRooms.indexOf(chatRoomName),1);
        }
      });
    }else{
      socket.emit('output',[{name: "SERVER", message: "You are not authorized inside this private chat"}]);
    }
  });
}

//pop private window on other user page
function popPrivateWindow(user, fromUser, chatRoomName, callback){
  var opened = false;
  for(var x = 0; x < onlineUserList.length; x++){
    if(onlineUserList[x].username == user){
      for(var y = 0; y < onlineUserList[x].socketList.length; y++){
        onlineUserList[x].socketList[y].emit('output',[{name: "SERVER", room: chatRoomName, type:"openPrivateRoom"}]);
      }
      opened = true;
      break;
    }
  }
  callback(opened);
}

//------------------------------------------------------------------------------

//Code for refresher
function refresher(refresher){
    nameSpaceRefresh = refresher;
    sendRefresh();
    nameSpaceRefresh.on('connection', function(socket){
      console.log("Connected to refresher");
    });
}

function sendRefresh(){
  nameSpaceRefresh.emit('refresh', true);
}

//------------------------------------------------------------------------------
//module exports
module.exports.publicChat = publicChat;
module.exports.onAuthorizeSuccess = onAuthorizeSuccess;
module.exports.onAuthorizeFail = onAuthorizeFail;
module.exports.checkActivePrivateRooms = checkActivePrivateRooms;
module.exports.refresher = refresher;
module.exports.sendRefresh = sendRefresh;
//------------------------------------------------------------------------------
