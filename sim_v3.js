const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = 8002;


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
const activeSessions = new Map(); //store session
app.use(bodyParser.text({ type: 'application/xml' }));
//app.use(bodyParser.text({ type: 'text/xml' }));

/////// Endpoints //////

//////////////// E.1 LGI ////////////
function formatDate(timestamp) 
{
    const date = new Date(timestamp);
    
    // Extract date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    // Extract time components
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
}


// const activeSessions = new Map([
//     ['key1', { sessionToken: 'token1', timestamp: formatDate(Date.now()) }],
//     ['192.168.0.1', { sessionToken: 'token2', timestamp: formatDate(Date.now()) }],
//     ['key3', { sessionToken: 'token3', timestamp: formatDate(Date.now()) }]
// ]);
app.post('/', (req, res) => {

   
    xml2js.parseString(req.body, (err, result) => 
    {
        if (err) 
        {
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
                    handleLGI(lgiData, res, req);
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
function searchSessionToken(obj, token) 
{
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


function generateSessionToken() 
{
    let token = '';
    const characters = '123456789';
    const tokenLength = 7;

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }

    return token;
}

// Function to check if the session is expired
function isSessionExpired(session) 
{
    const currentTime = formatDate(Date.now());
    return currentTime - session.timestamp > 10000; // 10 seconds expiration
}

// Function to handle LGI operation
function handleLGI(data, res, req) 
{
    const { OPNAME, PWD } = data;
    const udmUsername = "udm_username";
    const udmPassword = "udm_password";
    //                     
    const forwardedFor = req.headers['x-forwarded-for'];
    let deviceIP = forwardedFor ? forwardedFor.split(',')[0] : req.socket.remoteAddress;
    //
    const keyToCheck = (deviceIP === '::1') ? '192.168.0.1' : deviceIP;

    if (activeSessions.has(keyToCheck))
    {
        const sessionData = activeSessions.get(keyToCheck);
        if(!isSessionExpired(sessionData))
        { 
            sessionData.timestamp = formatDate(Date.now());
            activeSessions.set(keyToCheck, sessionData);
            const redirectURL = `http://localhost:8002/${sessionData.sessionToken}`;
            res.set
            ({
                'Content-Type': 'application/xml',
                'Location': redirectURL,
                'Connection': 'Keep-Alive'
            });
            return res.status(307).contentType('application/xml').send(responseXML);
        }
    } 
    else
    {
        if (OPNAME[0] === 'udm_username' && PWD[0] === 'udm_password')
        {
            const timestamp = formatDate(Date.now());
            const sessionToken = generateSessionToken();
            const redirectURL = `http://localhost:8002/${sessionToken}`;
            if (deviceIP == '::1')
            {
                activeSessions.set('192.168.0.1', {sessionToken, timestamp});
                deviceIP = '192.168.0.1';
                
            }
            else
            {
                
                activeSessions.set(deviceIP, {sessionToken, timestamp});
            }
            
            
            console.log(`Device IP: ${deviceIP}, Session ID: ${sessionToken}`);
            res.set
            ({
                'Content-Type': 'application/xml',
                'Location' : redirectURL,
                'Connection': 'Keep-Alive'
            });

            console.log(activeSessions)
            //return res.status(200).contentType('application/xml').send(responseXML);
            return res.status(307).contentType('application/xml').send(responseXML);
        }
        else
        {
            return res.status(200).contentType('application/xml').send(responseFailedXML);
        }

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
    console.log(`HTTP Server simulator is running on http://localhost:${PORT}`);
});
