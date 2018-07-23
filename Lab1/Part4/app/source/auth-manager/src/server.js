'use strict';

// Declare library dependencies
const express = require('express');
const bodyParser = require('body-parser');

//AWS Dependencies for Cognito and AWS SDK
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;

//Configure Environment
const configModule = require('../shared-modules/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

//Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;

//Include Custom Modules
const tokenManager = require('../shared-modules/token-manager/token-manager.js');

// Instantiate application
var app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});

app.get('/auth/health', function(req, res) {
    res.status(200).send({service: 'Authentication Manager', isAlive: true});
});

// process login request
app.post('/auth', function (req, res) {
    var user = req.body;

    tokenManager.getUserPool(user.userName, function (error, userPoolLookup) {
        if (!error) {
            // get the pool data from the response
            var poolData = {
                UserPoolId: userPoolLookup.userPoolId,
                ClientId: userPoolLookup.client_id
            };
            // construct a user pool object
            var userPool = new CognitoUserPool(poolData);
            // configure the authentication credentials
            var authenticationData = {
                Username: user.userName,
                Password: user.password
            };
            // create object with user/pool combined
            var userData = {
                Username: user.userName,
                Pool: userPool
            };
            // init Cognito auth details with auth data
            var authenticationDetails = new AWS.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
            // authenticate user to in Cognito user pool
            var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser(userData);

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    // get the ID token
                    var idToken = result.getIdToken().getJwtToken();
                    var AccessToken = result.getAccessToken().getJwtToken();
                    res.json({token: idToken, access: AccessToken});
                },
                onFailure: function(err) {
                    if (res.status != 400) {
                        res.json(err);
                        return;
                    }
                },
                mfaRequired: function(codeDeliveryDetails) {
                    // MFA is required to complete user authentication.
                    // Get the code from user and call

                    //MFA is Disabled for this QuickStart. This may be submitted as an enhancement, if their are sufficient requests.
                    var mfaCode = '';

                    if (user.mfaCode == undefined){
                        res.status(200);
                        res.json({mfaRequired: true});
                        return;
                    }
                    cognitoUser.sendMFACode(mfaCode, this)

                },
                newPasswordRequired: function(userAttributes, requiredAttributes) {
                    // User was signed up by an admin and must provide new
                    // password and required attributes, if any, to complete
                    // authentication.
                    if (user.newPassword == undefined){
                        res.status(200);
                        res.json({newPasswordRequired: true});
                        return;
                    }
                    // These attributes are not mutable and should be removed from map.
                    delete userAttributes.email_verified;
                    delete userAttributes['custom:tenant_id'];
                    cognitoUser.completeNewPasswordChallenge(user.newPassword, userAttributes, this);
                }
            });
        }
        else {
            winston.error("Error Authenticating User: ", error);
            res.status(404);
            res.json(error);
        }
    });
});



// Start the servers
app.listen(configuration.port.auth);
console.log(configuration.name.auth + ' service started on port ' + configuration.port.auth);
