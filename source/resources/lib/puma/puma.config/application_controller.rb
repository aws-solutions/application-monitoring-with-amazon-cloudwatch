#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
#  with the License. A copy of the License is located at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
#  and limitations under the License.
 
class ApplicationController < ActionController::Base
    around_action :generate_cloudwatch_log_json
  
    private
  
    def generate_cloudwatch_log_json
      start_request_time = Time.now
      yield
      total_request_time = Time.now - start_request_time
      logging_hash = {
        time: Time.now,
        request_uuid: request.uuid,
        method: request.method,
        remoteIP: request.ip,
        host: Socket.gethostname,
        parameters: request.parameters,
        bytesSent: request.content_length,
        bytesReceived: response.body.size,
        filename: request.original_fullpath,
        request: request.original_url,
        responseTime: total_request_time,
        user_agent: request.user_agent
      }
  
      begin
        yield
      ensure
        logging_hash.merge!({
          status: response.code,
          response_message: response.message,
          response_content_type: response.content_type
        })
  
        logger.info logging_hash.to_json
      end
    end
end