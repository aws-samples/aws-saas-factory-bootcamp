//This will not compile natively in lambda and requires an NPM Install prior, and then must be zipped.
var response = require('cfn-response');
exports.handler = function(event, context) {
    console.log('REQUEST RECEIVED:\n', JSON.stringify(event));
    if (event.RequestType == 'Delete') {
        console.log('STACK DELETE');
    }
    if (event.RequestType == 'Create') {
        var ecs_cluster = event.ResourceProperties.Cluster;
        console.log('STACK CREATE');
        var aws = require('aws-sdk');
        var ecs = new aws.ECS({apiVersion: '2014-11-13'});
        var params = {
            cluster: ecs_cluster
        };
        ecs.listTasks(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     {
                // console.log(data);
                var params = {
                    tasks: data.taskArns,
                    cluster: ecs_cluster
                };
                ecs.describeTasks(params, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                    } // an error occurred
                    else     {
                        var tasks = data.tasks;
                        for(i=0;i<tasks.length;i++){
                            var taskName = tasks[i].containers[0].name;
                            var taskArn = tasks[i].containers[0].taskArn;
                            jsonArray.push({"TaskName": taskName, "TaskArn" : taskArn});
                            if(taskName == service_name){
                                var params = {
                                    task: taskArn, //, /* required */
                                    cluster: ecs_cluster
                                    // reason: 'STRING_VALUE'
                                };
                                ecs.stopTask(params, function(err, data) {
                                    if (err) {
                                        console.log(err, err.stack);
                                        response.send(event, context, response.FAILED);
                                    } // an error occurred
                                    else  {
                                        console.log(data);
                                        response.send(event, context, response.SUCCESS);

                                    }
                                });
                            }

                        }
                    }
                });
            }
            return;
    })
    }
    if (event.RequestType == 'Update') {
        console.log('STACK UPDATE');
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
