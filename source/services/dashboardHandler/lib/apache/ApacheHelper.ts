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
 * @description apache workload class
 * @author @aws-solutions
 */
import { logWidgets, explorerWidget, metricWidgets } from "./apache_exports";
import { logger } from "../utils/logger";
import { CWHelper, WidgetFactory } from "../CWHelperAbstract";
import { ILogWidget, IMetricWidget, IExplorerWidget } from "../generics";

class ApacheWidgets implements WidgetFactory {
  widgets(
    instanceIds: string[],
    tag: string
  ): (ILogWidget | IMetricWidget | IExplorerWidget)[] {
    logger.debug({
      label: "apache/widgetFactory",
      message: `generating widgets for apache dashboard for instances: ${instanceIds}`,
    });

    // log widgets
    const re = "%%filter%%";
    const filter = this.createFilterPattern(instanceIds);
    logWidgets.forEach((widget: ILogWidget) => {
      const queryString = widget.properties.query.replace(re, filter);
      widget.properties.query = queryString;
    });
    logger.debug({
      label: "apache/widgetFactory",
      message: `log widgets: ${JSON.stringify(logWidgets)}`,
    });

    // metric explorer widget
    const _tag = JSON.parse(tag);
    logger.debug({
      label: "apache/widgetFactory",
      message: `ec2 tag: ${JSON.stringify(_tag)}`,
    });

    const newObj: any = {};
    Object.keys(_tag).forEach((key) => (newObj[key.toLowerCase()] = _tag[key]));
    logger.debug({
      label: "apache/widgetFactory",
      message: `tag for explorer widget: ${JSON.stringify(newObj)}`,
    });
    explorerWidget.properties.labels[0]["key"] = newObj.key;
    explorerWidget.properties.labels[0]["value"] = newObj.value;
    logger.debug({
      label: "apache/widgetFactory",
      message: `explorer widget: ${JSON.stringify(explorerWidget)}`,
    });

    // metric widgets
    logger.debug({
      label: "apache/widgetFactory",
      message: `metric widgets instances: ${instanceIds}`,
    });
    metricWidgets.forEach((widget: IMetricWidget) => {
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
      label: "apache/widgetFactory",
      message: `metric widgets: ${JSON.stringify(metricWidgets)}`,
    });

    return [...logWidgets, explorerWidget, ...metricWidgets];
  }
  private createFilterPattern(instances: string[]): string {
    try {
      logger.debug({
        label: "apache/createFilterPattern",
        message:
          "creating filter pattern for log insight queries for apache dashboard",
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
        label: "apache/createFilterPattern",
        message: `generated filter: ${filter}`,
      });
      return filter;
    } catch (e) {
      logger.debug({
        label: "apache/createFilterPattern",
        message: e,
      });
      throw new Error("error creating filter pattern for apache workload");
    }
  }
}

export class Apache extends CWHelper {
  factoryMethod() {
    return new ApacheWidgets();
  }
}
