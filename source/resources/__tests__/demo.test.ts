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
import { Template } from "aws-cdk-lib/assertions";
import { DemoConstruct } from "../lib/demo.infra";

describe("==Demo Infrastructure==", () => {
  const app = new App();
  const stack = new Stack(app, "Framework");
  new DemoConstruct(stack, "DemoInfra");

  const template = Template.fromStack(stack);
  test("snapshot test", () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

  test("demo infra has a vpc with internet gateway", () => {
    template.resourceCountIs("AWS::EC2::VPC", 1);
    template.resourceCountIs("AWS::EC2::InternetGateway", 1);
  });

  test("demo infra has a security group", () => {
    template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
  });
});
