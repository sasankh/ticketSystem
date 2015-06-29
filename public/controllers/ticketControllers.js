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
//Create a new ticket
function addNewTicket($scope, $http, $modal, $log){
  $scope.ticket = {};
  $scope.animationsEnabled = true;
  $scope.customerNotifyCreation = false;
  $scope.customerNotifyFuture = false;

    $scope.addTicket = function(){
      $scope.ticket.customerNotifyCreation = $scope.customerNotifyCreation;
      $scope.ticket.customerNotifyFuture = $scope.customerNotifyFuture;
      $scope.ticket.creatorID = $scope.ticket.customerID; //need to be chaged later after the login system is made.
      $http.post('/addNewTicket', $scope.ticket).success(function(){
            $scope.ticket = {};
            $scope.customerNotifyCreation = false;
            $scope.customerNotifyFuture = false;
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
        $scope.customer = "";
        $scope.customerNotifyCreation = false;
        $scope.customerNotifyFuture = false;
    };

    //Back button to list
    $scope.cancel = function(){
        location.href= "#/Ticket";
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
    })
   };

    refresh();

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
        location.href= "#/Ticket/editTicket/" + id;
    };

    $scope.details = function(id){
      location.href = "#/Ticket/ticketDetail/" + id;
    };
};

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

    var refresh = function(){$http.get('/obtainTicketInfo/' + id).success(function(response){
        $scope.ticket = response;
    })};

    $scope.updateTicket = function(){
        $http.put('/updateTicketInfo/' + id, $scope.ticket).success(function(response){
            $scope.ticket = ""
            location.href="#/Ticket";
        });
    };

    refresh();

    $scope.undo = function(){
        refresh();
    }

    $scope.cancel = function(){
        location.href= "#/Ticket";
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

      var refresh = function(){$http.get('/obtainTicketInfo/' + id).success(function(response){
          $scope.ticket = response;
      })};

      //Edit button
      $scope.edit = function(){
          location.href= "#/Ticket/editTicket/" + id;
      };

      refresh();

      //Add log
      $scope.addLog = function(){
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: '/views/Ticket/addLog.html',
          controller: 'addTicketLog',
          size: 'lg',
          resolve: {
            sendID: function () {
              return id;
            }
          }
        });

        modalInstance.result.then(function () {
          $route.reload();
        });
      };

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
            $route.reload();
          });
        });
      };
};

//Add new group controller
function addTicketLog($scope, $http, $modalInstance, sendID){

    console.log(sendID);

    $scope.add = function(){
      $scope.update.by = "558a25aa74a1d3fb1e0edcfd";
      $scope.update.type = "Internal";
      $http.post('/addTicketLog/' + sendID, $scope.update).success(function(response){
        $modalInstance.close();
      });
    };

    //Back button to list
    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    };
};
