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
  CfnResource,
} from "@aws-cdk/core";
import { WorkloadInfra } from "./workload.infra";
import { ApacheDemo } from "./apache/apache.demo";
import { NginxDemo } from "./nginx/nginx.demo";
import { PumaDemo } from "./puma/puma.demo";
import { manifest, Workload } from "./exports";

export class FrameworkInfra extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);

    //=============================================================================================
    // Parameters
    //=============================================================================================
    const apacheTagSchema = new CfnParameter(this, "ApacheTagSchema", {
      description:
        "Tagging Schema to identify apache workload instances. Leave empty if you don't want to monitor apache workload.",
      type: "String",
      default: '{"Key":"CW-Dashboard","Value":"Apache"}',
      allowedPattern:
        '^$|^[{]"Key":"[A-Za-z0-9-$#@*]*","Value":"[A-Za-z0-9-$#@*]*"}$',
      constraintDescription: "Must match AllowedPattern",
    });

    const apacheDemo = new CfnParameter(this, "ApacheDemoInstance", {
      description: "Do you want to deploy apache workload demo instance?",
      type: "String",
      allowedValues: ["Yes", "No"],
      default: "Yes",
    });

    const pumaTagSchema = new CfnParameter(this, "PumaTagSchema", {
      description:
        "Tagging Schema to identify puma workload instances. Leave empty if you don't want to monitor puma workload.",
      type: "String",
      default: '{"Key":"CW-Dashboard","Value":"Puma"}',
      allowedPattern:
        '^$|^[{]"Key":"[A-Za-z0-9-$#@*]*","Value":"[A-Za-z0-9-$#@*]*"}$',
      constraintDescription: "Must match AllowedPattern",
    });

    const pumaDemo = new CfnParameter(this, "PumaDemoInstance", {
      description: "Do you want to deploy puma workload demo instance?",
      type: "String",
      allowedValues: ["Yes", "No"],
      default: "Yes",
    });

    const nginxTagSchema = new CfnParameter(this, "NginxTagSchema", {
      description:
        "Tagging Schema to identify nginx workload instances. Leave empty if you don't want to monitor nginx workload.",
      type: "String",
      default: '{"Key":"CW-Dashboard","Value":"Nginx"}',
      allowedPattern:
        '^$|^[{]"Key":"[A-Za-z0-9-$#@*]*","Value":"[A-Za-z0-9-$#@*]*"}$',
      constraintDescription: "Must match AllowedPattern",
    });

    const nginxDemo = new CfnParameter(this, "NginxDemoInstance", {
      description: "Do you want to deploy nginx workload demo instance?",
      type: "String",
      allowedValues: ["Yes", "No"],
      default: "Yes",
    });

    // assigning to local variables
    Workload.Apache.TagSchema = apacheTagSchema.valueAsString;
    Workload.Nginx.TagSchema = nginxTagSchema.valueAsString;
    Workload.Puma.TagSchema = pumaTagSchema.valueAsString;

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
            Parameters: [apacheTagSchema.logicalId, apacheDemo.logicalId],
          },
          {
            Label: {
              default:
                "Do you want to deploy CloudWatch dashboard to monitor Puma workload?",
            },
            Parameters: [pumaTagSchema.logicalId, pumaDemo.logicalId],
          },
          {
            Label: {
              default:
                "Do you want to deploy CloudWatch dashboard to monitor Nginx workload?",
            },
            Parameters: [nginxTagSchema.logicalId, nginxDemo.logicalId],
          },
        ],
        ParameterLabels: {
          [apacheTagSchema.logicalId]: {
            default: "Apache Tagging Schema",
          },
          [apacheDemo.logicalId]: {
            default: "Apache Demo Instance",
          },
          [pumaTagSchema.logicalId]: {
            default: "Puma Tagging Schema",
          },
          [pumaDemo.logicalId]: {
            default: "Puma Demo Instance",
          },
          [nginxTagSchema.logicalId]: {
            default: "Nginx Tagging Schema",
          },
          [nginxDemo.logicalId]: {
            default: "Nginx Demo Instance",
          },
        },
      },
    };
    this.templateOptions.description = `(${manifest.solutionId}) - AWS CloudFormation template for deployment of the ${manifest.solutionName}. Version ${manifest.solutionVersion}`;
    this.templateOptions.templateFormatVersion = manifest.templateVersion;

    //=============================================================================================
    // Condition
    //=============================================================================================
    const apacheDeployCheck = new CfnCondition(this, "ApacheDeployCheck", {
      expression: Fn.conditionNot(
        Fn.conditionEquals(apacheTagSchema.valueAsString, "")
      ),
    });

    const apacheDemoCheck = new CfnCondition(this, "apacheDemoCheck", {
      expression: Fn.conditionAnd(
        Fn.conditionEquals(apacheDemo.valueAsString, "Yes"),
        apacheDeployCheck
      ),
    });

    //Puma condition
    const pumaDeployCheck = new CfnCondition(this, "PumaDeployCheck", {
      expression: Fn.conditionNot(
        Fn.conditionEquals(pumaTagSchema.valueAsString, "")
      ),
    });

    const pumaDemoCheck = new CfnCondition(this, "PumaDemoCheck", {
      expression: Fn.conditionAnd(
        Fn.conditionEquals(pumaDemo.valueAsString, "Yes"),
        pumaDeployCheck
      ),
    });

    //Nginx condition
    const nginxDeployCheck = new CfnCondition(this, "NginxDeployCheck", {
      expression: Fn.conditionNot(
        Fn.conditionEquals(nginxTagSchema.valueAsString, "")
      ),
    });

    const nginxDemoCheck = new CfnCondition(this, "NginxDemoCheck", {
      expression: Fn.conditionAnd(
        Fn.conditionEquals(nginxDemo.valueAsString, "Yes"),
        nginxDeployCheck
      ),
    });

    // assigning to local variable
    Workload.Apache.DeployCheck = apacheDeployCheck;
    Workload.Nginx.DeployCheck = nginxDeployCheck;
    Workload.Puma.DeployCheck = pumaDeployCheck;

    //=============================================================================================
    // Resources
    //=============================================================================================
    /**
     * @description workload infrastructure stacks
     * @type {NestedStack}
     */
    Object.keys(Workload).forEach((identifier) => {
      const stack = new WorkloadInfra(this, `${identifier}-Stack`, {
        parameters: {
          ["WorkloadName"]: identifier,
          ["TagSchema"]: Workload[identifier].TagSchema as string,
          ["DashboardName"]: Workload[identifier].DashboardName,
          ["AccessLogGroup"]: Workload[identifier].AccessLog,
          ["SSMParameterName"]: Workload[identifier].SSMParameter,
        },
      });
      (stack.nestedStackResource as CfnResource).cfnOptions.condition =
        Workload[identifier].DeployCheck;
    });

    /**
     * @description Apache Demo stack
     * @type {NestedStack}
     */
    const apacheDemoStack: NestedStack = new ApacheDemo(
      this,
      "Apache-Demo-Stack"
    );
    (apacheDemoStack.nestedStackResource as CfnResource).cfnOptions.condition =
      apacheDemoCheck;

    /**
     * @description Nginx Demo stack
     * @type {NestedStack}
     */
    const nginxDemoStack: NestedStack = new NginxDemo(this, "Nginx-Demo-Stack");
    (nginxDemoStack.nestedStackResource as CfnResource).cfnOptions.condition =
      nginxDemoCheck;

    /**
     * @description Puma Demo stack
     * @type {NestedStack}
     */
    const pumaDemoStack: NestedStack = new PumaDemo(this, "Puma-Demo-Stack");
    (pumaDemoStack.nestedStackResource as CfnResource).cfnOptions.condition =
      pumaDemoCheck;

    /**
     * the framework stack can be extended for new workloads
     * use existing workload as reference for updating the parameters, conditions and resources sections
     * to deploy the nested stacks for the new workload and the demo instance
     */

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "Deploy Apache", {
      description: "Should the framework deploy dashboard for Apache workload?",
      value: "Yes",
      condition: apacheDeployCheck,
    });

    new CfnOutput(this, "Deploy Puma", {
      description: "Should the framework deploy dashboard for Puma workload?",
      value: "Yes",
      condition: pumaDeployCheck,
    });

    new CfnOutput(this, "Deploy Nginx", {
      description: "Should the framework deploy dashboard for Nginx workload?",
      value: "Yes",
      condition: nginxDeployCheck,
    });
  }
}
