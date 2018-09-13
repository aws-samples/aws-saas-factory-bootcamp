var aws = require('aws-sdk');
//var fs = require('fs');

var service_name;
if (process.env.SERVICE_NAME) {
	service_name = process.env.SERVICE_NAME;
} else {
	service_name = "product-manager";
}

var region;
if (process.env.AWS_DEFAULT_REGION) {
	region = process.env.AWS_DEFAULT_REGION;
} else {
	region = 'us-east-1';
}
var ecs = new aws.ECS({apiVersion: '2014-11-13', region: region});
var cloudformation = new aws.CloudFormation({apiVersion: '2010-05-15', region: region});
var ecs_cluster;

//var filePath = "./tasks.json";
//var jsonArray = [];

var params = {
	StackName: 'module-saas-bootcamp-base'
};
cloudformation.describeStacks(params, function (err, data) {
	if (err)
		console.log(err, err.stack); // an error occurred
	else {
		// console.log(data.Stacks[0].Outputs);
		var Outputs = data.Stacks[0].Outputs;
		for (i = 0; i < Outputs.length; i++) {
			if ("ECSCLUSTER" === Outputs[i].OutputKey) {
				ecs_cluster = Outputs[i].OutputValue;
				break;
			}
		}
		console.log("Found ECS Cluster " + ecs_cluster);
		var params = {
			cluster: ecs_cluster
		};
		ecs.listTasks(params, function (err, data) {
			if (err) {
				console.log(err, err.stack); // an error occurred
			} else {
				// console.log(data);
				var params = {
					tasks: data.taskArns,
					cluster: ecs_cluster
				};
				ecs.describeTasks(params, function (err, data) {
					if (err) {
						console.log(err, err.stack); // an error occurred
					} else {
						var tasks = data.tasks;
						for (var i = 0; i < tasks.length; i++) {
							var taskName = tasks[i].containers[0].name;
							var taskArn = tasks[i].containers[0].taskArn;
							console.log("Stopping task " + taskName + " in service " + service_name);
//							jsonArray.push({"TaskName": taskName, "TaskArn": taskArn});
							if (taskName === service_name) {
								var params = {
									task: taskArn, /* required */
									cluster: ecs_cluster
									// reason: 'STRING_VALUE'
								};
								ecs.stopTask(params, function (err, data) {
									if (err) {
										console.log(err, err.stack); // an error occurred
									} else {
										console.log(data);
									}
								});
								break;
							}
						}
					}
				});
			}
		});
	}
});
