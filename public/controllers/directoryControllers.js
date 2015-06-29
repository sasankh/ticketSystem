angular.module('ticket');

ticket.controller('userListController', userListController);
ticket.controller('addUserToDirectory', addUserToDirectory);
ticket.controller('addAdminToDirectory', addAdminToDirectory);
ticket.controller('updateUserController', updateUserController);
ticket.controller('detailsUserController', detailsUserController);
ticket.filter('offset', offset);
ticket.controller('addNewGroup', addNewGroup);
ticket.controller('viewGroups', viewGroups);


//userListController.$inject = [$scope, $http, $route, $routeParams, $location];
//addUserToDirectory.$inject = [$scope, $http];
//updateUserController.$inject = [$scope, $http, $routeParams];
//detailsUserController.$inject = [$scope, $http, $routeParams];

//Directory User List Controller
function userListController($scope, $http, $route, $routeParams, $location, $filter){

    $scope.itemsPerPage = 0;
    $scope.currentPage = 0;
    $scope.items = [];
    $scope.listLength = 0;
    $scope.itemsPerPage = 2;
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
        $scope.itemsPerPage = response.length;
        $scope.order('-fname',true);
        $scope.person="";
    })};

    refresh();

    $scope.showAll = function(){
        refresh();
    };

    $scope.remove = function(id){
      $http.get('/checkUserTicket/' + id).success(function(checkCount){
        console.log(checkCount);
        if(checkCount <= 0){
          $http.delete('/removeFromDirectory/' + id).success(function(response){
            refresh();
          });
        }else{
          alert("The user has tickets associated with it. To make sure that all information regarding the any ticket is complete the user cannot to removed. Sorry :(");
        }
      });
    };

    $scope.details = function(id){
        location.href= "#/Directory/userDetails/" + id;
    };

    //Edit button
    $scope.edit = function(id){
        location.href= "#/Directory/updateUser/" + id;
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

//Add new user controller
function addUserToDirectory($scope, $http){

  var refresh = function(){
    $http.get('/listGroups').success(function(response){
      $scope.listGroup = response;
      $scope.group="";
  })};

  refresh();

    $scope.addUser = function(){
        $http.post('/addDirectory', $scope.person).success(function(){
            $scope.person = "";
        });
    };

    $scope.clear = function(){
        $scope.person = "";
    };

    //Back button to list
    $scope.cancel = function(){
        location.href= "#/Directory";
    };
};

//Add new user controller
function addAdminToDirectory($scope, $http){

    $scope.addUser = function(){
      $scope.person.group = "Admin";
      $scope.person.username = $scope.admin.username;
      $scope.admin.active = true;
      if($scope.admin.password == $scope.retype.password){
        $http.post('/addDirectory', $scope.person).success(function(){
          $scope.person = "";
        });
        $http.post('/addAdmin', $scope.admin).success(function(){
          $scope.admin = "";
          $scope.retype = "";
        });
      }else{
        alert('The passwords do not match');
       }
    };

    $scope.clear = function(){
        $scope.person = "";
    };

    //Back button to list
    $scope.cancel = function(){
        location.href= "#/Directory";
    };
};

//Update User Controller
function updateUserController($scope, $http, $routeParams){

    var id = $routeParams.sendID;

    var refresh = function(){$http.get('/obtainUserInfo/' + id).success(function(response){
        $scope.person = response;
    })};

    $scope.update = function(){
        $http.put('/updateUserInfo/' + id, $scope.person).success(function(response){
            $scope.person = ""
            location.href="#/Directory/userDetails/" + id;
        });
    };

    refresh();

    $scope.undo = function(){
        refresh();
    }

    $scope.cancel = function(){
        location.href= "#/Directory/userDetails/" + id;
    };
};

//View User Details, Edit and remove Controller
function detailsUserController($scope, $http, $routeParams){


      var id = $routeParams.sendID;

      var refresh = function(){
        $http.get('/obtainUserInfo/' + id).success(function(response){
          $scope.person = response;
      })};

      //Edit button
      $scope.edit = function(){
          location.href= "#/Directory/updateUser/" + id;
      };

      refresh();

      //Remove button
      $scope.remove = function(){
        $http.get('/checkUserTicket/' + id).success(function(checkCount){
          if(checkCount <= 0){
            $http.delete('/removeFromDirectory/' + id).success(function(response){
              location.href= "#/Directory"
            });
          }else{
            alert("The user has tickets associated with it. To make sure that all information regarding the any ticket is complete the user cannot to removed. Sorry :(");
          }
        });
      };

      $scope.cancel = function(){
          location.href= "#/Directory";
      };
};
/*
function offset() {
  return function(input, start) {
    start = parseInt(start, 10);
    return input.slice(start);
  };
};
*/
//Exp

function offset() {
    return function(input, start) {
        if (!input || !input.length) { return; }
        start = +start; //parse to int
        return input.slice(start);
    }
};

//Add new group controller
function addNewGroup($scope, $http, $modalInstance){

    $scope.addGroup = function(){
        $http.post('/addNewGroup', $scope.group).success(function(){
            $scope.group = "";
            location.href="#/";
            location.href="#/Groups/viewGroups";
        });
    };

    $scope.clear = function(){
        $scope.group = "";
    };

    //Back button to list
    $scope.cancel = function(){
      location.href="#/";
      location.href="#/Groups/viewGroups";
      $modalInstance.dismiss('cancel');
    };
};

//Directory User List Controller
function viewGroups($scope, $http, $modal, $log){

    var refresh = function(){
      $http.get('/listGroups').success(function(response){
        $scope.listGroup = response;
        $scope.group="";
    })};

    refresh();

    //Add New customer screen
    $scope.addGroup = function(size){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Groups/addNewGroup.html',
        controller: 'addNewGroup',
        size: size
      });
    };

};
