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
 * @description abstract class to be extended by workload specific classes
 * @author @aws-solutions
 */

import { CloudWatch } from "aws-sdk";
import { logger } from "./utils/logger";
import { SSMHelper } from "./SSMHelper";

import {
  IDashboard,
  IExplorerWidget,
  ILogWidget,
  IMetricWidget,
  config,
} from "./generics";

/**
 * @description abstract helper class for workloads
 */
export abstract class CWHelper {
  /**
   * @description factory method for workloads
   */
  abstract factoryMethod(): WidgetFactory;

  /**
   * @description put dashboard method for CloudWatch dashboard
   * @param startTime
   * @param dashboardName
   * @returns
   */
  async putDashboard(startTime: string, dashboardName: string): Promise<void> {
    let instances = [];
    const tag = process.env.TAG_SCHEMA!;
    try {
      // validate tag
      if (!this.isTagValid(tag)) throw new Error("invalid tag");

      // validate instances
      instances = await SSMHelper.getParameter(process.env.SSM_PARAMETER!);
      if (instances.length === 0) {
        logger.debug({
          label: "CWHelper/putDashboard",
          message: "no instances found",
        });
        // if no instances found, delete dashboard
        await this.deleteDashboard(dashboardName).catch((_) => {
          // do nothing
        });
        throw new Error("no instances found");
      }

      // generate widgets
      const dashboard: IDashboard = { start: "", widgets: [] };
      dashboard.start = startTime;
      dashboard.widgets = this.factoryMethod().widgets(instances, tag);

      // put dashboard
      const cw = new CloudWatch({
        apiVersion: config.cw,
        customUserAgent: config.customUserAgent,
      });
      await cw
        .putDashboard({
          DashboardBody: JSON.stringify(dashboard),
          DashboardName: dashboardName,
        })
        .promise();
    } catch (e) {
      logger.error({
        label: "CWHelper/putDashboard",
        message: e,
      });
      throw new Error("dashboard put failed");
    }
  }

  /**
   * @description method to delete dashboard
   * @param {string} dashboardName - name of dashboard to delete
   * @returns
   */
  async deleteDashboard(dashboardName: string): Promise<void> {
    const cw = new CloudWatch({
      apiVersion: config.cw,
      customUserAgent: config.customUserAgent,
    });
    try {
      await cw
        .deleteDashboards({
          DashboardNames: [dashboardName],
        })
        .promise();
      logger.info({
        label: "CWHelper/deleteDashboard",
        message: `${dashboardName} dashboard deleted successfully`,
      });
    } catch (e) {
      logger.debug({
        label: "CWHelper/deleteDashboard",
        message: e,
      });
      throw new Error(`failure in deleting dashboard: ${dashboardName}`);
    }
  }

  /**
   * @description validates tag schema
   * @param tag
   * @returns
   */
  isTagValid(tag: string): boolean {
    logger.info({
      label: "CWHelper/isTagValid",
      message: `checking if tag is valid`,
    });
    try {
      const tagSchema = tag;
      logger.debug({
        label: "CWHelper/isTagValid",
        message: `tag: ${JSON.stringify(tagSchema)}`,
      });
      const t = JSON.parse(tagSchema);

      if (
        (Object.prototype.hasOwnProperty.call(t, "Key") ||
          Object.prototype.hasOwnProperty.call(t, "key")) &&
        (Object.prototype.hasOwnProperty.call(t, "Value") ||
          Object.prototype.hasOwnProperty.call(t, "value")) &&
        Object.keys(t).length === 2
      ) {
        logger.info({
          label: "CWHelper/isTagValid",
          message: `tag is valid`,
        });
        return true;
      } else throw new Error("invalid tag");
    } catch (e) {
      logger.debug({
        label: "CWHelper/isTagValid",
        message: e,
      });
      return false;
    }
  }
}

/**
 * @description common interface for workload classes
 */
export interface WidgetFactory {
  widgets(
    instanceIds: string[],
    tag: string
  ): (ILogWidget | IExplorerWidget | IMetricWidget)[];
}
