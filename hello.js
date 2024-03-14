const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const http = require('http');
const fs = require('fs');
const { timeStamp } = require('console');

const app = express();
const PORT = 8002;

app.use(bodyParser.text({ type: 'application/xml' }));
const activeSessions = new Map();

const Sessionmap = new Map();

function formatDate(timestamp) {
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

function generateSANumbers(numOfNumbers, outputFile) {
  const saNumbers = [];

  for (let i = 0; i < numOfNumbers; i++) {
      // Generate random 9-digit phone number
      const phoneNumber = '27' + Math.floor(100000000 + Math.random() * 900000000);
      saNumbers.push(phoneNumber);
  }

  // Write the phone numbers to a text file
  fs.writeFile(outputFile, saNumbers.join('\n'), (err) => {
      if (err) throw err;
      console.log(`${numOfNumbers} SA phone numbers generated and saved to ${outputFile}.`);
  });
}


function generateSessionToken() {
  let token = '';
  const characters = '0123456789';
  const tokenLength = 7;

  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }

  return token;
}

function getTimestamp(sessionId) 
{
  if (activeSessions.has(sessionId)) 
  {
    return activeSessions.get(sessionId);
  } 
  else 
  {
    return null; // Session ID not found
  }
}


//////////////// THE LGI AND ETC /////////////////////////
app.post('/rmv_SUB', (req, res) => 
{

  console.log(req)
  const sessionId = req.params.sessionId;
  console.log(sessionId)
  //const request_timeStamp = formatDate(Date.now());
  const session_timestamp = getTimestamp(sessionId);

  //console.log("Current time: ", request_timeStamp)
  console.log("Session time: ", session_timestamp)

  xml2js.parseString(req.body, (err, result) =>
   {
      if (err) 
      {
        console.error('Error parsing SOAP request:', err);
        return res.status(400).send('Error parsing SOAP request');
      }
    
    // start session check
      const isdn = result['soap:Envelope']['soap:Body'][0]['rmv:RMV_SUB'][0]['rmv:ISDN'][0];
      const rmvki = result['soap:Envelope']['soap:Body'][0]['rmv:RMV_SUB'][0]['rmv:RMVKI'][0];

      fs.readFile('sa_phone_numbers.txt', 'utf8', (err, data) => {
        if (err) 
        {
          console.error('Error reading file:', err);
          return;
        }
      
          // Split the file content by newline character
        const lines = data.split('\n');
      
          // Filter out lines that do not match the ISDN
        const filteredLines = lines.filter(line => 
        {
          return !line.startsWith(isdn);
        });

        if (filteredLines.length === lines.length) 
        {
          console.error('ISDN not found in the file.');
          return;
        }
      
          // Join the filtered lines back into a single string
          const updatedContent = filteredLines.join('\n');
      
          // Write the updated content back to the file
          fs.writeFile('sa_phone_numbers.txt', updatedContent, 'utf8', err => {
              if (err) {
                  console.error('Error writing to file:', err);
                  return;
              }
              console.log('ISDN removed successfully.');
          });
      });

    res.send("ISDN removed successfully.").status(200);
  });
});
////////////////////////////////////////////////////

app.post('/LGI', (req, res) => 
{
  xml2js.parseString(req.body, (err, result) => 
  {
    if (err) 
    {
      console.error('Error parsing SOAP request:', err);
      return res.status(400).send('Error parsing SOAP request');
    }

    const { OPNAME, PWD } = result['soap:Envelope']['soap:Body'][0]['LGI'][0];
    const udmUsername = "udm_username";
    const udmPassword = "udm_password";

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
      res.status(307).contentType('application/xml').send(responseXML);
      //res.status(200).contentType('application/xml').send(responseXML);
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
  });
  
});

