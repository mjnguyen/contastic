'use strict';

/**
 * @ngdoc function
 * @name sampleAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sampleAppApp
 */
 var apiUrl = 'https://api.linkedin.com';

 	// Notes: create Service to make all API calls rather than make them directly inside functions

 	console.log('initializing app');
 	var app = angular.module('sampleAppApp');
 	app.controller('MainCtrl', ['$location', '$scope', '$http', 'AccessToken',
 		function($location, $scope, $http, AccessToken) 
 		{
 			$scope.authorizationCode = $location.search().code;
 			$scope.accessToken = null;
 			$scope.connections = []; 
 			$scope.client_id = '75ggnb9t6bak34';
 			$scope.client_secret = 'WJU612kqTRDJSw8b';
 			$scope.currentState = Math.random().toString(36).replace(/[^a-z]+/g, '');

 			var portNumber =  window.location.port  ? ':' + window.location.port : '/contastic/';
 			$scope.redirect_uri = encodeURI('http://' + window.location.hostname + portNumber );


 			$scope.hotResultsFilter = function(element) {
 				var isPrivate = element.firstName.match(/^private/) || element.lastName.match(/^private/);

 				return !isPrivate;
 			};


 			// Scoring Methods
 			$scope.titleScore = function(profile) {
 				var score = 0;
				if (profile.headline) {
					var headline = profile.headline;
					if (headline.match(/hiring/)) {
						score += 60
					}
					else if (headline.match(/recruiter/i)) {
						score += 55;
					}
					else if (headline.match(/Human resources|HR/i)) {
						score += 50;
					}
					else if (headline.match(/Manager/i)) {
						score += 40;
					}
					else if (headline.match(/CEO|CTO|CFO|CMO/i)) {
						score += 30;
					}
				} 

				return score;				
 			}

 			$scope.locationScore = function(profile1, profile2) {
				var score = 0;
				if (profile2.location) {
					if (profile2.location.country.code) {
						if (profile1.location.country.code == profile2.location.country.code) {
							score += 20;
						}
					}
				} 	

				return score;			
 			}

 			$scope.loadData = function(profile) {
 				IN.API.Connections("me")
 				.fields(['firstName', 'lastName', 'numConnections', 'industry', 'headline', 'pictureUrl', 'location', 'suggestions', 'public-profile-url'])
 				.params({"count":500, "sort" : 'connections'})
 				.result(function(result, metadata) {

 					for (var index in result.values) {
 						var connection = result.values[index];
 						var pictureScore = 0;
 						if (!connection.pictureUrl) {
 							connection.profileImageUrl = 'https://static.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_60x60_v1.png';
 						}
 						else {
 							connection.profileImageUrl = connection.pictureUrl;
 							pictureScore = 1;
 						}

 						var titleScore = $scope.titleScore(connection);
 						var locationScore = $scope.locationScore(profile, connection);

	 					// other factors to consider (industry, shared groups)

			 			connection.score = Math.floor((connection.numConnections * 0.50 + pictureScore * 0.10 +  titleScore * 0.30 + locationScore * 0.10) ) ;
			 			connection.rank = Math.floor(connection.score / 581 * 10000)/100 ;
			 			$scope.connections.push(connection);
			 		}
	 				$scope.$apply();
			 	});
			};

			// This could be expanded to show more information
			$scope.showProfile = function (profile) {
				return profile.headline;
			};


	 // reserved for REST API calls in place of the JSAPI
	/* Following this API call example, get the access token:
			https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code
                                       &code=AUTHORIZATION_CODE
                                       &redirect_uri=YOUR_REDIRECT_URI
                                       &client_id=YOUR_API_KEY
                                       &client_secret=YOUR_SECRET_KEY
                                       */

 			$scope.init = function () {
 				if ($scope.authorizationCode) {
 					$scope.getAccessToken($scope.authorizationCode);
 				}
 			};
                                       
			$scope.getAccessToken = function( authorizationCode ) {
		 		// setup the call to get access token
		 		var endpoint = '/uas/oauth2/accessToken';
		 		var formParams = { 
		 			grant_type: 'authorization_code' ,
				 		code: authorizationCode ,
				 		redirect_uri: $scope.redirect_uri ,
				 		client_id: $scope.client_id ,
				 		client_secret: $scope.client_secret
				 	};


			 	var url = apiUrl + endpoint ;

			 	var queryParams = 'grant_type=' + 'authorization_code' + 
			 	'&code=' + authorizationCode +
			 	'&redirect_uri=' + $scope.redirect_uri +
			 	'&client_id=' + $scope.client_id +
			 	'&client_secret=' + $scope.client_secret;

			 	$http.post(url + '?callback=JSON_CALLBACK&' + queryParams, formParams )
			 	.success(function(data, status, headers, config) {
						    // this callback will be called asynchronously
						    // when the response is available
						  	var expiration = data.expires_in; //['expires_in'];
						  	$scope.accessToken = data.access_token; //['access_token'];
						  	console.log('Granted Access Token: ' + $scope.accessToken + ' with a time limit of ' + expiration/3600 + 'seconds.');

						  }).
			 	error(function(data, status, headers, config) {
			 		console.error('Failed to get access Token: ' + data + '\n' + status);
			 	});

 			};

 		$scope.getConnections = function(peopleId) {
	    	// we have the access token now make the call to populate the array of people sorted by related views-
	    	var personId = !peopleId ? '~' : 'id='+ peopleId;
	    	var endpoint = '/v1/people/' + personId + '/connections?format=json';

	    	var url = apiUrl + endpoint + '&oauth2_access_token=' + $scope.accessToken;
	    	url += "&callback=JSON_CALLBACK";

	    	$http.jsonp( url)
	    	.success(function(data, status, headers, config) {
				// now that we have the data, walk through it createing a Person Object with the number of related views
				var results = data.results;

				for (var idx=0; idx < results.length; idx++ ) {
					console.log(results[idx].firstName);
				}

			})
	    	.error(function(data, status, headers, config) {
	    		console.log('Failed to make api call: ' + data + '\n' + 'Status Code: ' + status);
	    	});

	    };


	}]);
