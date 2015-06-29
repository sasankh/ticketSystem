//mostly for ssl
/*var fs = require('fs');
var https = require('https');*/

//other requirement
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

//for passport
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var passport= require('passport');
var passportLocal = require('passport-local');

//ssl server
/*var server = https.createServer({
  cert: fs.readFileSync(__dirname + '/sslKey/ticketSystem.crt'),
  key: fs.readFileSync(__dirname + '/sslKey/clientKey.key')
}, app);*/

//for functions
var dbDirectory = require('./function_modules/directoryFunction');
var dbAdmin = require('./function_modules/adminFunction');
var dbTicket = require('./function_modules/ticketFunction');
var sendEmail = require('./function_modules/sendEmails');
var getEmail = require('./function_modules/getEmails');
var extra = require('./function_modules/extraFunctions');

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
  secret: 'ticketSystem',
  resave: false,
  saveUninitialized: false
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
  done(null, {id: id, name: id});
});
//for ejs
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
    res.send(403);
  }
}

app.get('/', function(req, res){
  res.render('index',{
    isAuthenticated: req.isAuthenticated(),
    user: req.user
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
  res.render('main');
});

app.post('/login', passport.authenticate('local'), function(req,res){
  res.redirect('/main');
});

//Functions
//Directroy server side functions
app.get('/listDirectory', ensureAngularAuthenticated, dbDirectory.listDirectory);
app.post('/addDirectory', ensureAngularAuthenticated, dbDirectory.addDirectory);
app.post('/addAdmin', ensureAngularAuthenticated, dbAdmin.addAdmin);
app.delete('/removeFromDirectory/:id', ensureAngularAuthenticated, dbDirectory.removeFromDirectory);
app.get('/obtainUserInfo/:id', ensureAngularAuthenticated, dbDirectory.obtainUserInfo);
app.put('/updateUserInfo/:id', ensureAngularAuthenticated, dbDirectory.updateUserInfo);

//ticket server side function
app.get('/listTicket', ensureAngularAuthenticated, dbTicket.listTicket);
app.post('/addNewTicket', ensureAngularAuthenticated, dbTicket.addNewTicket);
app.get('/obtainTicketInfo/:id', ensureAngularAuthenticated, dbTicket.obtainTicketInfo);
app.put('/updateTicketInfo/:id', ensureAngularAuthenticated, dbTicket.updateTicketInfo);
app.post('/addTicketLog/:id', ensureAngularAuthenticated, dbTicket.addTicketLog);

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


//server ports
app.listen(3000);
//server.listen(3000);
console.log("Server is running on port 3000")

//openssl req -x509 -nodes -newkey rsa:1024 -out ticketSystem.crt -keyout clientKey.key
