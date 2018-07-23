var fs = require('fs');
var aws = require('aws-sdk');
var myRepo;
var ecr = new aws.ECR({apiVersion: '2015-09-21', region: process.env.AWS_DEFAULT_REGION});
var params = {
};

var filePath = process.env.BUILD_FILE_PATH;
// var filePath = "./../app/source/product-manager/build.sh"
var newText;
var oldText = 'export REPOSITORY_URI=PLACEHOLDER';

ecr.describeRepositories(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else  {
        myRepo = data.repositories[0].repositoryUri;
        console.log(myRepo);

        var myVar;
        myVar = 'export REPOSITORY_URI=' + myRepo;
        newText = myVar;

        //Replacing now instead of creating new file
        // fs.appendFile('export-repository.sh', myVar, function (err) {
        //     if (err) throw err;
        //     console.log('Saved!');
        // });

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
});
