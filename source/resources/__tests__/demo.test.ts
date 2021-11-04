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

import { App, Stack } from "@aws-cdk/core";
import { DemoConstruct } from "../lib/demo.infra";
import "@aws-cdk/assert/jest";
import { SynthUtils } from "@aws-cdk/assert";

describe("==Demo Infrastructure==", () => {
  const app = new App();
  const stack = new Stack(app, "Framework");
  new DemoConstruct(stack, "DemoInfra");
  test("snapshot test", () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  });

  test("demo infra has a vpc with internet gateway", () => {
    expect(stack).toHaveResource("AWS::EC2::VPC");
    expect(stack).toCountResources("AWS::EC2::VPC", 1);
    expect(stack).toHaveResource("AWS::EC2::InternetGateway");
  });

  test("demo infra has a security group", () => {
    expect(stack).toHaveResource("AWS::EC2::SecurityGroup");
    expect(stack).toCountResources("AWS::EC2::SecurityGroup", 1);
  });
});
