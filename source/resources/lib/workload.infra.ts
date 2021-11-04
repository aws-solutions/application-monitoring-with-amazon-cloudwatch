/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

/**
 * @description deploys the infrastructure for specific workloads
 * @author @aws-solutions
 */

import {
  Stack,
  CfnMapping,
  NestedStack,
  CfnParameter,
  NestedStackProps,
  Duration,
  CfnOutput,
  CustomResource,
} from "@aws-cdk/core";
import { ParameterTier, StringListParameter } from "@aws-cdk/aws-ssm";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { CfnFunction, Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { Queue, QueueEncryption } from "@aws-cdk/aws-sqs";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";
import {
  CfnPolicy,
  Effect,
  IRole,
  Policy,
  PolicyStatement,
} from "@aws-cdk/aws-iam";
import { LogLevel, manifest } from "./exports";
import { Provider } from "@aws-cdk/custom-resources";
import * as path from "path";

export class WorkloadInfra extends NestedStack {
  readonly account: string;
  readonly region: string;
  readonly partn: string;
  constructor(scope: Stack, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    const stack = Stack.of(this);
    this.account = stack.account; // Returns the AWS::AccountId for this stack (or the literal value if known)
    this.region = stack.region; // Returns the AWS::Region for this stack (or the literal value if known)
    this.partn = stack.partition; // Returns the AWS::Partition for this stack

    //=============================================================================================
    // Parameters
    //=============================================================================================
    const workload = new CfnParameter(this, "WorkloadName", {
      description: "Name of the workload",
      type: "String",
      allowedValues: ["Apache", "Nginx", "Puma"],
    });

    const tag = new CfnParameter(this, "TagSchema", {
      description:
        'EC2 tag schema to identify workload instances. for eg. {"Key":"CW-Dashboard","Value":"Apache"}',
      type: "String",
    });

    const dashboard = new CfnParameter(this, "DashboardName", {
      description:
        "Region will be appended to the name. for eg. ApacheDashboard-us-east-1",
      type: "String",
    });

    const accesslog = new CfnParameter(this, "AccessLogGroup", {
      description:
        "CloudWatch Log Group where instances push their access logs",
      type: "String",
    });

    const ssmparam = new CfnParameter(this, "SSMParameterName", {
      description: "SSM parameter used for maintaining workload instance list",
      type: "String",
    });

    //=============================================================================================
    // Metadata
    //=============================================================================================
    this.templateOptions.metadata = {
      "AWS::CloudFormation::Interface": {
        ParameterGroups: [
          {
            Label: { default: "Workload Configuration" },
            Parameters: [
              workload.logicalId,
              tag.logicalId,
              dashboard.logicalId,
              accesslog.logicalId,
              ssmparam.logicalId,
            ],
          },
        ],
        ParameterLabels: {
          [workload.logicalId]: {
            default: "Workload Name",
          },
          [tag.logicalId]: {
            default: "Tag Schema",
          },
          [dashboard.logicalId]: {
            default: "CW Dashboard Name",
          },
          [accesslog.logicalId]: {
            default: "Access Log Group",
          },
          [ssmparam.logicalId]: {
            default: "SSM Parameter Name",
          },
        },
      },
    };
    this.templateOptions.description = `(${manifest.solutionId}) - AWS CloudFormation template for deployment of the ${manifest.solutionName} workload infrastructure. Version ${manifest.solutionVersion}`;
    this.templateOptions.templateFormatVersion = manifest.templateVersion;

    //=============================================================================================
    // Map
    //=============================================================================================
    const map = new CfnMapping(this, "StackMap", {
      mapping: {
        Metric: {
          SendAnonymousMetric: manifest.sendMetric,
          MetricsEndpoint: manifest.metricsEndpoint, // aws-solutions metrics endpoint
        },
        Solution: {
          SolutionId: manifest.solutionId,
          SolutionVersion: manifest.solutionVersion,
        },
      },
    });

    //=============================================================================================
    // Resources
    //=============================================================================================
    /**
     * @description solution helper function
     */
    const helperFunction = new Function(this, "Helper", {
      description:
        "DO NOT DELETE - CloudWatch Monitoring Framework - helper function",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(
        `${path.dirname(__dirname)}/../services/helper/dist/helperFunction.zip`
      ),
      handler: "index.handler",
      memorySize: 512,
      environment: {
        METRICS_ENDPOINT: map.findInMap("Metric", "MetricsEndpoint"),
        SEND_METRIC: map.findInMap("Metric", "SendAnonymousMetric"),
        LOG_LEVEL: LogLevel.INFO, //change as needed
        CUSTOM_SDK_USER_AGENT: `AwsSolution/${map.findInMap(
          "Solution",
          "SolutionId"
        )}/${map.findInMap("Solution", "SolutionVersion")}`,
      },
    });

    /**
     * @description iam policy for helper function
     * @type {Policy}
     */
    const helperPolicy: Policy = new Policy(this, "helperPolicy", {
      roles: [helperFunction.role as IRole],
    });

    /**
     * @description iam policy statement for deleting dashboard
     * @type {PolicyStatement}
     */
    const h0: PolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "CWWrite",
      actions: ["cloudwatch:DeleteDashboards"],
      resources: [
        `arn:${this.partn}:cloudwatch::${this.account}:dashboard/${dashboard.valueAsString}-${this.region}`,
      ],
    });
    helperPolicy.addStatements(h0);

    /**
     * @description custom resource for helper functions
     * @type {Provider}
     */
    const helperProvider: Provider = new Provider(this, "helperProvider", {
      onEventHandler: helperFunction,
    });

    /**
     * Get UUID for deployment
     */
    const uuid = new CustomResource(this, "CreateUUID", {
      resourceType: "Custom::CreateUUID",
      serviceToken: helperProvider.serviceToken,
    });

    /**
     * Send launch data to aws-solutions
     */
    new CustomResource(this, "LaunchData", {
      resourceType: "Custom::LaunchData",
      serviceToken: helperProvider.serviceToken,
      properties: {
        SolutionId: map.findInMap("Solution", "SolutionId"), // solution id for the stack
        SolutionVersion: map.findInMap("Solution", "SolutionVersion"),
        SolutionUuid: uuid.getAttString("UUID"),
        Stack: `${workload.valueAsString}-Stack`,
      },
    });

    /**
     * Delete dashboard with delete
     */
    new CustomResource(this, "DeleteDeployment", {
      resourceType: "Custom::DeleteDeployment",
      serviceToken: helperProvider.serviceToken,
      properties: {
        DashboardName: `${dashboard.valueAsString}-${this.region}`,
      },
    });

    /**
     * @description SSM Parameter to maintain list of workload instances
     * @type {StringListParameter}
     */
    const ssmParameter: StringListParameter = new StringListParameter(
      this,
      "SSMParameter",
      {
        stringListValue: ["NOP"],
        parameterName: ssmparam.valueAsString,
        tier: ParameterTier.ADVANCED,
        simpleName: false,
      }
    );

    /**
     * @description dead letter queue for lambda
     * @type {Queue}
     */
    const dlq: Queue = new Queue(this, `dlq`, {
      encryption: QueueEncryption.KMS_MANAGED,
    });

    /**
     * @description lambda to handle workload tag events
     */
    const tagHandler = new Function(this, "TagHandler", {
      description: `DO NOT DELETE - CloudWatch Monitoring Framework - ${workload.valueAsString} tag handler function`,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(
        `${path.dirname(__dirname)}/../services/tagHandler/dist/tagHandler.zip`
      ),
      handler: "index.handler",
      memorySize: 512,
      environment: {
        METRICS_ENDPOINT: map.findInMap("Metric", "MetricsEndpoint"),
        SEND_METRIC: map.findInMap("Metric", "SendAnonymousMetric"),
        LOG_LEVEL: LogLevel.INFO, //change as needed
        SSM_PARAMETER: ssmParameter.parameterName,
        TAG_SCHEMA: tag.valueAsString,
        CUSTOM_SDK_USER_AGENT: `AwsSolution/${map.findInMap(
          "Solution",
          "SolutionId"
        )}/${map.findInMap("Solution", "SolutionVersion")}`,
      },
      deadLetterQueue: dlq,
    });

    /**
     * @description iam policy for tag handler role
     * @type {Policy}
     */
    const po: Policy = new Policy(this, "tagHandlerPolicy", {
      roles: [tagHandler.role as IRole],
    });

    /**
     * @description iam policy statement for read/write ssm parameter
     * @type {PolicyStatement}
     */
    const po0: PolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "SSMWrite",
      actions: ["ssm:PutParameter", "ssm:GetParameter"],
      resources: [ssmParameter.parameterArn],
    });
    po.addStatements(po0);

    /**
     * @description iam policy statement for reading instance tags
     * @type {PolicyStatement}
     */
    const po1: PolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "EC2Describe",
      actions: ["ec2:DescribeTags"],
      resources: ["*"],
    });
    po.addStatements(po1);

    /**
     * @description lambda for dashboard CRUD operations
     */
    const dashboardHandler = new Function(this, "DashboardHandler", {
      description: `DO NOT DELETE - CloudWatch Monitoring Framework - ${workload.valueAsString} dashboard handler function`,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(
        `${path.dirname(
          __dirname
        )}/../services/dashboardHandler/dist/dashboardHandler.zip`
      ),
      handler: "index.handler",
      memorySize: 512,
      environment: {
        METRICS_ENDPOINT: map.findInMap("Metric", "MetricsEndpoint"),
        SEND_METRIC: map.findInMap("Metric", "SendAnonymousMetric"),
        LOG_LEVEL: LogLevel.INFO, //change as needed
        SSM_PARAMETER: ssmParameter.parameterName,
        ACCESS_LOG_GROUP: accesslog.valueAsString,
        DASHBOARD_NAME: `${dashboard.valueAsString}-${this.region}`,
        TAG_SCHEMA: tag.valueAsString,
        WORKLOAD: workload.valueAsString, // env variable to identify workload
        START_TIME: "-PT12H",
        CUSTOM_SDK_USER_AGENT: `AwsSolution/${map.findInMap(
          "Solution",
          "SolutionId"
        )}/${map.findInMap("Solution", "SolutionVersion")}`,
      },
      deadLetterQueue: dlq,
    });

    /**
     * @description iam policy for dashboard handler role
     * @type {Policy}
     */
    const dh: Policy = new Policy(this, "dashboardHandlerPolicy", {
      roles: [dashboardHandler.role as IRole],
    });

    /**
     * @description iam policy statement for reading ssm parameter
     * @type {PolicyStatement}
     */
    const dh0: PolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "SSMRead",
      actions: ["ssm:GetParameter"],
      resources: [ssmParameter.parameterArn],
    });
    dh.addStatements(dh0);

    /**
     * @description iam policy statement for putting/deleting dashboard
     * @type {PolicyStatement}
     */
    const dh1: PolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "CWWrite",
      actions: ["cloudwatch:PutDashboard", "cloudwatch:DeleteDashboards"],
      resources: [
        `arn:${this.partn}:cloudwatch::${this.account}:dashboard/${dashboard.valueAsString}-${this.region}`,
      ],
    });
    dh.addStatements(dh1);

    /**
     * @description Events Rule for SSM Parameter update
     * @type {Rule}
     */
    new Rule(this, `SSMRule`, {
      ruleName: `${workload.valueAsString}-SSMRule`,
      eventPattern: {
        source: ["aws.ssm"],
        detailType: ["Parameter Store Change"],
        detail: {
          name: [ssmParameter.parameterName],
        },
      },
      targets: [new LambdaFunction(dashboardHandler)],
    });

    /**
     * @description Events Rule for EC2 Tag update
     * @type {Rule}
     */
    new Rule(this, `EC2TagRule`, {
      ruleName: `${workload.valueAsString}-EC2TagRule`,
      schedule: Schedule.rate(Duration.minutes(5)),
      targets: [new LambdaFunction(tagHandler)],
    });

    //=============================================================================================
    // cfn_nag suppress rules
    //=============================================================================================
    const _po = po.node.findChild("Resource") as CfnPolicy;
    _po.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W12",
            reason:
              "* is required for ec2:DescribeTags, as it does not support resource level permissions",
          },
        ],
      },
    };

    const tH = tagHandler.node.findChild("Resource") as CfnFunction;
    tH.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W58",
            reason:
              "CloudWatch logs write permissions added with managed role AWSLambdaBasicExecutionRole",
          },
          {
            id: "W89",
            reason: "Not valid use case to deploy Lambda in VPC",
          },
          {
            id: "W92",
            reason: "Not valid use case for ReservedConcurrentExecutions",
          },
        ],
      },
    };

    const dH = dashboardHandler.node.findChild("Resource") as CfnFunction;
    dH.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W58",
            reason:
              "CloudWatch logs write permissions added with managed role AWSLambdaBasicExecutionRole",
          },
          {
            id: "W89",
            reason: "Not valid use case to deploy Lambda in VPC",
          },
          {
            id: "W92",
            reason: "Not valid use case for ReservedConcurrentExecutions",
          },
        ],
      },
    };

    const hF = helperFunction.node.findChild("Resource") as CfnFunction;
    hF.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W58",
            reason:
              "CloudWatch logs write permissions added with managed role AWSLambdaBasicExecutionRole",
          },
          {
            id: "W89",
            reason: "Not valid use case to deploy Lambda in VPC",
          },
          {
            id: "W92",
            reason: "Not valid use case for ReservedConcurrentExecutions",
          },
        ],
      },
    };

    const hpP = helperProvider.node.children[0].node.findChild(
      "Resource"
    ) as CfnFunction;
    hpP.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W58",
            reason:
              "CloudWatch logs write permissions added with managed role AWSLambdaBasicExecutionRole",
          },
          {
            id: "W89",
            reason: "Not valid use case to deploy Lambda in VPC",
          },
          {
            id: "W92",
            reason: "Not valid use case for ReservedConcurrentExecutions",
          },
        ],
      },
    };

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "UUID", {
      description: "UUID for deployment",
      value: uuid.getAttString("UUID"),
    });
    new CfnOutput(this, `Dashboard`, {
      description: `CloudWatch Dashboard for the workload`,
      value: `${dashboard.valueAsString}-${this.region}`,
    });
  }
}
