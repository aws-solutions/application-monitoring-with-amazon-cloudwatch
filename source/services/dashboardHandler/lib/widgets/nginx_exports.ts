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
 * @description cloudwatch widgets for nginx workload
 * @author @aws-solutions
 */

import { IExplorerWidget, ILogWidget, IMetricWidget } from "../generics";

//=============================================================================================
// Log widgets - cloudwatch log insights queries
//=============================================================================================
export const NginxLogWidgets: ILogWidget[] = [
  /**
   * @description remote IP widget for dashboard
   */
  {
    type: "log",
    x: 0,
    y: 0,
    width: 12,
    height: 6,
    properties: {
      view: "pie",
      title: "Nginx Traffic by RemoteIP",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | %%filter%%\n| stats count(remoteIP) as Count by remoteIP\n| sort Count desc\n| limit 10`,
    },
  },
  /**
   * @description host widget for dashboard
   */
  {
    type: "log",
    x: 12,
    y: 0,
    width: 12,
    height: 6,
    properties: {
      view: "pie",
      title: "Nginx Traffic by Host",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | %%filter%%\n| stats count(host) as Count by host\n| sort Count desc\n| limit 10`,
    },
  },
  /**
   * @description bytes sent widget for dashboard
   */
  {
    type: "log",
    x: 0,
    y: 6,
    width: 12,
    height: 6,
    properties: {
      view: "table",
      title: "Nginx Traffic by BytesSent",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | %%filter%%\n| stats SUM(bytesSent) as TotalBytesSent by filename\n| sort TotalBytesSent desc\n| limit 10`,
    },
  },
  /**
   * @description bytes received widget for dashboard
   */
  {
    type: "log",
    x: 12,
    y: 6,
    width: 12,
    height: 6,
    properties: {
      view: "table",
      title: "Nginx Traffic by BytesReceived",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | %%filter%%\n| stats SUM(bytesReceived) as TotalBytesReceived by filename\n| sort TotalBytesReceived desc\n| limit 10`,
    },
  },
  /**
   * @description response status widget for dashboard
   */
  {
    type: "log",
    x: 0,
    y: 12,
    width: 12,
    height: 6,
    properties: {
      view: "table",
      title: "Nginx Traffic by Status",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | %%filter%%\n| stats Count(status) as Count by status,filename\n| sort Count desc\n| limit 10`,
    },
  },
  /**
   * @description response time widget for dashboard
   */
  {
    type: "log",
    x: 12,
    y: 12,
    width: 12,
    height: 6,
    properties: {
      view: "table",
      title: "Nginx Traffic by ResponseTime(Âµs)",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | %%filter%%\n| sort responseTime desc\n| display remoteIP, request, responseTime\n| limit 10`,
    },
  },
  /**
   * @description response time widget for dashboard
   */
  {
    type: "log",
    x: 12,
    y: 12,
    width: 12,
    height: 6,
    properties: {
      view: "Line",
      title: "Total Requests",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | fields @timestamp, @message\n| sort @timestamp desc\n| stats count(@message) as connection_requests by bin(5ms)\n| limit 15`,
    },
  },
  /**
   * @description response time widget for dashboard
   */
  {
    type: "log",
    x: 12,
    y: 12,
    width: 12,
    height: 6,
    properties: {
      view: "Line",
      title: "Total Active Connections",
      region: process.env.AWS_REGION as string,
      query: `SOURCE "${process.env.ACCESS_LOG_GROUP}" | fields @timestamp, @message\n| sort @timestamp desc\n| stats count(@message) as connection_active by bin(5ms)\n| limit 15`,
    },
  },
];

//=============================================================================================
// Metric Explorer widget - metrics with single dimension
//=============================================================================================

/**
 * @description metric explorer widget for single dimension metrics on EC2
 */
export const NginxExplorerWidget: IExplorerWidget = {
  type: "explorer",
  x: 0,
  y: 30,
  width: 24,
  height: 9,
  properties: {
    metrics: [
      {
        metricName: "netstat_tcp_established",
        resourceType: "AWS::EC2::Instance",
        stat: "Sum",
      },
      {
        metricName: "mem_used_percent",
        resourceType: "AWS::EC2::Instance",
        stat: "Average",
      },
    ],
    labels: [
      {
        key: "",
        value: "",
      },
    ],
    widgetOptions: {
      legend: {
        position: "bottom",
      },
      view: "timeSeries",
      stacked: false,
      rowsPerPage: 1,
      widgetsPerRow: 2,
    },
    period: 300,
    splitBy: "",
    title: "Nginx Explorer",
  },
};

//=============================================================================================
// Metric  widget - metrics with multiple dimension
//=============================================================================================

/**
 * @description apache CPU widget
 */
export const NginxMetricWidgets: IMetricWidget[] = [
  {
    type: "metric",
    x: 0,
    y: 27,
    width: 24,
    height: 6,
    properties: {
      metrics: [
        [
          "CWAgent",
          "procstat_cpu_usage",
          "exe",
          "nginx",
          "InstanceId",
          "%%instance%%",
          "process_name",
          "nginx",
        ],
      ],
      view: "timeSeries",
      title: "Host Nginx CPU",
      region: process.env.AWS_REGION as string,
      period: 300,
      stat: "Average",
    },
  },
];
