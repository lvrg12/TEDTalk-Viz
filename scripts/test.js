var d3 = require("d3");
var lda = require('lda');
const csv = require('csv-parser')
const fs = require('fs')
const results = [];

// Example document.
// var text = 'Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.';

fs.createReadStream('scripts/transcripts.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
		// console.log(results);

		var count = 0;
		var documents = [];
		for( row in results )
		{
			var transcript = results[row].transcript;
			transcript = transcript.replace(/[^A-Za-z0-9 ]/gi, " ").replace(/( )+/g, " ");
			documents.push(transcript);
			// console.log(results[row].transcript)
			count++;

			if( count== 1 ) break;
		}
		// var text = 'Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.';

		// var documents = text.match( /[^\.!\?]+[\.!\?]+/g );
		var result = lda(documents, 2, 20);
		console.log( result );

  });