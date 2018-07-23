'use strict';

// Declare library dependencies
const AWS = require('aws-sdk');

//Configure Environment
const configModule = require('../config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);
//Token Manager
const tokenManager = require('../token-manager/token-manager.js');

//Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;

//UUID Generator
const uuidV4 = require('uuid/v4');

/**
 * Create a CloudWatch Event
 * @param putRecordParams The params to pass a record into CloudWatch
 * @param {Promise} The response for the put record request
 * @param {credentials} The credentials required to push the request
 */
module.exports.putEvents = function (putRecordParams, credentials) {
        var promise = new Promise(function (resolve, reject) {
            var cloudwatchevents = new AWS.CloudWatchEvents(
                {
                    apiVersion: '2015-10-07',
                    sessionToken: credentials.claim.SessionToken,
                    accessKeyId: credentials.claim.AccessKeyId,
                    secretAccessKey: credentials.claim.SecretKey,
                    region: configuration.aws_region
                });
            var Payload = JSON.stringify(putRecordParams.Payload);
            var DetailType = "MeteringRecord";
            var Source = 'ProductManager';
            var params = {
                Entries: [/* required */
                    {
                        Detail: Payload,
                        DetailType: DetailType,
                        Source: Source,
                        Time: new Date()
                    },
                    /* more items */
                ]
            };
            cloudwatchevents.putEvents(params, function (err, data) {
                if (err) {
                    console.log('Error: Failed putEvent');
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log('Success: putEvent');
                    resolve(data);
                }
            });
        });
        return promise;
};

/**
 * Create a SQS Message
 * @param putRecordParams The params to pass a record into SQS
 * @param {Promise} The response for the put record request
 * @param {credentials} The credentials required to push the request
 */
module.exports.sendMessage = function (putRecordParams, credentials) {
        var promise = new Promise(function (resolve, reject) {
            var sqs = new AWS.SQS(
                {
                    apiVersion: '2012-11-05',
                    sessionToken: credentials.claim.SessionToken,
                    accessKeyId: credentials.claim.AccessKeyId,
                    secretAccessKey: credentials.claim.SecretKey,
                    region: configuration.aws_region
                });
            var Payload = JSON.stringify(putRecordParams.Payload);
            var params = {
                MessageBody: Payload, /* required */
                QueueUrl: configuration.queue_name //, /* required */
                // DelaySeconds: 0,
            };

            sqs.sendMessage(params, function (err, data) {
                if (err) {
                    console.log('Error: Failed sendMessage');
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log('Success: sendMessage');
                    resolve(data);
                }
            });
        });
        return promise;
};

/**
 * Put a Record into a Kinesis Stream
 * @param putRecordParams The params to pass a record into kinesis
 * @param {Promise} The response for the put record request
 * @param {credentials} The credentials required to push the request
 */
module.exports.putRecord = function (putRecordParams, credentials) {
        var promise = new Promise(function (resolve, reject) {
            var kinesis = new AWS.Kinesis(
                {
                    apiVersion: '2013-12-02',
                    sessionToken: credentials.claim.SessionToken,
                    accessKeyId: credentials.claim.AccessKeyId,
                    secretAccessKey: credentials.claim.SecretKey,
                    region: configuration.aws_region
                });
            var Data = JSON.stringify(putRecordParams.Payload);
            var params = {
                Data: Data /* Strings will be Base-64 encoded on your behalf */, /* required */
                PartitionKey: putRecordParams.Payload.Id, /* required */
                StreamName: configuration.stream_name, /* required */
                // ExplicitHashKey: putRecordParams.ExplicitHashKey,
                // SequenceNumberForOrdering: putRecordParams.SequenceNumberForOrdering
            };
            kinesis.putRecord(params, function (err, data) {
                if (err) {
                    console.log('Error: Failed putRecord');
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log('Success: putRecord');
                    resolve(data);
                }
            });
        });
        return promise;
};


/**
 * Create a SessionID
 */
module.exports.setService = function(ServiceName) {
    var service;
    if(!ServiceName){
        service = 'ProductManager';
        return service;
    }
    else{
        service = ServiceName;
        return service;
    }
}

/**
 * Create a SessionID
 */
module.exports.createSessionID = function(SessionID) {
    var session;
    if(!SessionID){
        session = uuidV4();
        return session;
    }
    else{
        session = SessionID;
        return session;
    }
}

/**
 * Create a RequestID
 */
module.exports.createRequestID = function(RequestID) {
    var request;
    if(!RequestID){
        request = uuidV4();
        return request;
    }
    else{
        request = RequestID;
        return request;
    }
}

/**
 * Initialize the creation of a new JSON Record used for Logging, Metering and Analytics
 * @param serviceParam - Distinct Name that identifies the MicroService
 * @param requestParam - The HTTP/HTTPS Request that will be mapped cleanly
 * @param credentials - The Credentials that are passed to create records in AWS services
 * @param error - The response from the function call(s) - error or success
 */
module.exports.Record = function (serviceParam, requestParam, credentials, error) {
    var RequestID = this.createRequestID();
    var SessionID = this.createSessionID();
    var TenantID = tokenManager.getTenantId(requestParam);
    var Service = this.setService(serviceParam);
    var Request = this.MapRequest(requestParam);
    var Context = this.MapContext(requestParam);
    var Error = this.HandleError(error);

    if(!RequestID && !SessionID && !TenantID && !Service && !Request && !Context){
    }
    else{
        var Record = this.createRecord(RequestID, TenantID, SessionID, Request, Context, Service, Error);
        if(Record == undefined || !Record){
            console.log('Create Record Error');
        }
        else{
            var params = {
                Payload: Record,
                Source: Service
            };
            this.putEvents(params, credentials);
            this.putRecord(params, credentials);
            this.sendMessage(params, credentials);
        }
    }
}

/**
 * Create a Record
 */
module.exports.createRecord = function(requestID, TenantID, SessionID, Request, Context, Service, Error){
    var Record = {
        "Id": requestID,
        "Tenant": TenantID,
        "Session": SessionID,
        "Request": Request,
        "Context": Context,
        "Date": new Date(),
        "Error": Error,
        "Service": Service //,
        // "Response": Response
    };
    return Record;
}

/**
 * Append a JSON Object to an Array
 * @param JSONPayload - A single JSON object
 */
module.exports.AggregatePayload = function (record, object) {
    record.push(object);
    return record;
}

/**
 * Map an HTTP/HTTPS Request to params for metering initial record
 * @param req - An http/https request
 */
module.exports.MapRequest = function (req) {
    //Code to map response
    var cleanedRequest = {};
    if (req) {
        cleanedRequest = {
            "App": req.app,
            "Path": req.path,
            "Method": req.method,
            "Body": req.body,
            "Cookies": req.cookies,
            "Hostname": req.hostname,
            "IP": req.ip,
            "OriginalURL": req.originalUrl,
            "BaseURL": req.baseUrl,
            "Params": req.params,
            "Protcol": req.protocol,
            "Query": req.query,
            "Route": req.route,
            "Secure": req.secure,
            "SignedCookie": req.signedCookies
        };
        return cleanedRequest;
    }
    else {
        console.log('REQUEST NOT CLEANED');
        return 'invalid request';
    }
}

/**
 * Handle Error
 * @param request - An http/https request
 */
module.exports.HandleError = function (error) {
    var Error;
    if (error) {
        console.log(error);
        Error = error;
        return Error;
    }
    else {
        Error = false;
        return Error;
    }
}
/**
 * Map an HTTP/HTTPS Request to request context
 * @param request - An http/https request
 */
module.exports.MapContext = function (req) {
    var decodedContext = {};
    var bearerToken = req.get('Authorization');
    var tokenValue = bearerToken.substring(bearerToken.indexOf(' ') + 1);
    if (tokenValue) {
        decodedContext = tokenManager.decodeToken(tokenValue)
    }
    //CLean up context here
    var cleanedContext = decodedContext;
    return cleanedContext;
}

/**
 * Map an HTTP/HTTPS Request to params for metering initial record
 * @param response - An http/https response
 */
module.exports.MapResponse = function (response) {
    //Code to map response - not neccesary for this demo
    var cleanedResponse;
    return cleanedResponse;
}
