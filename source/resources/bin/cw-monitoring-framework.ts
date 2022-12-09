#!/usr/bin/env node

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

import { App, DefaultStackSynthesizer } from "aws-cdk-lib";
import { FrameworkInfra } from "../lib/framework.infra";
import { AppRegistryForSolution } from "../lib/app-registry/app-registry";

const app = new App();

// deploy framework infrastructure
const mainStack = new FrameworkInfra(app, "CW-Monitoring-Framework-Stack", {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});

new AppRegistryForSolution(mainStack, mainStack.stackId, {
  solutionId: app.node.tryGetContext("SOLUTION_ID"),
  solutionName: app.node.tryGetContext("SOLUTION_NAME"),
  solutionVersion: app.node.tryGetContext("SOLUTION_VERSION"),
  appRegistryApplicationName: app.node.tryGetContext("APP_REGISTRY_NAME"),
  applicationType: app.node.tryGetContext("APPLICATION_TYPE"),
  attributeGroupName: app.node.tryGetContext("ATTRIBUTE_GROUP_NAME"),
}).associateAppWithNestedStacks(mainStack.nestedStacks);
