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
    "manifest file to control provisioining and configuration of shared infrastructure",
  solutionId: "SO0158",
  solutionVersion: "%%VERSION%%",
  metricsEndpoint: "https://metrics.awssolutionsbuilder.com/generic",
  solutionName: "%%SOLUTION_NAME%%",
  templateVersion: "2010-09-09",
  sendMetric: "Yes",
};
