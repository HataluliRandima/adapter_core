const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');

const app = express();
const port = 3000;

// Middleware to parse SOAP XML requests
app.use(bodyParser.text({ type: 'text/xml' }));

app.post('/lgi', (req, res) => {
  const xml = req.body;

  // Parse XML to JSON
  xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
    if (err) {
      console.error('Error parsing XML:', err);
      return res.status(500).send('Error parsing XML');
    }

    // Accessing values of OPNAME and PWD
    const opname = result['soapenv:Envelope']['soapenv:Body']['rm:LGI']['inPara']['Login']['attribute']
      .find(attr => attr.key === 'OPNAME').value;

    const pwd = result['soapenv:Envelope']['soapenv:Body']['rm:LGI']['inPara']['Login']['attribute']
      .find(attr => attr.key === 'PWD').value;

    console.log('OPNAME:', opname);
    console.log('PWD:', pwd);

    // Send response
    res.send('Received SOAP request\nOPNAME: ' + opname + '\nPWD: ' + pwd);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
