let express = require('express'),
  bodyParser = require('body-parser'),
  port = process.env.PORT || 3000,
  app = express();
let alexaVerifier = require('alexa-verifier');
const SKILL_NAME = 'Silvana Öffnungszeiten';
const GET_OH_MESSAGE = "Das Silvana ist heute ";
const HELP_MESSAGE = 'Sie können von mir die heutige Öffnungszeit des Silvana Hallenbads erfahren.';
const HELP_REPROMPT = 'Wie kann ich Ihnen weiterhelfen?';
const STOP_MESSAGE = 'Super! Tschüss schönen Feierabend!';
const MORE_MESSAGE = ' Haben Sie`s verstanden?'
const PAUSE = '<break time="0.3s" />'
const WHISPER = '<amazon:effect name="whispered"/>'

var end = '';
end = '';

app.use(bodyParser.json({
  verify: function getRawBody(req, res, buf) {
    req.rawBody = buf.toString();
  }
}));

function requestVerifier(req, res, next) {
  alexaVerifier(
    req.headers.signaturecertchainurl,
    req.headers.signature,
    req.rawBody,
    function verificationCallback(err) {
      if (err) {
        res.status(401).json({
          message: 'Verification Failure',
          error: err
        });
      } else {
        next();
      }
    }
  );
}

function log() {
  if (true) {
    console.log.apply(console, arguments);
  }
}

app.post('/openingHours', requestVerifier, function(req, res) {

  if (req.body.request.type === 'LaunchRequest') {
    var speechOutput = 'Willkommen bei Silvana Öffnungszeiten! <break time="0.3s" />' + HELP_REPROMPT;
    res.json(buildResponseWithRepromt(speechOutput, false, ''));
  } else if (req.body.request.type === 'SessionEndedRequest') { /* ... */
    log("Session End")
  } else if (req.body.request.type === 'IntentRequest') {

    if (req.body.request.intent.name == 'GetAllOpeningHours' || req.body.request.intent.name == 'AMAZON.NoIntent' ) 
    {
      loadJSON('https://us-central1-test-bcc13.cloudfunctions.net/openingHours', function (text) 
      {
        end = JSON.parse(text);

        var string = '';

        const heute = new Date();
        var index = heute.getDay();
    
        switch (index)
        {
          case 0:
            string = end[index+6].Sonntag.toString();
            break;
          case 1:
            string = end[index-1].Montag.toString();
            break;
          case 2:
            string = end[index-1].Dienstag.toString();
            break;
          case 3:
            string = end[index-1].Mittwoch.toString();
            break;
          case 4:
            string = end[index-1].Donnerstag.toString();
            break;
          case 5:
            string = end[index-1].Freitag.toString();
            break;
          case 6:
            string = end[index-1].Samstag.toString();
            break;
          default:
            break;
        }
        const tempOutput = GET_OH_MESSAGE + string + PAUSE;
        const speechOutput = tempOutput + MORE_MESSAGE;
        const more = MORE_MESSAGE;
        res.json(buildResponseWithRepromt(speechOutput, false,  more));
      });
    }
    
    else if (req.body.request.intent.name == 'AMAZON.YesIntent')
    {
      res.json(stopAndExit());
    }

    else if (req.body.request.intent.name == 'AMAZON.HelpIntent')
    {
      res.json(help());
    }

  }
});

function handleDataMissing() {
  return buildResponse(MISSING_DETAILS, true)
}

function stopAndExit() {

  const speechOutput = STOP_MESSAGE
  var jsonObj = buildResponse(speechOutput, true );
  return jsonObj;
}

function help() {

  const speechOutput = HELP_MESSAGE
  const reprompt = HELP_REPROMPT
  var jsonObj = buildResponseWithRepromt(speechOutput, false, reprompt);

  return jsonObj;
}


function loadJSON(file, callback) {

    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var xobj = new XMLHttpRequest();
    xobj.open('GET', file, true);
    xobj.setRequestHeader("Content-Type", "application/json");
    xobj.onreadystatechange = function () {

        if (xobj.readyState == 4 && xobj.status == '200') {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}


function buildResponse(speechText, shouldEndSession) {

  const speechOutput = "<speak>" + speechText + "</speak>"
  var jsonObj = {
    "version": "1.0",
    "response": {
      "shouldEndSession": shouldEndSession,
      "outputSpeech": {
        "type": "SSML",
        "ssml": speechOutput
      },
    }
  }
  return jsonObj
}

function buildResponseWithRepromt(speechText, shouldEndSession, reprompt) {

  const speechOutput = "<speak>" + speechText + "</speak>"
  var jsonObj = {
     "version": "1.0",
     "response": {
      "shouldEndSession": shouldEndSession,
       "outputSpeech": {
         "type": "SSML",
         "ssml": speechOutput
       },
     "reprompt": {
       "outputSpeech": {
         "type": "PlainText",
         "text": reprompt,
         "ssml": reprompt
       }
     }
   }
 }
  return jsonObj
}

app.listen(port);

console.log('Alexa list RESTful API server started on: ' + port);