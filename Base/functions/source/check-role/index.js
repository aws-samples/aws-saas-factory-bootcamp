exports.handler = function(event, context) {
	console.log("check-role invoked:\n" + JSON.stringify(event));
	var response = require('cfn-response');
	var responseData = {};
	
	if ('Delete' == event.RequestType) {
		console.log("CloudFormation DELETE stack event. Skipping check role.");
		return response.send(event, context, response.SUCCESS, responseData);
	}
	if ('Create' == event.RequestType || 'Update' == event.RequestType) {
		var aws = require('aws-sdk');
		var iam = new aws.IAM();
		var params = {RoleName: event.ResourceProperties.RoleName};
		iam.getRole(params, function(err, data) {
			console.log("iam.getRole returned:\n" + JSON.stringify(err) + "\n\n" + JSON.stringify(data));
			if (err) {
				// IAM throws an error instead of returning NULL when it can't find the role
				if ('NoSuchEntity' == err.code) {
					responseData = {Role: ''};
					return response.send(event, context, response.SUCCESS, responseData);
				} else {
					responseData = {Error: 'iam.getRole failed for role ' + params.RoleName};
					console.log(responseData.Error, err);
					return response.send(event, context, response.FAILED, responseData);
				}
			} else {
				console.log("Success. Role " + params.RoleName + " exists");
				responseData = {Role: data.Role.Arn};
				return response.send(event, context, response.SUCCESS, responseData);
			}
		});
	}
};