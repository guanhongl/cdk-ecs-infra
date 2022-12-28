import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs'; // Allows working with ECS resources
import * as ec2 from 'aws-cdk-lib/aws-ec2'; // Allows working with EC2 and VPC resources
import * as iam from 'aws-cdk-lib/aws-iam'; // Allows working with IAM resources
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'; // Helper to create ECS services with loadbalancers, and configure them

export class CdkEcsInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Look up the default VPC
    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    });

    // define which container to use, and how it should be configured

    // create an empty IAM role to attach to the task definition
    const taskIamRole = new iam.Role(this, "AppRole", {
      roleName: "AppRole",
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // specify a task definition type to deploy to Fargate
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'Task', {
      taskRole: taskIamRole,
    });

    // create a task definition to supply the container port, 
    // amount of cpu and memory it needs, and the container image to use
    taskDefinition.addContainer('MyContainer', {
    // build the container image provided with the sample application in SampleApp folder
    // CDK will build the container image using the Dockerfile in the SampleApp directory
      image: ecs.ContainerImage.fromRegistry('docker/getting-started'),
      portMappings: [{ containerPort: 80 }],
      memoryReservationMiB: 256,
      cpu : 256,
    });

    // set up the ECS cluster, define a service, create a load balancer, 
    // configure it to connect to the service, and set up the required security group rules
    // the ECS Pattern will configure the security group
    new ecsPatterns.ApplicationLoadBalancedFargateService(this, "MyApp", {
      vpc: vpc, // specify where to create all the resources
      taskDefinition: taskDefinition, // define which container image to deploy
      desiredCount: 1, // launch 1 copy of the container
      serviceName: 'MyWebApp',
      assignPublicIp: true, // allow public subnets
      publicLoadBalancer: true, // allow public access
    });
  }
}