// app.post('/:sessionId', (req, res) => 
// {
//   const sessionId = req.params.sessionId;
//   console
//   // Check if the session ID is valid
//   if (activeSessions.has(sessionId)) {
//       // Session ID is valid, respond with the LGI response body
//       const lgiResponseBody = `
//           <?xml version="1.0"?>
//           <SOAP:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
//               <SOAP:Body>
//                   <LGIResponse>
//                       <Result>
//                           <ResultCode>0</ResultCode>
//                           <ResultDesc>Operation is successful</ResultDesc>
//                       </Result>
//                   </LGIResponse>
//               </SOAP:Body>
//           </SOAP:Envelope>
//       `;

//       // Respond with the LGI response body
//       res.status(200).send(lgiResponseBody);
//   } else {
//       // Session ID is not valid, respond with a 404 status code
//       res.status(404).send('Session ID is not valid');
//   }
// });

//////////////////////////////SIM V1////////////////////////////

// app.post('/', (req, res) => {
//   xml2js.parseString(req.body, (err, result) => {
//       if (err) {
//           console.error('Error parsing SOAP request:', err);
//           return res.status(400).send('Error parsing SOAP request');
//       }

//       const soapBody = result['soap:Envelope']['soap:Body'][0];
//       const keys = Object.keys(soapBody);

//       // Check for specific keys in the SOAP body and perform actions accordingly
//       keys.forEach(key => {
//           switch (key) {
//               case 'LGI':
//                   // Handle LGI operation
//                   handleLGI1(soapBody[key], res);
//                   break;
//               case 'LGO':
//                   // Handle LGO operation
//                   handleLGO1(soapBody[key], res);
//                   break;
//               default:
//                   console.log(`Unknown operation: ${key}`);
//                   break;
//           }
//       });
//   });
// });

// // Function to handle LGI operation
// function handleLGI1(data, res) {
//   // Extract necessary data from the 'data' object and perform the LGI operation
//   // Example:
//   const { OPNAME, PWD } = data;
//   // Perform LGI operation based on OPNAME and PWD
//   // Respond with appropriate SOAP response
// }

// // Function to handle LGO operation
// function handleLGO1(data, res) {
//   // Extract necessary data from the 'data' object and perform the LGO operation
//   // Example:
//   const { Username, Password } = data;
//   // Perform LGO operation based on Username and Password
//   // Respond with appropriate SOAP response
// }


//////////////////////////SIM_V1_HATA////////////////////////////////

app.post('/HATA', (req, res) => {
  console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")
  xml2js.parseString(req.body, (err, result) => {
      if (err) {
          console.error('Error parsing SOAP request:', err);
          return res.status(400).send('Error parsing SOAP request');
      }

      const soapBody = result['soap:Envelope']['soap:Body'][0];
      const keys = Object.keys(soapBody);

      // Check if the LGI key is present in the SOAP body
      if (keys.includes('LGI')) {
        console.log(keys)
          const lgiData = soapBody['LGI'][0]; // Extract data for LGI operation
          handleLGI(lgiData, res);
          //return
      } 
      // Check if the LGO key is present in the SOAP body
      else if (keys.includes('LGO')) {
        console.log(keys)
          const lgoData = soapBody['LGO'][0]; // Extract data for LGO operation
          handleLGO(lgoData, res);
      } 
      else {
          // No valid operation key found in the SOAP body
          console.log('No valid operation key found in the SOAP body');
          res.status(400).send('No valid operation key found in the SOAP body');
      }
  });
});

const activeSessions1 = {}; // Store active sessions

// Function to check if the session is expired
function isSessionExpired(session) {
    const currentTime = Date.now();
    return currentTime - session.timestamp > 60000; // 1 minute expiration
}
// Function to generate session token (you can customize it according to your needs)
// function generateSessionToken() {
//   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// }

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
    const timestamp = Date.now();
    const sessionToken = generateSessionToken();
    // const timestamp = formatDate(Date.now());
    // const sessionToken = generateSessionToken();
    // activeSessions.set(sessionToken, {udm_username, timestamp});
    // console.log(activeSessions) 

    Sessionmap.set(sessionToken, {udm_username, timestamp});
    console.log(Sessionmap) 


    // const timestamp = Date.now();
    // const sessionToken = generateSessionToken();
    // activeSessions1[OPNAME] = { sessionToken, timestamp };

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

