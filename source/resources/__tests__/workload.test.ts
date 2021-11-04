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

import "@aws-cdk/assert/jest";
import { App, Stack } from "@aws-cdk/core";
import { WorkloadInfra } from "../lib/workload.infra";
import {
  anything,
  arrayWith,
  objectLike,
  stringLike,
  SynthUtils,
} from "@aws-cdk/assert";

describe("==Infrastructure==", () => {
  const app = new App();
  const stack = new Stack(app, "ParentStack");
  const apacheStack = new WorkloadInfra(stack, "Apache");

  test("snapshot test", () => {
    expect(SynthUtils.toCloudFormation(apacheStack)).toMatchSnapshot();
  });

  test("has string list SSM parameter", () => {
    expect(apacheStack).toHaveResource("AWS::SSM::Parameter", {
      Type: "StringList",
    });
  });

  test("has SQS queue", () => {
    expect(apacheStack).toHaveResource("AWS::SQS::Queue", {
      KmsMasterKeyId: "alias/aws/sqs",
    });
  });

  test("has 4 lambda functions", () => {
    expect(apacheStack).toHaveResourceLike("AWS::Lambda::Function", {
      Runtime: "nodejs14.x",
      DeadLetterConfig: objectLike({ TargetArn: anything() }),
    });
    expect(apacheStack).toCountResources("AWS::Lambda::Function", 4);
  });

  test("IAM policy for tag handler", () => {
    expect(apacheStack).toHaveResourceLike("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: arrayWith(
          objectLike({
            Action: "ec2:DescribeTags",
          }),
          objectLike({
            Action: ["ssm:PutParameter", "ssm:GetParameter"],
          })
        ),
      },
    });
  });

  test("IAM policy for dashboard handler", () => {
    expect(apacheStack).toHaveResourceLike("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: arrayWith(
          objectLike({
            Action: ["cloudwatch:PutDashboard", "cloudwatch:DeleteDashboards"],
          }),
          objectLike({
            Action: "ssm:GetParameter",
          })
        ),
      },
    });
  });

  test("CloudWatch Events rule for EC2 describe", () => {
    expect(apacheStack).toHaveResource("AWS::Events::Rule", {
      ScheduleExpression: stringLike("rate*"),
    });
  });

  test("CloudWatch Events rule for put dashboard", () => {
    expect(apacheStack).toHaveResource("AWS::Events::Rule", {
      EventPattern: objectLike({
        source: ["aws.ssm"],
        "detail-type": ["Parameter Store Change"],
      }),
    });
  });
});
