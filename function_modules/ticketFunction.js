var mongojs = require('mongojs');
var db = mongojs('test',['Ticket']);
var bodyParser = require('body-parser');
var sendEmails = require('./sendEmails');
var dbDirectory = require('./directoryFunction');
//being scrapped var tRFunction = require('./ticketRelationFunctions')

//Database interactions functions for Ticket Collection

//check is there is any related tickets to the user
function checkTicketExsistance(id, callback){
  db.Ticket.count({_id: mongojs.ObjectId(id)},function(err,doc){
    callback(doc);
  });
}

//check is there is any related tickets to the user
function checkUserTickets(req,res){
  var id = req.params.id;
  db.Ticket.count({customerID:id},function(err,doc){
    res.json(doc);
  });
}

//add new ticket
function addNewTicket(req, res){
  req.body.creationDate = new Date();
  req.body.holderID = 'OPEN';
  req.body.closerID = 'NONE';
  req.body.ticketState = 'New';
  req.body.active = true;
  req.body.noLog = 1;

  //coede for the creation of worklog creation content
  var logContent = "Customer: " + req.body.customerName + "\nPrefered Contact Method: " + req.body.contactMethod + "\nAssigned to team: "+req.body.assignedTeam+"\nLevel: "+req.body.level+"\nTicket Holder: "+req.body.holderName+"\nTicket Type: "+
  req.body.type+ "\nPriority: " + req.body.priority + "\nTicket Location: "+req.body.ticketLocation+"\nShort Description: "+ req.body.shortDescription+ "\nDetail Description: "+req.body.detailDescription+"\nNotify ticket creation to customer: "+req.body.customerNotifyCreation + "\nNotify customer of future updates: "+req.body.customerNotifyFuture;
  req.body.workLog = [{type:"creation", date: new Date(), by:req.body.creatorID, content:logContent}];
  console.log(logContent);

  db.Ticket.insert(req.body,function(err, docs){
    if(req.body.customerNotifyCreation === true){
      dbDirectory.getUserEmailInternal(req.body.customerID,function(customerInfo){
        var emailObject = {"ticketID":docs._id,"title": docs.ticketTitle,"email": customerInfo.email};
        sendEmails.emailConformation(emailObject);
      });
    }
    res.json(docs);
  });
}


//send the list of all active tickets
function listTicket(req, res){
  db.Ticket.find({active: true},{assignedTeam:1, level:1, ticketTitle:1, priority:1, dDate:1, shortDescription:1, customerID:1, holderID:1, ticketState:1, customerName:1, holderName:1},function(err, lists){
    res.json(lists);
  });
}

//get Ticket info
function obtainTicketInfo(req, res){
  var id = req.params.id;
  db.Ticket.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
    res.json(doc);
  });
}

//update ticket info
//update user info
function updateTicketInfo(req, res){
  var id = req.params.id;
  //main update part
  db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},
    update: {$set: {customerID : req.body.customerID, customerName : req.body.customerName, contactMethod : req.body.contactMethod, assignedTeam : req.body.assignedTeam, level : req.body.level, ticketTitle : req.body.ticketTitle, type : req.body.type, priority : req.body.priority, ticketLocation : req.body.ticketLocation, shortDescription : req.body.shortDescription, detailDescription : req.body.detailDescription, customerNotifyFuture : req.body.customerNotifyFuture, holderName : req.body.holderName
  }},
    new: true}, function(err, doc){
    res.json(doc);
  });
}

//add log to a ticket
/*---1----
function addTicketLog(req, res){
  var id = req.params.id;
  var log = {type:req.body.type, date: new Date(), by:req.body.by, content:req.body.content};
  db.Ticket.update({_id: mongojs.ObjectId(id)},{$push:{workLog:log}},function(err,doc){
    res.json(doc);
  });
}
*/
function addTicketLog(req, res){
  var id = req.params.id;
  var log = {type:req.body.type, date: new Date(), by:req.body.by, content:req.body.content};
  enterLog(id,log, function(doc){
    res.json(doc);
  });
}

//export function
module.exports.addNewTicket = addNewTicket;
module.exports.checkUserTickets = checkUserTickets;
module.exports.listTicket = listTicket;
module.exports.obtainTicketInfo = obtainTicketInfo;
module.exports.updateTicketInfo = updateTicketInfo;
module.exports.addTicketLog = addTicketLog;
module.exports.enterLog = enterLog;
module.exports.checkTicketExsistance = checkTicketExsistance;
//internal function
function enterLog(id, log, callback){
  db.Ticket.update({_id: mongojs.ObjectId(id)},{$push:{workLog:log}},function(err,doc){
    callback(doc);
  });
}
