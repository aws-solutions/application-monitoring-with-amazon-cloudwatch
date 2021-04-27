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
export const config = {
  /**
   * @description service client version for aws ssm
   */
  ssm: "2014-11-06",
  /**
   * @description service client version for aws ec2
   */
  ec2: "2016-11-15",
  /**
   * @description max return result size of aws ec2 apis
   */
  apiMaxResults: 50,
  /**
   * @description custom user agent to identify solution calls to aws services
   */
  customUserAgent: process.env.CUSTOM_SDK_USER_AGENT,
};
