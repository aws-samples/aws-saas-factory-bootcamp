'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module of the application.
 */
angular
  .module('clientApp', ['ngRoute', 'angular-jwt']);

angular.module('clientApp').factory('httpRequestInterceptor', ["$rootScope", function ($rootScope) {
  return {
    request: function (config) {
      if ($rootScope.bearerToken)
        config.headers['Authorization'] = 'Bearer ' + $rootScope.bearerToken;
      return config;
    }
  };
}]);

angular.module('clientApp').config(["$routeProvider", "$httpProvider", "$locationProvider", function ($routeProvider, $httpProvider, $locationProvider) {
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
  $httpProvider.interceptors.push('httpRequestInterceptor');
  $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'mainController'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login'
      })
      .when('/register', {
        templateUrl: 'views/register.html',
        controller: 'RegisterCtrl',
        controllerAs: 'register'
      })
      .when('/logout', {
        templateUrl: 'views/logout.html',
        controller: 'LogoutCtrl',
        controllerAs: 'logout'
      })
      .when('/confirm', {
        templateUrl: 'views/confirm.html',
        controller: 'ConfirmCtrl',
        controllerAs: 'confirm'
      })
      .when('/users', {
        templateUrl: 'views/users.html',
        controller: 'UsersCtrl',
        controllerAs: 'users'
      })
      .when('/products', {
        templateUrl: 'views/products.html',
        controller: 'ProductsCtrl',
        controllerAs: 'products'
      })
      .when('/product/add', {
        templateUrl: 'views/product-add.html',
        controller: 'ProductAddCtrl',
        controllerAs: 'productAdd'
      })
      .when('/product/edit/:id', {
        templateUrl: 'views/product-edit.html',
        controller: 'ProductEditCtrl',
        controllerAs: 'productEdit'
      })
      .when('/product/delete/:id', {
        templateUrl: 'views/product-delete.html',
        controller: 'ProductDeleteCtrl',
        controllerAs: 'productDelete'
      })
      .when('/tenants', {
        templateUrl: 'views/tenants.html',
        controller: 'TenantsCtrl',
        controllerAs: 'tenants'
      })
      .when('/tenant/edit/:id', {
        templateUrl: 'views/tenant-edit.html',
        controller: 'TenantEditCtrl',
        controllerAs: 'tenantEdit'
      })
      .when('/tenant/delete/:id', {
        templateUrl: 'views/tenant-delete.html',
        controller: 'TenantDeleteCtrl',
        controllerAs: 'tenantDelete'
      })
       .when('/users', {
        templateUrl: 'views/users.html',
        controller: 'UsersCtrl',
        controllerAs: 'users'
      })
      .when('/user/add', {
        templateUrl: 'views/user-add.html',
        controller: 'UserAddCtrl',
        controllerAs: 'userAdd'
      })
      .when('/user/edit/:id', {
        templateUrl: 'views/user-edit.html',
        controller: 'UserEditCtrl',
        controllerAs: 'userEdit'
      })
      .when('/user/delete/:id', {
        templateUrl: 'views/user-delete.html',
        controller: 'UserDeleteCtrl',
        controllerAs: 'userDelete'
      })
      .when('/user/enable/:id', {
        templateUrl: 'views/user-enable.html',
        controller: 'UserEnableCtrl',
        controllerAs: 'userEnable'
      })
      .when('/orders', {
        templateUrl: 'views/orders.html',
        controller: 'OrdersCtrl',
        controllerAs: 'orders'
      })
      .when('/order/add', {
        templateUrl: 'views/order-add.html',
        controller: 'OrderAddCtrl',
        controllerAs: 'orderAdd'
      })
      .when('/order/edit/:id', {
        templateUrl: 'views/order-edit.html',
        controller: 'OrderEditCtrl',
        controllerAs: 'orderEdit'
      })
      .when('/order/delete/:id', {
        templateUrl: 'views/order-delete.html',
        controller: 'OrderDeleteCtrl',
        controllerAs: 'orderDelete'
      })
      .when('/product/:id', {
        templateUrl: 'views/product-view.html',
        controller: 'ProductViewCtrl',
        controllerAs: 'productView'
      })
      .otherwise({
        redirectTo: '#!/login'
      });

  }]);

angular.module('clientApp').run(["$rootScope", "$location", "$http", "Constants", function ($rootScope, $location, $http, Constants) {
  $rootScope.$on('$locationChangeStart', function (event, next, current) {
    // redirect to login page if not logged in and trying to access a restricted page

    var restrictedPage = false;
    var userLoggedOut = false;
    if ($location.path() === '/logout') {
      $rootScope.isUserLoggedIn = false;
      $rootScope.bearerToken = '';
      $rootScope.currentUser = '';
      $rootScope.userDisplayName = '';
      userLoggedOut = true;
    }
    else {
      restrictedPage = $.inArray($location.path(), ['/login', '/register', '/confirm']) === -1;
      if ($rootScope.isUserLoggedIn === undefined)
        $rootScope.isUserLoggedIn = false;
    }

    //var loggedIn = true;
    if ((userLoggedOut) || (restrictedPage && !$rootScope.isUserLoggedIn)) {
      $location.path('/login');
    }
  });

  $rootScope.isAdminUser = function() {
    return (($rootScope.userRole === Constants.SYSTEM_ADMIN_ROLE) || ($rootScope.userRole === Constants.TENANT_ADMIN_ROLE));
  };

  $rootScope.isSystemAdminUser = function() {
    return ($rootScope.userRole === Constants.SYSTEM_ADMIN_ROLE);
  };

  $rootScope.isTenantAdminUser = function() {
    return ($rootScope.userRole === Constants.TENANT_ADMIN_ROLE);
  };

  $rootScope.isSystemUser = function() {
    var systemUser = false;
    if (($rootScope.userRole === Constants.SYSTEM_ADMIN_ROLE) || ($rootScope.userRole === Constants.SYSTEM_SUPPORT_ROLE))
      systemUser = true;
    return systemUser;
  };

  $rootScope.isTenantUser = function() {
    var tenantUser = false;
    if (($rootScope.userRole === Constants.TENANT_ADMIN_ROLE) || ($rootScope.userRole === Constants.TENANT_USER_ROLE))
      tenantUser = true;
    return tenantUser;
  };

  $rootScope.roleToDisplayName = function(userRole) {
    var displayName = '';
    if (userRole === 'TenantAdmin')
      displayName = 'Administrator';
    else if (userRole === 'TenantUser')
      displayName = 'Order Manager';
    else if (userRole === 'SystemAdmin')
      displayName = 'System Admin';
    else if (userRole === 'SystemUser')
      displayName = 'Customer Support';

    return displayName;
  }

  $rootScope.isActiveLink = function (viewLocation) {
    var active = (viewLocation === $location.path());
    return active;
  };

  $rootScope.isLinkEnabled = function (viewLocation) {
    var enabled = false;
    if ($rootScope.isUserLoggedIn) {
      if ($.inArray(viewLocation, ['/login', '/']) >= 0)
        enabled = true;
      else if (viewLocation === '/tenants') {
        enabled = $rootScope.isSystemUser();
      }
      else if (viewLocation === '/users') {
        enabled = $rootScope.isAdminUser();
      }
      else if ($.inArray(viewLocation, ['/products', '/orders']) >= 0) {
        enabled = $rootScope.isTenantUser();
      }
    }
    else {
      if ($.inArray(viewLocation, ['/login', '/register', 'confirm']) >= 0)
        enabled = true;
    }
    return enabled;
  };
}]);

