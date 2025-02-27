//
//  RCTHTTPRequestHandler.m
//  client
//
//  Created by Claudia Castellano on 24/02/25.
//

#import "React/RCTBridgeModule.h"
#import "React/RCTHTTPRequestHandler.h"

@implementation RCTHTTPRequestHandler(ignoreSSL)

- (void)URLSession:(NSURLSession *)session didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler
{
  completionHandler(NSURLSessionAuthChallengeUseCredential, [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust]);
}
@end
