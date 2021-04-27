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

import "jest";
import { EC2Helper } from "../lib/EC2Helper";

const mockEC2 = jest.fn();

const mockEC2Describe = {
  Tags: [{ ResourceId: "i-00001111" }, { ResourceId: "i-11112222" }],
  NextToken: "nextToken",
};
const mockEC2Describe2 = {
  Tags: [{ ResourceId: "i-22223333" }, { ResourceId: "i-33334444" }],
};

const mockEC2DescribeEmptyList = {
  Tags: [],
};

jest.mock("aws-sdk", () => {
  return {
    EC2: jest.fn(() => ({
      describeTags: mockEC2,
    })),
  };
});

describe("==EC2Helper Tests==", () => {
  describe("[getInstances]", () => {
    test("[BDD] successful api call with next token", async () => {
      mockEC2.mockImplementationOnce(() => {
        return {
          promise() {
            return Promise.resolve(mockEC2Describe);
          },
        };
      });
      mockEC2.mockImplementationOnce(() => {
        return {
          promise() {
            return Promise.resolve(mockEC2Describe2);
          },
        };
      });
      try {
        const data = await EC2Helper.getInstances("key", "value");
        const list = ["i-00001111", "i-11112222", "i-22223333", "i-33334444"];
        expect(data).toEqual(expect.arrayContaining(list));
      } catch (e) {
        console.log(`negative test: ${e.message}`);
      }
    });

    test("[BDD] successful api call without next token", async () => {
      mockEC2.mockImplementationOnce(() => {
        return {
          promise() {
            return Promise.resolve(mockEC2Describe2);
          },
        };
      });
      try {
        const data = await EC2Helper.getInstances("key", "value");
        const list = ["i-22223333", "i-33334444"];
        expect(data).toEqual(expect.arrayContaining(list));
      } catch (e) {
        console.log(`negative test: ${e.message}`);
      }
    });

    test("[BDD] successful api call with empty list", async () => {
      mockEC2.mockImplementationOnce(() => {
        return {
          promise() {
            return Promise.resolve(mockEC2DescribeEmptyList);
          },
        };
      });
      try {
        const data = await EC2Helper.getInstances("key", "value");
        expect(data).toEqual(expect.arrayContaining([]));
      } catch (e) {
        console.log(`negative test: ${e.message}`);
      }
    });

    test("[BDD] successful api call with invalid response", async () => {
      mockEC2.mockImplementationOnce(() => {
        return {
          promise() {
            return Promise.resolve("invalid response");
          },
        };
      });
      try {
        const data = await EC2Helper.getInstances("key", "value");
        expect(data).toEqual(expect.arrayContaining([]));
      } catch (e) {
        console.log(`negative test: ${e.message}`);
      }
    });

    test("[TDD] failed api call", async () => {
      mockEC2.mockImplementation(() => {
        return {
          promise() {
            return Promise.reject("failed ec2 describe call");
          },
        };
      });
      try {
        await EC2Helper.getInstances("key", "value");
      } catch (e) {
        expect(e.message).toEqual("error in describing tag for instances");
      }
    });
  });

  describe("[compareArrays]", () => {
    test("[BDD] equal arrays", () => {
      const array1 = ["i-11112222", "i-22223333", "i-33334444"];
      const array2 = ["i-33334444", "i-11112222", "i-22223333"];
      expect(EC2Helper.compareArrays(array1, array2)).toBe(true);
    });

    test("[BDD] arrays not equal", () => {
      const array1 = ["i-11112222", "i-22223333", "i-33334444"];
      const array2 = ["i-11112222"];
      expect(EC2Helper.compareArrays(array1, array2)).toBe(false);
    });

    test("[BDD] arrays not equal", () => {
      const array1 = ["i-11112222", "i-22223333", "i-33334444"];
      const array2 = ["i-44445555"];
      expect(EC2Helper.compareArrays(array1, array2)).toBe(false);
    });
  });

  describe("[isTagValid]", () => {
    test("[BDD] valid tag", () => {
      const tag = { Key: "sample-key", Value: "sample-value" };
      expect(EC2Helper.isTagValid(JSON.stringify(tag))).toBe(true);
    });
    test("[BDD] valid tag", () => {
      const tag = { key: "sample-key", value: "sample-value" };
      expect(EC2Helper.isTagValid(JSON.stringify(tag))).toBe(true);
    });
    test("[BDD] invalid tag", () => {
      const tag = { key1: "sample-key", Value: "sample-value" };
      expect(EC2Helper.isTagValid(JSON.stringify(tag))).toBe(false);
    });
  });
});
