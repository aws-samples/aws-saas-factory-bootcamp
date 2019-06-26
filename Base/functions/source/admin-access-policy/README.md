# Attach Managed Policy
## Documentation
###Purpose
This Custom CloudFormation Resource attaches a Managed IAM policy to an existing IAM user.
###Steps
1. Install Node Packages via "npm install"
2. Zip All Files into an Archive
3. Upload Zip Package to S3
4. Navigate to CloudFormation
5. Create a Stack using the cloudformation.template file
5. Enter the S3 Bucket Name, Prefix, and Object Name of the Zip Archive
6. Follow through CloudFormation and Create Stack
7. View outputs of Stack to see the Request ID