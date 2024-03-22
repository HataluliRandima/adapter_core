const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const http = require('http');

const app = express();
const PORT = 3001;

app.use(bodyParser.text({ type: 'application/xml' }));

/////// Endpoints //////

/// E.1 LGI  OR LGO ETC /////////
app.post('/', (req, res) => {

    xml2js.parseString(req.body, (err, result) => {
        if (err) {
            console.error('Error parsing SOAP request:', err);
            return res.status(400).send('Error parsing SOAP request');
        }

        const soapBody = result['soap:Envelope']['soap:Body'][0];
        const keys = Object.keys(soapBody);

        // // Check if the LGI key is present in the SOAP body
        // if (keys.includes('LGI')) {
        //   console.log(keys)
        //     const lgiData = soapBody['LGI'][0]; // Extract data for LGI operation
        //     handleLGI(lgiData, res);
        //     //return
        // } 
        // // Check if the LGO key is present in the SOAP body
        // else if (keys.includes('LGO')) {
        //   console.log(keys)
        //     const lgoData = soapBody['LGO'][0]; // Extract data for LGO operation
        //     handleLGO(lgoData, res);
        // } 
        // else {
        //     // No valid operation key found in the SOAP body
        //     console.log('No valid operation key found in the SOAP body');
        //     res.status(400).send('No valid operation key found in the SOAP body');
        // }


        // Check for specific keys in the SOAP body and perform actions accordingly
        keys.forEach(key => {
            switch (key) {
                case 'LGI':
                    // Handle LGI operation
                    const lgiData = soapBody['LGI'][0];
                    handleLGI(lgiData, res);
                    break;
                case 'LGO':
                    // Handle LGO operation
                    const lgoData = soapBody['LGO'][0]; // Extract data for LGO operation
                    handleLGO(lgoData, res);
                    break;
                default:
                    console.log(`Unknown operation: ${key}`);
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

    console.log(sessionToken1)
    console.log(activeSessions1)



    // Search for sessionToken and get the associated timestamp
    var timestamp = searchSessionToken(activeSessions1, sessionToken1);

    // Check if the sessionToken exists and get the timestamp
    if (timestamp !== undefined) {
        console.log("The sessionToken exists within the JSON and the associated timestamp is:", timestamp);
    
        ////////////////////
        if (isTimestampExpired(timestamp, 60000))
         {
            console.log("The timestamp is expired.");
            //delete activeSessions1[OPNAME];
            return res.status(401).send('Session has expired Please Log in again');
           
        } else {
                        
            const redirectURL = `http://localhost:3001/${sessionToken1}`;

            ///sessionData.timestamp = Date.now();

            console.log(activeSessions1)
            res.set({
              'Content-Type': 'application/xml',
              'Location': redirectURL,
              'Connection': 'Keep-Alive'
            });
            console.log("The timestamp is not expired.");
            return res.status(200).send({ sessionToken1 });
           
        }

    } else
     {
        console.log("The sessionToken does not exist within the JSON.");
         // Session token not found, send an error response
         res.status(404).send('Session token not found');
    }




    // // Check if the session token exists in the activeSessions1 object
    // if (activeSessions1.hasOwnProperty(sessionToken)) {
    //     // Retrieve the session data associated with the session token
    //     const sessionData = activeSessions1[sessionToken];

    //     // Check if the session data contains a valid timestamp
    //     if (isSessionExpired(sessionData)) {
    //         // Session has expired, send an error response
    //         res.status(401).send('Session has expired');
    //     } else {
    //         // Session is valid, handle the request
    //         res.status(200).send('Session is valid');
    //     }
    // } else {
    //     // Session token not found, send an error response
    //     res.status(404).send('Session token not found');
    // }

});

////////////////////////

////// Functions /////////

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
    return currentTime - session.timestamp > 60000; // 1 minute expiration
}

// Function to handle LGI operation
function handleLGI(data, res) {
    const { OPNAME, PWD } = data;

    // Perform LGI operation based on OPNAME and PWD
    // Check if the session for the user exists
    //    if (activeSessions1[OPNAME]) {
    //     if (!isSessionExpired(activeSessions1[OPNAME])) {
    //         // Session is not expired, return the session token
    //         const sessionToken = activeSessions1[OPNAME].sessionToken;
    //         return res.status(200).json({ sessionToken });
    //     } else {
    //       console.log(activeSessions1)
    //         // Session has expired, remove the user from activeSessions
    //         delete activeSessions1[OPNAME];
    //         return res.status(401).send('Session has expired  Please Log in again');
    //     }
    // }


    // Check if the session for the user exists
    if (activeSessions1[OPNAME]) {
        const sessionData = activeSessions1[OPNAME];



        // Check if the session is expired
        if (!isSessionExpired(sessionData)) {
            // Session is not expired, update timestamp
            sessionData.timestamp = Date.now();
            const sessionToken = sessionData.sessionToken;
            const redirectURL = `http://localhost:3001/${sessionToken}`;


            console.log(activeSessions1)
            res.set({
                'Content-Type': 'application/xml',
                'Location': redirectURL,
                'Connection': 'Keep-Alive'
            });

            return res.status(200).json({ sessionToken });
        } else {
            // Session has expired, remove the user from activeSessions
            delete activeSessions1[OPNAME];
            return res.status(401).send('Session has expired Please Log in again');
        }
    }


    // Auth
    if (OPNAME[0] === 'udm_username' && PWD[0] === 'udm_password') {

        udm_username = "udm_username"
        // const timestamp = Date.now();
        // const sessionToken = generateSessionToken();

        ///////////////
        // const timestamp = formatDate(Date.now());
        // const sessionToken = generateSessionToken();
        // activeSessions.set(sessionToken, {udm_username, timestamp});
        // console.log(activeSessions) 

        const timestamp = Date.now();
        const sessionToken = generateSessionToken();
        activeSessions1[OPNAME] = { sessionToken, timestamp };



        // Log the username and its session ID
        console.log(`Username: ${OPNAME}, Session ID: ${sessionToken}`);

        const redirectURL = `http://localhost:3001/${sessionToken}`;
        // Authentication successful
        const responseXML = `
          <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
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


        return res.status(307).send(responseXML);
    } else {
        // Authentication failed
        const responseFailedXML = `
          <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
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

// Function to handle LGO operation
function handleLGO(data, res) {
    // Handle LGO operation
    // Example:
    const { Username, Password } = data;
    // Perform LGO operation based on Username and Password
    // Example:
    const responseXML = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
              <LGOResponse>
                  <Result>
                      <ResultCode>0</ResultCode>
                      <ResultDesc>LGO Operation is successful</ResultDesc>
                  </Result>
              </LGOResponse>
          </soap:Body>
      </soap:Envelope>
  `;
    res.status(200).send(responseXML);
}


//////////////////////////////



const httpServer = http.createServer(app);
//httpServer.keepAliveTimeout = 670000;
httpServer.listen(PORT, () => {
    console.log(`HTTP Server simulator is running on http://localhost:${PORT}`);
});






















 