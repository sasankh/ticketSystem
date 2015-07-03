angular.module('ticket');

//Controllers declaration
ticket.controller('addNewTicket', addNewTicket);
ticket.controller('ticketListController', ticketListController);
ticket.controller('addUserToDirectoryTicket', addUserToDirectoryTicket);
ticket.controller('viewCustomerDetailsController', viewCustomerDetailsController);
ticket.controller('updateTicketController', updateTicketController);
ticket.controller('selectCustomerForTicket', selectCustomerForTicket);
ticket.controller('detailTicketController', detailTicketController);
ticket.controller('addTicketLog',addTicketLog);
ticket.controller('assignTeamListController', assignTeamListController);
ticket.controller('closeTicketController', closeTicketController);

//Create a new ticket
function addNewTicket($scope, $http, $modal, $log){
//  $scope.ticket = {};
  $scope.animationsEnabled = true;
  $scope.customerNotifyCreation = false;
  $scope.leadList = [];


  var refresh = function(){
    $scope.ticket = {};
    $scope.customerNotifyCreation = false;
    $scope.teamList = "";
    $http.get('/teamListForTicket').success(function(response){
      $scope.leadList = new Array(response.length);
      for(var x = 0; x < response.length; x++){
        if(response[x].isLead){
          $scope.leadList[x] = response[x].value;
        }
      }
      $scope.teamList = response;
    });
  };

  refresh();

    $scope.addTicket = function(){
      $scope.ticket.customerNotifyCreation = $scope.customerNotifyCreation;
      if($scope.ticket.assignedTeam == 'OPEN'){
        $scope.ticket.assignmentType = 'OPEN';
      }
      $http.post('/addNewTicket', $scope.ticket).success(function(){
        refresh();
      });
    };

    //Select Customer screen
    $scope.selectUser = function(size){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/selectUserList.html',
        controller: 'selectCustomerForTicket',
        size: 'lg'
      });

      modalInstance.result.then(function (customerInfo) {
        $scope.ticket.customerID = customerInfo.id;
        $scope.ticket.customerName = customerInfo.name;
      });
    };

    $scope.clear = function(){
        $scope.ticket = "";
        $scope.customerNotifyCreation = false;
    };

    //Back button to list
    $scope.cancel = function(){
        location.href= "#/Ticket/view/All";
    };

    //Add New customer screen
    $scope.openAddUser = function(size){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Directory/addUser.html',
        controller: 'addUserToDirectoryTicket',
        size: size
      });
    };

    //typehead functions
    //Customer Typeahead

    $scope.getCustomer = function(look) {
      return $http.get('/lookCustomers/' + look).then(function(response){
        var tyahead = response.data;
        return tyahead;
      });
    };

    //Date function
    $scope.calenderOpen = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened = true;
    };
};

//add user within ticket creation
function addUserToDirectoryTicket($scope, $http, $modalInstance){

  var refresh = function(){
    $http.get('/listGroups').success(function(response){
      $scope.listGroup = response;
      $scope.group="";
  })};

  refresh();


    $scope.addUser = function(){
        $http.post('/addDirectory', $scope.person).success(function(){
            $scope.person = "";
            $modalInstance.close();
        });
    };

    $scope.clear = function(){
        $scope.person = "";
    };

    //Back button to list
    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    };
};

//list the different tickets
function ticketListController($scope, $http, $modal, $log, $route, $routeParams, $location, $filter){

    var refresh = function(){
      $http.get('/listTicket').success(function(response){
        $scope.listTicket = response;
        $scope.ticket="";
      });
      $http.get('/user').success(function(response){
        $scope.controlUser = response.username;
      });
      $http.get('/getUserTeams').success(function(response){
        $scope.leads = response.lead;
        $scope.member = response.member;
      });
      //Keep an eye on this one
      var whose = $routeParams.whose;
      if (whose == "MyTickets"){
        $scope.myActive = true;
      }else{
        $scope.allActive = true;
      }
    };

    refresh();

    $scope.assignTicket = function(ticketID, assignedTeam){
      //Select Customer screen
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: '/views/Ticket/assignTeamList.html',
          controller: 'assignTeamListController',
          size: 'lg',
          resolve: {
            team: function () {
              return {assignedTeam:assignedTeam, ticketID:ticketID};
            }
          }
        });

        modalInstance.result.then(function () {
          refresh();
        });
    }

    //close ticket
    $scope.closeTicket = function(tID,cID){
      var sendData = {ticketID:tID,customerID:cID};
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/closeTicket.html',
        controller: 'closeTicketController',
        size: 'lg',
        resolve: {
          data: function () {
            return sendData;
          }
        }
      });
      modalInstance.result.then(function () {
        refresh();
      });
    }


    //acknowledge ticket
    $scope.acknowledge = function(id){
      $http.put('/acknowledgeTicket/'+id).success(function(response){
        if(response == 200){
          refresh();
        }else{
          alert("Could not acknowledge the ticket");
        }
      });
    }

    //view customer detail screen //all change done
    $scope.openCustomerInfo = function(sendID){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: 'views/Ticket/customerDetails.html',
        controller: 'viewCustomerDetailsController',
        resolve: {
          displayID: function () {
            return sendID;
          }
        }
      });
    };

    //email customer regarding the ticket
    $scope.emailCustomer = function(customerID, ticketID, customerName){
      $http.get('/getUserEmail/' + customerID).success(function(response){
        var data = {name:customerName, email:response.email, subject:ticketID};
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: 'views/Email/ticketEmail.html',
          controller: 'internalEmailController',
          size: 'lg',
          resolve: {
            data: function () {
              return data;
            }
          }
        });
      });
    };

    $scope.edit = function(id){
        location.href= "#/Ticket/editTicket/" + id;
    };

    $scope.grab = function(id){
      $http.put('/grabTicket/'+id).success(function(response){
        if(response == 200){
          refresh();
        }else{
          alert("Could not grab the ticket");
        }
      });
    };

    $scope.addLog = function(tID, cID){
      var sendData = {ticketID:tID,customerID:cID};
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/addLog.html',
        controller: 'addTicketLog',
        size: 'lg',
        resolve: {
          data: function () {
            return sendData;
          }
        }
      });
    };

    $scope.details = function(id){
      location.href = "#/Ticket/ticketDetail/" + id;
    };
};

