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
    switch (req.body.request.intent.name) {
      case 'GetAllOpeningHours':
        res.json(getOpeningHours());
        break;
      case 'AMAZON.NoIntent':
        res.json(getOpeningHours());
        break;
      case 'AMAZON.YesIntent':
        res.json(stopAndExit());
        break;
      case 'AMAZON.HelpIntent':
        res.json(help());
        break;
      default:
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

function getOpeningHours() {

  var answer = '';
  var end = '';
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var xhttp = new XMLHttpRequest();
  xhttp.open("GET", "https://us-central1-test-bcc13.cloudfunctions.net/openingHours", true);
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.send(null);
  xhttp.onreadystatechange = function() {
  if (this.readyState == 4) {

  end = JSON.parse(xhttp.responseText);
  console.log("==== END ====");
  console.log(end);
  answer = end[1].Dienstag.toString() + ' geöffnet.';
  console.log("==== ANSWER ====");
  console.log(answer);

  // const openings = data;
  // const heute = new Date();
  // const openingIndex = heute.getDay();
  // const day = openings[openingIndex];
  const tempOutput = GET_OH_MESSAGE + answer + PAUSE;
  const speechOutput = tempOutput + MORE_MESSAGE;
  const more = MORE_MESSAGE;

  return buildResponseWithRepromt(speechOutput, false,  more);
  }
}
  return;
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