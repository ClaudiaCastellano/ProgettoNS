//
//  RCTHTTPRequestHandler+ignoreSSL.h
//  client
//
//  Created by Claudia Castellano on 24/02/25.
//

// RCTHTTPRequestHandler+ignoreSSL.h
#import "React/RCTHTTPRequestHandler.h"

@interface RCTHTTPRequestHandler (ignoreSSL)

- (void)URLSession:(NSURLSession *)session
    didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
    completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler;

@end
