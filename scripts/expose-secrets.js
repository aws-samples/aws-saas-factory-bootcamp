var fs = require('fs');
var aws = require('aws-sdk');
var os = require('os');
var region;
if(process.env.AWS_DEFAULT_REGION){
    region = process.env.AWS_DEFAULT_REGION;
}
else{
    region = 'us-east-1';
}
// var myRepo;
var cloudformation = new aws.CloudFormation({apiVersion: '2010-05-15', region: region});

var filePath = "/home/ec2-user/.aws/credentials-new"
// var filePath = "test.txt"

var aws_access_key_id;
var aws_secret_access_key;

var params = {
    StackName: 'module-saas-bootcamp-base'
};
cloudformation.describeStacks(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else  {
        // console.log(data.Stacks[0].Outputs);
        var Outputs = data.Stacks[0].Outputs;
        for(i=0;i<Outputs.length;i++){
            if(Outputs[i].OutputKey == "ACCESSKEYID"){
                var aws_access_key_id = Outputs[i].OutputValue;
                console.log(Outputs[i]);
            }
            if(Outputs[i].OutputKey == "SECRETACCESSKEY"){
                var aws_secret_access_key = Outputs[i].OutputValue;
                console.log(Outputs[i]);
            }
        }
        fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) {
                return console.log(err);
            }
            else{
                var lines;
                var line1 = "[default]" + os.EOL;
                var line2 = "aws_access_key_id=" + aws_access_key_id + os.EOL;
                var line3 = "aws_secret_access_key=" + aws_secret_access_key + os.EOL;
                var line4 = "region=" + process.env.AWS_DEFAULT_REGION;
                lines = [line1, line2, line3, line4];
                console.log(lines);

                for(i=0;i<lines.length;i++){
                    var line = lines[i];
                    fs.appendFile(filePath, line, function (err) {
                        if (err) return console.log(err);
                    });
                }
            }

        });
    }
});
