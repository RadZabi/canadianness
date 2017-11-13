// ## Import libraries
const noflo = require('noflo');

// ## Useful functions
//
// Function to calculate most common value (the [mode](https://en.wikipedia.org/wiki/Mode_(statistics))
const findMode = function(array) {
  const frequency = {};
  let maxFrequency = 0;
  let result = undefined;
  for (let v in array) {
    frequency[array[v]] = (frequency[array[v]] || 0) + 1;
    if (frequency[array[v]] > maxFrequency) {
      maxFrequency = frequency[array[v]];
      result = array[v];
    }
  }
  return result;
};

// ## Component declaration
//
// Define the input and output ports, and describe their function
exports.getComponent = () => {
  const c = new noflo.Component({
    description: 'Find all of the instances of `word` in `content` and send them out in a stream',
    inPorts: {
      content: {
        datatype: 'string',
        description: 'the content which we look for the word in',
        required: true
      }
    },
    outPorts: {
      emotion: {
        datatype: 'string',
        description: 'the emotion based the content in ehs',
        required: true
      },
      error: {
        datatype: 'object'
      }
    }
  });

  // ## Processing function
  //
  c.process((input, output) => {
   
    // ### Receiving input
    //
    // We expect a [stream](noflojs.org/documentation/process-api/#full-stream)
    // Will also accept a single (non-bracketed) input packet, returned as a stream of length 1
    let emotion, mode;
    if (!input.hasStream('content')) { return; }
    let contents = input.getStream('content');

    // The output will be a single packet (not a stream),
    // hence we drop the `openBracket` and `closeBracket`
    contents = contents.filter(ip => ip.type === 'data');

    // extract the data payload from the IP objects
    contents = contents.map(ip => ip.data);

    // ### Component business logic
    //
    // First find which emotions are present, then calculate which one is most common.
    // This could alternatively be split into two dedicate components.

    // to hold the emotions found
    const matches = [];

    // the emotions we will use
    const emotions = {
      joy: ['eh!'],
      neutral: ['eh'],
      amusement: ['eh?', 'Eh?', 'Eh??'],
      fear: ['eH??', 'eh??'],
      surprise: ['eh !?', 'EH!?'],
      anticipation: ['eh?!'],
      excitment: ['EH!', 'eH!'],
      sadness: ['...eh', '...eh...', '..eh', 'eh..', '..eh..'],
      anger: ['EH!?', 'EH?']
    };

    // go through our content and our emotions
    // then add them to our `matches`
    contents.forEach((content) => {
      emotions.forEach((emotion) => {
        const data = emotions[emotion];
        if (content.indexOf(data) !== -1) {
          matches.push(emotion);
        }
      });
    });

    // if we didn't get any emotions, it default to 'neutral'
    if (matches.length === 0) {
      mode = 'neutral';
    // if we did, we need to find the emotion that was the most common
    } else {
      mode = findMode(matches);
    }

    // ### Send output
    //
    // Also signals completion by using `sendDone()`
    output.sendDone({emotion: mode});
  });

  return c;
};
