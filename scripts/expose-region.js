var fs = require('fs');
var region;
if(process.env.AWS_DEFAULT_REGION){
    region = process.env.AWS_DEFAULT_REGION;
}
else{
    region = 'us-east-1';
}
// var filePath = "./../app/source/user-manager/build.sh"
var filePath = process.env.BUILD_FILE_PATH;
var newText = region;
var oldText = 'export AWS_DEFAULT_REGION=PLACEHOLDER';


        var myVar;
        myVar = 'export AWS_DEFAULT_REGION=' + newText;
        newText = myVar;

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
