//This will not compile natively in lambda and requires an NPM Install prior, and then must be zipped.
var response = require('cfn-response');
exports.handler = function(event, context) {
    console.log('REQUEST RECEIVED:\n', JSON.stringify(event));
    if (event.RequestType == 'Delete') {
        console.log('STACK DELETED');
        response.send(event, context, response.SUCCESS);
        return;
    }
    if (event.RequestType == 'Create') {
        console.log('STACK CREATE');
        var aws = require('aws-sdk');
        var iam = new aws.IAM({apiVersion: '2010-05-08'});
        var params = {
            PolicyArn: event.ResourceProperties.PolicyArn,
            UserName: event.ResourceProperties.UserName
        };
        iam.attachUserPolicy(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                response.send(event, context, response.FAILED);
            } // an error occurred
            else {
                var responseData = data;
                console.log(data);           // successful response
                response.send(event, context, response.SUCCESS, responseData);
            }
        });
        return;
    }
    if (event.RequestType == 'Update') {
        console.log('STACK UPDATE');
        //CODE REQUIRED FOR STACK UPDATE
        response.send(event, context, response.SUCCESS);
        return;
    }
    var stackName = event.ResourceProperties.StackName;
    var responseData = {};
    if (stackName) {
        var aws = require('aws-sdk');
        var cfn = new aws.CloudFormation();
        cfn.describeStacks({StackName: stackName}, function(err, data) {
            if (err) {
                responseData = {Error: 'DescribeStacks call failed'};
                console.log(responseData.Error + ':\n', err);
                response.send(event, context, response.FAILED, responseData);
            }
            else {
                data.Stacks[0].Parameters.forEach(function(param) {
                    responseData[param.ParameterKey] = param.ParameterValue;
                });
                response.send(event, context, response.SUCCESS, responseData);
            }
        });
    } else {
        responseData = {Error: 'Stack name not specified'};
        console.log(responseData.Error);
        response.send(event, context, response.FAILED, responseData);
    }
};