'use strict';

/**
 * @ngdoc overview
 * @name constants
 * @description
 * # constants
 *
 * Main module of the application.
 */
angular.module('clientApp')
  .constant('Constants', {
    // AUTH_MANAGER_URL: 'http://localhost:3000',
    // USER_MANAGER_URL: 'http://localhost:3001',
    // TENANT_MANAGER_URL: 'http://localhost:3003',
    // TENANT_REGISTRATION_URL: 'http://localhost:3004',
    // PRODUCT_MANAGER_URL: 'http://localhost:3006',
    // ORDER_MANAGER_URL: 'http://localhost:3015',
    // SYSTEM_REGISTRATION_URL: 'http://localhost:3011',

    AUTH_MANAGER_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',
    USER_MANAGER_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',
    TENANT_MANAGER_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',
    TENANT_REGISTRATION_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',
    PRODUCT_MANAGER_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',
    ORDER_MANAGER_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',
    SYSTEM_REGISTRATION_URL: 'https://1klylzxi8c.execute-api.us-east-1.amazonaws.com/prod',

    SYSTEM_ADMIN_ROLE: 'SystemAdmin',
    SYSTEM_SUPPORT_ROLE: 'SystemUser',
    TENANT_ADMIN_ROLE: 'TenantAdmin',
    TENANT_USER_ROLE: 'TenantUser'
  });

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('MainCtrl', ["$scope", "$timeout", "$http", "$location", "Constants", function ($scope, $timeout, $http, $location, Constants) {
  $scope.authenticationManagerHealthy = true;
  $scope.tenantManagerHealthy = true;
  $scope.tenantRegistrationHealthy = true;
  $scope.orderManagerHealthy = true;
  $scope.productManagerHealthy = true;
  $scope.userManagerHealthy = true;

  var pollForServiceHealth = function() {
    $timeout(function() {
      // only poll if we're on the home page
      if ($location.path() === '/') {
        getServiceHealth(Constants.AUTH_MANAGER_URL + '/auth', function (healthStatus) {
          $scope.authenticationManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.TENANT_MANAGER_URL + '/tenant', function (healthStatus) {
          $scope.tenantManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.TENANT_REGISTRATION_URL + '/reg', function (healthStatus) {
          $scope.tenantRegistrationHealthy = healthStatus;
        });

        getServiceHealth(Constants.ORDER_MANAGER_URL + '/order', function (healthStatus) {
          $scope.orderManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.PRODUCT_MANAGER_URL + '/product', function (healthStatus) {
          $scope.productManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.USER_MANAGER_URL + '/user', function (healthStatus) {
          $scope.userManagerHealthy = healthStatus;
        });
      }
      pollForServiceHealth();
    }, 5000);
  };
  pollForServiceHealth();

  function getServiceHealth(serviceURL, callback) {
    $http.get(serviceURL + '/health')
      .then(function(response) {
        if (response.status == 200)
          callback(true);
        else
          callback(false);
      })
      .catch(function(error) {
        callback(false);
      })
  }

}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('LoginCtrl', ["$scope", "$rootScope", "$location", "$route", "$http", "Constants", "jwtHelper", function ($scope, $rootScope, $location, $route, $http, Constants, jwtHelper) {
  $scope.username = 'tgolding+56@gmail.com';
  $scope.password = 'Abc123456';

  $scope.formSubmit = function () {
    var user = {
      userName: $scope.username,
      password: $scope.password
    };

    $http.post(Constants.AUTH_MANAGER_URL + '/auth', user)
      .then(function(response) {
        console.log('Login success');

        if (response.data.newPasswordRequired) {
          $rootScope.currentUser = $scope.username;
          $location.path('/confirm');
        }
        else {
          $rootScope.isUserLoggedIn = true;
          $rootScope.currentUser = $scope.username;
          $rootScope.bearerToken = response.data.token;
          var decodedToken = jwtHelper.decodeToken($rootScope.bearerToken);
          $rootScope.userDisplayName = decodedToken['given_name'] + ' ' + decodedToken['family_name'];
          $rootScope.userRole = decodedToken['custom:role'];
          $scope.error = '';
          $scope.username = '';
          $scope.password = '';
          $location.path('/');
          $route.reload();
        }
      })
      .catch(function() {
        $rootScope.isUserLoggedIn = false;
        $rootScope.identityToken = '';
        $rootScope.userDisplayName = '';
        $rootScope.userRole = '';
        $scope.error = "Invalid login. Please try again.";
        console.log('Login failed');
      })
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:RegisterCtrl
 * @description
 * # RegisterCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('RegisterCtrl', ["$scope", "$http", "$location", "Constants", function ($scope, $http, $location, Constants) {
  $scope.formSubmit = function () {
    if (!($scope.tenant.email || $scope.tenant.companyName)) {
      $scope.error = "User name and company name are required. Please enter these values.";
    }
    else {
      var tenant = {
        id: '',
        companyName: $scope.tenant.companyName,
        accountName: $scope.tenant.companyName,
        ownerName: $scope.tenant.email,
        tier: $scope.tenant.plan,
        email: $scope.tenant.email,
        userName: $scope.tenant.email,
        firstName: $scope.tenant.firstName,
        lastName: $scope.tenant.lastName
      };

      $http.post(Constants.TENANT_REGISTRATION_URL + '/reg', tenant)
        .then(function(data) {
          console.log('Registration success');
          $scope.hideRegistrationForm = true;
          $scope.showSuccessMessage = true;
        })
        .catch(function(response) {
          $scope.error = "Unable to create new account";
          console.log('Registration failed: ', response)
        })
    }
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ConfirmCtrl
 * @description
 * # ConfirmCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ConfirmCtrl', ["$scope", "$rootScope", "$location", "$route", "$http", "Constants", "jwtHelper", function ($scope, $rootScope, $location, $route, $http, Constants, jwtHelper) {
  $scope.formSubmit = function () {
    if ($scope.newPassword !== $scope.confirmPassword) {
      $scope.error = "Passwords do not match.";
    }
    else if ($scope.newPassword.length < 6) {
      $scope.error = "Password must be 6 or more characters long";
    }
    else if (!($scope.currentPassword || $scope.newPassword || $scope.confirmPassword)) {
      $scope.error = "Current, new, and confirm passwords are required. Please enter these values.";
    }
    else {
      var user = {
        userName: $rootScope.currentUser,
        password: $scope.currentPassword,
        newPassword: $scope.newPassword
      }
    }

    $http.post(Constants.AUTH_MANAGER_URL + '/auth', user)
      .then(function (response) {
        console.log('Login success');
        $rootScope.isUserLoggedIn = true;
        $rootScope.bearerToken = response.data.token;
        var decodedToken = jwtHelper.decodeToken($rootScope.bearerToken);
        $rootScope.userDisplayName = decodedToken['given_name'] + ' ' + decodedToken['family_name'];
        $rootScope.userRole = decodedToken['custom:role'];
        $scope.error = '';
        $scope.username = '';
        $scope.password = '';
        $location.path('/');
        $route.reload();
      })
      .catch(function (response) {
        $rootScope.isUserLoggedIn = false;
        $rootScope.identityToken = '';
        $rootScope.userDisplayName = '';
        $scope.error = "Invalid login. Please try again.";
        console.log('Login failed');
      });
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UsersCtrl', ["$scope", "$http", "Constants", function ($scope, $http, Constants) {
  $http.get(Constants.USER_MANAGER_URL + '/users')
    .then(function (response) {
      $scope.users = response.data;
    })
    .catch(function (response) {
      console.error('Error getting users', response.status, response.data);
    })
    .finally(function () {
      console.log('Finished getting users');
    });
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductsCtrl
 * @description
 * # ProductsCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductsCtrl', ["$scope", "$http", "Constants", function ($scope, $http, Constants) {
  $http.get(Constants.PRODUCT_MANAGER_URL + '/products')
    .then(function(response) {
      $scope.products = response.data;
    })
    .catch(function(response) {
      console.error('Error getting products', response.status, response.data);
    })
    .finally(function() {
      console.log('Finished getting products');
    });
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductAddCtrl
 * @description
 * # ProductAddCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductAddCtrl', ["$scope", "$location", "$http", "$route", "Constants", function ($scope, $location, $http, $route, Constants) {
    $scope.addProduct = true;

    $scope.saveProduct = function() {
      var product = {
        sku: $scope.product.sku,
        title: $scope.product.title,
        description: $scope.product.description,
        condition: $scope.product.condition,
        conditionDescription: $scope.product.conditionDescription,
        numberInStock: $scope.product.numberInStock,
        unitCost: $scope.product.unitCost
      };

      $http.post(Constants.PRODUCT_MANAGER_URL + '/product', product)
        .then(function(response) {
          console.log('Product added');
          $scope.product.sku = '';
          $scope.product.title = '';
          $scope.product.description = '';
          $scope.product.condition = '1';
          $scope.product.conditionDescription = '';
          $scope.product.numberInStock = 0;
          $scope.product.unitCost = 0;
          $route.reload();
        })
        .catch(function(response) {
          $scope.error = "Error saving product: " + response.message;
          console.log("Error saving product: " + response.message);
        })
    };

    $scope.cancel = function() {
      $location.path('/products');
    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductEditCtrl
 * @description
 * # ProductEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductEditCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.product = {};
  $scope.editProduct = true;

  $http.get(Constants.PRODUCT_MANAGER_URL + '/product/' + $routeParams.id)
    .then(function(response) {
      $scope.product = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting product: " + response.message;
      console.log('Error getting product: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting product');
    });


  $scope.saveProduct = function() {
    var product = {
      productId: $scope.product.productId,
      sku: $scope.product.sku,
      title: $scope.product.title,
      description: $scope.product.description,
      condition: $scope.product.condition,
      conditionDescription: $scope.product.conditionDescription,
      numberInStock: $scope.product.numberInStock,
      unitCost: $scope.product.unitCost
    };

    $http.put(Constants.PRODUCT_MANAGER_URL + '/product', product)
      .then(function(response) {
        console.log('Product updated');
        $location.path('/products');
      })
      .catch(function(response) {
        $scope.error = "Error updating product: " + response.message;
        console.log("Error updating product: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/products');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductDeleteCtrl
 * @description
 * # ProductDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductDeleteCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to delete
  $http.get(Constants.PRODUCT_MANAGER_URL + '/product/' + $routeParams.id)
    .then(function(response) {
      $scope.product = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting order: " + response.message;
      console.log('Error getting product: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting product');
    });

  // delete the product
  $scope.deleteProduct = function() {
    $http.delete(Constants.PRODUCT_MANAGER_URL + '/product/' + $scope.product.productId)
      .then(function (response) {
        console.log('Product delete');
        $location.path('/products');
      })
      .catch(function (response) {
        $scope.error = "Error deleting product: " + response.message;
        console.log("Error deleting product: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/products');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:TenantsCtrl
 * @description
 * # TenantsCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('TenantsCtrl', ["$scope", "$http", "Constants", function ($scope, $http, Constants) {
  $http.get(Constants.TENANT_MANAGER_URL + '/tenants')
    .then(function(response) {
      $scope.tenants = response.data;
    })
    .catch(function(response) {
      console.error('Error getting tenants', response.status, response.data);
    })
    .finally(function() {
      console.log('Finished getting tenants');
    });
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:TenantEditCtrl
 * @description
 * # TenantEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('TenantEditCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.tenant = {};

  $http.get(Constants.TENANT_MANAGER_URL + '/tenant/' + $routeParams.id).
    then(function(response) {
      $scope.tenant = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting tenant: " + response.message;
      console.log('Error getting tenant: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting tenant');
    });

  $scope.saveTenant = function() {
    var tenant = {
      'id': $scope.tenant.id,
      'companyName': $scope.tenant.companyName,
      'accountName': $scope.tenant.accountName,
      'ownerName': $scope.tenant.ownerName,
      'tier': $scope.tenant.tier,
      'status': $scope.tenant.status
    };

    $http.put(Constants.TENANT_MANAGER_URL + '/tenant', tenant)
      .then(function(response) {
        console.log('Tenant updated');
        $location.path('/tenants');
      })
      .catch(function(response) {
        $scope.error = "Error updating tenant: " + response.message;
        console.log("Error updating tenant: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/tenants');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:TenantDeleteCtrl
 * @description
 * # TenantDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('TenantDeleteCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to delete
  $http.get(Constants.TENANT_MANAGER_URL + '/tenant/' + $routeParams.id)
    .then(function(response) {
      $scope.tenant = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting tenant: " + response.message;
      console.log('Error getting tenant: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting tenant');
    });


  $scope.deleteTenant = function() {
    var tenantKey = {
      'id': $scope.tenant.id,
      'title': $scope.tenant.title
    };

    $http.delete(Constants.TENANT_MANAGER_URL + '/tenant/' + $scope.tenant.id)
      .then(function (response) {
        console.log('Tenant delete');
        $location.path('/tenants');
      })
      .catch(function (response) {
        $scope.error = "Error deleting tenant: " + response.message;
        console.log("Error deleting tenant: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/tenants');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserAddCtrl
 * @description
 * # UserAddCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserAddCtrl', ["$scope", "$location", "$http", "$route", "$rootScope", "Constants", function ($scope, $location, $http, $route, $rootScope, Constants) {
  $scope.addUser = true;
  $scope.user = {};
  $scope.user.role = $rootScope.userRole;

  $scope.saveUser = function() {
    var user = {
      firstName: $scope.user.firstName,
      lastName: $scope.user.lastName,
      userName: $scope.user.userName,
      role: $scope.user.role
    };

    $http.post(Constants.USER_MANAGER_URL + '/user', user)
      .then(function(response) {
        console.log('User added');
        $scope.user.firstName = '';
        $scope.user.lastName = '';
        $scope.user.userName = '';
        $scope.user.role = $rootScope.userRole;
        $route.reload();
      })
      .catch(function(response) {
        $scope.error = "Error saving user: " + response.message;
        console.log("Error saving user: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/users');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserEditCtrl
 * @description
 * # UserEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserEditCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.user = {};
  $scope.editUser = true;

  $http.get(Constants.USER_MANAGER_URL + '/user/' + $routeParams.id)
    .then(function(response) {
      $scope.user = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting user";
      console.log('Error getting user: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting user');
    });

  $scope.saveUser = function() {
    var user = {
      'userName': $scope.user.userName,
      'firstName': $scope.user.firstName,
      'lastName': $scope.user.lastName,
      'role': $scope.user.role
    };

    $http.put(Constants.USER_MANAGER_URL + '/user', user)
      .then(function(response) {
        console.log('User updated');
        $location.path('/users');
      })
      .catch(function(response) {
        $scope.error = "Error updating user: " + response.message;
        console.log("Error updating user: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/users');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserDeleteCtrl
 * @description
 * # UserDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserDeleteCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to delete
  $http.get(Constants.USER_MANAGER_URL + '/user/' + $routeParams.id)
    .then(function(response) {
      $scope.user = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting user: " + response.message;
      console.log('Error getting user: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting user');
    });

  $scope.deleteUser = function() {
    $http.delete(Constants.USER_MANAGER_URL + '/user/' + $scope.user.userName)
      .then(function (response) {
        console.log('User delete');
        $location.path('/users');
      })
      .catch(function (response) {
        $scope.error = "Error deleting user: " + response.message;
        console.log("Error deleting user: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/users');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrdersCtrl
 * @description
 * # OrdersCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrdersCtrl', ["$scope", "$http", "$filter", "Constants", function ($scope, $http, $filter, Constants) {
  $http.get(Constants.ORDER_MANAGER_URL + '/orders')
    .then(function(response) {
      $scope.orders = response.data;
      $scope.filteredOrders = $scope.orders.slice();

      var productFilterDict = {'No Filter': ''};
      var key = '';
      for (key in $scope.orders) {
        var productDescription = $scope.orders[key].productDescription;
        if (!(productDescription in productFilterDict))
          productFilterDict[productDescription] = "";
      }
      $scope.productFilterValues = Object.keys(productFilterDict);
    })
    .catch(function(response) {
      console.error('Error getting orders', response.status, response.data);
    })
    .finally(function() {
      console.log('Finished getting orders');
    });

  $scope.orderFilterChanged = function(orderFilter) {
    if (orderFilter === 'No Filter')
      $scope.filteredOrders = $scope.orders;
    else
      $scope.filteredOrders = $filter('filter')($scope.orders, { productDescription: orderFilter });
  }
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrderAddCtrl
 * @description
 * # OrderAddCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrderAddCtrl', ["$scope", "$location", "$http", "$route", "$rootScope", "Constants", function ($scope, $location, $http, $route, $rootScope, Constants) {
  $scope.order = {};
  $scope.addOrder = true;

  $http.get(Constants.PRODUCT_MANAGER_URL + '/products')
    .then(function (response) {
      $scope.products = response.data;
      $scope.order.dateOrdered = new Date();
      $scope.order.quantity = 1;
      $scope.order.unitCost = 0;
      $scope.productMap = {};
      $scope.products.forEach(function (it) { $scope.productMap[it.productId] = it; });

      if ($scope.products) {
        $scope.order.productId = $scope.products[0].productId;
        $scope.order.unitCost = $scope.products[0].unitCost;
      }
    })
    .catch(function (response) {
      console.log('Error getting products: ' + response.message);
    })
    .finally(function () {
      console.log('Finished getting products');
    });

  $scope.saveOrder = function() {
    var order = {
      productId: $scope.order.productId,
      productSKU: $scope.productMap[$scope.order.productId].sku,
      productDescription: $scope.productMap[$scope.order.productId].title,
      dateOrdered: new Date($scope.order.dateOrdered),
      orderedBy: $rootScope.currentUser,
      quantity: $scope.order.quantity,
      unitCost: $scope.order.unitCost
    };

    $http.post(Constants.ORDER_MANAGER_URL + '/order', order)
      .then(function(response) {
        console.log('Order added');
      })
      .catch(function(response) {
        $scope.error = "Error saving order: " + response.message;
        console.log("Error saving order: " + response.message);
      });

    var product = $scope.productMap[$scope.order.productId];
    product.numberInStock -= $scope.order.quantity;
    $http.put(Constants.PRODUCT_MANAGER_URL + '/product', product)
      .then(function (response) {
        console.log('Product inventory updated');
      })
      .catch(function (response) {
        $scope.error = "Error updating product inventory: " + response.message;
        console.log("Error updating product inventory: " + response.message);
      });

    $scope.order = {};
    $scope.order.quantity = 1;
    $route.reload();
  };

  $scope.productChanged = function(productId) {
    $scope.order.unitCost = $scope.productMap[$scope.order.productId].unitCost;
  };

  $scope.cancel = function() {
    $location.path('/orders');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrderEditCtrl
 * @description
 * # OrderEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrderEditCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "$rootScope", "Constants", function ($scope, $location, $http, $route, $routeParams, $rootScope, Constants) {
  // fetch the item to edit
  $scope.editOrder = true;

  $http.get(Constants.ORDER_MANAGER_URL + '/order/' + $routeParams.id)
    .then(function(response) {
      $scope.order = response.data;
      $scope.order.dateOrdered = new Date($scope.order.dateOrdered);
      $scope.order.originalQantity = $scope.order.quantity;
    })
    .catch(function(response) {
      console.log('Error getting order: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting order');
  });

  $http.get(Constants.PRODUCT_MANAGER_URL + '/products')
    .then(function (response) {
      $scope.products = response.data;
      $scope.productMap = {};
      $scope.products.forEach(function (it) { $scope.productMap[it.productId] = it; });
    })
    .catch(function (response) {
      console.log('Error getting products: ' + response.message);
    })
    .finally(function () {
      console.log('Finished getting products');
    });

  $scope.saveOrder = function() {
    var order = {
      orderId: $scope.order.orderId,
      productId: $scope.order.productId,
      productSKU: $scope.productMap[$scope.order.productId].sku,
      productDescription: $scope.productMap[$scope.order.productId].title,
      orderedBy: $rootScope.currentUser,
      dateOrdered: $scope.order.dateOrdered,
      quantity: $scope.order.quantity,
      unitCost: $scope.order.unitCost
    };

    $http.put(Constants.ORDER_MANAGER_URL + '/order', order)
      .then(function(response) {
        console.log('Order updated');
        $location.path('/orders');
      })
      .catch(function(response) {
        $scope.error = "Error updating order: " + response.message;
        console.log("Error updating order: " + response.message);
      });

    if ($scope.order.quantity != $scope.order.originalQantity) {
      var product = $scope.productMap[$scope.order.productId];
      if ($scope.order.quantity > $scope.order.originalQantity) {
        product.numberInStock -= ($scope.order.quantity - $scope.order.originalQantity);
      }
      else {
        product.numberInStock += ($scope.order.originalQantity - $scope.order.quantity);
      }

      $http.put(Constants.PRODUCT_MANAGER_URL + '/product', product)
        .then(function (response) {
          console.log('Product inventory updated');
        })
        .catch(function (response) {
          $scope.error = "Error updating product inventory: " + response.message;
          console.log("Error updating product inventory: " + response.message);
        })
    }

    $scope.order = {};
    $scope.order.quantity = 1;
    $route.reload();
  };

  $scope.productChanged = function(productId) {
    $scope.order.unitCost = $scope.productMap[$scope.order.productId].unitCost;
  };

  $scope.cancel = function() {
    $location.path('/orders');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrderDeleteCtrl
 * @description
 * # OrderDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrderDeleteCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {

  // fetch the item to delete
  $http.get(Constants.ORDER_MANAGER_URL + '/order/' + $routeParams.id)
    .then(function(response) {
      $scope.order = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting order: " + response.message;
      console.log('Error getting order: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting order');
    });


  $scope.deleteOrder = function() {
    $http.delete(Constants.ORDER_MANAGER_URL + '/order/' + $scope.order.orderId)
      .then(function (response) {
        console.log('Order delete');
        $location.path('/orders');
      })
      .catch(function (response) {
        $scope.error = "Error deleting order: " + response.message;
        console.log("Error deleting order: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/orders');
  };
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductViewCtrl
 * @description
 * # ProductViewCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductViewCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {

  $http.get(Constants.PRODUCT_MANAGER_URL + '/product/' + $routeParams.id)
    .then(function (response) {
      $scope.product = response.data;
    })
    .catch(function (response) {
      console.log('Error getting product: ' + response.message);
    })
    .finally(function () {
      console.log('Finished getting product');
    });
}]);

'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserEnableCtrl
 * @description
 * # UserEnableCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserEnableCtrl', ["$scope", "$location", "$http", "$route", "$routeParams", "Constants", function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.user = {};

  $http.get(Constants.USER_MANAGER_URL + '/user/' + $routeParams.id)
    .then(function(response) {
      $scope.user = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting user";
      console.log('Error getting user: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting user');
    });

  $scope.yesPressed = function() {
    if ($scope.user.enabled)
      $scope.disableUser();
    else
      $scope.enableUser();
  };

  $scope.enableUser = function() {
    $http.put(Constants.USER_MANAGER_URL + '/user/enable', $scope.user)
      .then(function (response) {
        $location.path('/users');
      })
      .catch(function (response) {
        $scope.error = "Error enabling user";
        console.log("Error enabling user");
      })
  };

  $scope.disableUser = function() {
    $http.put(Constants.USER_MANAGER_URL + '/user/disable/', $scope.user)
      .then(function (response) {
        $location.path('/users');
      })
      .catch(function (response) {
        $scope.error = "Error disabling user";
        console.log("Error disabling user");
      })
  };

  $scope.back = function() {
    $location.path('/users');
  };
}]);

angular.module('clientApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/confirm.html',
    "<div class=\"col-md-8 col-md-offset-1\"> <h3>Congratulations on Your Successful Login!</h3> <p>Please change your password before proceeding</p> <form name=\"form\" ng-submit=\"formSubmit()\" role=\"form\"> <div class=\"form-group\"> <label for=\"currentPassword\">Current Password</label> <input type=\"password\" name=\"currentPassword\" id=\"currentPassword\" class=\"form-control\" ng-model=\"currentPassword\" required> </div> <div class=\"form-group\"> <label for=\"newPassword\">New Password</label> <input type=\"password\" name=\"newPassword\" id=\"newPassword\" class=\"form-control\" ng-model=\"newPassword\" required> </div> <div class=\"form-group\"> <label for=\"confirmPassword\">Confirm New Password</label> <input type=\"password\" name=\"confirmPassword\" id=\"confirmPassword\" class=\"form-control\" ng-model=\"confirmPassword\" required> </div> <div class=\"form-actions\"> <button type=\"submit\" class=\"btn btn-primary\">Confirm</button> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form> </div>"
  );


  $templateCache.put('views/login.html',
    "<div class=\"col-md-6 col-md-offset-3\"> <h2>Login</h2> <form name=\"form\" ng-submit=\"formSubmit()\" role=\"form\"> <div class=\"form-group\"> <label for=\"username\">Username</label> <input type=\"text\" name=\"username\" id=\"username\" class=\"form-control\" ng-model=\"username\" required> </div> <div class=\"form-group\"> <label for=\"password\">Password</label> <input type=\"password\" name=\"password\" id=\"password\" class=\"form-control\" ng-model=\"password\" required> </div> <div class=\"form-actions\"> <button type=\"submit\" class=\"btn btn-primary\">Login</button> <a href=\"#!/register\" class=\"btn btn-link\">Register</a> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form> </div>"
  );


  $templateCache.put('views/main.html',
    "<div class=\"jumbotron\"> <div class=\"well\" style=\"padding-top: 0px\" ng-if=\"isSystemUser()\"> <div> <img style=\"width:28px; float: left; margin-right: 5px\" src=\"/images/monitor.png\"> <h3 class=\"text-left\">Service Health</h3> </div> <hr style=\"margin-top: 0px; margin-bottom: 8px; padding: 0px\"> <div class=\"row\"> <div class=\"col-sm-4\"> <img class=\"health-image\" ng-src=\"{{authenticationManagerHealthy && '/images/green-circle.png' || '/images/red-circle.png'}}\"> <h5 class=\"text-left\">Authentication Manager</h5> </div> <div class=\"col-sm-4\"> <img class=\"health-image\" ng-src=\"{{tenantManagerHealthy && '/images/green-circle.png' || '/images/red-circle.png'}}\"> <h5 class=\"text-left\">Tenant Manager</h5> </div> <div class=\"col-sm-4\"> <img class=\"health-image\" ng-src=\"{{tenantRegistrationHealthy && '/images/green-circle.png' || '/images/red-circle.png'}}\"> <h5 class=\"text-left\">Tenant Registration</h5> </div> </div> <br> <div class=\"row\"> <div class=\"col-sm-4\"> <img class=\"health-image\" ng-src=\"{{userManagerHealthy && '/images/green-circle.png' || '/images/red-circle.png'}}\"> <h5 class=\"text-left\">User Manager</h5> </div> <div class=\"col-sm-4\"> <img class=\"health-image\" ng-src=\"{{orderManagerHealthy && '/images/green-circle.png' || '/images/red-circle.png'}}\"> <h5 class=\"text-left\">Order Manager</h5> </div> <div class=\"col-sm-4\"> <img class=\"health-image\" ng-src=\"{{productManagerHealthy && '/images/green-circle.png' || '/images/red-circle.png'}}\"> <h5 class=\"text-left\">Product Manager</h5> </div> </div> </div> <div class=\"well\" style=\"padding-top: 0px\"> <div> <img style=\"width:28px; float: left; margin-right: 5px\" src=\"/images/chart.png\"> <h3 class=\"text-left\">System Metrics</h3> </div> <hr style=\"margin-top: 0px; margin-bottom: 8px; padding: 0px\"> <div class=\"row\"> <div class=\"col-sm-6\"> <div class=\"panel panel-default\"> <div class=\"panel-heading panel-heading-custom\"> <h3 class=\"panel-title\">Total Product Count</h3> </div> <div class=\"panel-body\"> 1,414 </div> </div> </div> <div class=\"col-sm-6\"> <div class=\"panel panel-default\"> <div class=\"panel-heading panel-heading-custom\"> <h3 class=\"panel-title\">Total Order Count</h3> </div> <div class=\"panel-body\"> 9,934 </div> </div> </div> </div> <div class=\"row\"> <div class=\"col-sm-6\"> <div class=\"panel panel-default\"> <div class=\"panel-heading panel-heading-custom\"> <h3 class=\"panel-title\">Average Sale Price</h3> </div> <div class=\"panel-body\"> $193.12 </div> </div> </div> <div class=\"col-sm-6\"> <div class=\"panel panel-default\"> <div class=\"panel-heading panel-heading-custom\"> <h3 class=\"panel-title\">Today's Order Count</h3> </div> <div class=\"panel-body\"> 123 </div> </div> </div> </div> <div ng-if=\"isSystemUser()\" class=\"row\"> <div class=\"col-sm-6\"> <div class=\"panel panel-default\"> <div class=\"panel-heading panel-heading-custom\"> <h3 class=\"panel-title\">Tenant Count</h3> </div> <div class=\"panel-body\"> 5 </div> </div> </div> <div class=\"col-sm-6\"> <div class=\"panel panel-default\"> <div class=\"panel-heading panel-heading-custom\"> <h3 class=\"panel-title\">User Count</h3> </div> <div class=\"panel-body\"> 29 </div> </div> </div> </div> </div> </div>"
  );


  $templateCache.put('views/order-add.html',
    "<ng-include src=\"'views/order-nav.html'\"></ng-include> <form role=\"form\"> <div class=\"form-group\"> <label for=\"productId\">Product</label> <select class=\"form-control\" id=\"productId\" ng-model=\"order.productId\" ng-change=\"productChanged(productId)\" required> <option ng-repeat=\"product in products\" ng-value=\"product.productId\">{{product.title}}</option> </select> </div> <div class=\"form-group\"> <label for=\"dateOrdered\" class=\"control-label\">Date Ordered</label> <input type=\"date\" ng-model=\"order.dateOrdered\" class=\"form-control\" id=\"dateOrdered\" required> </div> <div class=\"form-group\"> <label for=\"quantity\" class=\"control-label\">Quantity</label> <input type=\"number\" ng-model=\"order.quantity\" class=\"form-control\" id=\"quantity\" required> </div> <div class=\"form-group\"> <label for=\"unitCost\" class=\"control-label\">Unit Cost</label> <input type=\"number\" ng-model=\"order.unitCost\" class=\"form-control\" id=\"unitCost\" required> </div> <div class=\"form-group\"> <label class=\"control-label\">Total Cost</label> <p>{{ (order.quantity && order.unitCost) ? order.quantity * order.unitCost : 0 | currency }}</p> </div> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-primary\" ng-click=\"saveOrder()\" value=\"Save\"> <input type=\"submit\" class=\"btn btn-secondary\" ng-click=\"cancel()\" value=\"Cancel\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/order-delete.html',
    "<form role=\"form\"> <p>Are you sure you wish to delete the order: {{ order.productDescription }}?</p> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-danger\" ng-click=\"deleteOrder()\" value=\"Yes\"> <button ng-click=\"back()\" type=\"button\" class=\"btn btn-default\">No</button> </div> <div class=\"form-group\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/order-edit.html',
    "<ng-include src=\"'views/order-add.html'\"></ng-include>"
  );


  $templateCache.put('views/order-nav.html',
    "<h3 role=\"presentation\" ng-hide=\"!addOrder\">Add Order</h3> <h3 role=\"presentation\" ng-hide=\"!editOrder\">Edit Order</h3>"
  );


  $templateCache.put('views/orders.html',
    "<div class=\"container\"> <div class=\"row\"> <div class=\"col-md-10\"> <div class=\"form-group\"> <label>Product Filter: </label> <select id=\"productFilter\" ng-model=\"orderFilter\" ng-init=\"orderFilter='No Filter'\" ng-change=\"orderFilterChanged(orderFilter)\">Product <option ng-repeat=\"itemVal in productFilterValues\" ng-value=\"itemVal\">{{itemVal}}</option> </select> </div> </div> <a class=\"btn btn-primary\" href=\"#!/order/add\"><span class=\"glyphicon glyphicon-plus\"></span> Add Order</a> </div> </div> <table class=\"table table-striped\"> <thead> <th>Product SKU</th> <th>Product Title</th> <th>Ordered By</th> <th>Order Date</th> <th>Quantity</th> <th>Unit Cost</th> <th>Total Cost</th> <th></th> </thead> <tbody> <col width=\"12%\"> <col width=\"20%\"> <col width=\"20%\"> <col width=\"19%\"> <col width=\"4%\"> <col width=\"9%\"> <col width=\"10%\"> <col width=\"8%\"> <tr ng-repeat=\"order in filteredOrders | orderBy: '-datePlaced'\"> <td>{{ order.productSKU }}</td> <td>{{ order.productDescription }}</td> <td>{{ order.orderedBy }}</td> <td>{{ order.dateOrdered | date:'MM-dd-yyyy HH:mm:ss' }}</td> <td>{{ order.quantity }}</td> <td>{{ order.unitCost | currency }}</td> <td>{{ order.quantity * order.unitCost | currency }}</td> <td> <div class=\"button-group\"> <a ng-href=\"/#!/order/edit/{{ order.orderId }}\"><span class=\"glyphicon glyphicon-pencil\"></span></a> <a ng-href=\"/#!/order/delete/{{ order.orderId }}\"><span class=\"glyphicon glyphicon-trash\"></span></a> </div> </td> </tr> </tbody> </table> "
  );


  $templateCache.put('views/product-add.html',
    "<ng-include src=\"'views/product-nav.html'\"></ng-include> <form role=\"form\"> <div class=\"form-group\"> <label for=\"sku\" class=\"control-label\">SKU</label> <input type=\"text\" ng-model=\"product.sku\" class=\"form-control\" id=\"sku\" required> </div> <div class=\"form-group\"> <label for=\"title\" class=\"control-label\">Title</label> <input type=\"text\" ng-model=\"product.title\" class=\"form-control\" id=\"title\" required> </div> <div class=\"form-group\"> <label for=\"description\" class=\"control-label\">Description</label> <textarea ng-model=\"product.description\" class=\"form-control\" id=\"description\" required></textarea> </div> <div class=\"form-group\"> <label for=\"condition\" class=\"control-label\">Condition</label> <select class=\"form-control\" id=\"condition\" name=\"condition\" ng-model=\"product.condition\" ng-init=\"product.condition='Brand New'\" required> <option value=\"Brand New\">Brand New</option> <option value=\"Refurbished\" 2>Refubished</option> <option value=\"Scratch and Dent\">Scratch and Dent</option> </select> </div> <div class=\"form-group\"> <label for=\"conditionDescription\" class=\"control-label\">Condition Description</label> <textarea ng-model=\"product.conditionDescription\" class=\"form-control\" id=\"conditionDescription\" required></textarea> </div> <div class=\"form-group\"> <label for=\"numberInStock\" class=\"control-label\">Number in Stock</label> <input type=\"text\" ng-model=\"product.numberInStock\" class=\"form-control\" id=\"numberInStock\" required> </div> <div class=\"form-group\"> <label for=\"unitCost\" class=\"control-label\">Unit Cost</label> <input type=\"number\" ng-model=\"product.unitCost\" class=\"form-control\" id=\"unitCost\" required> </div> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-primary\" ng-click=\"saveProduct()\" value=\"Save\"> <input type=\"submit\" class=\"btn btn-secondary\" ng-click=\"cancel()\" value=\"Cancel\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/product-delete.html',
    "<form role=\"form\"> <p>Are you sure you wish to delete the product: {{ product.title }}?</p> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-danger\" ng-click=\"deleteProduct()\" value=\"Yes\"> <button ng-click=\"back()\" type=\"button\" class=\"btn btn-default\">No</button> </div> <div class=\"form-group\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/product-edit.html',
    "<ng-include src=\"'views/product-add.html'\"></ng-include>"
  );


  $templateCache.put('views/product-nav.html',
    "<h3 role=\"presentation\" ng-hide=\"!addProduct\">Add Product</h3> <h3 role=\"presentation\" ng-hide=\"!editProduct\">Edit Product</h3>"
  );


  $templateCache.put('views/product-view.html',
    "<h3>View Product</h3> <form role=\"form\"> <div class=\"form-group\"> <label class=\"control-label\" for=\"sku\">SKU</label> <p ng-model=\"product.sku\" ng-readonly=\"true\" class=\"form-control\" id=\"sku\">{{product.sku}}</p> </div> <div class=\"form-group\"> <label class=\"control-label\" for=\"title\">Title</label> <p ng-model=\"product.title\" ng-readonly=\"true\" class=\"form-control\" id=\"title\">{{product.title}}</p> </div> <div class=\"form-group\"> <label class=\"control-label\" for=\"description\">Description</label> <textarea ng-model=\"product.description\" ng-readonly=\"true\" class=\"form-control\" id=\"description\">{{product.description}}</textarea> </div> <div class=\"form-group\"> <label class=\"control-label\" for=\"condition\">Condition</label> <p ng-model=\"product.condition\" ng-readonly=\"true\" class=\"form-control\" id=\"condition\">{{product.condition}}</p> </div> <div class=\"form-group\"> <label class=\"control-label\" for=\"conditionDescription\">Condition Description</label> <textarea ng-model=\"product.conditionDescription\" ng-readonly=\"true\" class=\"form-control\" id=\"conditionDescription\">{{product.conditionDescription}}</textarea> </div> <div class=\"form-group\"> <label class=\"control-label\" for=\"numberInStock\">In Stock</label> <p ng-model=\"product.numberInStock\" ng-readonly=\"true\" class=\"form-control\" id=\"numberInStock\">{{product.numberInStock}}</p> </div> <div class=\"form-group\"> <label class=\"control-label\" for=\"unitCost\">Unit Cost</label> <p ng-model=\"product.unitCost\" ng-readonly=\"true\" class=\"form-control\" id=\"unitCost\">{{product.unitCost | currency}}</p> </div> </form>"
  );


  $templateCache.put('views/products.html',
    "<div align=\"right\"> <a class=\"btn btn-primary\" ng-if=\"isTenantAdminUser()\" href=\"#!/product/add\"><span class=\"glyphicon glyphicon-plus\"></span> Add Product</a> </div> <table class=\"table table-striped\"> <thead> <th>SKU</th> <th>Title</th> <th>Condition</th> <th>In Stock</th> <th>Unit Cost</th> <th ng-if=\"isTenantAdminUser()\"></th> </thead> <tbody> <col width=\"15%\"> <col width=\"25%\"> <col width=\"23%\"> <col width=\"15%\"> <col width=\"15%\"> <col ng-if=\"isTenantAdminUser()\" width=\"7%\"> <tr ng-repeat=\"product in products\"> <td><a ng-href=\"/#!/product/{{ product.productId }}\">{{ product.sku }}</a></td> <td>{{ product.title }}</td> <td>{{ product.condition }}</td> <td>{{ product.numberInStock }}</td> <td>{{ product.unitCost | currency }}</td> <td ng-if=\"isTenantAdminUser()\"> <div class=\"button-group\"> <a ng-href=\"/#!/product/edit/{{ product.productId }}\"><span class=\"glyphicon glyphicon-pencil\"></span></a> <a ng-href=\"/#!/product/delete/{{ product.productId }}\"><span class=\"glyphicon glyphicon-trash\"></span></a> </div> </td> </tr> </tbody> </table> "
  );


  $templateCache.put('views/register.html',
    "<div ng-show=\"!hideRegistrationForm\" class=\"col-md-6 col-md-offset-3\"> <h2>Register</h2> <form name=\"form\" ng-submit=\"formSubmit()\" role=\"form\"> <div class=\"form-group\"> <label for=\"firstName\">First name</label> <input type=\"text\" name=\"firstName\" id=\"firstName\" class=\"form-control\" ng-model=\"tenant.firstName\" required> </div> <div class=\"form-group\"> <label for=\"lastName\">Last name</label> <input type=\"text\" name=\"lastName\" id=\"lastName\" class=\"form-control\" ng-model=\"tenant.lastName\" required> </div> <div class=\"form-group\"> <label for=\"email\">Email Address</label> <input type=\"text\" name=\"email\" id=\"email\" class=\"form-control\" ng-model=\"tenant.email\" required> </div> <div class=\"form-group\"> <label for=\"companyName\">Company</label> <input type=\"text\" name=\"companyName\" id=\"companyName\" class=\"form-control\" ng-model=\"tenant.companyName\" required> </div> <div class=\"form-group\"> <label for=\"plan\">Plan</label> <select class=\"form-control\" id=\"plan\" name=\"plan\" ng-model=\"tenant.plan\" ng-init=\"tenant.plan='Free Tier'\" required> <option value=\"Free Tier\">Free Tier</option> <option value=\"Standard Tier\">Standard Tier</option> <option value=\"Professional Tier\">Professional Tier</option> </select> </div> <div class=\"form-actions\"> <button type=\"submit\" class=\"btn btn-primary\">Register</button> <a href=\"#!/login\" class=\"btn btn-link\">Cancel</a> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form> </div> <div ng-show=\"showSuccessMessage\" class=\"col-md-8 col-md-offset-1\"> <h3>Success</h3> <p>Your account has been registered. An email with login instructions is on its way.</p> </div>"
  );


  $templateCache.put('views/tenant-delete.html',
    "<form role=\"form\"> <p>Are you sure you wish to delete the tenant: {{ tenant.companyName }}?</p> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-danger\" ng-click=\"deleteTenant()\" value=\"Yes\"> <button ng-click=\"back()\" type=\"button\" class=\"btn btn-default\">No</button> </div> <div class=\"form-group\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/tenant-edit.html',
    "<h3>Edit Tenant</h3> <form role=\"form\"> <div class=\"form-group\"> <label for=\"companyName\" class=\"control-label\">Company Name</label> <input type=\"text\" ng-model=\"tenant.companyName\" class=\"form-control\" id=\"companyName\" required> </div> <div class=\"form-group\"> <label for=\"accountName\" class=\"control-label\">Account Name</label> <input type=\"text\" ng-model=\"tenant.accountName\" class=\"form-control\" id=\"accountName\" required> </div> <div class=\"form-group\"> <label for=\"ownerName\" class=\"control-label\">Owner Name</label> <input type=\"text\" ng-model=\"tenant.ownerName\" class=\"form-control\" id=\"ownerName\" required> </div> <div class=\"form-group\"> <label for=\"tier\">Plan</label> <select class=\"form-control\" id=\"tier\" name=\"tier\" ng-model=\"tenant.tier\" ng-init=\"tenant.tier='Free Tier'\" required> <option value=\"Free Tier\">Free Tier</option> <option value=\"Standard Tier\">Standard Tier</option> <option value=\"Professional Tier\">Professional Tier</option> </select> </div> <div class=\"form-group\"> <label for=\"status\" class=\"control-label\">Status</label> <select class=\"form-control\" id=\"status\" name=\"status\" ng-model=\"tenant.status\" ng-init=\"tenant.status='Active'\" required> <option value=\"Active\">Active</option> <option value=\"Inactive\" 2>Inactive</option> </select> </div> <input type=\"submit\" class=\"btn btn-primary\" ng-click=\"saveTenant()\" value=\"Save\"> <input type=\"submit\" class=\"btn btn-secondary\" ng-click=\"cancel()\" value=\"Cancel\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </form>"
  );


  $templateCache.put('views/tenants.html',
    "<table class=\"table table-striped\"> <thead> <th>Company Name</th> <th>Account Name</th> <th>Owner</th> <th>Plan</th> <th>Status</th> <th ng-if=\"isSystemAdminUser()\"></th> </thead> <tbody> <col width=\"20%\"> <col width=\"20%\"> <col width=\"21%\"> <col width=\"20%\"> <col width=\"12%\"> <col ng-if=\"isSystemAdminUser()\" width=\"7%\"> <tr ng-repeat=\"tenant in tenants\"> <td>{{ tenant.companyName }}</td> <td>{{ tenant.accountName }}</td> <td>{{ tenant.ownerName }}</td> <td>{{ tenant.tier }}</td> <td>{{ tenant.status }}</td> <td ng-if=\"isSystemAdminUser()\"> <div class=\"button-group\"> <a ng-href=\"/#!/tenant/edit/{{ tenant.id }}\"><span class=\"glyphicon glyphicon-pencil\"></span></a> <a ng-href=\"/#!/tenant/delete/{{ tenant.id }}\"><span class=\"glyphicon glyphicon-trash\"></span></a> </div> </td> </tr> </tbody> </table> "
  );


  $templateCache.put('views/user-add.html',
    "<ng-include src=\"'views/user-nav.html'\"></ng-include> <form role=\"form\"> <div class=\"form-group\"> <label for=\"userName\" class=\"control-label\">User Name</label> <input type=\"text\" ng-model=\"user.userName\" class=\"form-control\" id=\"userName\" required> </div> <div class=\"form-group\"> <label for=\"firstName\" class=\"control-label\">First Name</label> <input type=\"text\" ng-model=\"user.firstName\" class=\"form-control\" id=\"firstName\" required> </div> <div class=\"form-group\"> <label for=\"lastName\" class=\"control-label\">Last Name</label> <input type=\"text\" ng-model=\"user.lastName\" class=\"form-control\" id=\"lastName\" required> </div> <div class=\"form-group\"> <label for=\"role\" class=\"control-label\">Role</label> <select class=\"form-control\" id=\"role\" name=\"role\" ng-model=\"user.role\" ng-init=\"user.role\" required> <option ng-if=\"isSystemUser()\" value=\"SystemAdmin\">System Administrator</option> <option ng-if=\"isSystemUser()\" value=\"SystemUser\">Customer Support</option> <option ng-if=\"!isSystemUser()\" value=\"TenantAdmin\">Administrator</option> <option ng-if=\"!isSystemUser()\" value=\"TenantUser\">Order Manager</option> </select> </div> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-primary\" ng-click=\"saveUser()\" value=\"Save\"> <input type=\"submit\" class=\"btn btn-secondary\" ng-click=\"cancel()\" value=\"Cancel\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/user-delete.html',
    "<form role=\"form\"> <p>Are you sure you wish to delete the user: {{ user.userName }}?</p> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-danger\" ng-click=\"deleteUser()\" value=\"Yes\"> <button ng-click=\"back()\" type=\"button\" class=\"btn btn-default\">No</button> </div> <div class=\"form-group\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/user-edit.html',
    "<ng-include src=\"'views/user-add.html'\"></ng-include>"
  );


  $templateCache.put('views/user-enable.html',
    "<form role=\"form\"> <p>Are you sure you wish to {{user.enabled? 'disable' : 'enable' }} user: {{ user.userName }}?</p> <div class=\"form-group\"> <input type=\"submit\" class=\"btn btn-danger\" ng-click=\"yesPressed()\" value=\"Yes\"> <button ng-click=\"back()\" type=\"button\" class=\"btn btn-default\">No</button> </div> <div class=\"form-group\"> <br> <br> <div ng-if=\"error\" class=\"alert alert-danger\">{{ error }}</div> </div> </form>"
  );


  $templateCache.put('views/user-nav.html',
    "<h3 role=\"presentation\" ng-hide=\"!addUser\">Add User</h3> <h3 role=\"presentation\" ng-hide=\"!editUser\">Edit User</h3>"
  );


  $templateCache.put('views/users.html',
    "<div align=\"right\"> <a class=\"btn btn-primary\" href=\"#!/user/add\"><span class=\"glyphicon glyphicon-plus\"></span> Add User</a> </div> <table class=\"table table-striped\"> <thead> <th>First Name</th> <th>Last Name</th> <th>User Name</th> <th>Role</th> <th>Active</th> <th>Date Created</th> <th></th> </thead> <tbody> <col width=\"12%\"> <col width=\"11%\"> <col width=\"16%\"> <col width=\"15%\"> <col width=\"10%\"> <col width=\"22%\"> <col width=\"10%\"> <tr ng-repeat=\"user in users\"> <td>{{ user.firstName }}</td> <td>{{ user.lastName }}</td> <td>{{ user.userName }}</td> <td>{{ roleToDisplayName(user.role) }}</td> <td>{{ user.enabled ? 'Active' : 'Inactive' }}</td> <td>{{ user.dateCreated | date:'yyyy-MM-dd HH:mm:ss'}}</td> <td> <div class=\"button-group\"> <a title=\"Edit\" ng-href=\"/#!/user/edit/{{ user.userName }}\"><span class=\"glyphicon glyphicon-pencil\"></span></a> <a title=\"Delete\" ng-href=\"/#!/user/delete/{{ user.userName }}\"><span class=\"glyphicon glyphicon-trash\"></span></a> <a title=\"Enable/Disable\" ng-href=\"/#!/user/enable/{{ user.userName }}\"><span class=\"glyphicon glyphicon-check\"></span></a> </div> </td> </tr> </tbody> </table> "
  );

}]);
