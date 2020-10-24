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
