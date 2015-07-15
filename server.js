//Ticket System
var fs = require('fs');
var https = require('https');

//original express
var express = require('express');
var app = express();

//all original
var path = require('path');
var bodyParser = require('body-parser');

//for passport
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var passport= require('passport');
var passportLocal = require('passport-local');
var MongoStore = require('connect-mongo')(expressSession); //session store

//ssl
var server = https.createServer({
  cert: fs.readFileSync(__dirname + '/sslKey/ticketSystem.crt'),
  key: fs.readFileSync(__dirname + '/sslKey/clientKey.key')
}, app);

//for functions
var dbDirectory = require('./function_modules/directoryFunction');
var dbAdmin = require('./function_modules/adminFunction');
var dbTicket = require('./function_modules/ticketFunction');
var sendEmail = require('./function_modules/sendEmails');
var getEmail = require('./function_modules/getEmails');
var extra = require('./function_modules/extraFunctions');
var socketConnect = require('./function_modules/socketFunction');
var sessionStorage = new MongoStore({ url: 'mongodb://127.0.0.1/test', ttl: 1 * 24 * 60 * 60});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// has to be don before passport
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(expressSession({
  key: 'express.sid',
  secret: 'ticketSystem',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true },
  store: sessionStorage
  }));

//passport codes
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(function(username, password, done){
//check user in database
  dbAdmin.adminAuthentication(username, password,function(userObject){
    done(null, userObject);
  });
}));

passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  //Query database or cache here
  dbAdmin.getAdminUsername(id, function(userName){
    done(null, {id:id, username: userName});
  });
});

//---------------------------------------------------------------------------
//socket
var io = require('socket.io')(server);
var passportSocketIo = require("passport.socketio");
var publicChat = io.of('/publicChat');
var refresher = io.of('/refresher');
socketConnect.publicChat(publicChat);
socketConnect.refresher(refresher);

//Socket Authentication
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,       // the same middleware you registrer in express
  key:          'express.sid',       // the name of the cookie where express/connect stores its session_id
  secret:       'ticketSystem',    // the session_secret
  store:        sessionStorage,        // use sessionstore.
  success:      socketConnect.onAuthorizeSuccess,  // *optional
  fail:         socketConnect.onAuthorizeFail,     // *optional
}));

//-----------------------------------------------------------------------------

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.redirect('/login')
//    res.send(403);
  }
}

function ensureAngularAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.sendStatus(401);
  }
}

app.get('/', function(req, res){
  res.render('index',{
    isAuthenticated: req.isAuthenticated()
  });
});

app.get('/login',function(req,res){
  res.render('login');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/main', ensureAuthenticated, function(req,res){
  res.render('main',{
    controlUser: req.user.username
  });
});
//------------------------------------------------------------------------------
//for one on one chat

app.get('/privateMessage/:check',ensureAuthenticated, function(req, res){
  var check = req.params.check;
  var checkSplit = check.split("-");
  if(checkSplit.length == 1){
    var toUser = check;
    socketConnect.checkActivePrivateRooms(io,req.user.username,toUser,function(chatRoom){
      res.render('privateMessage',{
        from: req.user.username,
        to: toUser,
        room: chatRoom
      });
    });
  }else if(checkSplit.length == 2){
    var toUser = "";
    if(checkSplit[0] != req.user.username){
      toUser = checkSplit[0];
    }else{
      toUser = checkSplit[1];
    }
    res.render('privateMessage',{
      from: req.user.username,
      to: toUser,
      room: check
    });
  }else{
    res.render('privateRoomNotAvailable');
  }
});

//-------------------------------------------------------------------------
app.post('/login', passport.authenticate('local'), function(req,res){
  res.redirect('/main');
});

//restricted files
app.use(ensureAngularAuthenticated, express.static(path.join(__dirname,'restrictedFiles')));

//get currentuser
app.get('/user', ensureAngularAuthenticated, function(req, res){
  res.json(req.user);
});

//Functions
//Directroy server side functions
app.get('/listDirectory', ensureAngularAuthenticated, dbDirectory.listDirectory);
app.post('/addDirectory', ensureAngularAuthenticated, dbDirectory.addDirectory);
app.post('/addAdmin', ensureAngularAuthenticated, dbAdmin.addAdmin);
app.delete('/removeFromDirectory/:id', ensureAngularAuthenticated, dbDirectory.removeFromDirectory);
app.get('/obtainUserInfo/:id', ensureAngularAuthenticated, dbDirectory.obtainUserInfo);
app.put('/updateUserInfo/:id', ensureAngularAuthenticated, dbDirectory.updateUserInfo);
app.get('/adminStatus/:id', ensureAngularAuthenticated, dbAdmin.adminStatus);
app.get('/getdirectoryID/:username', ensureAngularAuthenticated, dbDirectory.getdirectoryID);

