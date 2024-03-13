const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = 8002;

app.use(bodyParser.text({ type: 'application/xml' }));
//app.use(bodyParser.text({ type: 'text/xml' }));

/////// Endpoints //////

//////////////// E.1 LGI ////////////
app.post('/', (req, res) => {



    const clientIP = req.socket.remoteAddress;
    //const clientIP = req.connection.remoteAddress; ; // Get client's IP address

    // Now you can use clientIP as needed
    console.log(`SOAP request received from IP: ${clientIP}`);

    xml2js.parseString(req.body, (err, result) => {
        if (err) {
            console.error('Error parsing SOAP request 1st:', err);
            return res.status(400).send('Error parsing SOAP request');
        }

        const soapBody = result['soapenv:Envelope']['soapenv:Body'][0];
        const keys = Object.keys(soapBody); 

        keys.forEach(key => 
            {
            switch (key) 
            {
                case 'LGI':
                    // Handle LGI operation
                    const lgiData = soapBody['LGI'][0];
                    handleLGI(lgiData, res);
                    break;
                
                case 'LGO':
                    // Handle LGI operation
                    if (req.params.sessionToken == undefined) 
                    {
                        console.log("The timestamp is expired.");
                        // return res.status(401).send('Session has expired Please Log in again');
                        const redirectURL = `http://169.10.20.100:8002/`;
                        res.set({
                            'Content-Type': 'text/xml',
                            'Location': redirectURL,
                            'Connection': 'Keep-Alive'
                        });

                        const responseFailedXML = `
                        <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                            <soapenv:Body>
                                <LGOResponse>
                                    <Result>
                                        <ResultCode>5004</ResultCode>
                                        <ResultDesc>Session ID invalid or time out</ResultDesc>
                                    </Result>
                                </LGOResponse>
                            </soapenv:Body>
                        </soapenv:Envelope>
                    `;
                        res.status(307).send(responseFailedXML);

                    }
                    break;


                default:
                    console.log(`Unknown operation: ${key} from /`);
                    console.log('No valid operation key found in the SOAP body');
                    res.status(400).send('No valid operation key found in the SOAP body');
                    break;
            }
        });

    });
});



/////// TEST OTHERS THAT CONTAIN SESSIONTOKEN  ////////////////////

app.post('/:sessionToken', (req, res) => {
    const sessionToken1 = req.params.sessionToken;

    ///// For test purpose /////
    console.log(sessionToken1)
    console.log(activeSessions1)
    ////////////////////////////

    //const redirectURL = `http://localhost:3001/${sessionToken1}`;

    ///sessionData.timestamp = Date.now();

    // console.log(activeSessions1)
    // res.set({
    //   'Content-Type': 'application/xml',
    //   'Location': redirectURL,
    //   'Connection': 'Keep-Alive'
    // });
    // console.log("The timestamp is not expired.");
    // return res.status(200).json({ sessionToken1 });

    xml2js.parseString(req.body, (err, result) => {
        if (err) {
            console.error('Error parsing SOAP request:', err);
            return res.status(400).send('Error parsing SOAP request');
        }


        // Search for sessionToken and get the associated timestamp
        var timestamp = searchSessionToken(activeSessions1, sessionToken1);

        // Check if the sessionToken exists and get the timestamp
        if (timestamp !== undefined && !isTimestampExpired(timestamp, 50000)) {

            console.log("YESYESYESYEYSYESYEYE")
            console.log("The sessionToken exists within the JSON and the associated timestamp is:", timestamp);

            // Update the timestamp for the session token

            if (updateTimestampForSessionToken(activeSessions1, sessionToken1)) {
                console.log("Timestamp updated successfully for sessionToken:", sessionToken1);
            } else {
                console.log("Session token not found:", sessionToken1);
            }

            // Output the updated activeSessions object
            console.log(activeSessions1);

            const soapBody = result['soapenv:Envelope']['soapenv:Body'][0];
            const keys = Object.keys(soapBody);

            // Check for specific keys in the SOAP body and perform actions accordingly
            keys.forEach(key => {
                switch (key) {
                    case 'LGO':
                        // Handle LGO operation
                        const lgoData = soapBody['LGO'][0]; // Extract data for LGO operation
                        handleLGO(lgoData, res);
                        break;
                    case 'LST_SUB':
                        // Handle LGO operation
                        const SubData = soapBody['LST_SUB'][0]; // Extract data for LGO operation
                        // req.body
                        handleLST(req.body, res);
                        break;
                    default:
                        console.log(`Unknown operation: ${key}`);
                        console.log('No valid operation key found in the SOAP body');
                        res.status(400).send('No valid operation key found in the SOAP body');
                        break;
                }
            });




        }
        else {

            console.log("NONONONONONONONONONOONO")
            console.log("The sessionToken does not exist within the JSON.");
            // res.status(404).send('Session token not found');
            console.log("The timestamp is expired.");
            // return res.status(401).send('Session has expired Please Log in again');
            //add this response time of session expired based on a key


            const soapBody = result['soapenv:Envelope']['soapenv:Body'][0];
            const keys = Object.keys(soapBody);

            const redirectURL = `http://169.10.20.100:8002/`;

            // Check for specific keys in the SOAP body and perform actions accordingly
            keys.forEach(key => {
                switch (key) {
                    case 'LGO':

                        res.set({
                            'Content-Type': 'text/xml',
                            'Location': redirectURL,
                            'Connection': 'Keep-Alive'
                        });


                        const responseFailedXML1 = `
    <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
            <LGOResponse>
                <Result>
                    <ResultCode>5004</ResultCode>
                    <ResultDesc>Session ID invalid or time out</ResultDesc>
                </Result>
            </LGOResponse>
        </soapenv:Body>
    </soapenv:Envelope>
`;
                        res.status(307).send(responseFailedXML1);

                        break;
                    case 'LST_SUB':

                        res.set({
                            'Content-Type': 'text/xml',
                            'Location': redirectURL,
                            'Connection': 'Keep-Alive'
                        });


                        const responseFailedXML2 = `
    <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
            <LST_SUBResponse>
                <Result>
                    <ResultCode>5004</ResultCode>
                    <ResultDesc>Session ID invalid or time out</ResultDesc>
                </Result>
            </LST_SUBResponse>
        </soapenv:Body>
    </soapenv:Envelope>
`;
                        res.status(307).send(responseFailedXML2);

                        break;
                    default:
                        console.log(`Unknown operation: ${key}`);
                        console.log('No valid operation key found in the SOAP body');
                        res.status(400).send('No valid operation key found in the SOAP body');
                        break;
                }
            });






        }

    });


});

