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
 * @description  widget factory class
 * @author @aws-solutions
 */
import { WorkloadWidgets } from "./widgets/widget_exports";
import { logger } from "logger";
import { CWHelper, WidgetFactory } from "./CWHelperAbstract";
import { ILogWidget, IMetricWidget, IExplorerWidget } from "./generics";

class Widgets implements WidgetFactory {
  get(
    workload: string,
    instanceIds: string[],
    tag: string
  ): (ILogWidget | IMetricWidget | IExplorerWidget)[] {
    logger.debug({
      label: "WidgetFactory",
      message: `generating widgets for ${workload} dashboard for instances: ${instanceIds}`,
    });

    // if supported workload get widgets for the workload else throw error
    if (!Object.keys(WorkloadWidgets).includes(workload))
      throw new Error(
        `unsupported workload specified, please check WORKLOAD env_variable to match one of supported workloads ${Object.keys(
          WorkloadWidgets
        )}`
      );
    const widgets = WorkloadWidgets[workload];

    // log widgets
    const re = "%%filter%%";
    const filter = this.createFilterPattern(instanceIds);
    widgets.LogWidgets.forEach((widget: ILogWidget) => {
      const queryString = widget.properties.query.replace(re, filter);
      widget.properties.query = queryString;
    });
    logger.debug({
      label: "WidgetFactory",
      message: `log widgets: ${JSON.stringify(widgets.LogWidgets)}`,
    });

    // metric explorer widget
    const _tag = JSON.parse(tag);
    logger.debug({
      label: "WidgetFactory",
      message: `ec2 tag: ${JSON.stringify(_tag)}`,
    });

    const newObj: { [key: string]: string } = {};
    Object.keys(_tag).forEach((key) => (newObj[key.toLowerCase()] = _tag[key]));
    logger.debug({
      label: "WidgetFactory",
      message: `tag for explorer widget: ${JSON.stringify(newObj)}`,
    });
    widgets.ExplorerWidget.properties.labels[0]["key"] = newObj.key;
    widgets.ExplorerWidget.properties.labels[0]["value"] = newObj.value;
    logger.debug({
      label: "WidgetFactory",
      message: `explorer widget: ${JSON.stringify(widgets.ExplorerWidget)}`,
    });

    // metric widgets
    logger.debug({
      label: "WidgetFactory",
      message: `metric widgets instances: ${instanceIds}`,
    });
    widgets.MetricWidgets.forEach((widget: IMetricWidget) => {
      const _m = new Array(instanceIds.length);
      for (let i = 0; i < _m.length; i++) {
        _m[i] = new Array(widget.properties.metrics[0].length);
      }
      const dimensions = widget.properties.metrics[0];
      const instanceIndex = dimensions.indexOf("%%instance%%");
      instanceIds.forEach((id, index) => {
        dimensions.forEach(
          (_, dim_id) => (_m[index][dim_id] = dimensions[dim_id])
        );
        _m[index][instanceIndex] = id;
      });
      widget.properties.metrics = _m;
    });
    logger.debug({
      label: "WidgetFactory",
      message: `metric widgets: ${JSON.stringify(widgets.MetricWidgets)}`,
    });

    return [
      ...widgets.LogWidgets,
      widgets.ExplorerWidget,
      ...widgets.MetricWidgets,
    ];
  }
  private createFilterPattern(instances: string[]): string {
    try {
      logger.debug({
        label: "WidgetFactory/createFilterPattern",
        message:
          "creating filter pattern for log insight queries for workload dashboard",
      });
      // creating filter pattern for log insights query
      let i = 0;
      let filter = "filter ";
      instances.forEach((instance) => {
        if (i === 0) filter += `@logStream = "${instance}"`;
        else filter += ` OR @logStream = "${instance}"`;
        i += 1;
      });
      logger.debug({
        label: "WidgetFactory/createFilterPattern",
        message: `generated filter: ${filter}`,
      });
      return filter;
    } catch (e) {
      logger.debug({
        label: "WidgetFactory/createFilterPattern",
        message: e,
      });
      throw new Error("error creating filter pattern for the workload");
    }
  }
}

export class Workload extends CWHelper {
  factoryMethod(): Widgets {
    return new Widgets();
  }
}
