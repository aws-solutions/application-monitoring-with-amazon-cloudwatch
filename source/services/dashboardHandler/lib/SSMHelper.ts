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
 * @description class to help with AWS SSM service operations
 * @author @aws-solutions
 */

import { logger } from "logger";
import { APIError } from "error";
import { SSM } from "aws-sdk";
import { config } from "./generics";

/**
 * @description class to help with SSM operations
 */
export class SSMHelper {
  /**
   * @description get SSM parameter value
   * @param {string} parameterName - name of the ssm parameter to fetch
   * @returns
   */
  static async getParameter(parameterName: string): Promise<string[]> {
    try {
      const ssm = new SSM({
        apiVersion: config.ssm,
        customUserAgent: config.customUserAgent,
      });
      const response = await ssm
        .getParameter({ Name: parameterName })
        .promise();
      if (!response.Parameter?.Value || !response.Parameter?.Version) {
        throw new ReferenceError("parameter not found");
      } else {
        logger.debug({
          label: "SSMHelper/getParameter",
          message: `ssm parameter fetched: ${JSON.stringify(response)}`,
        });
        const value = response.Parameter.Value.split(",").filter(
          (i) => i !== "NOP"
        );
        logger.debug({
          label: "SSMHelper/getParameter",
          message: `ssm parameter return value: ${value}`,
        });
        return value;
      }
    } catch (e) {
      logger.debug({
        label: "SSMHelper/getParameter",
        message: e,
      });
      if (e instanceof ReferenceError)
        throw new ReferenceError("parameter not found");
      else throw new APIError("error fetching SSM parameter");
    }
  }

  /**
   * @description put value for the SSM parameter
   * @param {string} parameterName - name of the ssm parameter
   * @param {string} value - value to put for ssm parameter
   */
  static async putParameter(
    parameterName: string,
    value: string[]
  ): Promise<void> {
    try {
      let pV: string;
      if (value.length === 0) {
        pV = "NOP";
      } else {
        pV = value.join(",");
      }
      const ssm = new SSM({
        apiVersion: config.ssm,
        customUserAgent: config.customUserAgent,
      });
      await ssm
        .putParameter({ Name: parameterName, Value: pV, Overwrite: true })
        .promise();
      logger.info({
        label: "SSMHelper/putSSMParameter",
        message: "ssm parameter updated with instance list",
      });
    } catch (e) {
      logger.debug({
        label: "SSMHelper/putSSMParameter",
        message: e,
      });
      throw new APIError("error putting SSM parameter");
    }
  }
}