//close ticket
function closeTicketController($scope, $http, $modalInstance, data){


  $scope.close = {};
  $scope.ticketID = data.ticketID;
  $scope.close.customerNotifyLog = false;
  $scope.close.customerVisibleLog = true;

  $scope.closeTicket = function(){
    $scope.close.type = "Closing";
    $scope.close.customerID = data.customerID;
    $http.put('/closeTicket/' + data.ticketID, $scope.close).success(function(response){
      if(response == 200){
        $modalInstance.close();
      }else{
        alert("Could not close the ticket");
      }
    });
  };

  //Back button to list
  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

}

//assign team ticket controller
function assignTeamListController($scope, $http, $modalInstance, team){

  var refresh = function(){
    $http.get("/getTeamMembers/" + team.assignedTeam).success(function(members){
      $scope.memberList = members;
    });
  }

  refresh();

  $scope.assignUser = function(assignedUsername){
    var holder = {holderName:assignedUsername};
    $http.put('/assignTicketToUser/' + team.ticketID, holder).success(function(response){
      if(response == 200){
        $modalInstance.close();
      }else{
        alert("Could not assign the ticket");
        $modalInstance.close();
      }
    });
  }
}


//customer Detail from ticket list
function viewCustomerDetailsController($scope, $http, $modal, $log, $modalInstance, displayID){

    var refresh = function(){
      $http.get('/obtainUserInfo/' + displayID).success(function(response){
        $scope.person = response;
    })};

    refresh();

    //Back button to list
    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    };
};

//Update User Controller
function updateTicketController($scope, $http, $routeParams, $modal, $log){

    var id = $routeParams.sendID;
    $scope.leadList = [];
    var refresh = function(){$http.get('/obtainTicketInfo/' + id).success(function(ticketInfo){
        $scope.ticket = ticketInfo;
        $scope.teamList = "";
        $http.get('/teamListForTicket').success(function(response){
          $scope.leadList = new Array(response.length);
          for(var x = 0; x < response.length; x++){
            if(response[x].isLead){
              $scope.leadList[x] = response[x].value;
            }
          }
          $scope.teamList = response;
        });
    })};

    $scope.updateTicket = function(){
        $http.put('/updateTicketInfo/' + id, $scope.ticket).success(function(response){
            $scope.ticket = ""
            location.href="#/Ticket/ticketDetail/" + id;
        });
    };

    refresh();

    $scope.undo = function(){
        refresh();
    }

    $scope.cancel = function(){
        location.href= "#/Ticket/view/All";
    };

    //Select Customer screen
    $scope.selectUser = function(size){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/selectUserList.html',
        controller: 'selectCustomerForTicket',
        size: 'lg'
      });

      modalInstance.result.then(function (customerInfo) {
        $scope.ticket.customerName = customerInfo.name;
        $scope.ticket.customerID = customerInfo.id;
      });
    };


};
//controler for selecting users
function selectCustomerForTicket($scope, $http, $modalInstance, $route, $routeParams, $location, $filter){

$scope.currentPage = 0;
$scope.items = [];
$scope.listLength = 0;
$scope.itemsPerPage = 10;
$scope.advanceSearch = true;

//order By
var orderBy = $filter('orderBy');
$scope.order = function(predicate, reverse) {
    $scope.listDirectory = orderBy($scope.listDirectory, predicate, reverse);
};

var refresh = function(){
  $http.get('/listDirectory').success(function(response){
  $scope.listDirectory = response;
    $scope.listLength = response.length;
    $scope.order('-fname',true);
    $scope.person="";
})};

refresh();

$scope.selectUser = function(fname, lname, id){
  var customer = {name: fname + " " + lname, id: id};
  $modalInstance.close(customer);
};


//Pagination Codes

$scope.prevPage = function() {
    if ($scope.currentPage > 0) {
        $scope.currentPage--;
    }
};

$scope.prevPageDisabled = function() {
    return $scope.currentPage === 0 ? "disabled" : "";
};

$scope.pageCount = function() {
    return Math.ceil($scope.listLength/$scope.itemsPerPage)-1;
};

$scope.nextPage = function() {
    if ($scope.currentPage < $scope.pageCount()) {
        $scope.currentPage++;
    }
};

$scope.nextPageDisabled = function() {
    return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
};
};

