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

import { logger } from "logger";
import { Workload } from "./lib/CWWidgetFactory";

exports.handler = async (event: unknown) => {
  // log the event
  logger.debug({
    label: "dashboardHandler",
    message: `received event: ${JSON.stringify(event)}`,
  });

  const wld = new Workload();
  await wld.putDashboard(
    process.env.START_TIME as string,
    process.env.DASHBOARD_NAME as string
  );

  logger.info({
    label: "dashboardHandler",
    message: `Dashboard:${process.env.DASHBOARD_NAME as string} updated`,
  });
};
