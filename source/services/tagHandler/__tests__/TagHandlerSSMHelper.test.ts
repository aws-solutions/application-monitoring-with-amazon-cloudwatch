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

import "jest";
import { TagHandlerSSMHelper } from "../lib/TagHandlerSSMHelper";
import { APIError } from "error";

const mockSSM = jest.fn();

const mockSSMParameter = {
  Parameter: {
    Type: "StringList",
    Value: "a,b,c",
    Version: 1,
  },
};
const mockSSMSL = mockSSMParameter.Parameter.Value.split(",");

jest.mock("aws-sdk", () => {
  return {
    SSM: jest.fn(() => ({
      getParameter: mockSSM,
      putParameter: mockSSM,
    })),
  };
});

describe("==TagHandlerSSMHelper Tests==", () => {
  describe("[getParameter]", () => {
    beforeEach(() => {
      mockSSM.mockReset();
    });
    test("[BDD] successful api call", async () => {
      mockSSM.mockImplementation(() => {
        return {
          promise() {
            return Promise.resolve(mockSSMParameter);
          },
        };
      });
      try {
        const data = await TagHandlerSSMHelper.getParameter("name");
        expect(data).toEqual(expect.arrayContaining(mockSSMSL));
      } catch (e) {
        console.log(`negative test: ${e}`);
      }
    });

    test("[BDD] invalid response from api", async () => {
      mockSSM.mockImplementation(() => {
        return {
          promise() {
            return Promise.resolve({
              // invalid response
              Parameter: {
                Type: "StringList",
                Value: "a,b,c",
                // Version: 1,
              },
            });
          },
        };
      });
      try {
        await TagHandlerSSMHelper.getParameter("name");
      } catch (e) {
        expect((e as ReferenceError).message).toEqual("parameter not found");
      }
    });

    test("[TDD] failed api call", async () => {
      mockSSM.mockImplementation(() => {
        return {
          promise() {
            return Promise.reject("failed api call");
          },
        };
      });
      try {
        await TagHandlerSSMHelper.getParameter("");
      } catch (e) {
        expect((e as APIError).message).toEqual("error fetching SSM parameter");
      }
    });
  });

  describe("[putParameter]", () => {
    beforeEach(() => {
      mockSSM.mockReset();
    });
    test("[TDD] successful api call", async () => {
      mockSSM.mockImplementation(() => {
        return {
          promise() {
            return Promise.resolve();
          },
        };
      });
      try {
        await TagHandlerSSMHelper.putParameter("name", ["value1", "value2"]); // testing with list
        await TagHandlerSSMHelper.putParameter("name", []); // testing with empty value
      } catch (e) {
        console.log(`negative test: ${e}`);
      }
    });
    test("[TDD] failed api call", async () => {
      mockSSM.mockImplementation(() => {
        return {
          promise() {
            return Promise.reject("failed api call");
          },
        };
      });
      try {
        await TagHandlerSSMHelper.putParameter("name", ["value"]);
      } catch (e) {
        expect((e as APIError).message).toEqual("error putting SSM parameter");
      }
    });
  });
});
