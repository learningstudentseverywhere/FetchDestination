'use strict';
const request = require('request');
const axios = require("axios");
const xsenv = require('@sap/xsenv');
const API_EndPoint = "Field-Glass-API";
/***
 * Extract client id, client secret and url from the bound Destinations service VCAP_SERVICES object
 *
 * when the promise resolves it returns a clientid, clientsecret and url of the token granting service
 *
 * @returns {Promise<any>}
 */
function getCredentials() {
    return new Promise(function(resolve) {
        const destination = xsenv.getServices({
            destination: {
                tag: 'destination'
            }
        }).destination;

        const credentials = {
            clientid: destination.clientid,
            clientsecret: destination.clientsecret,
            url: destination.url
        };
        

        resolve(credentials);
    });
}

/***
 * This creates a token for us from the supplied token granting service url, the clientid and the client
 * secret when the promise resolves
 *
 * The return value when the promise resolves is an object and not a string. The request API will turn the response
 * from a string into an object for us.
 *
 * @param destAuthUrl : url of the destination service token granting service - you will still need to append /oath/token to the url
 * @param clientId: the clientId used to get a token from the
 * @param clientSecret : the password to get a token
 * @returns {Promise<any>}
 */
function createToken(destAuthUrl, clientId, clientSecret) {
    return new Promise(function(resolve, reject) {
        // we make a post using x-www-form-urlencoded encoding for the body and for the authorization we use the
        // clientid and clientsecret.
        // Note we specify a grant_type and client_id as required to get the token
        // the request will return a JSON object already parsed
        request({
                url: `${destAuthUrl}/oauth/token`,
                method: 'POST',
                json: true,
                form: {
                    grant_type: 'client_credentials',
                    client_id: clientId
                },
                auth: {
                    user: clientId,
                    pass: clientSecret
                }
            },
            function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body.access_token);
                }
            });
    });
}

/***
 * This creates a token for us from the supplied token granting service url, the clientid and the client
 * secret when the promise resolves
 *
 * The return value when the promise resolves is an object and not a string. The request API will turn the response
 * from a string into an object for us.
 *
 * @param destAuthUrlFG : url of the destination service token granting service - you will still need to append /oath/token to the url
 * @param clientIdFG: the clientId used to get a token from the
 * @param clientSecretFG : the password to get a token
 * @returns {Promise<any>}
 */
function createTokenFG(destAuthUrlFG, clientIdFG, clientSecretFG) {
   return new Promise(function(resolve, reject) {
       // we make a post using x-www-form-urlencoded encoding for the body and for the authorization we use the
       // clientid and clientsecret.
       // Note we specify a grant_type and client_id as required to get the token
       // the request will return a JSON object already parsed
       console.log(destAuthUrlFG);
       request({
               url: `${destAuthUrlFG}/oauth/token`,
               method: 'POST',
               json: true,
               form: {
                   grant_type: 'client_credentials',
                   client_id: clientIdFG
               },
               auth: {
                   user: clientIdFG,
                   pass: clientSecretFG
               }
           },
           function(error, response, body) {
               if (error) {
                   reject(error);
               } else {
                    console.log(body.access_token)
                   resolve(body.access_token);
               }
           });
   });
}
/***
 * This gets the destination using the supplied access token. We generated the access token using
 * createToken above.
 *
 * The destination has the uri field that holds the server(url) that will enable us to get the
 * destination details.
 *
 * -----------------------------------------
 * NOTE WE ASSUME A DESTINATION OF testdest
 * -----------------------------------------
 *
 * As above we do a GET request but instead of authentication we supply a bearer and access token
 * which give us access to the destination service for our service.
 *
 * The return value when the promise resolves is an object and not a string. The request API will turn the response
 * from a string into an object for us.
 *
 * @param access_token : the access token giving us access to the destination service
 * @param destinationName : the name of the destination to retrieve.
 * @returns {Promise<any>}
 */
function getDestination(access_token, destinationName) {
    return new Promise(function(resolve, reject) {
        const destination = xsenv.getServices({destination: {tag: 'destination'} }).destination;
        console.log("ACCESS TOKEN = "+access_token);
        // Note that we use the uri and not the url!!!!

        request({
                url: `${destination.uri}/destination-configuration/v1/destinations/${destinationName}`,
                method: 'GET',
                auth: {
                    bearer: access_token,
                },
                json: true,
            },
            function(error, response, body) {
                if (error) {
                    console.error(`Error retrieving destination ${error.toString()}`);
                    reject(error);
                } else {
                    console.log(`Retrieved destination ${JSON.stringify(body)}`);
                    resolve(body.destinationConfiguration);
                }
            });
    });
}

function readOrderDetailsDestinationUrl(destination_name) {
    return new Promise(function (resolve, reject) {
        getCredentials()
            .then(function (credentials) {
                console.log(credentials);
                return createToken(credentials.url, credentials.clientid, credentials.clientsecret)
            })
            .then(function (access_token) {
                // return getDestination(access_token, API_EndPoint);
                return getDestination(access_token, destination_name);
            })
            .then(function (destination) {
                const url = `${destination.URL}`;
                console.log(destination);
                console.log(`Accessing ODATA URL 1 ${url}`);
                // return createTokenFG(destination.tokenServiceURL, destination.clientid, destination.clientsecret)
                // resolve(url);
                resolve(`${JSON.stringify(destination)}`)
                // resolve(`${destination}`);
            })
            // .then(function (access_token) {
            //     console.log(`Accessing ODATA URL ${access_token}`);
            //     // console.log('FG ACCESS TOKEN  ${access_token}');
            //     resolve(access_token);
            // })
            // .then(function (credentials) {
            //     console.log(credentials);
            //     return createToken(credentials.url, credentials.clientid, credentials.clientsecret)
            // })
            .catch(function (error) {
                console.error(`Error getting Order_Details destination URL`);
                reject(error);
            })
    });
}

function readDestinationDetails(destination) {

    return new Promise(function (resolve, reject) {
        console.log(`Getting destination url for Order_Details odata collection`);

        readOrderDetailsDestinationUrl(destination)
            .then(function (url) {
                console.log(`Read destiantion url2 ${url}`);
                resolve(url);

                // request({
                //     method: 'GET',
                //     url: `${url}/api/vc/connector/ActiveWorkOrderProfileWorkerDownload`,
                //     json: true,
                //     headers: {
                //         'x-api-key': 'TRFI_9ERVL87TJKX4pnGSPUWWcq3DqTM',
                //         Authorization: "Bearer YWVzQG9MRFVPamY1d3ByeGJYaG1zSkN5MG9jOHBmQ0JxYTJUK2JycDB2a01ZaEpZNWxRMXhIMzFQeFhSazJzNGtPVlFTK0plRVJlTzV3TFRSMEJOcjRBZUNpak9PbkR6NlRkQ2RxRlVVcVRDNVRaZC92Yk9FY1RpK3Fjdk40VjB6WUJ1Y2NkV20zOFZpalo4K0xKSGJOZFAwQT09",
                //         accept: "application/json"
                //       }
                // }, function(error, response) {
                //     if (error) {
                //         console.error(`Error getting odata from Order_Details API ${error.toString()}`);
                //         reject(error);
                //     } else {
                //         console.log(`Received Odata from wishlist API`);
                //         resolve(response.body);
                //     }
                // })
            })
            .catch(function (error) {
                console.error(`Failed reading Order_Details data - ${error.toString()}`);
                reject(error);
            });
    });
}

module.exports = {
    readDestinationDetails: readDestinationDetails
}