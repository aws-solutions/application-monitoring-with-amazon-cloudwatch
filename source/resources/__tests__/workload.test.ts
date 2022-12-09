/**
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { App, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { WorkloadInfra } from "../lib/workload.infra";

describe("==Infrastructure==", () => {
  const app = new App();
  const stack = new Stack(app, "ParentStack");
  const apacheStack = new WorkloadInfra(stack, "Apache");
  const apacheTemplate = Template.fromStack(apacheStack);

  test("snapshot test", () => {
    expect(apacheTemplate.toJSON()).toMatchSnapshot();
  });

  test("has string list SSM parameter", () => {
    apacheTemplate.hasResourceProperties("AWS::SSM::Parameter", {
      Type: "StringList",
    });
  });

  test("has SQS queue", () => {
    apacheTemplate.hasResourceProperties("AWS::SQS::Queue", {
      KmsMasterKeyId: "alias/aws/sqs",
    });
  });

  test("has 4 lambda functions", () => {
    apacheTemplate.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs16.x",
      DeadLetterConfig: Match.objectLike({
        TargetArn: Match.objectLike(Match.anyValue),
      }),
    });
    apacheTemplate.resourceCountIs("AWS::Lambda::Function", 4);
  });

  test("IAM policy for tag handler", () => {
    apacheTemplate.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["ssm:PutParameter", "ssm:GetParameter"],
          }),
          Match.objectLike({
            Action: "ec2:DescribeTags",
          }),
        ]),
      },
    });
  });

  test("IAM policy for dashboard handler", () => {
    apacheTemplate.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "ssm:GetParameter",
          }),
          Match.objectLike({
            Action: ["cloudwatch:PutDashboard", "cloudwatch:DeleteDashboards"],
          }),
        ]),
      },
    });
  });

  test("CloudWatch Events rule for EC2 describe", () => {
    apacheTemplate.hasResourceProperties("AWS::Events::Rule", {
      ScheduleExpression: Match.stringLikeRegexp("rate*"),
    });
  });

  test("CloudWatch Events rule for put dashboard", () => {
    apacheTemplate.hasResourceProperties("AWS::Events::Rule", {
      EventPattern: Match.objectLike({
        source: ["aws.ssm"],
        "detail-type": ["Parameter Store Change"],
      }),
    });
  });
});
