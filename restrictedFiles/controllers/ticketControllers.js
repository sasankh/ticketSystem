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
ticket.controller('ticketSettingController', ticketSettingController);
ticket.controller('teamTransferController', teamTransferController);
ticket.controller('disableTicketListController',disableTicketListController);
ticket.controller('activateTicketController',activateTicketController);

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
}

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
}

//list the different tickets
function disableTicketListController($scope, $http, $modal, $log, $route, $routeParams, $location, $filter){

    $http.get('/user').success(function(response){
      $scope.controlUser = response.username;
    });
    $http.get('/getticketViewOptions').success(function(response){
      $scope.viewOptions = response;
    });

    var refresh = function(){
      $http.get('/listDisableTicket').success(function(response){
        $scope.listTicket = response;
        $scope.ticket="";
      });
    };

    refresh();

    //close ticket
    $scope.activateTicket = function(tID,cID){
      var sendData = {ticketID:tID,customerID:cID};
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/activateTicket.html',
        controller: 'activateTicketController',
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

    $scope.details = function(id){
      location.href = "#/Ticket/ticketDetail/" + id;
    };
}

function activateTicketController($scope, $http, $modalInstance, data){
    $scope.activate = {};
    $scope.ticketID = data.ticketID;
    $scope.activate.customerNotifyLog = false;
    $scope.activate.customerVisibleLog = true;
    $scope.activate.reason = "";

    $scope.activateTicket = function(){
      $scope.activate.type = "Reactivation";
      $scope.activate.customerID = data.customerID;
      $http.put('/activateTicket/' + data.ticketID, $scope.activate).success(function(response){
        if(response == 200){
          $modalInstance.close();
        }else{
          alert("Could not activate the ticket");
        }
      });
    };

    //Back button to list
    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    };
}


  //list the different tickets
