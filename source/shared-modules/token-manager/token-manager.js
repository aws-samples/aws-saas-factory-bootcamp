'use strict';

// Declare library dependencies
const jwtDecode = require('jwt-decode');
const request = require('request');
const async = require('async');
const AWS = require('aws-sdk');

//Configure Environment
const configModule = require('../config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

//Configure Logging
const winston = require('winston');
winston.add(new winston.transports.Console({level: configuration.loglevel}));

// TODO: replace temporary cache with real cache
var tokenCache = {};

/**
 * Extract an id token from a request, decode it and extract the tenant
 * id from the token.
 * @param req A request
 * @returns A tenant Id
 */
module.exports.getTenantId = function(req) {
    var tenantId = '';
    var bearerToken = req.get('Authorization');
    if (bearerToken) {
        bearerToken = bearerToken.substring(bearerToken.indexOf(' ') + 1);
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken) {
            tenantId = decodedIdToken['custom:tenant_id'];
        }
    }
    return tenantId;
}

/**
 * Extract non PII info from Token
 * @param req A request
 * @returns JSON Object without PII
 */
module.exports.extractTokenData = function(req) {
    var tokenData;
    var bearerToken = req.get('Authorization');
    if (bearerToken) {
        bearerToken = bearerToken.substring(bearerToken.indexOf(' ') + 1);
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken){
            tokenData.TenantID = decodedIdToken['custom:tenant_id'];
            //Add Other Mappings Below
            //others such as sub, and non pii information
        }
    }
    return tokenData;
}

/**
 * Create a Unique Session ID
 * @returns Return a Unique String ID to pass as Session ID
 */
module.exports.generateSessionID = function() {
    const uuidV4 = require('uuid/v4');
    var sessionID = uuidV4();
    if(sessionID){
        return sessionID;
    }
}

/**
 * Extract an id token from a request, decode it and extract the user role
 * id from the token.
 * @param req A request
 * @returns A role
 */
module.exports.getUserRole = function(req, callback) {
    var bearerToken = req.get('Authorization');
    if (bearerToken) {
        bearerToken = bearerToken.substring(bearerToken.indexOf(' ') + 1);
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken)
            callback(decodedIdToken['custom:role']);
        else
            callback('unkown');
    }
}

/**
 * Decode and token and extract the user's full name from
 * the token.
 * @param idToken A bearer token
 * @returns The user's full name
 */
module.exports.getUserFullName = function(idToken) {
    var userFullName = '';
    if (idToken) {
        var decodedIdToken = jwtDecode(idToken);
        if (decodedIdToken)
            userFullName = {'firstName': decodedIdToken.given_name, 'lastName': decodedIdToken.family_name};
    }
    return userFullName;
}

/**
 * Get the authorization token from a request
 * @param req The request with the authorization header
 * @returns The user's email address
 */
module.exports.getRequestAuthToken = function(req) {
    authToken = '';
    var authHeader = req.get('Authorization');
    if (authHeader)
        var authToken = authHeader.substring(authHeader.indexOf(' ') + 1);
    return authToken;
}

/**
 * Decode and token and extract the token
 * @param bearerToken A bearer token
 * @returns The user's full name
 */
module.exports.decodeToken = function(bearerToken) {
    var resultToken = {};
    if (bearerToken) {
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken)
            resultToken = decodedIdToken;
    }
    return resultToken;
}

/**
 * Decode token and validate access
 * @param bearerToken A bearer token
 * @returns The users access is provided
 */
module.exports.checkRole = function(bearerToken) {
    var resultToken = {};
    if (bearerToken) {
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken)
            var resultToken = decodedIdToken['custom:role'];
    }
    return resultToken;

}

/**
 * Decode and token and extract the token
 * @param bearerToken A bearer token
 * @returns The user's full name
 */
module.exports.decodeOpenID = function(bearerToken) {
    var resultToken = {};
    if (bearerToken) {
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken)
            resultToken = decodedIdToken;
    }
    return resultToken;
}

/**
 * Get access credential from the passed in request
 * @param req A request
 * @returns The access credentials
 */
module.exports.getCredentialsFromToken = function(req, updateCredentials) {
    var bearerToken = req.get('Authorization');
    if (bearerToken) {
        var tokenValue = bearerToken.substring(bearerToken.indexOf(' ') + 1);
        if (!(tokenValue in tokenCache)) {
            var decodedIdToken = jwtDecode(tokenValue);
            var userName = decodedIdToken['cognito:username'];
            async.waterfall([
                function(callback) {
                    getUserPoolWithParams(userName, callback)
                },
                function(userPool, callback) {
                    authenticateUserInPool(userPool, tokenValue, callback)
                }
            ], function(error, results) {
                if (error) {
                    winston.error('Error fetching credentials for user')
                    updateCredentials(null);
                }
                else {
                    tokenCache[tokenValue] = results;
                    updateCredentials(results);
                }
            });
        }
        else if (tokenValue in tokenCache) {
            winston.debug('Getting credentials from cache');
            updateCredentials(tokenCache[tokenValue]);
        }
    }
};

/**
 * Lookup the user pool from a user name
 * @param user The username to lookup
 * @param callback Function called with found user pool
 */
module.exports.getUserPool = function(userName, callback) {
    // Create URL for user-manager request
    var userURL = configuration.url.user + '/pool/' + userName;
    request({
        url: userURL,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null, body);
        } else {
            if (!error) {
                var lookupError = new Error("Failed looking up user pool: " + response.body.Error);
                callback(lookupError, response);
            } else {
                callback(error, response)
            }
        }
    });
}

