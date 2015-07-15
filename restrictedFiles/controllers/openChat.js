
(function(){
  var getNode = function(s){
    return document.querySelector(s);
  }

  //Get requiredodes
  status = getNode('.chat-status span'),
  messages = getNode('.chat-messages'),
  textarea = getNode('.chat textarea'),
  chatName = getNode('.chat-name'),
  onlineUsers = getNode('.online-users'),
  statusDefault = status.textContent,
  setStatus = function(s){
    status.textContent = s;

    if(s !== statusDefault){
      var delay = setTimeout(function(){
        setStatus(statusDefault);
        clearInterval(delay);
      }, 3000);
    }
  };

  try{
    var connectTo = "https://localhost:443/publicChat";
    var socket = io.connect(connectTo);
//    var socket = io.connect('https://localhost:443/publicChat');
  } catch(e){
    //set status to warn user
  }

  if(socket != undefined){

    //listen for output
    socket.on('output', function(data){
      if(data.length){
        //loop through results
        for(var x = 0; x < data.length; x++){
          if(data[x].type === "message"){
          var message = document.createElement('div');
          message.setAttribute('class', 'chat-message');
          message.textContent = data[x].name + ": " + data[x].message;

          //Append
          messages.appendChild(message);
          messages.insertBefore(message, messages.firstChild);  //print in reverse order
        }else if(data[x].type === "onlineUsers"){
          document.getElementById("online-users").innerHTML = "";
          for(var y = 0; y < data[x].users.length; y++){
            //create the online button
            var onlineUser = document.createElement('button');
            onlineUser.setAttribute("class", "online-user");
//            var onclickContent = "window.open('/privateMessage/" + data[x].users[y] + "', '_blank', 'toolbar=yes, scrollbars=yes, resizable=yes, top=500, left=500, width=400, height=400')";
            if(chatName.value != data[x].users[y]){
              var onclickContent = "openiFrame('" + data[x].users[y]+"')";
              onlineUser.setAttribute("onclick", String(onclickContent));
            }
  //          var onclickContent = "openiFrame('" + data[x].users[y]+"')";
  //          onlineUser.setAttribute("onclick", String(onclickContent));
            onlineUser.textContent = data[x].users[y];

            //Append
            onlineUsers.appendChild(onlineUser);
           }
        }else if(data[x].type === "openPrivateRoom"){
          openiFrame(String(data[x].room));
    //      var openLink = "/privateMessage/" + String(data[x].room);
  //        window.open(openLink, '_blank', 'toolbar=yes, scrollbars=yes, resizable=yes, top=500, left=500, width=400, height=400');
        }else{
          //don't do anything
        }
      }
      }
    });

    //listen for a status
    socket.on('status', function(data){
      setStatus((typeof data === 'object') ? data.message : data);
      if(data.clear === true){
        textarea.value = '';
      }
    });



    //listen for key down
    textarea.addEventListener('keydown', function(event){
      var self = this,
      name = chatName.value;

      if(event.which === 13 && event.shiftKey === false){
        socket.emit('input',{
          name: name,
          message: self.value,
          type:"message"
        });
        event.preventDefault();
      }
    });
  }
})();

var openiFrame = function(toUser){
  //split and check
  var chatFrameName = toUser.split("-");
  if(chatFrameName.length == 2){
    for (var x = 0; x < chatFrameName.length; x++){
      if(activeChatFrame.indexOf(chatFrameName[x]) < 0){
        activeChatFrame.push(String(chatFrameName[x]));
      }
    }
  }
  //create frame first
  //for iframe
  if(activeChatFrame.indexOf(toUser) < 0){
    privateFrame = document.querySelector('.privateFrames');
    var frameLink = "/privateMessage/" + toUser;
    var newFrame = document.createElement('iframe');
    newFrame.setAttribute("class", "privateFrameClass");
    newFrame.setAttribute("id", String(toUser));
    newFrame.setAttribute("src", frameLink);
    activeChatFrame.push(String(toUser));
    privateFrame.appendChild(newFrame);
  }
};
