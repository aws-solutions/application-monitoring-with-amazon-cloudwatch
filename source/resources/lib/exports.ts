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

import { CfnCondition } from "@aws-cdk/core";

/**
 * @description log levels for the application
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

/**
 * @description manifest for shared resources
 */
export const manifest = {
  title: "CloudWatch Monitoring Framework",
  description:
    "manifest file to control provisioning and configuration of shared infrastructure",
  solutionId: "SO0158",
  solutionVersion: "%%VERSION%%",
  metricsEndpoint: "https://metrics.awssolutionsbuilder.com/generic",
  solutionName: "%%SOLUTION_NAME%%",
  templateVersion: "2010-09-09",
  sendMetric: "Yes",
};

/**
 * @description interface for workload identifiers
 */
interface IWorkload {
  /**
   * @description name of the dashboard to be created for the workload
   */
  DashboardName: string;
  /**
   * @description cw log group name for access log of workload instances
   */
  AccessLog: string;
  /**
   * @description name of the ssm parameter to maintain workload instance list
   */
  SSMParameter: string;
  /**
   * @description condition to check whether to deploy workload dashboard or not
   */
  DeployCheck?: CfnCondition;
  /**
   * @description tag schema to identify workload instances
   */
  TagSchema?: string;
}

/**
 * @description workload specific configurations
 * @type { [key: string]: IWorkload }
 */
export const Workload: { [key: string]: IWorkload } = {
  Apache: {
    DashboardName: "ApacheDashboard",
    AccessLog: "/cw-monitoring-framework/apache/access",
    SSMParameter: "/cw-monitoring-framework/ApacheInstances",
  },
  Nginx: {
    DashboardName: "NginxDashboard",
    AccessLog: "/cw-monitoring-framework/nginx/access",
    SSMParameter: "/cw-monitoring-framework/NginxInstances",
  },
  Puma: {
    DashboardName: "PumaDashboard",
    AccessLog: "/cw-monitoring-framework/puma/access",
    SSMParameter: "/cw-monitoring-framework/PumaInstances",
  },
  /* this can be extended as follows
  WorkloadName: {
    DashboardName: "<Workload>Dashboard",
    AccessLog: "/cw-monitoring-framework/<workload>/access",
    SSMParameter: "/cw-monitoring-framework/<Workload>Instances",
  },
  // WorkloadName must match with workload name in ./source/services/dashboardHandler/lib/widgets/widget_exports.ts
  */
};
