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

import { logger } from "./lib/utils/logger";
import { Apache } from "./lib/apache/ApacheHelper";

exports.handler = async (event: any, _: any) => {
  // log the event
  logger.debug({
    label: "dashboardHandler",
    message: `received event: ${JSON.stringify(event)}`,
  });

  /**
   * instantiating workload related class
   * this can be extended for different workloads
   */
  if (process.env.WORKLOAD === "Apache") {
    const apache = new Apache();
    await apache.putDashboard(
      process.env.START_TIME!,
      process.env.DASHBOARD_NAME!
    );
  }
  logger.info({
    label: "dashboardHandler",
    message: `Apache dashboard:${process.env.DASHBOARD_NAME!} updated`,
  });
};
