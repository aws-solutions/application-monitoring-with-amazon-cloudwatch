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
 * @description cloudwatch widgets for apache workload
 * @author @aws-solutions
 */

import { IExplorerWidget, ILogWidget, IMetricWidget } from "../generics";
import {
  ApacheLogWidgets,
  ApacheExplorerWidget,
  ApacheMetricWidgets,
} from "./apache_exports";
import {
  NginxLogWidgets,
  NginxExplorerWidget,
  NginxMetricWidgets,
} from "./nginx_exports";
import {
  PumaLogWidgets,
  PumaExplorerWidget,
  PumaMetricWidgets,
} from "./puma_exports";
// add exports for new workload as needed

/**
 * @description interface for workload widgets
 */
interface IWorkloadWidget {
  LogWidgets: ILogWidget[];
  ExplorerWidget: IExplorerWidget;
  MetricWidgets: IMetricWidget[];
}

/**
 * @description widgets for supported workloads, extend for more workloads
 */
export const WorkloadWidgets: { [key: string]: IWorkloadWidget } = {
  /**
   * @description widgets for Apache workload
   */
  Apache: {
    LogWidgets: ApacheLogWidgets,
    ExplorerWidget: ApacheExplorerWidget,
    MetricWidgets: ApacheMetricWidgets,
  },
  /**
   * @description widgets for Nginx workload
   */
  Nginx: {
    LogWidgets: NginxLogWidgets,
    ExplorerWidget: NginxExplorerWidget,
    MetricWidgets: NginxMetricWidgets,
  },
  /**
   * @description widgets for Puma workload
   */
  Puma: {
    LogWidgets: PumaLogWidgets,
    ExplorerWidget: PumaExplorerWidget,
    MetricWidgets: PumaMetricWidgets,
  },
  /**
   * @description widgets for the new workload
   * this can be extended
  WorkloadName: {
    LogWidgets: <Workload>LogWidgets,
    ExplorerWidget: <Workload>ExplorerWidget,
    MetricWidgets: <Workload>MetricWidgets,
  },
  */
};
