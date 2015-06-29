angular.module('ticket');

//controller for ticket email
ticket.controller('openEmailController', openEmailController);
ticket.controller('internalEmailController', internalEmailController);

function openEmailController($scope, $http){
  $scope.send = function(){
    $http.post('/sendEmails', $scope.email).success(function(){
			$scope.email = "";
			location.href= "#/";
    });
	};
};

//internal ticket email contyroller
function internalEmailController($scope, $http, $modal, $log, $modalInstance, data){
  $scope.to = data.name + ' (' + data.email + ')';
  $scope.subject = "SYSTICKET"+data.subject+"ENDTICKET";

  //send the email
  $scope.send = function(){
    $scope.email.to = data.email;
    $scope.email.subject = $scope.subject;
    $scope.email.ticketID = data.subject;
    $scope.email.by = "558a25aa74a1d3fb1e0edcfd";
    $http.post('/ticketComposerEmail', $scope.email).success(function(){
      $modalInstance.close();
    });
	};
  //dismiss sending email
  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };
};
