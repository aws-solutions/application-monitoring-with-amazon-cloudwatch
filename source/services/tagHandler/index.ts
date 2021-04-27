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

import { logger } from "./lib/utils/logger";
import { SSMHelper } from "./lib/SSMHelper";
import { EC2Helper } from "./lib/EC2Helper";

exports.handler = async (event: any, _: any) => {
  // log the event
  logger.debug({
    label: "tagHandler",
    message: `received event: ${JSON.stringify(event)}`,
  });
  try {
    // validate tag
    if (!EC2Helper.isTagValid(process.env.TAG_SCHEMA as string))
      throw new Error("invalid tag for EC2 instances");

    // get instances based on tag values
    const tag = JSON.parse(process.env.TAG_SCHEMA as string);
    const tagInstances = await EC2Helper.getInstances(tag.Key, tag.Value);

    // get instances from SSM parameter
    const ssmInstances = await SSMHelper.getParameter(
      process.env.SSM_PARAMETER as string
    );

    // check if instances updated or not
    const flag = EC2Helper.compareArrays(tagInstances, ssmInstances);
    if (!flag) {
      logger.debug({
        label: "handler",
        message: `updated instance list: ${tagInstances}`,
      });
      await SSMHelper.putParameter(
        process.env.SSM_PARAMETER as string,
        tagInstances
      );
      logger.info({
        label: "handler",
        message: `instance list updated`,
      });
    } else
      logger.info({
        label: "handler",
        message: `no change in instance list`,
      });
  } catch (e) {
    logger.error({
      label: "handler",
      message: `${e.message}`,
    });
    throw new Error(e.message);
  }
};