///////////////////Handle sessionID endpoints ///////////////////

app.post('/:sessionToken', (req, res) => {
  const sessionToken = req.params.sessionToken;

  console.log(sessionToken)

  // // Check if the session ID is valid and not expired 
  // if (isValidSession(sessionToken)  && !isSessionExpired(activeSessions1[sessionToken])) {
  //     // If the session ID is valid and not expired, you can handle the request here
  //     // For demonstration purposes, let's send a success response
  //     res.status(200).send('Request is valid and authenticated');
  // } else {
  //     // If the session ID is not valid or expired, send an error response
  //     res.status(401).send('Invalid or expired session ID');
  // }


  const sessionData = activeSessions1;

// Get all keys of the sessionData object
const keys = Object.keys(sessionData);

// Check if there are keys in the sessionData object
if (keys.length > 0) {
    // Retrieve the first key dynamically
    const firstKey = keys[0];
    
    // Access the session token using the first key
    const sessionToken = sessionData[firstKey].sessionToken;
    
    // Log the session token
    console.log('Session token:', sessionToken);
} else {
    console.log('No session data found');
}


      // Check if the session token exists in the activeSessions1 object
      if (activeSessions1.hasOwnProperty(sessionToken)) {
        // Retrieve the session data associated with the session token
        const sessionData = activeSessions1[sessionToken];
        
        // Check if the session data contains a valid timestamp
        if (isSessionExpired(sessionData)) {
            // Session has expired, send an error response
            res.status(401).send('Session has expired');
        } else {
            // Session is valid, handle the request
            res.status(200).send('Session is valid');
        }
    } else {
        // Session token not found, send an error response
        res.status(404).send('Session token not found');
    }
    
});

// Function to validate session ID
// function isValidSession(sessionToken) {
//   // Check if the session ID exists in the activeSessions object
//   return activeSessions1.hasOwnProperty(sessionToken);
// }

function isValidSession(sessionToken) {
  // Check if the session ID exists in the activeSessions1 object
  // Iterate over the keys (usernames) of the activeSessions1 object
  for (let udm_username in activeSessions1) {
      // Check if the current username has the sessionToken property
      if (activeSessions1.hasOwnProperty(udm_username) && activeSessions1[udm_username].sessionToken === sessionToken) {
          // Return true if the sessionToken matches for any username
          return true;
      }
  }
  // Return false if the sessionToken is not found in any username
  return false;
}


// Function to check if the session is expired
// function isSessionExpired(sessionData) {
//   const currentTime = Date.now();
//   return currentTime - sessionData.timestamp > 60000; // 1 minute expiration
// } 
////////////////////////////////////////////////////////

// const sessionData = activeSessions1;

// // Get all keys of the sessionData object
// const keys = Object.keys(sessionData);

// // Check if there are keys in the sessionData object
// if (keys.length > 0) {
//     // Retrieve the first key dynamically
//     const firstKey = keys[0];
    
//     // Access the session token using the first key
//     const sessionToken = sessionData[firstKey].sessionToken;
    
//     // Log the session token
//     console.log('Session token:', sessionToken);
// } else {
//     console.log('No session data found');
// }

/////////////////////////////////////////////////////////////////////////////////////

function isSessionExpired(sessionData) {
  // Check if sessionData is defined and has a timestamp property
  if (sessionData && sessionData.timestamp) {
      const currentTime = Date.now();
      return currentTime - sessionData.timestamp > 60000; // 1 minute expiration
  } else {
      // Handle the case where sessionData is undefined or missing timestamp property
      return true; // Consider session expired if data is missing or undefined
  }
}



////////////////////////////////

app.get('/status', (req, res) => {
  const isGood = Math.random() < 0.5;
  const status = isGood ? 'Hata' : 'Error';
  res.status(isGood ? 200 : 500).json({ status });
});
////////////////////



