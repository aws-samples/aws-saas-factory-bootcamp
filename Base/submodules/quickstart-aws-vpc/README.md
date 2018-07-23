# quickstart-aws-vpc

This Quick Start provides a networking foundation for AWS Cloud infrastructures. It deploys an Amazon Virtual Private Cloud (Amazon VPC) according to AWS best practices and guidelines.

The Amazon VPC architecture includes public and private subnets. The first set of private subnets share the default network access control list (ACL) from the Amazon VPC, and a second, optional set of private subnets include dedicated custom network ACLs per subnet. The Quick Start divides the Amazon VPC address space in a predictable manner across multiple Availability Zones, and deploys either NAT instances or NAT gateways, depending on the AWS Region you deploy the Quick Start in.

Deployment Guide: http://docs.aws.amazon.com/quickstart/latest/vpc/

![Quick Start VPC Design Architecture](https://docs.aws.amazon.com/quickstart/latest/vpc/images/quickstart-vpc-design-fullscreen.png)
