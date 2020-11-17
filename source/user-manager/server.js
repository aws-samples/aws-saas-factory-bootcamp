'use strict';

// Configure Environment
const configModule = require('../shared-modules/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

const winston = require('winston');
winston.add(new winston.transports.Console({level: configuration.loglevel}));

// Declare dependencies
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
//const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const async = require('async');

// Declare shared modules
const tokenManager = require('../shared-modules/token-manager/token-manager.js');
const DynamoDBHelper = require('../shared-modules/dynamodb-helper/dynamodb-helper.js');
const cognitoUsers = require('./cognito-user.js');

// Variables that are provided through a token
var bearerToken = '';
var tenantId = '';

// instantiate application
var app = express();

// configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Origin, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, Access-Control-Allow-Headers, X-Requested-With, Access-Control-Allow-Origin");
    bearerToken = req.get('Authorization');
    if (bearerToken) {
        tenantId = tokenManager.getTenantId(req);
    }
    next();
});

var userSchema = {
    TableName : configuration.table.user,
    KeySchema: [
        { AttributeName: "tenant_id", KeyType: "HASH" },  //Partition key
        { AttributeName: "user_id", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "tenant_id", AttributeType: "S" },
        { AttributeName: "user_id", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [
        {
            IndexName: 'UserNameIndex',
            KeySchema: [
                { AttributeName: "user_id", KeyType: "HASH" }
            ],
            Projection: {
                ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ]
};

app.get('/user/health', function (req, res) {
    res.status(200).send('{"service": "User Manager", "isAlive": "true}');
});

/**
 * Lookup user pool for any user - no user data returned
 */
app.get('/user/pool/:id', function (req, res) {
    winston.debug('Looking up user pool data for: ' + req.params.id);
    tokenManager.getSystemCredentials(function (credentials) {
        lookupUserPoolData(credentials, req.params.id, null, true, function (err, user) {
            if (err) {
                res.status(400).send('{"Error" : "Error getting user"}');
            } else {
                if (user.length == 0) {
                    res.status(400).send('{"Error": "User not found"}');
                } else {
                    res.status(200).send(user);
                }
            }
        });
    });
});

/**
 * Get user attributes
 */
app.get('/user/:id', function (req, res) {
    winston.debug('Getting user id: ' + req.params.id);
    tokenManager.getCredentialsFromToken(req, function (credentials) {
        // get the tenant id from the request
        var tenantId = tokenManager.getTenantId(req);

        lookupUserPoolData(credentials, req.params.id, tenantId, false, function(err, user) {
            if (err) {
                res.status(400).send('{"Error" : "Error getting user"}');
            } else {
                cognitoUsers.getCognitoUser(credentials, user, function (err, user) {
                    if (err) {
                        res.status(400);
                        res.json('Error lookup user user: ' + req.params.id);
                    } else {
                        res.json(user);
                    }
                })
            }
        });
    });
});

/**
 * Get a list of users using a tenant id to scope the list
 */
app.get('/users', function (req, res) {
    tokenManager.getCredentialsFromToken(req, function (credentials) {
        var userPoolId = getUserPoolIdFromRequest(req);
        cognitoUsers.getUsersFromPool(credentials, userPoolId, configuration.aws_region)
            .then(function (userList) {
                res.status(200).send(userList);
            })
            .catch(function(error) {
                res.status(400).send("Error retrieving user list: " + error.message);
            });
    })
});

/**
 * Create a new user
 */
app.post('/user', function (req, res) {
    tokenManager.getCredentialsFromToken(req, function (credentials) {
        var user = req.body;
        winston.debug('Creating user: ' + user.userName);

        // extract requesting user and role from the token
        var authToken = tokenManager.getRequestAuthToken(req);
        var decodedToken = tokenManager.decodeToken(authToken);
        var requestingUser = decodedToken.email;
        user.tier = decodedToken['custom:tier'];
        user.tenant_id = decodedToken['custom:tenant_id'];

        // get the user pool data using the requesting user
        // all users added in the context of this user
        lookupUserPoolData(credentials, requestingUser, user.tenant_id, false, function(err, userPoolData) {
            // if the user pool found, proceed
            if (!err) {
                createNewUser(credentials, userPoolData.UserPoolId, userPoolData.IdentityPoolId, userPoolData.client_id, user.tenant_id, user)
                    .then(function(createdUser) {
                        winston.debug('User ' + user.userName + ' created');
                        res.status(200).send({status: 'success'});
                    })
                    .catch(function(err) {
                        winston.error('Error creating new user in DynamoDB: ' + err.message);
                        res.status(400).send('{"Error" : "Error creating user in DynamoDB"}');
                    });
            } else {
                res.status(400).send('{"Error" : "User pool not found"}');
            }
        });
    });
});

app.post('/user/create', function (req, res) {
	var newUser = req.body;
	
	var credentials = {};
    tokenManager.getSystemCredentials(function (systemCredentials) {
        if (systemCredentials) {
            credentials = systemCredentials;
            
            cognitoUsers.createUser(credentials, newUser, function(err, cognitoUsers) {
				if (err) {
					res.status(400).send('{"Error": "Error creating new user"}');
				} else {
					res.status(200).send(cognitoUsers);
				}
			});
			
        } else {
        	res.status(400).send('{"Error": "Could not retrieve system credentials"}');
        }
	});
});

/**
 * Provision a new system admin user
 */
app.post('/user/system', function (req, res) {
    var user = req.body;
    user.tier = configuration.tier.system;
    user.role = configuration.userRole.systemAdmin;
    // get the credentials for the system user
    var credentials = {};
    tokenManager.getSystemCredentials(function (systemCredentials) {
        if (systemCredentials) {
            credentials = systemCredentials;
            // provision the tenant admin and roles
            provisionAdminUserWithRoles(user, credentials, configuration.userRole.systemAdmin, configuration.userRole.systemUser,
                function (err, result) {
                    if (err) {
                        res.status(400).send("Error provisioning system admin user");
                    } else {
                        res.status(200).send(result);
                    }
                });
        } else{
            winston.debug("Error Obtaining System Credentials");
        }
    });
});

/**
 * Provision a new tenant admin user
 */
app.post('/user/reg', function (req, res) {
    var user = req.body;

    // get the credentials for the system user
    var credentials = {};
    tokenManager.getSystemCredentials(function (systemCredentials) {
        credentials = systemCredentials;

        // provision the tenant admin and roles
        provisionAdminUserWithRoles(user, credentials, configuration.userRole.tenantAdmin, configuration.userRole.tenantUser,
            function(err, result) {
                if (err) {
                    res.status(400).send("Error provisioning tenant admin user");
                } else {
                    res.status(200).send(result);
                }
            });
    });
});

/**
 * Enable a user that is currently disabled
 */
app.put('/user/enable', function (req, res) {
    updateUserEnabledStatus(req, true, function(err, result) {
        if (err) {
            res.status(400).send('Error enabling user');
        } else {
            res.status(200).send(result);
        }
    });
});


/**
 * Disable a user that is currently enabled
 */
app.put('/user/disable', function (req, res) {
    updateUserEnabledStatus(req, false, function(err, result) {
        if (err) {
            res.status(400).send('Error disabling user');
        } else {
            res.status(200).send(result);
        }
    });
});

/**
 * Update a user's attributes
 */
app.put('/user', function (req, res) {
    var user = req.body;
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // get the user pool id from the request
        var userPoolId = getUserPoolIdFromRequest(req);

        // update user data
        cognitoUsers.updateUser(credentials, user, userPoolId, configuration.aws_region)
            .then(function(updatedUser) {
                res.status(200).send(updatedUser);
            })
            .catch(function(err) {
                res.status(400).send("Error updating user: " + err.message);
            });
    });
});

/**
 * Delete a user
 */
app.delete('/user/:id', function (req, res) {
    var userName = req.params.id;
    tokenManager.getCredentialsFromToken(req, function (credentials) {
        winston.debug('Deleting user: ' + userName);

        // get the tenant id from the request
        var tenantId = tokenManager.getTenantId(req);

        // see if the user exists in the system
        lookupUserPoolData(credentials, userName, tenantId, false, function (err, userPoolData) {
            var userPool = userPoolData;
            // if the user pool found, proceed
            if (err) {
                res.status(400).send("User does not exist");
            } else {
                // first delete the user from Cognito
                cognitoUsers.deleteUser(credentials, userName, userPool.UserPoolId, configuration.aws_region)
                    .then(function (result) {
                        winston.debug('User ' + userName + ' deleted from Cognito');

                        // now delete the user from the user data base
                        var deleteUserParams = {
                            TableName: userSchema.TableName,
                            Key: {
                                user_id: userName,
                                tenant_id: tenantId
                            }
                        };

                        // construct the helper object
                        var dynamoHelper = new DynamoDBHelper(userSchema, credentials, configuration);

                        // delete the user from DynamoDB
                        dynamoHelper.deleteItem(deleteUserParams, credentials, function (err, user) {
                            if (err) {
                                winston.error('Error deleting DynamoDB user: ' + err.message);
                                res.status(400).send('{"Error" : "Error deleting DynamoDB user"}');
                            } else {
                                winston.debug('User ' + userName + ' deleted from DynamoDB');
                                res.status(200).send({status: 'success'});
                            }
                        })
                    })
                    .catch(function (error) {
                        winston.error('Error deleting Cognito user: ' + err.message);
                        res.status(400).send('{"Error" : "Error deleting user"}');
                    });
            }
        });
    });
});

/**
 * Provision an admin user and the associated policies/roles
 * @param user The user being created
 * @param credentials Credentials to use for provisioning
 * @param adminPolicyName The name of of the admin policy to provisioned
 * @param userPolicyName The name of the user policy to be provisioned
 * @param callback Returns an object with the results of the provisioned items
 */
function provisionAdminUserWithRoles(user, credentials, adminPolicyName, userPolicyName, callback) {
    // vars that are used across multiple calls
    var createdUserPoolData = {};
    var trustPolicyTemplate = {};
    var createdTrustPolicyRole = {};
    var createdUserPoolClient = {};
    var createdIdentityPool = {};
    var createdAdminPolicy = {};
    var createdAdminRole = {};
    var createdUserPolicy = {};
    var createdUserRole = {};

    // setup params for template generation
    var policyCreationParams = {
        tenantId: user.tenant_id,
        accountId: configuration.aws_account,
        region: configuration.aws_region,
        tenantTableName: configuration.table.tenant,
        userTableName: configuration.table.user,
        productTableName: configuration.table.product,
        orderTableName: configuration.table.order
    };

    // init role based on admin policy name
    user.role = adminPolicyName;

    // see if this user is already in the system
    lookupUserPoolData(credentials, user.userName, user.tenant_id, true, function(err, userPoolData) {
        if (!err){
            callback( new Error ('{"Error" : "User already exists"}'));
            winston.debug('{"Error" : "User already exists"}');
        } else {
            // create the new user
            cognitoUsers.createUserPool(user.tenant_id)
                .then(function (poolData) {
                    createdUserPoolData = poolData;

                    var clientConfigParams = {
                        "ClientName": createdUserPoolData.UserPool.Name,
                        "UserPoolId": createdUserPoolData.UserPool.Id
                    };

                    // add the user pool to the policy template configuration (couldn't add until here)
                    policyCreationParams.userPoolId = createdUserPoolData.UserPool.Id;

                    // crete the user pool for the new tenant
                    return cognitoUsers.createUserPoolClient(clientConfigParams);
                })
                .then(function(userPoolClientData) {
                    createdUserPoolClient = userPoolClientData;
                    var identityPoolConfigParams = {
                        "ClientId": userPoolClientData.UserPoolClient.ClientId,
                        "UserPoolId": userPoolClientData.UserPoolClient.UserPoolId,
                        "Name": userPoolClientData.UserPoolClient.ClientName
                    };
                    return cognitoUsers.createIdentityPool(identityPoolConfigParams);
                })
                .then(function(identityPoolData) {
                    createdIdentityPool = identityPoolData;

                    // create and populate policy templates
                    trustPolicyTemplate = cognitoUsers.getTrustPolicy(identityPoolData.IdentityPoolId);

                    // get the admin policy template
                    var adminPolicyTemplate = cognitoUsers.getPolicyTemplate(adminPolicyName, policyCreationParams);

                    // setup policy name
                    var policyName = user.tenant_id + '-' + adminPolicyName + 'Policy';

                    // configure params for policy provisioning calls
                    var adminPolicyParams = {
                        "policyName": policyName,
                        "policyDocument": adminPolicyTemplate
                    };

                    return cognitoUsers.createPolicy(adminPolicyParams)
                })
                .then(function (adminPolicy) {
                    createdAdminPolicy = adminPolicy;
                    return createNewUser(credentials, createdUserPoolData.UserPool.Id, createdIdentityPool.IdentityPoolId, createdUserPoolClient.UserPoolClient.ClientId, user.tenant_id, user);
                })
                .then(function() {
                    // get the admin policy template
                    var userPolicyTemplate = cognitoUsers.getPolicyTemplate(userPolicyName, policyCreationParams);

                    // setup policy name
                    var policyName = user.tenant_id + '-' + userPolicyName + 'Policy';

                    // configure params for policy provisioning calls
                    var userPolicyParams = {
                        "policyName": policyName,
                        "policyDocument": userPolicyTemplate
                    };

                    return cognitoUsers.createPolicy(userPolicyParams)
                })
                .then(function(userPolicy) {
                    createdUserPolicy = userPolicy;

                    var adminRoleName = user.tenant_id + '-' + adminPolicyName;
                    var adminRoleParams = {
                        "policyDocument": trustPolicyTemplate,
                        "roleName": adminRoleName
                    };

                    return cognitoUsers.createRole(adminRoleParams);
                })
                .then(function(adminRole) {
                    createdAdminRole = adminRole;

                    var userRoleName = user.tenant_id + '-' + userPolicyName;
                    var userRoleParams = {
                        "policyDocument": trustPolicyTemplate,
                        "roleName": userRoleName
                    };

                    return cognitoUsers.createRole(userRoleParams)
                })
                .then(function(userRole) {
                    createdUserRole = userRole;
                    var trustPolicyRoleName = user.tenant_id + '-Trust';
                    var trustPolicyRoleParams = {
                        "policyDocument": trustPolicyTemplate,
                        "roleName": trustPolicyRoleName
                    };

                    return cognitoUsers.createRole(trustPolicyRoleParams)
                })
                .then(function(trustPolicyRole) {
                    createdTrustPolicyRole = trustPolicyRole;
                    var adminPolicyRoleParams = {
                        PolicyArn: createdAdminPolicy.Policy.Arn,
                        RoleName: createdAdminRole.Role.RoleName
                    };

                    return cognitoUsers.addPolicyToRole(adminPolicyRoleParams);
                })
                .then(function() {
                    var userPolicyRoleParams = {
                        PolicyArn: createdUserPolicy.Policy.Arn,
                        RoleName: createdUserRole.Role.RoleName
                    };

                    return cognitoUsers.addPolicyToRole(userPolicyRoleParams);
                })
                .then(function() {
                    var addRoleToIdentityParams = {
                        "IdentityPoolId": createdIdentityPool.IdentityPoolId,
                        "trustAuthRole": createdTrustPolicyRole.Role.Arn,
                        "rolesystem": createdAdminRole.Role.Arn,
                        "rolesupportOnly": createdUserRole.Role.Arn,
                        "ClientId": createdUserPoolClient.UserPoolClient.ClientId,
                        "provider": createdUserPoolClient.UserPoolClient.UserPoolId,
                        "adminRoleName": adminPolicyName,
                        "userRoleName": userPolicyName
                    };

                    return cognitoUsers.addRoleToIdentity(addRoleToIdentityParams);
                })
                .then(function(identityRole) {
                    var returnObject = {
                        "pool": createdUserPoolData,
                        "userPoolClient": createdUserPoolClient,
                        "identityPool": createdIdentityPool,
                        "role": {
                            "systemAdminRole": createdAdminRole.Role.RoleName,
                            "systemSupportRole": createdUserRole.Role.RoleName,
                            "trustRole": createdTrustPolicyRole.Role.RoleName
                        },
                        "policy": {
                            "systemAdminPolicy": createdAdminPolicy.Policy.Arn,
                            "systemSupportPolicy": createdUserPolicy.Policy.Arn,
                        },
                        "addRoleToIdentity": identityRole
                    };
                    callback(null, returnObject)
                })
                .catch (function(err) {
                    winston.debug(err)
                    callback(err);
                });
        }
    });
}

/**
 * Create a new user using the supplied credentials/user
 * @param credentials The creds used for the user creation
 * @param userPoolId The user pool where the user will be added
 * @param identityPoolId the identityPoolId
 * @param clientId The client identifier
 * @param tenantId The tenant identifier
 * @param newUser The data fro the user being created
 * @param callback Callback with results for created user
 */
function createNewUser(credentials, userPoolId, identityPoolId, clientId, tenantId, newUser) {
    var promise = new Promise(function(resolve, reject) {
        // fill in system attributes for user (not passed in POST)
        newUser.userPoolId = userPoolId;
        newUser.tenant_id = tenantId;
        newUser.email = newUser.userName;
        // cerate the user in Cognito
        cognitoUsers.createUser(credentials, newUser, function (err, cognitoUser) {
            if (err)
                reject(err);
            else {
                // populate the user to store in DynamoDB
                newUser.user_id = newUser.userName;
                newUser.UserPoolId = userPoolId;
                newUser.IdentityPoolId = identityPoolId;
                newUser.client_id = clientId;
                newUser.tenant_id = tenantId;
                newUser.sub = cognitoUser.User.Attributes[0].Value;

                // construct the helper object
                var dynamoHelper = new DynamoDBHelper(userSchema, credentials, configuration);

                dynamoHelper.putItem(newUser, credentials, function (err, createdUser) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(null, createdUser)
                    }
                });
            }
        });
    });

    return promise;
}