////////////////////////

////// Functions /////////


// Function to update the timestamp based on the sessionToken
function updateTimestampForSessionToken(activeSessions, sessionToken) {
    for (var key in activeSessions) {
        if (activeSessions[key].sessionToken === sessionToken) {
            // Update the timestamp
            activeSessions[key].timestamp = Date.now();
            return true; // Return true if the update was successful
        }
    }
    return false; // Return false if the sessionToken was not found
}




function isTimestampExpired(timestamp, expirationThreshold) {
    // Get the current time in milliseconds
    var currentTime = Date.now();

    // Calculate the difference between the current time and the timestamp
    var timeDifference = currentTime - timestamp;

    // Check if the time difference exceeds the expiration threshold
    return timeDifference > expirationThreshold;
}



// Function to search for sessionToken within a given object
function searchSessionToken(obj, token) {
    for (var key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
            if (obj[key].sessionToken === token) {
                return obj[key].timestamp;
            } else {
                var timestamp = searchSessionToken(obj[key], token);
                if (timestamp !== undefined) {
                    return timestamp;
                }
            }
        }
    }
    return undefined;
}


function generateSessionToken() {
    let token = '';
    const characters = '123456789';
    const tokenLength = 7;

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }

    return token;
}


const activeSessions1 = {}; // Store active sessions

// Function to check if the session is expired
function isSessionExpired(session) {
    const currentTime = Date.now();
    return currentTime - session.timestamp > 50000; // 50 seconds expiration
}

// Function to handle LGI operation
function handleLGI(data, res) {
    const { OPNAME, PWD } = data;
    const udmUsername = "udm_username";
    const udmPassword = "udm_password";

    //console.log(OPNAME[0])
    if (OPNAME[0] === udmUsername && PWD[0] === udmPassword) 
    {
      const timestamp = formatDate(Date.now());
      const sessionToken = generateSessionToken();
      activeSessions.set(sessionToken, {udmUsername, timestamp});
      console.log(activeSessions) 

      const redirectURL = `http://localhost:3001/${sessionToken}`;
      const responseXML = `
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
          <soap:Body>
            <LGIResponse>
              <Result>
                <ResultCode>0</ResultCode>
                <ResultDesc>Operation is successful</ResultDesc>
              </Result>
            </LGIResponse>
          </soap:Body>
        </soap:Envelope>
      `;

      res.set({
        'Content-Type': 'application/xml',
        'Location': redirectURL,
        'Connection': 'Keep-Alive'
      });
      //res.status(307).contentType('application/xml').send(responseXML);
      res.status(200).contentType('application/xml').send(responseXML);
    } 
    else 
    {
      console.log("username and pass don't match");
      const responseFailedXML = `
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
          <soap:Body>
            <LGIResponse>
              <Result>
                <ResultCode>1018</ResultCode>
                <ResultDesc>Username/Password doesn't match</ResultDesc>
              </Result>
            </LGIResponse>
          </soap:Body>
        </soap:Envelope>
      `;
      res.status(200).send(responseFailedXML);
    }
}

