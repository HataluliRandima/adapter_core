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
      
        const username = result['soapenv:Envelope']['soapenv:Body'][0]['rm:LGI'][0]['inPara'][0]['Login'][0]['attribute']
                                .find(attr => attr.key[0] === 'OPNAME').value[0];

        const password = result['soapenv:Envelope']['soapenv:Body'][0]['rm:LGI'][0]['inPara'][0]['Login'][0]['attribute']
                                .find(attr => attr.key[0] === 'PWD').value[0];
  
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
        res.set
            ({
                'Content-Type': 'application/xml',
                'Location': 'http://localhost:8002/234564324',
                'Connection': 'Keep-Alive'
            });
        //res.status(307).contentType('application/xml').send(soapResponse); //redirect to do
        res.status(200).contentType('application/xml').send(soapResponse);
        
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
  
  app.post('/:sessionId', (req, res) => 
{
  
      res.status(200).send("testing pcf");
 
});
  const httpServer = http.createServer(app);
  httpServer.keepAliveTimeout = 67000;
  httpServer.listen(PORT, () => 
  {
    console.log(`HTTP Server is running on http://localhost:${PORT}`);
  });
  