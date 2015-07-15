Note:
Script to auto create the database, and a page to enter the ip, dns and email's (username and password) will be available in the final git push|product.
Along with the script to turn the system into a service in the host so that it restarts automatically at system start.
Feel free to use and comment.:)

SuperAdmin
username: "theforce"                 //you cannot change the user. No one can change 'theforce' unless you do it directly from the database:)
password: "maytheforcebewithyou"     //you can change the password


1) Used  MEAN stack.

2)There is a 'test' mongodbdump in the 'db' folder. Perforem a 'mongrestore' of the 'test' database.

3) Perform "npm install".

4) Enter gmail 'email' and 'password' in "function_modules/sendEmail.js" and 'function_modules/getEmail.js' to allow sending and receiving email.

5)Replace the "localhost" in 'restrictedFiles/controllers/openChat.js', 'restrictedFiles/controllers/ticketControllers.js' and 'views/privateMessage.ejs' with the DNS name or the IP so that the socket can work for auto refresh and chat.

6) Start application from terminal. command : "node server.js" or "nodemon server.js"

7) There is a default user "theforce" with password "maytheforcebewithyou". You can create new admin and use them. Currently the password is placed in plane text and is not encrypted. SSL is there but is commented out. The key and certificate is in 'sslKey'.Implementing ssl may cause "css" error right now but I will fix them later. Encryption and ssl will be implemented in the end product.

8) Progress video are as available below:

  a) Explains the features of the system

    https://www.youtube.com/watch?v=TyZsrxnUchg&index=3&list=PLWkBKvqBsDZnoUakEcl1uR-_a7Fd1iuiQ

  b) Includes the features missed to explained in the fist video

    https://www.youtube.com/watch?v=0xD6wJLRnsM&list=PLWkBKvqBsDZnoUakEcl1uR-_a7Fd1iuiQ&index=4

  c) public chat and few other features

     https://www.youtube.com/watch?v=XihrwF__piI&list=PLWkBKvqBsDZnoUakEcl1uR-_a7Fd1iuiQ&index=5
