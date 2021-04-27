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
import { v4 as uuidv4 } from "uuid";
import { logger } from "./lib/utils/logger";
import { Metrics } from "./lib/utils/metrics";
import { CloudWatch } from "aws-sdk";
import moment from "moment";

const cw_apiVersion = "2010-08-01";
interface IEvent {
  RequestType: string;
  ResponseURL: string;
  StackId: string;
  RequestId: string;
  ResourceType: string;
  LogicalResourceId: string;
  ResourceProperties: any;
  PhysicalResourceId?: string;
}

exports.handler = async (event: IEvent, context: any) => {
  logger.debug({
    label: "helper",
    message: `received event: ${JSON.stringify(event)}`,
  });

  let responseData: any = {
    Data: "NOV",
  };

  const status = "SUCCESS";
  const properties = event.ResourceProperties;

  /**
   * Generate UUID
   */
  if (event.ResourceType === "Custom::CreateUUID") {
    if (event.RequestType === "Create") {
      responseData = {
        UUID: uuidv4(),
      };
      logger.debug({
        label: "helper/UUID",
        message: `uuid create: ${responseData.UUID}`,
      });
    }
  } else if (event.ResourceType === "Custom::DeleteDeployment") {
    if (event.RequestType === "Delete") {
      try {
        // delete cloudwatch dashboard
        const cw = new CloudWatch({
          apiVersion: cw_apiVersion,
          customUserAgent: process.env.CUSTOM_SDK_USER_AGENT,
        });
        await cw
          .deleteDashboards({
            DashboardNames: [properties.DashboardName],
          })
          .promise();
        logger.info({
          label: "helper/DeleteDeployment",
          message: `${properties.DashboardName} dashboard deleted successfully`,
        });
      } catch (e) {
        logger.warn({
          label: "helper/DeleteDeployment",
          message: `dashboard delete failed: ${e}`,
        });
      }
    }
  } else if (event.ResourceType === "Custom::LaunchData") {
    /**
     * If stack created/deleted
     * Send metric for the event
     */
    if (process.env.SEND_METRIC === "Yes") {
      logger.debug({
        label: "helper/LaunchData",
        message: `sending launch data`,
      });
      let eventType = "";
      if (event.RequestType === "Create") {
        eventType = "SolutionLaunched";
      } else if (event.RequestType === "Delete") {
        eventType = "SolutionDeleted";
      }

      const metric = {
        Solution: properties.SolutionId,
        UUID: properties.SolutionUuid,
        TimeStamp: moment.utc().format("YYYY-MM-DD HH:mm:ss.S"),
        Data: {
          Event: eventType,
          Stack: properties.Stack,
          Version: properties.SolutionVersion,
        },
      };
      await Metrics.sendAnonymousMetric(
        <string>process.env.METRICS_ENDPOINT,
        metric
      );

      responseData = {
        Data: metric,
      };
    }
  }
  /**
   * Send response back to custom resource
   */
  return await sendResponse(event, context.logStreamName, status, responseData);
};

/**
 * Sends a response to custom resource
 * for Create/Update/Delete
 * @param {any} event - Custom Resource event
 * @param {string} logStreamName - CloudWatch logs stream
 * @param {string} responseStatus - response status
 * @param {any} responseData - response data
 */
const sendResponse = async (
  event: IEvent,
  logStreamName: string,
  responseStatus: string,
  responseData: any
) => {
  const responseBody = {
    Status: responseStatus,
    Reason: `${JSON.stringify(responseData)}`,
    PhysicalResourceId: event.PhysicalResourceId
      ? event.PhysicalResourceId
      : logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  };

  logger.debug({
    label: "helper/sendResponse",
    message: `Response Body: ${JSON.stringify(responseBody)}`,
  });

  if (responseStatus === "FAILED") {
    logger.error({
      label: "helper/sendResponse",
      message: responseBody.Reason,
    });
    throw new Error(responseBody.Data.Error);
  } else return responseBody;
};
