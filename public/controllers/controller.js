var ticket = angular.module('ticket',['ngRoute','ui.bootstrap','textAngular','checklist-model']);

ticket.config(function($routeProvider, $locationProvider){
	$routeProvider
	.when('/',
		//main Page route
		{
			controller:'userListController',
			templateUrl:'views/Dashboard/Dashboard.html'
		})
	    //Directory Routes
		.when('/Directory',
		{
			controller:'userListController',
			templateUrl:'views/Directory/userList.html'
		})
		.when('/Directory/addUser',
		{
			controller:'addUserToDirectory',
			templateUrl:'views/Directory/addUser.html'
		})
		.when('/Directory/addAdmin',
		{
			controller:'addAdminToDirectory',
			templateUrl:'views/Directory/addAdmin.html'
		})
		.when('/Directory/userDetails/:sendID',
		{
			controller:'detailsUserController',
      templateUrl:'views/Directory/userDetails.html'
    })
		.when('/Directory/updateUser/:sendID',
		{
			controller:'updateUserController',
			templateUrl:'views/Directory/updateUser.html'
		})
		//Ticket routes
		//my tickets
		.when('/Ticket/view/:whose',
		{
			controller:'ticketListController',
			templateUrl:'views/Ticket/ticketList.html'
		})
		.when('/Ticket/addNewTicket',
		{
			controller:'addNewTicket',
			templateUrl:'views/Ticket/addNewTicket.html'
		})
		.when('/Ticket/editTicket/:sendID',
		{
			controller:'updateTicketController',
			templateUrl:'views/Ticket/editTicket.html'
		})
		.when('/Ticket/ticketDetail/:sendID',
		{
			controller:'detailTicketController',
			templateUrl:'views/Ticket/ticketDetail.html'
		})
		//Email routes
		.when('/Email/email',
		{
			controller:'openEmailController',
			templateUrl:'views/Email/email.html'
		})
		//view group
		.when('/Groups/viewGroups',
		{
			controller:'viewGroups',
			templateUrl:'views/Groups/viewGroups.html'
		})
		//teams
		//view teams
		.when('/Teams/viewTeams',
		{
			controller:'viewTeamController',
			templateUrl:'views/Teams/viewTeams.html'
		})
		//create teams
		.when('/Teams/addNewTeams',
		{
			controller:'createTeamController',
			templateUrl:'views/Teams/addNewTeams.html'
		})
		//manage teams
		.when('/Teams/manageTeam/:sendID',
		{
			controller:'manageTeamController',
			templateUrl:'views/Teams/manageTeam.html'
		})
		//view user
		.when('/User/setting',
		{
			controller:'controlUserSettingController',
			templateUrl:'views/User/setting.html'
		})
	.otherwise({redirectTo:'/'});
});
