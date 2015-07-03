var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var mongojs = require('mongojs');
var db = mongojs('test',['emailLog']);
var dbTicket = require('./ticketFunction');
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'email@gmail.com', //enter email
		pass: 'password' //enter password
	}
});

//email Conformation
function emailConformation(docs){
	creationEmail(docs, function(){
		var tempData = {"kind":"Creation", "to":docs.email, "subject":docs.ticketID, "message":"Ticket creation confirmation"};
		db.emailLog.insert(tempData,function(err, docs){
			console.log("done email creation");
		});
	});
}

//send Email from composer
function sendComposerEmail(req, res){
	sendEmail(req, function(){
		req.body.kind = "open";
		db.emailLog.insert(req.body,function(err, docs){
			res.json(docs);
		});
	});
}

//send Email from composer
function ticketComposerEmail(req, res){
	sendEmail(req, function(){
		var id = req.body.ticketID;
		req.body.by = req.user.username;
	  var log = {type:"Email", date: new Date(), by:req.user.username, content:req.body.message, customerNotifyLog:true, customerVisibleLog:false};
    dbTicket.enterLog(id, log, function(doc){
			req.body.kind = "Internal";
			db.emailLog.insert(req.body,function(err, docs){
				res.json(docs);
			});
		});
	});
}

//internal notify email
function notifyEmail(req, callback){
	transporter.sendMail({
		from: 'systemticket007@gmail.com',
		to: req.to,
		subject: req.subject,
		text: req.message
	});
	db.emailLog.insert(req,function(err, docs){
		console.log("added");
	});
	callback();
}

//export function
module.exports.emailConformation = emailConformation;
module.exports.sendComposerEmail = sendComposerEmail;
module.exports.ticketComposerEmail = ticketComposerEmail;
module.exports.notifyEmail = notifyEmail;

function sendEmail(req, callback){
	transporter.sendMail({
		from: 'systemticket007@gmail.com',
		to: req.body.to,
		subject: req.body.subject,
		text: req.body.message
	});
	callback();
}


function creationEmail(docs, callback){
	transporter.sendMail({
		from: 'systemticket007@gmail.com',
		to: docs.email,
		subject: 'Ticket SYSTICKET'+docs.ticketID+'ENDTICKET Creation Notification',
		text: 'Hi\n\nThis is to let you know that a ticket (ID: SYSTICKET' + docs.ticketID + 'ENDTICKET, Subject: ' + docs.title + ') has been created for you.\nFor future interaction regarding the ticket through email, please insure that the ticket ID is included in the subject of the email.\n\nThank you\nSasankh BC'
	});
	callback();
}