function handleLST(data, res) {
    //  const { Username, Password } = data;

    // Load the JSON file containing ISDN data
    const jsonData = JSON.parse(fs.readFileSync('data1.json'));

    // Parse the SOAP XML body
    const xmlBody = data;

    // Extract ISDN from SOAP XML body
    const isdnRegex = /<ISDN>(.*?)<\/ISDN>/;
    const detailRegex = /<DETAIL>(.*?)<\/DETAIL>/;
    const match = xmlBody.match(isdnRegex);
    const detailMatch = xmlBody.match(detailRegex);


    const imsiRegex = /<IMSI>(.*?)<\/IMSI>/;
    const detailimsiRegex = /<DETAIL>(.*?)<\/DETAIL>/;
    const match1 = xmlBody.match(imsiRegex);
    const detailMatch1 = xmlBody.match(detailimsiRegex);

    //  // Extract ISDN and DETAIL from SOAP XML body
    //  const isdnRegex = /<ISDN>(.*?)<\/ISDN>/;

    //  const isdnMatch = xmlBody.match(isdnRegex);




    if (match && detailMatch) {
        const isdn = match[1];
        const detail = detailMatch[1];


        if (isdn.length > 15) {
            //{:error, "1033 :: Number threshold exceeded"}     
            console.log("15 digs");
            res.status(400).send('ISDN must be 15  digits long');
        } else {
            // Search for ISDN in the JSON data
            //  if (jsonData.hasOwnProperty(isdn)) {
            //      // ISDN found, return the data
            //      console.log("ISDN  found'");
            //      const responseXML = `<ISDN>${isdn}</ISDN><Relatives>${jsonData[isdn]}</Relatives>`;
            //      res.set('Content-Type', 'text/xml');
            //      res.status(200).send(`<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            //                  <soapenv:Body>
            //                      ${responseXML}
            //                  </soapenv:Body>
            //              </soapenv:Envelope>`);
            //  } else {
            //      // ISDN not found, return an error
            //      console.log("ISDN not found'");

            //      const responseXML = `
            //      <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            //          <soapenv:Body>
            //              <LST_SUBResponse>
            //                  <Result>
            //                      <ResultCode>3001</ResultCode>
            //                      <ResultDesc>ERR3001:Subscriber not defined</ResultDesc>
            //                  </Result>
            //              </LST_SUBResponse>
            //          </soapenv:Body>
            //      </soapenv:Envelope>
            //  `;
            //     res.status(200).send(responseXML);



            //  }

            // Search for ISDN in the JSON data
            const foundData = jsonData.data_sets.find(data => data.isdn === parseInt(isdn));
            if (foundData) {
                console.log(foundData)
                console.log(foundData.imsi)
                // ISDN found, return the data
                //const relatives = foundData.relatives ? foundData.relatives.join(', '): 'No relatives found';

                //const responseXML = `<ISDN>${isdn}</ISDN><Relatives>${relatives}</Relatives>`;

                //       const responseXML = `<Group>
                //       <Group>
                //           <HLRSN>1</HLRSN>
                //           <IMSI>${foundData.imsi}</IMSI>
                //       </Group>
                //       <Group>
                //           <ISDN>${isdn}</ISDN>
                //       </Group>
                //       <Group>
                //           <CardType>USIM</CardType>
                //           <NAM>BOTH</NAM>
                //           <CATEGORY>COMMON</CATEGORY>
                //       </Group>
                //   </Group>`;
                //       if (detail === 'true') {
                //         responseXML += `<CardType>${foundData.card_type}</CardType>`;
                //     }

                let responseXML = "<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><soapenv:Body><LST_SUBResponse> <Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>${foundData.imsi}</IMSI></Group>Group><ISDN>${isdn}</ISDN></Group>";

                // Include CardType if Detail is true
                if (detail === 'TRUE') {
                    responseXML += "<Group><CardType>${foundData.card_type}</CardType><NAM>${foundData.nam}</NAM><CATEGORY>${foundData.category}</CATEGORY></Group>";
                }

                responseXML += "</Group></ResultData></Result></LST_SUBResponse> </SOAP-ENV:Body></SOAP-ENV:Envelope>";

                res.set('Content-Type', 'text/xml');
                res.status(200).send(responseXML);

                //   res.set('Content-Type', 'text/xml');
                //   res.send(`<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                //               <soapenv:Body>
                //                 <LST_SUBResponse>
                //                   <Result>
                //                    <ResultCode>0</ResultCode>
                //                    <ResultDesc>SUCCESS0001:Operation is successful</ResultDesc>
                //                    <ResultData>
                //                    ${responseXML}
                //                    </ResultData>
                //                   </Result>
                //                 </LST_SUBResponse>       
                //               </soapenv:Body>
                //           </soapenv:Envelope>`);
            } else {
                // ISDN not found, return an error
                console.log("ISDN not found'");

                const responseXML = "<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>3001</ResultCode><ResultDesc>ERR3001:Subscriber not defined</ResultDesc></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>"
                const responseXML1 = `
             <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                 <soapenv:Body>
                     <LST_SUBResponse>
                         <Result>
                             <ResultCode>3001</ResultCode>
                             <ResultDesc>ERR3001:Subscriber not defined</ResultDesc>
                         </Result>
                     </LST_SUBResponse>
                 </soapenv:Body>
             </soapenv:Envelope>
         `;
                res.status(200).send(responseXML);;
            }

        }
        
    } else if (match1 && detailMatch1) 
    {
        const imsi = match1[1];
        const detail1 = detailMatch1[1];

          // Search for ISDN in the JSON data
          const foundData = jsonData.data_sets.find(data => data.imsi === parseInt(imsi));
          if (foundData) {
              console.log(foundData)
              console.log(foundData.imsi)
              

              let responseXML = "<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>" + imsi + "</IMSI></Group><Group><ISDN>" + foundData.isdn + "</ISDN></Group>";

              // Include CardType if Detail is true
              if (detail1 === 'TRUE') {
                  responseXML += "<Group><CardType>" + foundData.card_type + "</CardType><NAM>" + foundData.nam + "</NAM><CATEGORY>" + foundData.category + "</CATEGORY></Group>";
              }

              responseXML += "</Group></ResultData></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope";

              res.set('Content-Type', 'text/xml');
              res.status(200).send(responseXML);

             
          } else {
              // ISDN not found, return an error
              console.log("IMSI not found'");
              const responseXML = "<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>3001</ResultCode><ResultDesc>ERR3001:Subscriber not defined</ResultDesc></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>"
              const responseXML1 = `
           <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
               <soapenv:Body>
                   <LST_SUBResponse>
                       <Result>
                           <ResultCode>3001</ResultCode>
                           <ResultDesc>ERR3001:Subscriber not defined</ResultDesc>
                       </Result>
                   </LST_SUBResponse>
               </soapenv:Body>
           </soapenv:Envelope>
       `;
              res.status(200).send(responseXML);;
          }

       
      } else {
        // ISDN not found in the SOAP XML body
        res.status(400).send('ISDN & IMSI parameter not found in request');
    }



    //     const responseXML = `
    //       <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    //           <soapenv:Body>
    //               <LST_SUBResponse>
    //                   <Result>
    //                       <ResultCode>0</ResultCode>
    //                       <ResultDesc>LGO Operation is successful</ResultDesc>
    //                   </Result>
    //               </LST_SUBResponse>
    //           </soapenv:Body>
    //       </soapenv:Envelope>
    //   `;
    //     res.status(200).send(responseXML);
}

