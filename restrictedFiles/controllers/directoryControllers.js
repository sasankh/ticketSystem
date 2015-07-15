angular.module('ticket');

ticket.controller('userListController', userListController);
ticket.controller('addUserToDirectory', addUserToDirectory);
ticket.controller('addAdminToDirectory', addAdminToDirectory);
ticket.controller('updateUserController', updateUserController);
ticket.controller('detailsUserController', detailsUserController);
ticket.filter('offset', offset);
ticket.controller('addNewGroup', addNewGroup);
ticket.controller('viewGroups', viewGroups);
ticket.controller('controlUserSettingController', controlUserSettingController);
ticket.controller('adminAccountController', adminAccountController);
ticket.controller('createTeamController', createTeamController);
ticket.controller('viewTeamController', viewTeamController);
ticket.controller('manageTeamController', manageTeamController);

//userListController.$inject = [$scope, $http, $route, $routeParams, $location];
//addUserToDirectory.$inject = [$scope, $http];
//updateUserController.$inject = [$scope, $http, $routeParams];
//detailsUserController.$inject = [$scope, $http, $routeParams];

//Directory User List Controller
function userListController($scope, $http, $route, $routeParams, $location, $filter, $modal, $log){

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
    });

    //getting control user information
    $http.get('/user').success(function(response){
      $scope.controlUser = response.username;
      $scope.controlID = response.id;
    });

    };

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

    $scope.activateDisable = function(id){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: 'views/Directory/adminStatus.html',
        controller: 'adminAccountController',
        resolve: {
          directoryID: function () {
            return id;
          }
        }
      });
    }

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
        $http.post('/addDirectory', $scope.person).success(function(response){
          if(response == 200){
            $scope.person = "";
          }else{
            var notify = "There is already a user with the same " + response +".";
            alert(notify);
          }
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
      $http.post('/addDirectory', $scope.person).success(function(response){
        if(response == 200){
          $http.get('/getdirectoryID/'+ $scope.person.username).success(function(directoryID){
            $scope.admin.name = $scope.person.fname + " " + $scope.person.lname;
            $scope.admin.directoryID = directoryID;
            $http.post('/addAdmin', $scope.admin).success(function(){
              $scope.person = "";
              $scope.admin = "";
              $scope.retype = "";
            });
          });
        }else{
          var notify = "There is already a user with the same " + response +".";
          alert(notify);
        }
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

    var refresh = function(){
    $http.get('/listGroups').success(function(responseGroup){
      $scope.listGroup = responseGroup;
      $http.get('/obtainUserInfo/' + id).success(function(response){
        $scope.person = response;
    });
  });
    };

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
function detailsUserController($scope, $http, $routeParams, $modal, $log){


      var id = $routeParams.sendID;

      var refresh = function(){
        $http.get('/obtainUserInfo/' + id).success(function(response){
          $scope.person = response;
      })};

      //Edit button
      $scope.edit = function(){
          location.href= "#/Directory/updateUser/" + id;
      };

      //activateDisable admins
      $scope.activateDisable = function(){
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: 'views/Directory/adminStatus.html',
          controller: 'adminAccountController',
          resolve: {
            directoryID: function () {
              return id;
            }
          }
        });
      }

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
    $scope.addGroup = function(){
      var modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/views/Groups/addNewGroup.html',
        controller: 'addNewGroup'
      });
    };

};

//contorl user settings
function controlUserSettingController($scope, $http, $window){

  var refresh = function(){
    $scope.passwords = {};
    $scope.disableConfirm = false;
    $scope.ifOK = true;
    $http.get('/user').success(function(response){
      if(response.username == "theforce"){
        $scope.ifOK = false;
      }
    });
  };

  refresh();

  $scope.change = function(){
    if ($scope.passwords.new != $scope.passwords.retype){
      alert("New Passwords do not match");
    }else{
      //check password
      $http.put('/changePassword',$scope.passwords).success(function(response){
        if(response == 200){
          $scope.passwords = {};
        }
        else{
          alert("Wrong password. Please enter the correct password");
        }
      });
    }
  };

  $scope.disable = function(confirm){
    if(confirm){
        $http.put('/disableAccount').success(function(response){
          if(response == 200){
            $window.location.href = "/login";
          }else{
            alert("Could not disable account.");
          }

        });
    }
  }
};

