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
 * @description common configs and interfaces
 * @author @aws-solutions
 */

/**
 * @description aws service client configs
 */
export const config = {
  /**
   * @description service client for aws ssm
   */
  ssm: "2014-11-06",
  /**
   * @description service client for aws ec2
   */
  ec2: "2016-11-15",
  /**
   * @description service client for aws cloudwatch
   */
  cw: "2010-08-01",
  /**
   * @description user agent to identify solution calls to AWS Services
   */
  customUserAgent: process.env.CUSTOM_SDK_USER_AGENT,
};

/**
 * @description interface for instances tag schema
 */
export interface ITag {
  /**
   * @description instances tag key
   */
  key: string;
  /**
   * @description instances tag value
   */
  value: string;
}

/**
 * @description interface for explorer widget metrics
 */
interface IMetric {
  /**
   * @description metric name
   * @example netstat_tcp_established
   */
  metricName: string;
  /**
   * @description resource type for the metric
   * @example AWS::EC2::Instance
   */
  resourceType: string;
  /**
   * @description stat for the metrics
   * @example Average,Sum
   */
  stat: string;
}

/**
 * @description widget options interface
 */
interface IWidgetOptions {
  /**
   * @description legend position
   * @example {postion:bottom}
   */
  legend: {
    position: string;
  };
  /**
   * @description
   * @example timeseries
   */
  view: string;
  /**
   * @description
   */
  stacked: boolean;
  /**
   * @description number of rows for the metric widget
   */
  rowsPerPage: number;
  /**
   * @description number of widgets per row
   */
  widgetsPerRow: number;
}

/**
 * @description base widget interface
 */
interface IBaseWidget {
  /**
   * @description type of the widget
   * @example metric,explorer,log
   */
  type: string;
  /**
   * @description position along x axis
   */
  x: number;
  /**
   * @description position along y axis
   */
  y: number;
  /**
   * @description width of the widget
   */
  width: number;
  /**
   * @description height of the widget
   */
  height: number;
}

/**
 * @description interface for log widget properties
 */
interface ILogWidgetProperty {
  /**
   * @description view type
   * @example pie, table
   */
  view: string;
  /**
   * @description title for the widget
   *
   */
  title: string;
  /**
   * @description aws region
   */
  region: string;
  /**
   * @description query to run on the logs
   */
  query: string;
}

/**
 * interface for log widget
 */
export interface ILogWidget extends IBaseWidget {
  /**
   * @description properties for the log widget
   */
  properties: ILogWidgetProperty;
}

/**
 * @description interface for explorer widget property
 */
interface IExplorerWidgetProperty {
  /**
   * @description metrics for the explorer widget
   */
  metrics: IMetric[];
  /**
   * @description tags for identifying metrics
   */
  labels: ITag[];
  /**
   * @description widget options
   */
  widgetOptions: IWidgetOptions;
  /**
   * @description metric period
   */
  period: number;
  /**
   * @description widget split
   */
  splitBy: string;
  /**
   * @description widget title
   */
  title: string;
}

/**
 * @description interface for explorer widget
 */
export interface IExplorerWidget extends IBaseWidget {
  /**
   * @description properties for explorer widget
   */
  properties: IExplorerWidgetProperty;
}

/**
 * @description interface for metric widget property
 */
interface IMetricWidgetProperty {
  /**
   * @description metrics for the widget
   */
  metrics: string[][];
  /**
   * @description view type
   * @example pie, table
   */
  view: string;
  /**
   * @description widget title
   */
  title: string;
  /**
   * @description aws region
   */
  region: string;
  /**
   * @description period for the metrics
   */
  period: number;
  /**
   * @description metrics stats
   */
  stat: string;
}

/**
 * @description interface for metric widget
 */
export interface IMetricWidget extends IBaseWidget {
  /**
   * @description properties for metric widget
   */
  properties: IMetricWidgetProperty;
}

/**
 *
 */
export interface IDashboard {
  /**
   * @description start time for the dashboard
   * @example -PT12H
   */
  start: string;
  /**
   * @description widgets for the dashboard
   */
  widgets: IBaseWidget[];
}
