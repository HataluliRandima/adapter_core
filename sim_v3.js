const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.text({ type: 'text/xml' }));

/////// Endpoints //////

//////////////// E.1 LGI ////////////
app.post('/', (req, res) => {

    /////
    console.log(req.body)
    xml2js.parseString(req.body, (err, result) => {
        if (err) {
            console.log(req.body)
            console.error('Error parsing SOAP request 1st:', err);
            return res.status(400).send('Error parsing SOAP request');
        }

        const soapBody = result['soapenv:Envelope']['soapenv:Body'][0];
        const keys = Object.keys(soapBody); 

        // const lgiData = soapBody['LGI'][0];
        // handleLGI(lgiData, res);

        keys.forEach(key => {
            switch (key) {
                case 'LGI':
                    // Handle LGI operation
                    const lgiData = soapBody['LGI'][0];
                    handleLGI(lgiData, res);
                    break;
                case 'rm:LGI':
                        // Handle LGI operation
                    const lgiData1 = soapBody['rm:LGI'][0];
                     handleLGIPCF(lgiData1, res);
                     break;    
                //try to add of when the is no seession token LGO
                case 'LGO':
                    // Handle LGI operation
                    if (req.params.sessionToken == undefined) {
                        console.log("The timestamp is expired.");
                        // return res.status(401).send('Session has expired Please Log in again');
                        const redirectURL = `http://169.10.20.100:8001/`;
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
                        // Handle LST_SUB operation
                        const SubData = soapBody['LST_SUB'][0]; // Extract data for LGO operation
                        // req.body
                        handleLST(req.body, res);
                        break;
                    case 'RMV_SUB':
                         // Handle LGO operation
                         const SubrmvData = soapBody['RMV_SUB'][0]; // Extract data for LGO operation
                            // req.body
                        handleRMV(req.body, res);
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

            const redirectURL = `http://169.10.20.100:8001/`;

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


function handleLGIPCF(lgiData, res) {
        // Accessing the Login object
        const loginObj = lgiData.inPara[0].Login[0];

        // Accessing the values of OPNAME and PWD
        const opnameAttr = loginObj.attribute.find(attr => attr.key[0] === 'OPNAME');
        const pwdAttr = loginObj.attribute.find(attr => attr.key[0] === 'PWD');
    
        // Check if attributes exist before accessing their values
        if (!opnameAttr || !pwdAttr) {
            console.error('OPNAME or PWD attribute not found');
            return res.status(400).send('OPNAME or PWD attribute not found in LGI request');
        }
    
        const opname = opnameAttr.value[0];
        const pwd = pwdAttr.value[0];
    
        // Now you have access to opname and pwd, you can use them as needed
        console.log('OPNAME:', opname);
        console.log('PWD:', pwd);
    
        // You can send a response back if needed
        res.status(200).send('LGI operation handled successfully');
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

    console.log(OPNAME)

    // Check if the session for the user exists
    if (activeSessions1[OPNAME]) {
        const sessionData = activeSessions1[OPNAME];

        // Check if the session is expired
        if (!isSessionExpired(sessionData)) {
            // Session is not expired, update timestamp
            sessionData.timestamp = Date.now();
            const sessionToken = sessionData.sessionToken;
            const redirectURL = `http://169.10.20.100:8001/${sessionToken}`;


            console.log(activeSessions1)
            res.set({
                'Content-Type': 'application/xml',
                'Location': redirectURL,
                'Connection': 'Keep-Alive'
            });

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

            return res.status(307).send(responseXML);
        } else {
            // Session has expired, remove the user from activeSessions
            // delete activeSessions1[OPNAME];
            // return res.status(401).send('Session has expired Please Log in again');
///
console.log("New session from LGI")
            delete activeSessions1[OPNAME];

            //tempLGI(data);

            // const { OPNAME, PWD } = data;
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



            //return res.status(401).send('Session has expired Please Log in again');
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

// Function to handle LGO operation
function handleLGO(data, res) {
    //   const { Username, Password } = data;
    const redirectURL = `http://169.10.20.100:8001/`;

    const responseXML = `
      <soapenv:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soapenv:Body>
              <LGOResponse>
                  <Result>
                      <ResultCode>0</ResultCode>
                      <ResultDesc>Operation is successful</ResultDesc>
                  </Result>
              </LGOResponse>
          </soapenv:Body>
      </soapenv:Envelope>
  `;

    res.set({
        'Content-Type': 'text/xml',
        'Location': redirectURL,
        'Connection': 'Keep-Alive'
    });

    console.log("Logout kind work")

    res.status(307).send(responseXML);
}


function handleRMV(data, res) {
    // Load the JSON file containing ISDN data
    const jsonData = JSON.parse(fs.readFileSync('data1.json'));

    // Parse the SOAP XML body
    const xmlBody = data;

    const imsiRegex = /<IMSI>(.*?)<\/IMSI>/;
    const detailimsiRegex = /<RMVKI>(.*?)<\/RMVKI>/;
    const match1 = xmlBody.match(imsiRegex);
    const detailMatch1 = xmlBody.match(detailimsiRegex);


    if (match1 && detailMatch1) 
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


              let has = `<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>${imsi}</IMSI></Group><Group><ISDN>${foundData.isdn}</ISDN></Group><Group><CardType>USIM</CardType><NAM>BOTH</NAM><CATEGORY>COMMON</CATEGORY><SUB_AGE>0</SUB_AGE></Group></Group><Group Name ="&quot;LOCK&quot;" ><GSM_IC>FALSE</GSM_IC><GSM_OC>FALSE</GSM_OC></Group><Group><GPRSLOCK>FALSE</GPRSLOCK></Group><Group Name ="&quot;SABLOCK&quot;" ><SABLOCK_IC>FALSE</SABLOCK_IC><SABLOCK_OC>FALSE</SABLOCK_OC></Group><Group Name ="&quot;Basic Service&quot;" ><Group><TS>Telephony (TS11)</TS><TS>Emergency Call (TS12)</TS><TS>Short Message MT_PP (TS21)</TS><TS>Short Message MO_PP (TS22)</TS><TS>Alternate Speech and Facsimile Group 3 (TS61)</TS><TS>AutomaticFacsimileGroup3 (TS62)</TS></Group></Group><Group><DEFAULTCALL_TS>Telephony (TS11)</DEFAULTCALL_TS></Group><Group Name ="&quot;ODB Data&quot;" ><ODBSS>FALSE</ODBSS><ODBOC>NOBOC</ODBOC><ODBIC>NOBIC</ODBIC><ODBPB1>FALSE</ODBPB1><ODBPB2>FALSE</ODBPB2><ODBPB3>FALSE</ODBPB3><ODBPB4>FALSE</ODBPB4><ODBENTE>FALSE</ODBENTE><ODBINFO>FALSE</ODBINFO><ODBROAM>NOBAR</ODBROAM><ODBRCF>NOBRCF</ODBRCF><ODBECT>NOBECT</ODBECT><ODBDECT>FALSE</ODBDECT><ODBMECT>FALSE</ODBMECT><ODBPOS>NOBPOS</ODBPOS><ODBPOSTYPE>BOTH</ODBPOSTYPE><ODBENTEROAM>FALSE</ODBENTEROAM><ODBINFOROAM>FALSE</ODBINFOROAM></Group><Group Name ="&quot;SS Data&quot;" ><Group><CFU>NOTPROV</CFU></Group><Group><CFB>NOTPROV</CFB></Group><Group><CFNRY>NOTPROV</CFNRY></Group><Group><CFNRC>NOTPROV</CFNRC></Group><Group><CFD>NOTPROV</CFD></Group><Group><BAOC>NOTPROV</BAOC><BOIC>NOTPROV</BOIC><BOICEXHC>NOTPROV</BOICEXHC><BORO>NOTPROV</BORO><BAIC>NOTPROV</BAIC><BICROAM>NOTPROV</BICROAM><CBCOU>SUBSCRIBER</CBCOU><CLIP>NOTPROV</CLIP><CLIR>NOTPROV</CLIR><COLP>NOTPROV</COLP><COLR>NOTPROV</COLR><ECT>NOTPROV</ECT><CW>NOTPROV</CW><HOLD>NOTPROV</HOLD><MPTY>NOTPROV</MPTY><MC>NOTPROV</MC><AOCI>NOTPROV</AOCI><AOCC>NOTPROV</AOCC><CUG>NOTPROV</CUG><UUS1>NOTPROV</UUS1><UUS2>NOTPROV</UUS2><UUS3>NOTPROV</UUS3><SMSCF>NOTPROV</SMSCF><plmn-specificSS-1>NOTPROV</plmn-specificSS-1><plmn-specificSS-2>NOTPROV</plmn-specificSS-2><plmn-specificSS-3>NOTPROV</plmn-specificSS-3><plmn-specificSS-4>NOTPROV</plmn-specificSS-4><plmn-specificSS-5>NOTPROV</plmn-specificSS-5><plmn-specificSS-6>NOTPROV</plmn-specificSS-6><plmn-specificSS-7>NOTPROV</plmn-specificSS-7><plmn-specificSS-8>NOTPROV</plmn-specificSS-8><plmn-specificSS-9>NOTPROV</plmn-specificSS-9><plmn-specificSS-A>NOTPROV</plmn-specificSS-A><plmn-specificSS-B>NOTPROV</plmn-specificSS-B><plmn-specificSS-C>NOTPROV</plmn-specificSS-C><plmn-specificSS-D>NOTPROV</plmn-specificSS-D><plmn-specificSS-E>NOTPROV</plmn-specificSS-E><plmn-specificSS-F>NOTPROV</plmn-specificSS-F><CNAP>NOTPROV</CNAP></Group></Group><Group><Group Name ="&quot;TIF-CSI&quot;" ><TIFCSI>NOTPROV</TIFCSI></Group></Group><Group><SMDP>MSC</SMDP><ALS>NOTPROV</ALS><VVDN>NOTPROV</VVDN><ARD>PROV</ARD><UTRANNOTALLOWED>FALSE</UTRANNOTALLOWED><GERANNOTALLOWED>FALSE</GERANNOTALLOWED><CARP>NOTPROV</CARP><RROption>ALL_PLMNS</RROption><VBS>NOTPROV</VBS><VGCS>NOTPROV</VGCS><EMLPP>NOTPROV</EMLPP><FMInit>NOTPROV</FMInit><FMSupervisor>NOTPROV</FMSupervisor><FMRemote>NOTPROV</FMRemote><IST>NOTPROV</IST><DIC>NOTPROV</DIC></Group><Group Name ="&quot;Dynamic Status Information For GSM&quot;" ><BaocForVlrRestrict>FALSE</BaocForVlrRestrict><Group><MsPurgedForNonGprs>FALSE</MsPurgedForNonGprs><VLRInHplmn>TRUE</VLRInHplmn><VLRInHomeCountry>TRUE</VLRInHomeCountry><VLRInArea>FALSE</VLRInArea><RequireCheckSS>FALSE</RequireCheckSS><RoamingRestrictInMscDueToUnsupportedFeature>FALSE</RoamingRestrictInMscDueToUnsupportedFeature><MscOrVlrAreaRoamingRestrict>FALSE</MscOrVlrAreaRoamingRestrict><ODBarredForUnsupportedCamel>FALSE</ODBarredForUnsupportedCamel><SupportedCamelPhase1>FALSE</SupportedCamelPhase1><SupportedCamelPhase2>FALSE</SupportedCamelPhase2><SupportedCamelPhase3>FALSE</SupportedCamelPhase3><SupportedCamelPhase4>FALSE</SupportedCamelPhase4><SRIMsrnCfActive>TRUE</SRIMsrnCfActive><ZoneCodeStatusAtMsc>zoneCodesSupported</ZoneCodeStatusAtMsc><longGroupIDSupported>FALSE</longGroupIDSupported><basicISTSupported>FALSE</basicISTSupported><istCommandSupported>FALSE</istCommandSupported><SuperChargerSupportedForGsm>FALSE</SuperChargerSupportedForGsm><ECATEGORYAtMsc>FALSE</ECATEGORYAtMsc><CS-MSISDN-LESS>FALSE</CS-MSISDN-LESS><CsUplStatus>Normal</CsUplStatus></Group></Group><Group Name ="&quot;Dynamic Status Information For GPRS&quot;" ><SgsnInHplmn>TRUE</SgsnInHplmn><MsPurgedForGprs>FALSE</MsPurgedForGprs><SgsnInHomeCountry>TRUE</SgsnInHomeCountry><SgsnInArea>FALSE</SgsnInArea><RoamingRestrictInSgsnDueToUnsupportedFeature>FALSE</RoamingRestrictInSgsnDueToUnsupportedFeature><SgsnAreaRoamingRestrict>FALSE</SgsnAreaRoamingRestrict><ODBarredForUnsupportedCamelForGprs>FALSE</ODBarredForUnsupportedCamelForGprs><PS-MSISDN-LESS>FALSE</PS-MSISDN-LESS><PsUplStatus>Normal</PsUplStatus></Group><Group><SupportedCamelPhase3_SGSN>FALSE</SupportedCamelPhase3_SGSN><SupportedCamelPhase4_SGSN>FALSE</SupportedCamelPhase4_SGSN><SuperChargerSupportedForGprs>networkNode_AreaRestricted</SuperChargerSupportedForGprs><ZoneCodeStatusAtSgsn>zoneCodesSupported</ZoneCodeStatusAtSgsn></Group><Group Name ="&quot;Short Message Dynamic Data for GSM&quot;" ><MCEFforGSM>FALSE</MCEFforGSM><MNRF>FALSE</MNRF><MNRRforGSM>No Reason for Non-GPRS</MNRRforGSM></Group><Group Name ="&quot;Short Message Dynamic Data for GPRS&quot;" ><MCEFforGPRS>FALSE</MCEFforGPRS><MNRG>FALSE</MNRG><MNRRforGPRS>No Reason</MNRRforGPRS><SupportedShortMessageMTPP>TRUE</SupportedShortMessageMTPP><SupportedShortMessageMOPP>TRUE</SupportedShortMessageMOPP></Group><Group Name ="&quot;ODB Supported Features For GSM&quot;" ><BarredSSAccess>TRUE</BarredSSAccess><BarredOutgoingEntertainmentCall>TRUE</BarredOutgoingEntertainmentCall><BarredOutgoingInformationCall>TRUE</BarredOutgoingInformationCall><SupGSMODB-BarredOutgoingInternationalCallExHC>TRUE</SupGSMODB-BarredOutgoingInternationalCallExHC><SupGSMODB-BarredOutgoingInternationalCall>TRUE</SupGSMODB-BarredOutgoingInternationalCall><SupGSMODB-BarredAllOutgoingCall>TRUE</SupGSMODB-BarredAllOutgoingCall><BarredAllECT>TRUE</BarredAllECT><BarredChargeableECT>TRUE</BarredChargeableECT><BarredInternationalECT>TRUE</BarredInternationalECT><BarredInterzonalECT>TRUE</BarredInterzonalECT><BarredDECT>TRUE</BarredDECT><BarredMECT>TRUE</BarredMECT></Group><Group Name ="&quot;ODB Supported Features For GPRS&quot;" ><SupGPRSODB-BarredAllOutgoingCall>TRUE</SupGPRSODB-BarredAllOutgoingCall><SupGPRSODB-BarredOutgoingInternationalCall>TRUE</SupGPRSODB-BarredOutgoingInternationalCall><SupGPRSODB-BarredOutgoingInternationalCallExHC>TRUE</SupGPRSODB-BarredOutgoingInternationalCallExHC><BarringofPacketOrientedServices>TRUE</BarringofPacketOrientedServices></Group><Group Name ="&quot;Supported LCS&quot;" ><MSCSupportedLCSCapabilitySet1>FALSE</MSCSupportedLCSCapabilitySet1><MSCSupportedLCSCapabilitySet2>FALSE</MSCSupportedLCSCapabilitySet2><SGSNSupportedLCSCapabilitySet2>FALSE</SGSNSupportedLCSCapabilitySet2></Group><Group Name ="&quot;Featured Service Supported Features&quot;" ><ALS_DYN>FALSE</ALS_DYN><VVDN_DYN>FALSE</VVDN_DYN></Group><Group Name ="&quot;5GS Data&quot;" ><AMBRUP>4</AMBRUP><UPUNIT>Gbps</UPUNIT><AMBRDW>4</AMBRDW><DWUNIT>Gbps</DWUNIT><RATRESTRICT>WLAN</RATRESTRICT><RFSPINDEX>1</RFSPINDEX><SUBSREGTIMER>54</SUBSREGTIMER><MPS>TRUE</MPS><MCS>FALSE</MCS><ACTIVETIME>54</ACTIVETIME><DLBUFFERIND>NOT_REQUESTED</DLBUFFERIND><DLBUFFER>0</DLBUFFER><AUTHTYPE>5G-AKA</AUTHTYPE><MICOALLOWED>TRUE</MICOALLOWED><SMSSUBSCRIBED>FALSE</SMSSUBSCRIBED><MTSMS>FALSE</MTSMS><MTSMSBA>FALSE</MTSMSBA><MTSMSBR>FALSE</MTSMSBR><MOSMS>FALSE</MOSMS><MOSMSBA>FALSE</MOSMSBA><MOSMSBR>FALSE</MOSMSBR><Group><SNSSAI>1-010101</SNSSAI><DEFSNSSAI>TRUE</DEFSNSSAI><DNN>satest</DNN><DEFAULT>TRUE</DEFAULT><DNNQOSTPLID>1</DNNQOSTPLID></Group></Group></ResultData></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;
           
              let scu = `<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><SOAP-ENV:Body><RMV_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc></Result></RMV_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;

              res.set('Content-Type', 'text/xml');
              res.status(200).send(scu);

             
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

                let responseXML = "<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><soapenv:Body><LST_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>" + foundData.imsi + "</IMSI></Group>Group><ISDN>" +isdn +"</ISDN></Group>";

                // Include CardType if Detail is true
                if (detail === 'TRUE') {
                    responseXML += "<Group><CardType>" + foundData.card_type + "</CardType><NAM>"+foundData.nam +"</NAM><CATEGORY>" + foundData.category +"</CATEGORY></Group>";
                }

                responseXML += "</Group></ResultData></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>";

              //  let resphata = "<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>${foundData.imsi}</IMSI></Group><Group><ISDN>${isdn}</ISDN></Group><Group><CardType>USIM</CardType><NAM>BOTH</NAM><CATEGORY>COMMON</CATEGORY><SUB_AGE>0</SUB_AGE></Group></Group><Group Name ="&quot;LOCK&quot;" ><GSM_IC>FALSE</GSM_IC><GSM_OC>FALSE</GSM_OC></Group><Group><GPRSLOCK>FALSE</GPRSLOCK></Group><Group Name ="&quot;SABLOCK&quot;" ><SABLOCK_IC>FALSE</SABLOCK_IC><SABLOCK_OC>FALSE</SABLOCK_OC></Group><Group Name =\"&quot;Basic Service&quot;\" ><Group><TS>Telephony (TS11)</TS><TS>Emergency Call (TS12)</TS><TS>Short Message MT_PP (TS21)</TS><TS>Short Message MO_PP (TS22)</TS><TS>Alternate Speech and Facsimile Group 3 (TS61)</TS><TS>AutomaticFacsimileGroup3 (TS62)</TS></Group></Group><Group><DEFAULTCALL_TS>Telephony (TS11)</DEFAULTCALL_TS></Group><Group Name ="&quot;ODB Data&quot;" ><ODBSS>FALSE</ODBSS><ODBOC>NOBOC</ODBOC><ODBIC>NOBIC</ODBIC><ODBPB1>FALSE</ODBPB1><ODBPB2>FALSE</ODBPB2><ODBPB3>FALSE</ODBPB3><ODBPB4>FALSE</ODBPB4><ODBENTE>FALSE</ODBENTE><ODBINFO>FALSE</ODBINFO><ODBROAM>NOBAR</ODBROAM><ODBRCF>NOBRCF</ODBRCF><ODBECT>NOBECT</ODBECT><ODBDECT>FALSE</ODBDECT><ODBMECT>FALSE</ODBMECT><ODBPOS>NOBPOS</ODBPOS><ODBPOSTYPE>BOTH</ODBPOSTYPE><ODBENTEROAM>FALSE</ODBENTEROAM><ODBINFOROAM>FALSE</ODBINFOROAM></Group><Group Name =\"&quot;SS Data&quot;\" ><Group><CFU>NOTPROV</CFU></Group><Group><CFB>NOTPROV</CFB></Group><Group><CFNRY>NOTPROV</CFNRY></Group><Group><CFNRC>NOTPROV</CFNRC></Group><Group><CFD>NOTPROV</CFD></Group><Group><BAOC>NOTPROV</BAOC><BOIC>NOTPROV</BOIC><BOICEXHC>NOTPROV</BOICEXHC><BORO>NOTPROV</BORO><BAIC>NOTPROV</BAIC><BICROAM>NOTPROV</BICROAM><CBCOU>SUBSCRIBER</CBCOU><CLIP>NOTPROV</CLIP><CLIR>NOTPROV</CLIR><COLP>NOTPROV</COLP><COLR>NOTPROV</COLR><ECT>NOTPROV</ECT><CW>NOTPROV</CW><HOLD>NOTPROV</HOLD><MPTY>NOTPROV</MPTY><MC>NOTPROV</MC><AOCI>NOTPROV</AOCI><AOCC>NOTPROV</AOCC><CUG>NOTPROV</CUG><UUS1>NOTPROV</UUS1><UUS2>NOTPROV</UUS2><UUS3>NOTPROV</UUS3><SMSCF>NOTPROV</SMSCF><plmn-specificSS-1>NOTPROV</plmn-specificSS-1><plmn-specificSS-2>NOTPROV</plmn-specificSS-2><plmn-specificSS-3>NOTPROV</plmn-specificSS-3><plmn-specificSS-4>NOTPROV</plmn-specificSS-4><plmn-specificSS-5>NOTPROV</plmn-specificSS-5><plmn-specificSS-6>NOTPROV</plmn-specificSS-6><plmn-specificSS-7>NOTPROV</plmn-specificSS-7><plmn-specificSS-8>NOTPROV</plmn-specificSS-8><plmn-specificSS-9>NOTPROV</plmn-specificSS-9><plmn-specificSS-A>NOTPROV</plmn-specificSS-A><plmn-specificSS-B>NOTPROV</plmn-specificSS-B><plmn-specificSS-C>NOTPROV</plmn-specificSS-C><plmn-specificSS-D>NOTPROV</plmn-specificSS-D><plmn-specificSS-E>NOTPROV</plmn-specificSS-E><plmn-specificSS-F>NOTPROV</plmn-specificSS-F><CNAP>NOTPROV</CNAP></Group></Group><Group><Group Name ="&quot;TIF-CSI&quot;" ><TIFCSI>NOTPROV</TIFCSI></Group></Group><Group><SMDP>MSC</SMDP><ALS>NOTPROV</ALS><VVDN>NOTPROV</VVDN><ARD>PROV</ARD><UTRANNOTALLOWED>FALSE</UTRANNOTALLOWED><GERANNOTALLOWED>FALSE</GERANNOTALLOWED><CARP>NOTPROV</CARP><RROption>ALL_PLMNS</RROption><VBS>NOTPROV</VBS><VGCS>NOTPROV</VGCS><EMLPP>NOTPROV</EMLPP><FMInit>NOTPROV</FMInit><FMSupervisor>NOTPROV</FMSupervisor><FMRemote>NOTPROV</FMRemote><IST>NOTPROV</IST><DIC>NOTPROV</DIC></Group><Group Name =\"&quot;Dynamic Status Information For GSM&quot;\" ><BaocForVlrRestrict>FALSE</BaocForVlrRestrict><Group><MsPurgedForNonGprs>FALSE</MsPurgedForNonGprs><VLRInHplmn>TRUE</VLRInHplmn><VLRInHomeCountry>TRUE</VLRInHomeCountry><VLRInArea>FALSE</VLRInArea><RequireCheckSS>FALSE</RequireCheckSS><RoamingRestrictInMscDueToUnsupportedFeature>FALSE</RoamingRestrictInMscDueToUnsupportedFeature><MscOrVlrAreaRoamingRestrict>FALSE</MscOrVlrAreaRoamingRestrict><ODBarredForUnsupportedCamel>FALSE</ODBarredForUnsupportedCamel><SupportedCamelPhase1>FALSE</SupportedCamelPhase1><SupportedCamelPhase2>FALSE</SupportedCamelPhase2><SupportedCamelPhase3>FALSE</SupportedCamelPhase3><SupportedCamelPhase4>FALSE</SupportedCamelPhase4><SRIMsrnCfActive>TRUE</SRIMsrnCfActive><ZoneCodeStatusAtMsc>zoneCodesSupported</ZoneCodeStatusAtMsc><longGroupIDSupported>FALSE</longGroupIDSupported><basicISTSupported>FALSE</basicISTSupported><istCommandSupported>FALSE</istCommandSupported><SuperChargerSupportedForGsm>FALSE</SuperChargerSupportedForGsm><ECATEGORYAtMsc>FALSE</ECATEGORYAtMsc><CS-MSISDN-LESS>FALSE</CS-MSISDN-LESS><CsUplStatus>Normal</CsUplStatus></Group></Group><Group Name =\"&quot;Dynamic Status Information For GPRS&quot;\" ><SgsnInHplmn>TRUE</SgsnInHplmn><MsPurgedForGprs>FALSE</MsPurgedForGprs><SgsnInHomeCountry>TRUE</SgsnInHomeCountry><SgsnInArea>FALSE</SgsnInArea><RoamingRestrictInSgsnDueToUnsupportedFeature>FALSE</RoamingRestrictInSgsnDueToUnsupportedFeature><SgsnAreaRoamingRestrict>FALSE</SgsnAreaRoamingRestrict><ODBarredForUnsupportedCamelForGprs>FALSE</ODBarredForUnsupportedCamelForGprs><PS-MSISDN-LESS>FALSE</PS-MSISDN-LESS><PsUplStatus>Normal</PsUplStatus></Group><Group><SupportedCamelPhase3_SGSN>FALSE</SupportedCamelPhase3_SGSN><SupportedCamelPhase4_SGSN>FALSE</SupportedCamelPhase4_SGSN><SuperChargerSupportedForGprs>networkNode_AreaRestricted</SuperChargerSupportedForGprs><ZoneCodeStatusAtSgsn>zoneCodesSupported</ZoneCodeStatusAtSgsn></Group><Group Name =\"&quot;Short Message Dynamic Data for GSM&quot;\" ><MCEFforGSM>FALSE</MCEFforGSM><MNRF>FALSE</MNRF><MNRRforGSM>No Reason for Non-GPRS</MNRRforGSM></Group><Group Name =\"&quot;Short Message Dynamic Data for GPRS&quot;\" ><MCEFforGPRS>FALSE</MCEFforGPRS><MNRG>FALSE</MNRG><MNRRforGPRS>No Reason</MNRRforGPRS><SupportedShortMessageMTPP>TRUE</SupportedShortMessageMTPP><SupportedShortMessageMOPP>TRUE</SupportedShortMessageMOPP></Group><Group Name =\"&quot;ODB Supported Features For GSM&quot;\" ><BarredSSAccess>TRUE</BarredSSAccess><BarredOutgoingEntertainmentCall>TRUE</BarredOutgoingEntertainmentCall><BarredOutgoingInformationCall>TRUE</BarredOutgoingInformationCall><SupGSMODB-BarredOutgoingInternationalCallExHC>TRUE</SupGSMODB-BarredOutgoingInternationalCallExHC><SupGSMODB-BarredOutgoingInternationalCall>TRUE</SupGSMODB-BarredOutgoingInternationalCall><SupGSMODB-BarredAllOutgoingCall>TRUE</SupGSMODB-BarredAllOutgoingCall><BarredAllECT>TRUE</BarredAllECT><BarredChargeableECT>TRUE</BarredChargeableECT><BarredInternationalECT>TRUE</BarredInternationalECT><BarredInterzonalECT>TRUE</BarredInterzonalECT><BarredDECT>TRUE</BarredDECT><BarredMECT>TRUE</BarredMECT></Group><Group Name =\"&quot;ODB Supported Features For GPRS&quot;\" ><SupGPRSODB-BarredAllOutgoingCall>TRUE</SupGPRSODB-BarredAllOutgoingCall><SupGPRSODB-BarredOutgoingInternationalCall>TRUE</SupGPRSODB-BarredOutgoingInternationalCall><SupGPRSODB-BarredOutgoingInternationalCallExHC>TRUE</SupGPRSODB-BarredOutgoingInternationalCallExHC><BarringofPacketOrientedServices>TRUE</BarringofPacketOrientedServices></Group><Group Name =\"&quot;Supported LCS&quot;\" ><MSCSupportedLCSCapabilitySet1>FALSE</MSCSupportedLCSCapabilitySet1><MSCSupportedLCSCapabilitySet2>FALSE</MSCSupportedLCSCapabilitySet2><SGSNSupportedLCSCapabilitySet2>FALSE</SGSNSupportedLCSCapabilitySet2></Group><Group Name =\"&quot;Featured Service Supported Features&quot;\" ><ALS_DYN>FALSE</ALS_DYN><VVDN_DYN>FALSE</VVDN_DYN></Group><Group Name ="&quot;5GS Data&quot;" ><AMBRUP>4</AMBRUP><UPUNIT>Gbps</UPUNIT><AMBRDW>4</AMBRDW><DWUNIT>Gbps</DWUNIT><RATRESTRICT>WLAN</RATRESTRICT><RFSPINDEX>1</RFSPINDEX><SUBSREGTIMER>54</SUBSREGTIMER><MPS>TRUE</MPS><MCS>FALSE</MCS><ACTIVETIME>54</ACTIVETIME><DLBUFFERIND>NOT_REQUESTED</DLBUFFERIND><DLBUFFER>0</DLBUFFER><AUTHTYPE>5G-AKA</AUTHTYPE><MICOALLOWED>TRUE</MICOALLOWED><SMSSUBSCRIBED>FALSE</SMSSUBSCRIBED><MTSMS>FALSE</MTSMS><MTSMSBA>FALSE</MTSMSBA><MTSMSBR>FALSE</MTSMSBR><MOSMS>FALSE</MOSMS><MOSMSBA>FALSE</MOSMSBA><MOSMSBR>FALSE</MOSMSBR><Group><SNSSAI>1-010101</SNSSAI><DEFSNSSAI>TRUE</DEFSNSSAI><DNN>satest</DNN><DEFAULT>TRUE</DEFAULT><DNNQOSTPLID>1</DNNQOSTPLID></Group></Group></ResultData></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>";

                let jj = `<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>${foundData.imsi}</IMSI></Group><Group><ISDN>${isdn}</ISDN></Group><Group><CardType>USIM</CardType><NAM>BOTH</NAM><CATEGORY>COMMON</CATEGORY><SUB_AGE>0</SUB_AGE></Group></Group><Group Name ="&quot;LOCK&quot;" ><GSM_IC>FALSE</GSM_IC><GSM_OC>FALSE</GSM_OC></Group><Group><GPRSLOCK>FALSE</GPRSLOCK></Group><Group Name ="&quot;SABLOCK&quot;" ><SABLOCK_IC>FALSE</SABLOCK_IC><SABLOCK_OC>FALSE</SABLOCK_OC></Group><Group Name ="&quot;Basic Service&quot;" ><Group><TS>Telephony (TS11)</TS><TS>Emergency Call (TS12)</TS><TS>Short Message MT_PP (TS21)</TS><TS>Short Message MO_PP (TS22)</TS><TS>Alternate Speech and Facsimile Group 3 (TS61)</TS><TS>AutomaticFacsimileGroup3 (TS62)</TS></Group></Group><Group><DEFAULTCALL_TS>Telephony (TS11)</DEFAULTCALL_TS></Group><Group Name ="&quot;ODB Data&quot;" ><ODBSS>FALSE</ODBSS><ODBOC>NOBOC</ODBOC><ODBIC>NOBIC</ODBIC><ODBPB1>FALSE</ODBPB1><ODBPB2>FALSE</ODBPB2><ODBPB3>FALSE</ODBPB3><ODBPB4>FALSE</ODBPB4><ODBENTE>FALSE</ODBENTE><ODBINFO>FALSE</ODBINFO><ODBROAM>NOBAR</ODBROAM><ODBRCF>NOBRCF</ODBRCF><ODBECT>NOBECT</ODBECT><ODBDECT>FALSE</ODBDECT><ODBMECT>FALSE</ODBMECT><ODBPOS>NOBPOS</ODBPOS><ODBPOSTYPE>BOTH</ODBPOSTYPE><ODBENTEROAM>FALSE</ODBENTEROAM><ODBINFOROAM>FALSE</ODBINFOROAM></Group><Group Name ="&quot;SS Data&quot;" ><Group><CFU>NOTPROV</CFU></Group><Group><CFB>NOTPROV</CFB></Group><Group><CFNRY>NOTPROV</CFNRY></Group><Group><CFNRC>NOTPROV</CFNRC></Group><Group><CFD>NOTPROV</CFD></Group><Group><BAOC>NOTPROV</BAOC><BOIC>NOTPROV</BOIC><BOICEXHC>NOTPROV</BOICEXHC><BORO>NOTPROV</BORO><BAIC>NOTPROV</BAIC><BICROAM>NOTPROV</BICROAM><CBCOU>SUBSCRIBER</CBCOU><CLIP>NOTPROV</CLIP><CLIR>NOTPROV</CLIR><COLP>NOTPROV</COLP><COLR>NOTPROV</COLR><ECT>NOTPROV</ECT><CW>NOTPROV</CW><HOLD>NOTPROV</HOLD><MPTY>NOTPROV</MPTY><MC>NOTPROV</MC><AOCI>NOTPROV</AOCI><AOCC>NOTPROV</AOCC><CUG>NOTPROV</CUG><UUS1>NOTPROV</UUS1><UUS2>NOTPROV</UUS2><UUS3>NOTPROV</UUS3><SMSCF>NOTPROV</SMSCF><plmn-specificSS-1>NOTPROV</plmn-specificSS-1><plmn-specificSS-2>NOTPROV</plmn-specificSS-2><plmn-specificSS-3>NOTPROV</plmn-specificSS-3><plmn-specificSS-4>NOTPROV</plmn-specificSS-4><plmn-specificSS-5>NOTPROV</plmn-specificSS-5><plmn-specificSS-6>NOTPROV</plmn-specificSS-6><plmn-specificSS-7>NOTPROV</plmn-specificSS-7><plmn-specificSS-8>NOTPROV</plmn-specificSS-8><plmn-specificSS-9>NOTPROV</plmn-specificSS-9><plmn-specificSS-A>NOTPROV</plmn-specificSS-A><plmn-specificSS-B>NOTPROV</plmn-specificSS-B><plmn-specificSS-C>NOTPROV</plmn-specificSS-C><plmn-specificSS-D>NOTPROV</plmn-specificSS-D><plmn-specificSS-E>NOTPROV</plmn-specificSS-E><plmn-specificSS-F>NOTPROV</plmn-specificSS-F><CNAP>NOTPROV</CNAP></Group></Group><Group><Group Name ="&quot;TIF-CSI&quot;" ><TIFCSI>NOTPROV</TIFCSI></Group></Group><Group><SMDP>MSC</SMDP><ALS>NOTPROV</ALS><VVDN>NOTPROV</VVDN><ARD>PROV</ARD><UTRANNOTALLOWED>FALSE</UTRANNOTALLOWED><GERANNOTALLOWED>FALSE</GERANNOTALLOWED><CARP>NOTPROV</CARP><RROption>ALL_PLMNS</RROption><VBS>NOTPROV</VBS><VGCS>NOTPROV</VGCS><EMLPP>NOTPROV</EMLPP><FMInit>NOTPROV</FMInit><FMSupervisor>NOTPROV</FMSupervisor><FMRemote>NOTPROV</FMRemote><IST>NOTPROV</IST><DIC>NOTPROV</DIC></Group><Group Name ="&quot;Dynamic Status Information For GSM&quot;" ><BaocForVlrRestrict>FALSE</BaocForVlrRestrict><Group><MsPurgedForNonGprs>FALSE</MsPurgedForNonGprs><VLRInHplmn>TRUE</VLRInHplmn><VLRInHomeCountry>TRUE</VLRInHomeCountry><VLRInArea>FALSE</VLRInArea><RequireCheckSS>FALSE</RequireCheckSS><RoamingRestrictInMscDueToUnsupportedFeature>FALSE</RoamingRestrictInMscDueToUnsupportedFeature><MscOrVlrAreaRoamingRestrict>FALSE</MscOrVlrAreaRoamingRestrict><ODBarredForUnsupportedCamel>FALSE</ODBarredForUnsupportedCamel><SupportedCamelPhase1>FALSE</SupportedCamelPhase1><SupportedCamelPhase2>FALSE</SupportedCamelPhase2><SupportedCamelPhase3>FALSE</SupportedCamelPhase3><SupportedCamelPhase4>FALSE</SupportedCamelPhase4><SRIMsrnCfActive>TRUE</SRIMsrnCfActive><ZoneCodeStatusAtMsc>zoneCodesSupported</ZoneCodeStatusAtMsc><longGroupIDSupported>FALSE</longGroupIDSupported><basicISTSupported>FALSE</basicISTSupported><istCommandSupported>FALSE</istCommandSupported><SuperChargerSupportedForGsm>FALSE</SuperChargerSupportedForGsm><ECATEGORYAtMsc>FALSE</ECATEGORYAtMsc><CS-MSISDN-LESS>FALSE</CS-MSISDN-LESS><CsUplStatus>Normal</CsUplStatus></Group></Group><Group Name ="&quot;Dynamic Status Information For GPRS&quot;" ><SgsnInHplmn>TRUE</SgsnInHplmn><MsPurgedForGprs>FALSE</MsPurgedForGprs><SgsnInHomeCountry>TRUE</SgsnInHomeCountry><SgsnInArea>FALSE</SgsnInArea><RoamingRestrictInSgsnDueToUnsupportedFeature>FALSE</RoamingRestrictInSgsnDueToUnsupportedFeature><SgsnAreaRoamingRestrict>FALSE</SgsnAreaRoamingRestrict><ODBarredForUnsupportedCamelForGprs>FALSE</ODBarredForUnsupportedCamelForGprs><PS-MSISDN-LESS>FALSE</PS-MSISDN-LESS><PsUplStatus>Normal</PsUplStatus></Group><Group><SupportedCamelPhase3_SGSN>FALSE</SupportedCamelPhase3_SGSN><SupportedCamelPhase4_SGSN>FALSE</SupportedCamelPhase4_SGSN><SuperChargerSupportedForGprs>networkNode_AreaRestricted</SuperChargerSupportedForGprs><ZoneCodeStatusAtSgsn>zoneCodesSupported</ZoneCodeStatusAtSgsn></Group><Group Name ="&quot;Short Message Dynamic Data for GSM&quot;" ><MCEFforGSM>FALSE</MCEFforGSM><MNRF>FALSE</MNRF><MNRRforGSM>No Reason for Non-GPRS</MNRRforGSM></Group><Group Name ="&quot;Short Message Dynamic Data for GPRS&quot;" ><MCEFforGPRS>FALSE</MCEFforGPRS><MNRG>FALSE</MNRG><MNRRforGPRS>No Reason</MNRRforGPRS><SupportedShortMessageMTPP>TRUE</SupportedShortMessageMTPP><SupportedShortMessageMOPP>TRUE</SupportedShortMessageMOPP></Group><Group Name ="&quot;ODB Supported Features For GSM&quot;" ><BarredSSAccess>TRUE</BarredSSAccess><BarredOutgoingEntertainmentCall>TRUE</BarredOutgoingEntertainmentCall><BarredOutgoingInformationCall>TRUE</BarredOutgoingInformationCall><SupGSMODB-BarredOutgoingInternationalCallExHC>TRUE</SupGSMODB-BarredOutgoingInternationalCallExHC><SupGSMODB-BarredOutgoingInternationalCall>TRUE</SupGSMODB-BarredOutgoingInternationalCall><SupGSMODB-BarredAllOutgoingCall>TRUE</SupGSMODB-BarredAllOutgoingCall><BarredAllECT>TRUE</BarredAllECT><BarredChargeableECT>TRUE</BarredChargeableECT><BarredInternationalECT>TRUE</BarredInternationalECT><BarredInterzonalECT>TRUE</BarredInterzonalECT><BarredDECT>TRUE</BarredDECT><BarredMECT>TRUE</BarredMECT></Group><Group Name ="&quot;ODB Supported Features For GPRS&quot;" ><SupGPRSODB-BarredAllOutgoingCall>TRUE</SupGPRSODB-BarredAllOutgoingCall><SupGPRSODB-BarredOutgoingInternationalCall>TRUE</SupGPRSODB-BarredOutgoingInternationalCall><SupGPRSODB-BarredOutgoingInternationalCallExHC>TRUE</SupGPRSODB-BarredOutgoingInternationalCallExHC><BarringofPacketOrientedServices>TRUE</BarringofPacketOrientedServices></Group><Group Name ="&quot;Supported LCS&quot;" ><MSCSupportedLCSCapabilitySet1>FALSE</MSCSupportedLCSCapabilitySet1><MSCSupportedLCSCapabilitySet2>FALSE</MSCSupportedLCSCapabilitySet2><SGSNSupportedLCSCapabilitySet2>FALSE</SGSNSupportedLCSCapabilitySet2></Group><Group Name ="&quot;Featured Service Supported Features&quot;" ><ALS_DYN>FALSE</ALS_DYN><VVDN_DYN>FALSE</VVDN_DYN></Group><Group Name ="&quot;5GS Data&quot;" ><AMBRUP>4</AMBRUP><UPUNIT>Gbps</UPUNIT><AMBRDW>4</AMBRDW><DWUNIT>Gbps</DWUNIT><RATRESTRICT>WLAN</RATRESTRICT><RFSPINDEX>1</RFSPINDEX><SUBSREGTIMER>54</SUBSREGTIMER><MPS>TRUE</MPS><MCS>FALSE</MCS><ACTIVETIME>54</ACTIVETIME><DLBUFFERIND>NOT_REQUESTED</DLBUFFERIND><DLBUFFER>0</DLBUFFER><AUTHTYPE>5G-AKA</AUTHTYPE><MICOALLOWED>TRUE</MICOALLOWED><SMSSUBSCRIBED>FALSE</SMSSUBSCRIBED><MTSMS>FALSE</MTSMS><MTSMSBA>FALSE</MTSMSBA><MTSMSBR>FALSE</MTSMSBR><MOSMS>FALSE</MOSMS><MOSMSBA>FALSE</MOSMSBA><MOSMSBR>FALSE</MOSMSBR><Group><SNSSAI>1-010101</SNSSAI><DEFSNSSAI>TRUE</DEFSNSSAI><DNN>satest</DNN><DEFAULT>TRUE</DEFAULT><DNNQOSTPLID>1</DNNQOSTPLID></Group></Group></ResultData></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;

                res.set('Content-Type', 'text/xml');
                res.status(200).send(jj);

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


              let has = `<?xml version='1.0' ?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><SOAP-ENV:Body><LST_SUBResponse><Result><ResultCode>0</ResultCode><ResultDesc>SUCCESS0001:Operation is successful</ResultDesc><ResultData><Group><Group><HLRSN>1</HLRSN><IMSI>${imsi}</IMSI></Group><Group><ISDN>${foundData.isdn}</ISDN></Group><Group><CardType>USIM</CardType><NAM>BOTH</NAM><CATEGORY>COMMON</CATEGORY><SUB_AGE>0</SUB_AGE></Group></Group><Group Name ="&quot;LOCK&quot;" ><GSM_IC>FALSE</GSM_IC><GSM_OC>FALSE</GSM_OC></Group><Group><GPRSLOCK>FALSE</GPRSLOCK></Group><Group Name ="&quot;SABLOCK&quot;" ><SABLOCK_IC>FALSE</SABLOCK_IC><SABLOCK_OC>FALSE</SABLOCK_OC></Group><Group Name ="&quot;Basic Service&quot;" ><Group><TS>Telephony (TS11)</TS><TS>Emergency Call (TS12)</TS><TS>Short Message MT_PP (TS21)</TS><TS>Short Message MO_PP (TS22)</TS><TS>Alternate Speech and Facsimile Group 3 (TS61)</TS><TS>AutomaticFacsimileGroup3 (TS62)</TS></Group></Group><Group><DEFAULTCALL_TS>Telephony (TS11)</DEFAULTCALL_TS></Group><Group Name ="&quot;ODB Data&quot;" ><ODBSS>FALSE</ODBSS><ODBOC>NOBOC</ODBOC><ODBIC>NOBIC</ODBIC><ODBPB1>FALSE</ODBPB1><ODBPB2>FALSE</ODBPB2><ODBPB3>FALSE</ODBPB3><ODBPB4>FALSE</ODBPB4><ODBENTE>FALSE</ODBENTE><ODBINFO>FALSE</ODBINFO><ODBROAM>NOBAR</ODBROAM><ODBRCF>NOBRCF</ODBRCF><ODBECT>NOBECT</ODBECT><ODBDECT>FALSE</ODBDECT><ODBMECT>FALSE</ODBMECT><ODBPOS>NOBPOS</ODBPOS><ODBPOSTYPE>BOTH</ODBPOSTYPE><ODBENTEROAM>FALSE</ODBENTEROAM><ODBINFOROAM>FALSE</ODBINFOROAM></Group><Group Name ="&quot;SS Data&quot;" ><Group><CFU>NOTPROV</CFU></Group><Group><CFB>NOTPROV</CFB></Group><Group><CFNRY>NOTPROV</CFNRY></Group><Group><CFNRC>NOTPROV</CFNRC></Group><Group><CFD>NOTPROV</CFD></Group><Group><BAOC>NOTPROV</BAOC><BOIC>NOTPROV</BOIC><BOICEXHC>NOTPROV</BOICEXHC><BORO>NOTPROV</BORO><BAIC>NOTPROV</BAIC><BICROAM>NOTPROV</BICROAM><CBCOU>SUBSCRIBER</CBCOU><CLIP>NOTPROV</CLIP><CLIR>NOTPROV</CLIR><COLP>NOTPROV</COLP><COLR>NOTPROV</COLR><ECT>NOTPROV</ECT><CW>NOTPROV</CW><HOLD>NOTPROV</HOLD><MPTY>NOTPROV</MPTY><MC>NOTPROV</MC><AOCI>NOTPROV</AOCI><AOCC>NOTPROV</AOCC><CUG>NOTPROV</CUG><UUS1>NOTPROV</UUS1><UUS2>NOTPROV</UUS2><UUS3>NOTPROV</UUS3><SMSCF>NOTPROV</SMSCF><plmn-specificSS-1>NOTPROV</plmn-specificSS-1><plmn-specificSS-2>NOTPROV</plmn-specificSS-2><plmn-specificSS-3>NOTPROV</plmn-specificSS-3><plmn-specificSS-4>NOTPROV</plmn-specificSS-4><plmn-specificSS-5>NOTPROV</plmn-specificSS-5><plmn-specificSS-6>NOTPROV</plmn-specificSS-6><plmn-specificSS-7>NOTPROV</plmn-specificSS-7><plmn-specificSS-8>NOTPROV</plmn-specificSS-8><plmn-specificSS-9>NOTPROV</plmn-specificSS-9><plmn-specificSS-A>NOTPROV</plmn-specificSS-A><plmn-specificSS-B>NOTPROV</plmn-specificSS-B><plmn-specificSS-C>NOTPROV</plmn-specificSS-C><plmn-specificSS-D>NOTPROV</plmn-specificSS-D><plmn-specificSS-E>NOTPROV</plmn-specificSS-E><plmn-specificSS-F>NOTPROV</plmn-specificSS-F><CNAP>NOTPROV</CNAP></Group></Group><Group><Group Name ="&quot;TIF-CSI&quot;" ><TIFCSI>NOTPROV</TIFCSI></Group></Group><Group><SMDP>MSC</SMDP><ALS>NOTPROV</ALS><VVDN>NOTPROV</VVDN><ARD>PROV</ARD><UTRANNOTALLOWED>FALSE</UTRANNOTALLOWED><GERANNOTALLOWED>FALSE</GERANNOTALLOWED><CARP>NOTPROV</CARP><RROption>ALL_PLMNS</RROption><VBS>NOTPROV</VBS><VGCS>NOTPROV</VGCS><EMLPP>NOTPROV</EMLPP><FMInit>NOTPROV</FMInit><FMSupervisor>NOTPROV</FMSupervisor><FMRemote>NOTPROV</FMRemote><IST>NOTPROV</IST><DIC>NOTPROV</DIC></Group><Group Name ="&quot;Dynamic Status Information For GSM&quot;" ><BaocForVlrRestrict>FALSE</BaocForVlrRestrict><Group><MsPurgedForNonGprs>FALSE</MsPurgedForNonGprs><VLRInHplmn>TRUE</VLRInHplmn><VLRInHomeCountry>TRUE</VLRInHomeCountry><VLRInArea>FALSE</VLRInArea><RequireCheckSS>FALSE</RequireCheckSS><RoamingRestrictInMscDueToUnsupportedFeature>FALSE</RoamingRestrictInMscDueToUnsupportedFeature><MscOrVlrAreaRoamingRestrict>FALSE</MscOrVlrAreaRoamingRestrict><ODBarredForUnsupportedCamel>FALSE</ODBarredForUnsupportedCamel><SupportedCamelPhase1>FALSE</SupportedCamelPhase1><SupportedCamelPhase2>FALSE</SupportedCamelPhase2><SupportedCamelPhase3>FALSE</SupportedCamelPhase3><SupportedCamelPhase4>FALSE</SupportedCamelPhase4><SRIMsrnCfActive>TRUE</SRIMsrnCfActive><ZoneCodeStatusAtMsc>zoneCodesSupported</ZoneCodeStatusAtMsc><longGroupIDSupported>FALSE</longGroupIDSupported><basicISTSupported>FALSE</basicISTSupported><istCommandSupported>FALSE</istCommandSupported><SuperChargerSupportedForGsm>FALSE</SuperChargerSupportedForGsm><ECATEGORYAtMsc>FALSE</ECATEGORYAtMsc><CS-MSISDN-LESS>FALSE</CS-MSISDN-LESS><CsUplStatus>Normal</CsUplStatus></Group></Group><Group Name ="&quot;Dynamic Status Information For GPRS&quot;" ><SgsnInHplmn>TRUE</SgsnInHplmn><MsPurgedForGprs>FALSE</MsPurgedForGprs><SgsnInHomeCountry>TRUE</SgsnInHomeCountry><SgsnInArea>FALSE</SgsnInArea><RoamingRestrictInSgsnDueToUnsupportedFeature>FALSE</RoamingRestrictInSgsnDueToUnsupportedFeature><SgsnAreaRoamingRestrict>FALSE</SgsnAreaRoamingRestrict><ODBarredForUnsupportedCamelForGprs>FALSE</ODBarredForUnsupportedCamelForGprs><PS-MSISDN-LESS>FALSE</PS-MSISDN-LESS><PsUplStatus>Normal</PsUplStatus></Group><Group><SupportedCamelPhase3_SGSN>FALSE</SupportedCamelPhase3_SGSN><SupportedCamelPhase4_SGSN>FALSE</SupportedCamelPhase4_SGSN><SuperChargerSupportedForGprs>networkNode_AreaRestricted</SuperChargerSupportedForGprs><ZoneCodeStatusAtSgsn>zoneCodesSupported</ZoneCodeStatusAtSgsn></Group><Group Name ="&quot;Short Message Dynamic Data for GSM&quot;" ><MCEFforGSM>FALSE</MCEFforGSM><MNRF>FALSE</MNRF><MNRRforGSM>No Reason for Non-GPRS</MNRRforGSM></Group><Group Name ="&quot;Short Message Dynamic Data for GPRS&quot;" ><MCEFforGPRS>FALSE</MCEFforGPRS><MNRG>FALSE</MNRG><MNRRforGPRS>No Reason</MNRRforGPRS><SupportedShortMessageMTPP>TRUE</SupportedShortMessageMTPP><SupportedShortMessageMOPP>TRUE</SupportedShortMessageMOPP></Group><Group Name ="&quot;ODB Supported Features For GSM&quot;" ><BarredSSAccess>TRUE</BarredSSAccess><BarredOutgoingEntertainmentCall>TRUE</BarredOutgoingEntertainmentCall><BarredOutgoingInformationCall>TRUE</BarredOutgoingInformationCall><SupGSMODB-BarredOutgoingInternationalCallExHC>TRUE</SupGSMODB-BarredOutgoingInternationalCallExHC><SupGSMODB-BarredOutgoingInternationalCall>TRUE</SupGSMODB-BarredOutgoingInternationalCall><SupGSMODB-BarredAllOutgoingCall>TRUE</SupGSMODB-BarredAllOutgoingCall><BarredAllECT>TRUE</BarredAllECT><BarredChargeableECT>TRUE</BarredChargeableECT><BarredInternationalECT>TRUE</BarredInternationalECT><BarredInterzonalECT>TRUE</BarredInterzonalECT><BarredDECT>TRUE</BarredDECT><BarredMECT>TRUE</BarredMECT></Group><Group Name ="&quot;ODB Supported Features For GPRS&quot;" ><SupGPRSODB-BarredAllOutgoingCall>TRUE</SupGPRSODB-BarredAllOutgoingCall><SupGPRSODB-BarredOutgoingInternationalCall>TRUE</SupGPRSODB-BarredOutgoingInternationalCall><SupGPRSODB-BarredOutgoingInternationalCallExHC>TRUE</SupGPRSODB-BarredOutgoingInternationalCallExHC><BarringofPacketOrientedServices>TRUE</BarringofPacketOrientedServices></Group><Group Name ="&quot;Supported LCS&quot;" ><MSCSupportedLCSCapabilitySet1>FALSE</MSCSupportedLCSCapabilitySet1><MSCSupportedLCSCapabilitySet2>FALSE</MSCSupportedLCSCapabilitySet2><SGSNSupportedLCSCapabilitySet2>FALSE</SGSNSupportedLCSCapabilitySet2></Group><Group Name ="&quot;Featured Service Supported Features&quot;" ><ALS_DYN>FALSE</ALS_DYN><VVDN_DYN>FALSE</VVDN_DYN></Group><Group Name ="&quot;5GS Data&quot;" ><AMBRUP>4</AMBRUP><UPUNIT>Gbps</UPUNIT><AMBRDW>4</AMBRDW><DWUNIT>Gbps</DWUNIT><RATRESTRICT>WLAN</RATRESTRICT><RFSPINDEX>1</RFSPINDEX><SUBSREGTIMER>54</SUBSREGTIMER><MPS>TRUE</MPS><MCS>FALSE</MCS><ACTIVETIME>54</ACTIVETIME><DLBUFFERIND>NOT_REQUESTED</DLBUFFERIND><DLBUFFER>0</DLBUFFER><AUTHTYPE>5G-AKA</AUTHTYPE><MICOALLOWED>TRUE</MICOALLOWED><SMSSUBSCRIBED>FALSE</SMSSUBSCRIBED><MTSMS>FALSE</MTSMS><MTSMSBA>FALSE</MTSMSBA><MTSMSBR>FALSE</MTSMSBR><MOSMS>FALSE</MOSMS><MOSMSBA>FALSE</MOSMSBA><MOSMSBR>FALSE</MOSMSBR><Group><SNSSAI>1-010101</SNSSAI><DEFSNSSAI>TRUE</DEFSNSSAI><DNN>satest</DNN><DEFAULT>TRUE</DEFAULT><DNNQOSTPLID>1</DNNQOSTPLID></Group></Group></ResultData></Result></LST_SUBResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;
              res.set('Content-Type', 'text/xml');
              res.status(200).send(has);

             
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
