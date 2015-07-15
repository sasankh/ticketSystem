Note: FREE TO USE and TEST 
Script to auto create the database, and a page to enter the ip, dns and email's (username and password) will be available in the final product.
Along with the script to turn the system into a service in the host so that it restarts automatically at system start.
Feel free to use and comment.:)

SuperAdmin

username: "theforce"                 //you cannot change the user. No one can change 'theforce' unless you do it directly from the database:)

password: "maytheforcebewithyou"     //you can change the password


1) Used  MEAN stack and socket.io.  

2) There is a mongodbdump called 'test' in the 'db' folder. Perform a 'mongrestore' of the 'test' database.

3) Perform "npm install".

4) Enter gmail 'email' and 'password' in "function_modules/sendEmail.js" and 'function_modules/getEmail.js' to allow sending and receiving email.

5) Replace the "localhost" in 'restrictedFiles/controllers/openChat.js', 'restrictedFiles/controllers/ticketControllers.js' and 'views/privateMessage.ejs' with the DNS name or the IP so that the socket can work for auto refresh and chat.

6) Start application from terminal. command : "node server.js" or "nodemon server.js"

7) There is a default user "theforce" with password "maytheforcebewithyou". You can create new admin and use them. SSL is enabled. Replace the ssl key with your own if desired in 'sslKey' folder. Make sure the names are the same for now. I will make it changable through browser later. Currently the password is placed in plane text and is not encrypted.

8) Open chat area and individual chat are available. I have not made the individual chat video yet. It can be initiated by clicking on the user on the 'online user' section. The "View Ticket" section auto updates itself when changes are made to the ticket. Every task done to the ticket from its activation, modification (including what parameter was changed to what by whom and when), transfer, acknowledgement, approval , closing are clogged in the ticket and can be viewed.

9) Progress videos with the consecutively explanation of features are available below till the open chat feature:

  a) Explains the features of the system

    https://www.youtube.com/watch?v=TyZsrxnUchg&index=3&list=PLWkBKvqBsDZnoUakEcl1uR-_a7Fd1iuiQ

  b) Includes the features missed to explained in the fist video

    https://www.youtube.com/watch?v=0xD6wJLRnsM&list=PLWkBKvqBsDZnoUakEcl1uR-_a7Fd1iuiQ&index=4

  c) public chat and few other features

     https://www.youtube.com/watch?v=XihrwF__piI&list=PLWkBKvqBsDZnoUakEcl1uR-_a7Fd1iuiQ&index=5
