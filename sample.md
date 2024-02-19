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