function ticketListController($scope, $http, $modal, $log, $route, $routeParams, $location, $filter){

    $http.get('/user').success(function(response){
      $scope.controlUser = response.username;
    });
    $http.get('/getUserTeams').success(function(response){
      $scope.leads = response.lead;
      $scope.member = response.member;
    });
    $http.get('/getticketViewOptions').success(function(response){
      $scope.viewOptions = response;
    });

    var refresh = function(){
      $http.get('/listTicket').success(function(response){
        $scope.listTicket = response;
        $scope.ticket="";
      });
      /*      $http.get('/user').success(function(response){
      $scope.controlUser = response.username;
      });
      $http.get('/getUserTeams').success(function(response){
      $scope.leads = response.lead;
      $scope.member = response.member;
      });*/
      //Keep an eye on this one
      var whose = $routeParams.whose;
      if (whose == "MyTickets"){
        $scope.myActive = true;
      }else{
        $scope.allActive = true;
      }
    };

    refresh();

    //------------------------------------------------------------------------------
    //socket experiment

    try{
      console.log("Socket connection attempted");
      var connectTo = "https://localhost:443/refresher";
      var socket = io.connect(connectTo);
      //    var socket = io.connect('https://localhost:443/publicChat');
    } catch(e){
      //set status to warn user
    }
    if(socket != undefined){
      socket.on('refresh', function(data){
        if(data){
          refresh();
        }
      });
    }

    //------------------------------------------------------------------------------
    $scope.transferTicket = function(ticketID, assignedTeam, assignmentType){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/assignTeamList.html',
        controller: 'assignTeamListController',
        size: 'lg',
        resolve: {
          team: function () {
            return {assignedTeam:assignedTeam, ticketID:ticketID, type:"transfer", assignmentType:assignmentType};
          }
        }
      });

      modalInstance.result.then(function () {
        refresh();
      });
    }

    //acknowledge team transfre ticket

    $scope.acknowledgeTeam = function(ticketID, assignedTeam, assignTo){
      $http.put('/acknowledgeTeamTransfer/'+ticketID, {"assignedTeam":assignedTeam, "assignTo":assignTo}).success(function(response){
        if(response == 200){
          refresh();
        }else{
          alert("Could not acknowledge");
        }
      });
    }

    $scope.approveTransfer = function(id,transferTo){
      $http.put('/approveTransfer/'+id, {"transferTo":transferTo}).success(function(response){
        if(response == 200){
          refresh();
        }else{
          alert("Could Not approve");
        }
      });
    }

    $scope.denyTransfer = function(id, denyTo){
      $http.put('/denyTransfer/'+id,{"denyTo":denyTo}).success(function(response){
        if(response == 200){
          refresh();
        }else{
          alert("Could Not deny");
        }
      });
    }

    $scope.teamTicketTransfer = function(ticketID, assignedTeam, assignmentType){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/assignTeamList.html',
        controller: 'teamTransferController',
        size: 'lg',
        resolve: {
          team: function () {
            return {assignedTeam:assignedTeam, ticketID:ticketID, type:"team", assignmentType:assignmentType};
          }
        }
      });

      modalInstance.result.then(function () {
        refresh();
      });
    }




    $scope.transferRequest = function(ticketID, assignedTeam, assignmentType){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/assignTeamList.html',
        controller: 'assignTeamListController',
        size: 'lg',
        resolve: {
          team: function () {
            return {assignedTeam:assignedTeam, ticketID:ticketID, type:"suggest", assignmentType:assignmentType};
          }
        }
      });

      modalInstance.result.then(function () {
        refresh();
      });
    }

    $scope.assignTicket = function(ticketID, assignedTeam, assignmentType){
      //Select Customer screen
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Ticket/assignTeamList.html',
        controller: 'assignTeamListController',
        size: 'lg',
        resolve: {
          team: function () {
            return {assignedTeam:assignedTeam, ticketID:ticketID, type:"assign", assignmentType:assignmentType};
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

    //cancel transfer request
    $scope.cancelTicketTransfer = function(id, assignTo){
      $http.put('/cancelTransferRequest/'+id, {"assignTo":assignTo}).success(function(response){
        if (response == 200){
          refresh();
        }else{
          alert("could not cancel");
          refresh();
        }
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
}

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

    $scope.type = team.type;
    $scope.trans = {};

    var refresh = function(){
      $http.get("/getTeamMembers/" + team.assignedTeam).success(function(members){
        $scope.memberList = members;
      });
    }

    refresh();


    $scope.assignUser = function(assignedUsername){
      if(team.type == 'assign'){
        $scope.trans.comment = ""
      }
      var assignData = {assignTo:assignedUsername, type:team.type, assignmentType:team.assignmentType, comment:$scope.trans.comment};
      $http.put('/assignTicketToUser/' + team.ticketID, assignData).success(function(response){
        if(response == 200){
          $modalInstance.close();
        }else{
          alert("Could not perform the task");
          $modalInstance.close();
        }
      });
    }
}


// team ticket transfer controller
function teamTransferController($scope, $http, $modalInstance, team){

    $scope.type = team.type;
    $scope.trans = {};

    var refresh = function(){
      $http.get("/getTeamListForTransfer").success(function(teams){
        $scope.memberList = teams;
      });
    }

    refresh();


    $scope.assignUser = function(assignedUsername){
      var assignTo = {assignTo:assignedUsername, type:team.type, assignmentType:team.assignmentType, comment:$scope.trans.comment};
      $http.put('/assignTicketToUser/' + team.ticketID, assignTo).success(function(response){
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
}

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
}

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
}

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

        refresh();

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

        $scope.transferTicket = function(ticketID, assignedTeam, assignmentType){
          var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/views/Ticket/assignTeamList.html',
            controller: 'assignTeamListController',
            size: 'lg',
            resolve: {
              team: function () {
                return {assignedTeam:assignedTeam, ticketID:ticketID, type:"transfer", assignmentType:assignmentType};
              }
            }
          });

          modalInstance.result.then(function () {
            refresh();
          });
        }

        //acknowledge team transfre ticket

        $scope.acknowledgeTeam = function(ticketID, assignedTeam, assignTo){
          $http.put('/acknowledgeTeamTransfer/'+ticketID, {"assignedTeam":assignedTeam, "assignTo":assignTo}).success(function(response){
            if(response == 200){
              refresh();
            }else{
              alert("Could not acknowledge");
            }
          });
        }

        $scope.approveTransfer = function(id,transferTo){
          $http.put('/approveTransfer/'+id, {"transferTo":transferTo}).success(function(response){
            if(response == 200){
              refresh();
            }else{
              alert("Could Not approve");
            }
          });
        }

        $scope.denyTransfer = function(id, denyTo){
          $http.put('/denyTransfer/'+id,{"denyTo":denyTo}).success(function(response){
            if(response == 200){
              refresh();
            }else{
              alert("Could Not deny");
            }
          });
        }

        $scope.teamTicketTransfer = function(ticketID, assignedTeam, assignmentType){
          var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/views/Ticket/assignTeamList.html',
            controller: 'teamTransferController',
            size: 'lg',
            resolve: {
              team: function () {
                return {assignedTeam:assignedTeam, ticketID:ticketID, type:"team", assignmentType:assignmentType};
              }
            }
          });

          modalInstance.result.then(function () {
            refresh();
          });
        }

        $scope.transferRequest = function(ticketID, assignedTeam, assignmentType){
          var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/views/Ticket/assignTeamList.html',
            controller: 'assignTeamListController',
            size: 'lg',
            resolve: {
              team: function () {
                return {assignedTeam:assignedTeam, ticketID:ticketID, type:"suggest", assignmentType:assignmentType};
              }
            }
          });

          modalInstance.result.then(function () {
            refresh();
          });
        }

        $scope.assignTicket = function(ticketID, assignedTeam, assignmentType){
          //Select Customer screen
          var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/views/Ticket/assignTeamList.html',
            controller: 'assignTeamListController',
            size: 'lg',
            resolve: {
              team: function () {
                return {assignedTeam:assignedTeam, ticketID:ticketID, type:"assign", assignmentType:assignmentType};
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
            location.href = "#/Ticket/view/All";
          });
        }//

        //cancel transfer request
        $scope.cancelTicketTransfer = function(id, assignTo){
          $http.put('/cancelTransferRequest/'+id, {"assignTo":assignTo}).success(function(response){
            if (response == 200){
              refresh();
            }else{
              alert("could not cancel");
              refresh();
            }
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
        }//





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
        };//

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
            modalInstance.result.then(function () {
              refresh();
            });
          });
        };//

        $scope.edit = function(id){
          location.href= "#/Ticket/editTicket/" + id;
        };//

        $scope.grab = function(id){
          $http.put('/grabTicket/'+id).success(function(response){
            if(response == 200){
              refresh();
            }else{
              alert("Could not grab the ticket");
            }
          });
        };   //
}

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
}

//ticket setting controller
function ticketSettingController($scope, $http){
        $scope.viewSettings = {};
        $scope.viewSettings.viewOptions = {creatorName:false, creationDate:false, level:false, ticketLocation:false, assignmentType:false, contactMethod:false};

        var refresh = function(){
          $http.get('/getticketViewOptions').success(function(response){
            $scope.viewSettings.viewOptions = response;
          });
        }

        refresh();

        $scope.saveDisplayOption = function(){
          $http.put('/setticketViewOptions', $scope.viewSettings).success(function(response){
            if(response == 200){
              alert("Options saved");
            }else{
              alert("View option could not be changed");
            }
          });
        }
}