//ticket server side function
app.get('/listTicket', ensureAngularAuthenticated, dbTicket.listTicket);
app.get('/listDisableTicket', ensureAngularAuthenticated, dbTicket.listDisableTicket);
app.post('/addNewTicket', ensureAngularAuthenticated, dbTicket.addNewTicket);
app.get('/obtainTicketInfo/:id', ensureAngularAuthenticated, dbTicket.obtainTicketInfo);
app.put('/updateTicketInfo/:id', ensureAngularAuthenticated, dbTicket.updateTicketInfo);
app.post('/addTicketLog/:id', ensureAngularAuthenticated, dbTicket.addTicketLog);
app.put('/grabTicket/:id', ensureAngularAuthenticated, dbTicket.grabTicket);
app.put('/acknowledgeTicket/:id', ensureAngularAuthenticated, dbTicket.acknowledgeTicket);
app.put('/assignTicketToUser/:id', ensureAngularAuthenticated, dbTicket.assignTicketToUser);
app.put('/closeTicket/:id', ensureAngularAuthenticated, dbTicket.closeTicket);
app.get('/getticketViewOptions', ensureAngularAuthenticated, dbAdmin.getticketViewOptions);
app.put('/setticketViewOptions', ensureAngularAuthenticated, dbAdmin.setticketViewOptions);
app.put('/approveTransfer/:id', ensureAngularAuthenticated, dbTicket.approveTransfer);
app.put('/denyTransfer/:id', ensureAngularAuthenticated, dbTicket.denyTransfer);
app.put('/acknowledgeTeamTransfer/:id', ensureAngularAuthenticated, dbTicket.acknowledgeTeamTransfer);
app.put('/cancelTransferRequest/:id', ensureAngularAuthenticated, dbTicket.cancelTransferRequest);
app.put('/activateTicket/:id', ensureAngularAuthenticated, dbTicket.activateTicket);


//typeahead and check serverside function
//typeahead
app.get('/lookCustomers/:look', ensureAngularAuthenticated, dbDirectory.lookCustomers);
//get user email
app.get('/getUserEmail/:id', ensureAngularAuthenticated, dbDirectory.getUserEmail);

//check user tickets
app.get('/checkUserTicket/:id', ensureAngularAuthenticated, dbTicket.checkUserTickets);

//send Email
app.post('/sendEmails', ensureAngularAuthenticated, sendEmail.sendComposerEmail);
app.post('/ticketComposerEmail', ensureAngularAuthenticated, sendEmail.ticketComposerEmail);

//group functions
app.get('/listGroups', ensureAngularAuthenticated, extra.listGroups);
app.post('/addNewGroup', ensureAngularAuthenticated, extra.addNewGroup);

//check user password
app.put('/changePassword', ensureAngularAuthenticated, dbAdmin.changePassword);
app.put('/disableAccount', ensureAngularAuthenticated, dbAdmin.disableAccount);
app.put('/disableOtherAccount/:id', ensureAngularAuthenticated, dbAdmin.disableOtherAccount);
app.put('/activateOtherAccount/:id', ensureAngularAuthenticated, dbAdmin.activateOtherAccount);

//get users for team
app.get('/getUsersForTeam', ensureAngularAuthenticated, dbAdmin.getUsersForTeam);
app.post('/createTeam', ensureAngularAuthenticated, dbAdmin.createTeam);
app.get('/getTeamList', ensureAngularAuthenticated, dbAdmin.getTeamList);
app.get('/getTeamInfo/:id', ensureAngularAuthenticated, dbAdmin.getTeamInfo);
app.put('/updateTeamInfo/:id', ensureAngularAuthenticated, dbAdmin.updateTeamInfo);
app.put('/activateTeam/:id', ensureAngularAuthenticated, dbAdmin.activateTeam);
app.put('/disableTeam/:id', ensureAngularAuthenticated, dbAdmin.disableTeam);
app.get('/teamListForTicket', ensureAngularAuthenticated, dbAdmin.teamListForTicket);
app.get('/getUserTeams', ensureAngularAuthenticated, dbAdmin.getUserTeams);
app.get('/getTeamMembers/:team', ensureAngularAuthenticated, dbAdmin.getTeamMembers);
app.get('/getTeamListForTransfer', ensureAngularAuthenticated, dbAdmin.getTeamListForTransfer);

//server ports
//app.listen(3000); //express
//server.listen(3000); //for ssl
server.listen(process.env.PORT || 443); //for socket
console.log("Server is running on port 80");

//openssl req -x509 -nodes -newkey rsa:1024 -out ticketSystem.crt -keyout clientKey.key