//controller for ticket details, update , editTicket
function detailTicketController($scope, $http, $routeParams, $modal, $log, $route){


      var id = $routeParams.sendID;
      $http.get('/user').success(function(response){
        $scope.controlUser = response.username;
      });
      $http.get('/getUserTeams').success(function(response){
        $scope.leads = response.lead;
        $scope.member = response.member;
      });

      var refresh = function(){$http.get('/obtainTicketInfo/' + id).success(function(response){
          $scope.ticket = response;
          $scope.isCollapsed = false;
          $scope.logData = {};
          $scope.newLog = "";
          $scope.logData.customerNotifyLog = false;
          $scope.logData.customerVisibleLog = false;
      })};

      //acknowledge ticket
      $scope.acknowledge = function(){
        $http.put('/acknowledgeTicket/'+id).success(function(response){
          if(response == 200){
            refresh();
          }else{
            alert("Could not acknowledge the ticket");
          }
        });
      }

      $scope.assignTicket = function(){
        //Select Customer screen
          var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/views/Ticket/assignTeamList.html',
            controller: 'assignTeamListController',
            size: 'lg',
            resolve: {
              team: function () {
                return {assignedTeam:$scope.ticket.assignedTeam, ticketID:id};
              }
            }
          });

          modalInstance.result.then(function (assignedTo) {
            refresh();
          });
      }

      //close ticket
      $scope.closeTicket = function(){
        var sendData = {ticketID:id,customerID:$scope.ticket.customerID};
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: '/views/Ticket/closeTicket.html',
          controller: 'closeTicketController',
          size: 'lg',
          resolve: {
            data: function () {
              return sendData;
            }
          }
        });
        modalInstance.result.then(function () {
          location.href = "#/Ticket/view/All"
        });
      }

      //Edit button
      $scope.edit = function(){
          location.href= "#/Ticket/editTicket/" + id;
      };

      refresh();

      //edit ticket
      $scope.editTicket = function(){
          location.href= "#/Ticket/editTicket/" + id;
      };

      //Add log
      $scope.addToLog = function(){
        $scope.logData.type = "Internal";
        $scope.logData.customerID = $scope.ticket.customerID;
        if($scope.logData.customerNotifyLog == true){
          $scope.logData.customerVisibleLog = true;
        }
        $http.post('/addTicketLog/' + id, $scope.logData).success(function(response){
          if(response == 200){
            refresh();
          }else{
            alert("Could not add the new log");
          }
        });
      }

      //email customer regarding the ticket
      $scope.emailCustomer = function(){
        $http.get('/getUserEmail/' + $scope.ticket.customerID).success(function(response){
          var data = {name:$scope.ticket.customerName, email:response.email, subject:id};
          var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'views/Email/ticketEmail.html',
            controller: 'internalEmailController',
            size: 'lg',
            resolve: {
              data: function () {
                return data;
              }
            }
          });
          modalInstance.result.then(function () {
            refresh();
          });
        });
      };

      //view customer detail screen //all change done
      $scope.openCustomerInfo = function(sendID){
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: 'views/Ticket/customerDetails.html',
          controller: 'viewCustomerDetailsController',
          resolve: {
            displayID: function () {
              return sendID;
            }
          }
        });
      };

      //grab the ticket
      $scope.grab = function(){
        $http.put('/grabTicket/'+id).success(function(response){
          if(response == 200){
            refresh();
          }else{
            alert("Could not grab the ticket");
          }
        });
      };
};

//Add new group controller
function addTicketLog($scope, $http, $modalInstance, data){

    $scope.update = {};
    $scope.ticketID = data.ticketID;
    $scope.update.customerNotifyLog = false;
    $scope.update.customerVisibleLog = false;

    $scope.add = function(){
      $scope.update.type = "Internal";
      if($scope.update.customerNotifyLog == true){
        $scope.update.customerVisibleLog = true;
      }
      $scope.update.customerID = data.customerID;
      $http.post('/addTicketLog/' + data.ticketID, $scope.update).success(function(response){
        if(response == 200){
          $modalInstance.close();
        }else{
          alert("Could not grab the ticket");
        }
      });
    };

    //Back button to list
    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    };
};
