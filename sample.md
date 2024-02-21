# Sample for if and case

```
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
    // keys.forEach(key => {
    //     switch (key) {
    //         case 'LGI':
    //             // Handle LGI operation
    //             const lgiData = soapBody['LGI'][0];
    //             handleLGI(lgiData, res);
    //             break;
    //         case 'LGO':
    //             // Handle LGO operation
    //             const lgoData = soapBody['LGO'][0]; // Extract data for LGO operation
    //             handleLGO(lgoData, res);
    //             break;
    //         default:
    //             console.log(`Unknown operation: ${key}`);
    //             console.log('No valid operation key found in the SOAP body');
    //             res.status(400).send('No valid operation key found in the SOAP body');
    //             break;
    //     }
    // });

    //////////////////

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

```






{
    "655730000347030": ["John Doe", "Jane Doe", "Alice Smith"],
    "123456789": ["Bob Johnson", "Emily Brown"]
}




/ Extract ISDN from SOAP XML body
 const isdnRegex = /<ISDN>(.*?)<\/ISDN>/;
 const match = xmlBody.match(isdnRegex);

 if (match) {
     const isdn = match[1];
     if (isdn.length > 15) {
        //{:error, "1033 :: Number threshold exceeded"}     
        console.log("15 digs");
         res.status(400).send('ISDN must be 15  digits long');
     } else {
         // Search for ISDN in the JSON data
         if (jsonData.hasOwnProperty(isdn)) {
             // ISDN found, return the data
             console.log("ISDN  found'");
             const responseXML = `<ISDN>${isdn}</ISDN><Relatives>${jsonData[isdn]}</Relatives>`;
             res.set('Content-Type', 'text/xml');
             res.status(200).send(`<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                         <soapenv:Body>
                             ${responseXML}
                         </soapenv:Body>
                     </soapenv:Envelope>`);
         } else {
             // ISDN not found, return an error
             console.log("ISDN not found'");

             const responseXML = `
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
            res.status(200).send(responseXML);

           
            // res.status(404).send('ISDN not found');
         }
     }
 } else {
     // ISDN not found in the SOAP XML body
     res.status(400).send('ISDN parameter not found in request');
 }