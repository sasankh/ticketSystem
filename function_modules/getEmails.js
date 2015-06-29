var MailListener = require("mail-listener2");
var dbTicket = require('./ticketFunction');

var mailListener = new MailListener({
  username: "email@gmail.com", //enter email here
  password: "password",  //enter password here
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true,
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
//  tlsOptions: { rejectUnauthorized: false },
//  mailbox: "INBOX", // mailbox to monitor
//  searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time
//  mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
//  attachments: true, // download attachments as they are encountered to the project directory
//  attachmentOptions: { directory: "../files/emailAttachments/" } // specify a download directory for attachments
});

mailListener.start(); // start listening

// stop listening
//mailListener.stop();

mailListener.on("server:connected", function(){
  console.log("imapConnected");
});

mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});

mailListener.on("error", function(err){
  console.log(err);
});

mailListener.on("mail", function(mail, seqno, attributes){
  // check the subject for ticket ID
  var checkSubject = mail.subject;
  var check1 = checkSubject.search(/SYSTICKET/i);
  var check2 = checkSubject.search(/ENDTICKET/i);
  if((check1 >= 0) && (check2 >= 0)){
    var start = checkSubject.search(/SYSTICKET/i) + 9;
    var end = checkSubject.search(/ENDTICKET/i);
    var ticketID = checkSubject.substring(start,end);
    dbTicket.checkTicketExsistance(ticketID, function(count){
      console.log(count);
      if(count == 1){
        var entryLog = {type:"Email", date:mail.date, by:mail.from[0].address, content:mail.text};
        dbTicket.enterLog(ticketID, entryLog, function(doc){
          console.log("Entered to the ticket log");
        });
      }
      else{
        console.log("Email with ticket syntax but no ticket with the id present");
      }
    });
  }
  else{
    console.log("New email but not ticket related email!");
  }
//  var toLogData = {from:mail.from, to:mail.to, subject:mail.subject, content:mail.text, date:mail.date, receivedDate:mail.receivedDate};
//  console.log(toLogData);
  // mail processing code goes here
});
/*
mailListener.on("attachment", function(attachment){
  console.log(attachment.path);
});
*/
