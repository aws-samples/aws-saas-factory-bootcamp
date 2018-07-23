var fs = require('fs');
var aws = require('aws-sdk');
var region;
if(process.env.AWS_DEFAULT_REGION){
    region = process.env.AWS_DEFAULT_REGION;
}
else{
    region = 'us-east-1';
}
var cloudformation = new aws.CloudFormation({apiVersion: '2010-05-15', region: region});
if(process.env.CLUSTER_BUILD_FILE_PATH)
{
    filePath = process.env.CLUSTER_BUILD_FILE_PATH;
}
else{
    filePath = "./deploy.sh";
}

var newText;
var oldText = 'ECS_CLUSTER=PLACEHOLDER';
var params = {
    StackName: 'module-saas-bootcamp-base'
};
cloudformation.describeStacks(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else  {
        // console.log(data.Stacks[0].Outputs);
        var Outputs = data.Stacks[0].Outputs;
        for(i=0;i<Outputs.length;i++){
            if(Outputs[i].OutputKey == "ECSCLUSTER"){
                var ecs_cluster = Outputs[i].OutputValue;
                newText = 'export ECS_CLUSTER=' + ecs_cluster;
                fs.readFile(filePath, 'utf8', function(err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    var result = data.replace(oldText,newText);
                    fs.writeFile(filePath, result, 'utf8', function(err) {
                        if (err) {
                            return console.log(err);
                        };
                    });
                });
            }
        }
    }
});