//////////////////////////////


////////////////LGI functio temporary when there is session expired when try to login 
function tempLGI(data) {
    const { OPNAME, PWD } = data;
    // Auth
    if (OPNAME[0] === 'udm_username' && PWD[0] === 'udm_password') {

        udm_username = "udm_username"
  

        const timestamp = Date.now();
        const sessionToken = generateSessionToken();
        activeSessions1[OPNAME] = { sessionToken, timestamp };



        // Log the username and its session ID
        console.log(`Username: ${OPNAME}, Session ID: ${sessionToken}`);

        const redirectURL = `http://169.10.20.100:8001/${sessionToken}`;
        // Authentication successful
        const responseXML = `
              <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soapenv:Body>
                      <LGIResponse>
                          <Result>
                              <ResultCode>0</ResultCode>
                              <ResultDesc>Operation is successful</ResultDesc>
                          </Result>
                      </LGIResponse>
                  </soapenv:Body>
              </soapenv:Envelope>
          `;


        res.set({
            'Content-Type': 'text/xml',
            'Location': redirectURL,
            'Connection': 'Keep-Alive'
        });


        return res.status(307).send(responseXML);
    } else {
        // Authentication failed
        const responseFailedXML = `
              <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soapenv:Body>
                      <LGIResponse>
                          <Result>
                              <ResultCode>1018</ResultCode>
                              <ResultDesc>Username/Password doesn't match</ResultDesc>
                          </Result>
                      </LGIResponse>
                  </soapenv:Body>
              </soapenv:Envelope>
          `;
        res.status(200).send(responseFailedXML);
    }
}


const httpServer = http.createServer(app);
httpServer.keepAliveTimeout = 670000;
httpServer.listen(PORT, () => {
    console.log(`HTTP Server simulator is running on http://localhost${PORT}`);
});
