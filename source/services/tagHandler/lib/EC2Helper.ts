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
 * @description helper class for AWS EC2 operations
 * @author @aws-solutions
 */

import { EC2 } from "aws-sdk";
import { logger } from "logger";
import { config } from "./exports";
/**
 * @description helper class for tag validation & describing EC2 instances
 */
export class EC2Helper {
  /**
   * @description get instances with given tag
   * @param {string} key
   * @param {string} value
   */
  static async getInstances(key: string, value: string): Promise<string[]> {
    try {
      logger.debug({
        label: "TagHelper/getInstances",
        message: `${JSON.stringify({ tag_key: key, tag_value: value })}`,
      });
      const instances: string[] = [];
      const ec2 = new EC2({
        apiVersion: config.ec2,
        customUserAgent: config.customUserAgent,
      });
      let nextToken = "";
      let resp = await ec2
        .describeTags({
          Filters: [
            {
              Name: "key",
              Values: [key],
            },
            {
              Name: "value",
              Values: [value],
            },
            {
              Name: "resource-type",
              Values: ["instance"],
            },
          ],
          MaxResults: config.apiMaxResults,
        })
        .promise();
      if (resp.Tags) {
        resp.Tags.forEach((item) => {
          instances.push(item.ResourceId as string);
        });
      }
      nextToken = resp.NextToken as string;
      // pagination
      while (nextToken) {
        resp = await ec2
          .describeTags({
            Filters: [
              {
                Name: "key",
                Values: [key],
              },
              {
                Name: "value",
                Values: [value],
              },
              {
                Name: "resource-type",
                Values: ["instance"],
              },
            ],
            MaxResults: config.apiMaxResults,
            NextToken: nextToken,
          })
          .promise();
        if (resp.Tags) {
          resp.Tags.forEach((item) => {
            instances.push(item.ResourceId as string);
          });
        }
        nextToken = resp.NextToken as string;
      }
      logger.debug({
        label: "TagHelper/getInstances",
        message: `instances with given tag: ${instances}`,
      });
      return instances;
    } catch (e) {
      logger.error({
        label: "TagHelper/getInstances",
        message: JSON.stringify(e),
      });
      throw new Error("error in describing tag for instances");
    }
  }

  /**
   * @description compare given arrays if they are equal or not
   * @param {string[]} a1
   * @param {string[]} a2
   */
  static compareArrays(a1: string[], a2: string[]): boolean {
    const superSet: { [key: string]: number } = {};
    for (const i of a1) {
      superSet[i] = 1;
    }

    for (const i of a2) {
      if (!superSet[i]) {
        return false;
      }
      superSet[i] = 2;
    }

    for (const e in superSet) {
      if (superSet[e] === 1) {
        return false;
      }
    }

    return true;
  }
  /**
   * @description validate if tagging schema is valid or not
   * @param {string} tagSchema
   */
  static isTagValid(tagSchema: string): boolean {
    logger.info({
      label: "PolicyManager/isTagValid",
      message: `checking if tag is valid`,
    });

    try {
      const t = JSON.parse(tagSchema);
      logger.debug({
        label: "EC2Helper/isTagValid",
        message: `tag: ${JSON.stringify(tagSchema)}`,
      });
      if (
        (Object.prototype.hasOwnProperty.call(t, "Key") ||
          Object.prototype.hasOwnProperty.call(t, "key")) &&
        (Object.prototype.hasOwnProperty.call(t, "Value") ||
          Object.prototype.hasOwnProperty.call(t, "value")) &&
        Object.keys(t).length === 2
      ) {
        logger.info({
          label: "EC2Helper/isTagValid",
          message: `tag is valid`,
        });
        return true;
      } else throw new Error("invalid tag");
    } catch (e) {
      logger.error({
        label: "EC2Helper/isTagValid",
        message: `${(e as Error).message}`,
      });
      return false;
    }
  }
}