/**
 * Lookup a user's pool data in the user table
 * @param credentials The credentials used for looking up the user
 * @param userId The id of the user being looked up
 * @param tenantId The id of the tenant (if this is not system context)
 * @param isSystemContext Is this being called in the context of a system user (registration, system user provisioning)
 * @param callback The results of the lookup
 */
function lookupUserPoolData(credentials, userId, tenantId, isSystemContext, callback) {

    // construct the helper object
    var dynamoHelper = new DynamoDBHelper(userSchema, credentials, configuration);

    // if we're looking this up in a system context, query the GSI with user name only
    if (isSystemContext) {

        // init params structure with request params
        var searchParams = {
            TableName: userSchema.TableName,
            IndexName: userSchema.GlobalSecondaryIndexes[0].IndexName,
            KeyConditionExpression: "user_id = :id",
            ExpressionAttributeValues: {
                ":id": userId
            }
        };

        // get the item from the database
        dynamoHelper.query(searchParams, credentials, function (err, users) {
            if (err) {
                winston.error('Error getting user: ' + err.message);
                callback(err);
            } else {
                if (users.length == 0) {
                    var err = new Error('No user found: ' + userId);
                    callback(err);
                } else {
                    callback(null, users[0]);
                }
            }
        });
    } else {
        // if this is a tenant context, then we must get with tenant id scope
        winston.debug("Fetching user " + userId + " with tenant context " + tenantId);
        var searchParams = {
            user_id: userId,
            tenant_id: tenantId
        }

        // get the item from the database
        dynamoHelper.getItem(searchParams, credentials, function (err, user) {
            if (err) {
                winston.error('Error getting user: ' + err.message);
                callback(err);
            } else {
                winston.debug("Returning user: ");
                winston.debug(JSON.stringify(user));
                callback(null, user);
            }
        });
    }
}