//activate or disable admin accounts
function adminAccountController($http, $scope, $modalInstance, directoryID){

  var refresh = function(){
    $http.get('/adminStatus/' + directoryID).success(function(response){
      $scope.status = response;
    });
  };

  refresh();

  $scope.disable = function(confirm){
    if(confirm){
      //getting control user information
        $http.put('/disableOtherAccount/' + directoryID).success(function(response){
          if(response == 304){
            alert("Could not change status.");
            $modalInstance.close();
          }else{
            $modalInstance.close();
          }
        });
    }
  };

  $scope.activate = function(confirm){
    if(confirm){
      $http.put('/activateOtherAccount/' + directoryID).success(function(response){
        if(response == 304){
          alert("Could not change status.");
          $modalInstance.close();
        }else{
          $modalInstance.close();
        }
      });
    }
  };
}

//create new team
function createTeamController($scope, $http){

  var refresh = function(){
    $http.get('/getUsersForTeam').success(function(response){
      $scope.team = {};
      $scope.team.leads = [];
      $scope.team.members = [];
      $scope.listUsers = response;
    });
  };

  refresh();

  $scope.cancel = function(){
    location.href="#/Teams/viewTeams";
  };

  $scope.clear = function(){
    refresh();
  }

  $scope.createTeam = function(){
    if($scope.team.members.length != 0){
      if($scope.team.leads.length != 0){
        var ok = true;
        for(var x = 0; x < $scope.team.leads.length; x++){
          if($scope.team.members.indexOf($scope.team.leads[x]) < 0){
            alert("One or more leads are not included as members");
            ok = false;
          }
        }
        if(ok){
          $http.post('/createTeam', $scope.team).success(function(response){
            if(response == 200){
              refresh();
            }else if(response == "name"){
              alert("There is already a team or user with the same name or username");
            }else{
              alert("Could not create team");
            }
          });
        }
      }else{
        alert("Plese choose atleast one lead from the members")
      }
    }else{
      alert("Please choose atleast one member");
    }
  }
}

function viewTeamController($scope, $http){

  $scope.teamList = {};

  var refresh = function(){
    $http.get('/getTeamList').success(function(response){
      $scope.teamList = response;
    });
  };

  refresh();

  $scope.createNewTeam = function(){
    location.href="#/Teams/addNewTeams";
  };

  $scope.manageTeam = function(id){
    location.href = "#/Teams/manageTeam/" + id;
  };

  $scope.activate = function(id){
    $http.put('/activateTeam/' + id).success(function(response){
      if(response == 200){
        refresh();
      }else{
        alert("Could not activate team");
      }
    });
  };

  $scope.disable = function(id){
    $http.put('/disableTeam/' + id).success(function(response){
      if(response == 200){
        refresh();
      }else if(response = 304){
        alert("One or more active ticket is associated with the team. Cannot be disabled until they are reassigned");
      }else{
        alert("Could not disable team");
      }
    });
  };
}

//manage team
function manageTeamController($scope, $http, $routeParams){

  var id = $routeParams.sendID;

  var refresh = function(){
    $http.get('/getUsersForTeam').success(function(response){
      $scope.team = {};
      $scope.listUsers = response;
      $http.get('/getTeamInfo/' + id).success(function(teamInfo){
        $scope.team = teamInfo;
      });
    });
  };

  refresh();

  $scope.undo = function(){
    refresh();
  };

  $scope.cancel = function(){
    location.href = "#/Teams/viewTeams";
  };

  $scope.activate = function(){
    $http.put('/activateTeam/' + id).success(function(response){
      if(response == 200){
        refresh();
      }else{
        alert("Could not activate team");
      }
    });
  };

  $scope.disable = function(){
    $http.put('/disableTeam/' + id).success(function(response){
      if(response == 200){
        refresh();
      }else if(response = 304){
        alert("One or more active ticket is associated with the team. Cannot be disabled until they are reassigned");
      }else{
        alert("Could not disable team");
      }
    });
  };

  $scope.updateTeam = function(){
    $http.put('/updateTeamInfo/' + id, $scope.team).success(function(response){
      if(response == 200){
        location.href="#/Teams/viewTeams";
      }else{
        alert("Could not update");
      }
    });
  };
}