/**
 * Lookup the user pool from a user name
 * @param user The username to lookup
 * @param idToken Identity token
 * @return params object with user pool and idToken
 */
function getUserPoolWithParams(userName, callback) {

    var userURL   = configuration.url.user + '/pool/' + userName;
    // fire the request
    request({
        url: userURL,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null, body);
        } else {
            callback(null, "Error loading user: " + error);
        }
    });
}

/**
 * Lookup the user pool from a user name
 * @param user The username to lookup
 * @param callback Function called with found user pool
 */
module.exports.getInfra = function(input, callback) {
    // Create URL for user-manager request
    var tenantsUrl   = configuration.url.tenant + 's/system/';
    console.log(tenantsUrl);
    request({
        url: tenantsUrl,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null, body);
        } else {
            if (!error) {
                var lookupError = new Error("Failed looking up infra: " + response.body.Error);
                callback(lookupError, response);
            } else {
                callback(error, response)
            }
        }
    });
}

/**
 * Perform an HTTP Request
 * @param protocol sring
 * @param domain string
 * @param path string
 * @param method string
 * @param headers json object
 * @param json true/false
 * @return Fire off request and return result
 */
module.exports.fireRequest = function(event, callback) {

    var protocol = event.protocol;
    var path = event.path;
    var delimiter = '://';
    var domain = event.domain;
    var url = protocol + delimiter + domain + path;
    // fire the request
    request({
        url: url,
        method: event.method,
        json: true,
        headers: {
            "content-type": "application/json",
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(body);
        } else {
            callback(null, 'Error making request. \nError: ' + error);
        }
    });
};

/**
 * Authenticate the user in the user pool
 * @param userPool The pool to use for authentication
 * @param idToken The id token for this session
 * @param callback The callback for completion
 */
function authenticateUserInPool(userPool, idToken, callback) {
    var decodedIdToken = jwtDecode(idToken);
    var provider = decodedIdToken.iss;
    provider = provider.replace('https://', '');
    var params = {
        token: idToken,
        provider: provider,
        IdentityPoolId: userPool.IdentityPoolId
    }
    var getIdentity = getId(params, function (ret, data) {
        if (ret) {
            var params = {
                token: idToken,
                IdentityId: ret.IdentityId,
                provider: provider
            }
            var returnedIdentity = ret;
            var getCredentials = getCredentialsForIdentity(params, function (ret, data) {
                if (ret) {
                    var returnedCredentials = ret;

                    // put claim and user full name into one response
                    callback(null, {"claim": returnedCredentials.Credentials});
                } else {
                    winston.error('ret');
                }
            })
        } else {
            winston.error('ret');
        }
    })
}

/**
 * Get AWS Credentials with Cognito Federated Identity and ID Token
 * @param IdentityPoolId The Identity Pool ID
 * @param idToken The id token for this session
 * @param callback The callback for completion
 */
function getCredentialsForIdentity(event, callback) {
    var cognitoidentity = new AWS.CognitoIdentity({apiVersion: '2014-06-30',region: configuration.aws_region});
    var params = {
        IdentityId: event.IdentityId, /* required */
        //CustomRoleArn: 'STRING_VALUE',
        Logins: {
            [event.provider]: event.token,
            /* '<IdentityProviderName>': ... */
        }
    };
    cognitoidentity.getCredentialsForIdentity(params, function (err, data) {
        if (err) {
            winston.debug(err, err.stack);
            callback(err);
        } else {
            callback(data);
        }
    });
};

/**
 * Get Cognito Federated identity
 * @param IdentityPoolId The Identity Pool ID
 * @param AccountId The AWS Account Number
 * @param Logins Provider Map Provider : ID Token
 */
function getId(event, callback) {
    var cognitoidentity = new AWS.CognitoIdentity({apiVersion: '2014-06-30',region: configuration.aws_region});
    var params = {
        IdentityPoolId: event.IdentityPoolId, /* required */
        AccountId: configuration.aws_account,
        Logins: {
            [event.provider]: event.token,
            /* '<IdentityProviderName>': ... */
        }
    };
    cognitoidentity.getId(params, function (err, data) {
        if (err) {
            winston.debug(err, err.stack);
            callback(err);
        } else {
            callback(data);
        }
    });
};

/**
 * Perform an HTTP Request
 * @param protocol sring
 * @param domain string
 * @param path string
 * @param method string
 * @param headers json object
 * @param json true/false
 * @return Fire off request and return result
 */
function fireRequest(event, callback) {
    var protocol = event.protocol;
    var path = event.path;
    var delimiter = '://';
    var domain = event.domain;
    var url = protocol + delimiter + domain + path;
    // fire the request
    request({
        url: url,
        method: event.method,
        json: true,
        headers: {
            "content-type": "application/json",
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(body);
        } else {
            callback(null, 'Error making request. \nError: ' + error);
        }
    });
};

module.exports.getSystemCredentials = function(callback) {
        var sysCreds = '';
        var sysConfig = new AWS.Config();
        sysConfig.getCredentials(function(err) {
            if (err) {
                callback(err.stack);
                winston.debug('Unable to Obtain Credentials');
            } else{
                var tempCreds = sysConfig.credentials;
                if (tempCreds.metadata == undefined || tempCreds.metadata == null){
                    var credentials = {"claim": tempCreds};
                    callback(credentials);
                } else {
                    sysCreds = {
                        SessionToken: tempCreds.metadata.Token,
                        AccessKeyId: tempCreds.metadata.AccessKeyId,
                        SecretKey: tempCreds.metadata.SecretAccessKey,
                        Expiration: tempCreds.metadata.Expiration,
                    }
                    var credentials = {"claim": sysCreds};
                    callback(credentials);
                }
            }
        })
}