app.post('/pcf', (req, res) => 
{

  xml2js.parseString(req.body, (err, result) => 
  {
    if (err) 
    {
      console.error('Error parsing SOAP request:', err);
      return res.status(400).send('Error parsing SOAP request');
    }

    // Maximum number of login attempts before locking the account
    const MAX_LOGIN_ATTEMPTS = 3;
    const users = [ { username: 'admin', password: 'Sysadmin@2009' }];
    const username = receivedData['soapenv:Envelope']['soapenv:Body']['rm:LGI']['inPara']['Login']['attribute'][0]['value'];
    const password = receivedData['soapenv:Envelope']['soapenv:Body']['rm:LGI']['inPara']['Login']['attribute'][1]['value'];

    //const user = users.find(user => user.username === username && user.password === password);
    const user = users.find(user => user.username === username);

    if (user && user.locked) 
    {
      // Account is locked, send a failure SOAP response
      const soapResponse = generateSOAPResponse('1155');
      res.send(soapResponse);
      return;
    }

    if (user && user.password === password) 
    {
      // Reset login attempts if password is correct
      user.loginAttempts = 0;

      // Credentials are correct, send a success SOAP response
      const soapResponse = generateSOAPResponse('0');
      res.send(soapResponse);
    }
    else 
    {
      // Increment login attempts and check if the account should be locked
      if (user) 
      {
          user.loginAttempts++;
          if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) 
          {
              // Lock the account if maximum login attempts exceeded
              user.locked = true;

              // Account is locked, send a failure SOAP response
              const soapResponse = generateSOAPResponse('1155');
              res.send(soapResponse);
          } 
          else 
          {
              // Credentials are incorrect, send a failure SOAP response
              const soapResponse = generateSOAPResponse('1013');
              res.send(soapResponse);
          }
      } 
      else 
      {
          // Increment login attempts for non-existing users
          const nonExistingUser = users.find(user => user.username === undefined);
          nonExistingUser.loginAttempts++;

          if (nonExistingUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) 
          {
              // Lock the account if maximum login attempts exceeded
              nonExistingUser.locked = true;

              // Account is locked, send a failure SOAP response
              const soapResponse = generateSOAPResponse('1155');
              res.send(soapResponse);
          } 
          else 
          {
              // Credentials are incorrect, send a failure SOAP response
              const soapResponse = generateSOAPResponse('1013');
              res.send(soapResponse);
          }
      }
  }
    


  });

});

function generateSOAPResponse(code) 
{
  let resultCode;
  let errorDescription;

  switch (code) {
      case '0':
          resultCode = '0';
          errorDescription = 'Operation succeeded';
          break;
      case '1004':
          resultCode = '1004';
          errorDescription = 'Invalid parameter value for parameter';
          break;
      case '1009':
          resultCode = '1009';
          errorDescription = 'Parameter missing in parameter list';
          break;
      case '1012':
          resultCode = '1012';
          errorDescription = 'Operator not defined';
          break;
      case '1013':
          resultCode = '1013';
          errorDescription = 'Username or password incorrect';
          break;
      case '1018':
          resultCode = '1018';
          errorDescription = 'Password does not match';
          break;
      case '1078':
          resultCode = '1078';
          errorDescription = 'The number of login attempts with the incorrect password exceeds, and the account is locked';
          break;
      case '1118':
          resultCode = '1118';
          errorDescription = 'Parameter repeated in parameter list';
          break;
      case '1155':
          resultCode = '1155';
          errorDescription = 'The number of login attempts with the incorrect username or password exceeds, and the account is locked';
          break;
      default:
          resultCode = '9999';
          errorDescription = 'Unknown error';
          break;
  }

  return `
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <SOAP-ENV:Body>
                <LGIResponse xmlns="rm:soap">
                    <result>
                        <resultCode>${resultCode}</resultCode>
                        <paras>
                            <key>errorDescription</key>
                            <value>${errorDescription}</value>
                        </paras>
                    </result>
                </LGIResponse>
            </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>
    `;
}


const httpServer = http.createServer(app);
httpServer.keepAliveTimeout = 67000;
httpServer.listen(PORT, () => 
{
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});
