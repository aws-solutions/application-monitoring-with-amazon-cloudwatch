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

/**
 * @description deploys the shared infrastructure for CloudWatch Monitoring Framework
 * @author @aws-solutions
 */

import {
  Stack,
  App,
  CfnParameter,
  CfnOutput,
  CfnCondition,
  Fn,
  NestedStack,
} from "@aws-cdk/core";
import { ApacheInfra } from "./apache/apache.infra";
import { ApacheDemo } from "./apache/apache.demo";
import { manifest } from "./exports";

export class FrameworkInfra extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);

    //=============================================================================================
    // Parameters
    //=============================================================================================
    const apacheDeploy = new CfnParameter(this, "ApacheWorkload", {
      type: "String",
      allowedValues: ["Yes", "No"],
      default: "Yes",
    });

    const apacheTagSchema = new CfnParameter(this, "ApacheTagSchema", {
      description: "Tagging Schema to identify apache workload instances",
      type: "String",
      default: '{"Key":"CW-Dashboard","Value":"Apache"}',
    });

    const apacheDemo = new CfnParameter(this, "ApacheDemoInstance", {
      description: "Do you want to deploy apache workload demo instance?",
      type: "String",
      allowedValues: ["Yes", "No"],
      default: "Yes",
    });

    //=============================================================================================
    // Metadata
    //=============================================================================================
    this.templateOptions.metadata = {
      "AWS::CloudFormation::Interface": {
        ParameterGroups: [
          {
            Label: {
              default:
                "Do you want to deploy CloudWatch dashboard to monitor Apache workload?",
            },
            Parameters: [
              apacheDeploy.logicalId,
              apacheTagSchema.logicalId,
              apacheDemo.logicalId,
            ],
          },
        ],
        ParameterLabels: {
          [apacheDeploy.logicalId]: {
            default: "Deploy",
          },
          [apacheTagSchema.logicalId]: {
            default: "Apache Tagging Schema",
          },
          [apacheDemo.logicalId]: {
            default: "Apache Demo Instance",
          },
        },
      },
    };
    this.templateOptions.description = `(${manifest.solutionId}) - The AWS CloudFormation template for deployment of the ${manifest.solutionName}. Version ${manifest.solutionVersion}`;
    this.templateOptions.templateFormatVersion = manifest.templateVersion;

    //=============================================================================================
    // Condition
    //=============================================================================================
    const apacheCheck = new CfnCondition(this, "apacheCheck", {
      expression: Fn.conditionEquals(apacheDeploy.valueAsString, "Yes"),
    });
    const apacheDemoCheck = new CfnCondition(this, "apacheDemoCheck", {
      expression: Fn.conditionAnd(
        Fn.conditionEquals(apacheDemo.valueAsString, "Yes"),
        Fn.conditionEquals(apacheDeploy.valueAsString, "Yes")
      ),
    });

    //=============================================================================================
    // Resources
    //=============================================================================================
    /**
     * @description Apache stack
     * @type {NestedStack}
     */
    const apacheStack: NestedStack = new ApacheInfra(this, "Apache-Stack", {
      parameters: {
        ["TagSchema"]: apacheTagSchema.valueAsString,
      },
    });
    apacheStack.nestedStackResource!.cfnOptions.condition = apacheCheck;

    /**
     * @description Apache Demo stack
     * @type {NestedStack}
     */
    const apacheDemoStack: NestedStack = new ApacheDemo(
      this,
      "Apache-Demo-Stack"
    );
    apacheDemoStack.nestedStackResource!.cfnOptions.condition = apacheDemoCheck;

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "Deploy Apache", {
      description: "Should the framework deploy dashboard for Apache workload?",
      value: apacheDeploy.valueAsString,
    });
  }
}