/**
 * Enable/disable a user
 * @param req The request with the user information
 * @param enable True if enabling, False if disabling
 * @param callback Return results of applying enable/disable
 */
function updateUserEnabledStatus(req, enable, callback) {
    var user = req.body;

    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // get the tenant id from the request
        var tenantId = tokenManager.getTenantId(req);

        // Get additional user data required for enabled/disable
        lookupUserPoolData(credentials, user.userName, tenantId, false, function(err, userPoolData) {
            var userPool = userPoolData;

            // if the user pool found, proceed
            if (err) {
                callback(err);
            } else {
                // update the user enabled status
                cognitoUsers.updateUserEnabledStatus(credentials, userPool.UserPoolId, user.userName, enable)
                    .then(function() {
                        callback(null, {status: 'success'});
                    })
                    .catch(function(err) {
                        callback(err);
                    });
            }
        });
    });
}

/**
 * Extract a token from the header and return its embedded user pool id
 * @param req The request with the token
 * @returns The user pool id from the token
 */
function getUserPoolIdFromRequest(req) {
    var token = req.get('Authorization');
    var userPoolId;
    var decodedToken = tokenManager.decodeToken(token);
    if (decodedToken) {
        var pool = decodedToken.iss;
        userPoolId = pool.substring(pool.lastIndexOf("/") + 1);
    }
    return userPoolId;
};


// Start the service
app.listen(configuration.port.user);
console.log(configuration.name.user + ' service started on port ' + configuration.port.user);