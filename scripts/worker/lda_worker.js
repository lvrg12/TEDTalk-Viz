self.onmessage = function( event )
{
    var transcripts = getTranscripts( event.data );
    var terms = topicise( transcripts );

    self.postMessage( terms );
    self.close();

    function topicise( transcripts )
    {
        //console.log("analysing "+transcripts.length+" transcripts...");
        var documents = new Array();
        var f = {};
        var vocab=new Array();
        var docCount=0;
        for(var i=0;i<transcripts.length;i++)
        {
            if (transcripts[i]=="") continue;
            var words = transcripts[i].split(/[\s,\"]+/);
            if(!words) continue;
            var wordIndices = new Array();
            for(var wc=0;wc<words.length;wc++)
            {
                var w=words[wc].toLowerCase().replace(/[^a-z\'A-Z0-9 ]+/g, '');
                //TODO: Add stemming
                if (w=="" || w.length==1 || stopwords[w] || w.indexOf("http")==0) continue;
                
                if (f[w])
                { 
                    f[w]=f[w]+1;			
                } 
                else if(w)
                { 
                    f[w]=1; 
                    vocab.push(w); 
                };	
                wordIndices.push(vocab.indexOf(w));
            }
            
            if (wordIndices && wordIndices.length>0)
            {
                documents[docCount++] = wordIndices;
            }
        }
            
        var V = vocab.length;
        var M = documents.length;
        // var K = parseInt($( "#topics" ).val());
        var K = 5;
        var alpha = 0.1;  // per-document distributions over topics
        var beta = .01;  // per-topic distributions over words

        lda.configure(documents,V,10000, 2000, 100, 10);
        lda.gibbs(K, alpha, beta);

        var theta = lda.getTheta();
        var phi = lda.getPhi();

        var terms = [];

        // console.log(phi);

        //topics
        var topTerms=20;
        var topicText = new Array();
        for (var k = 0; k < phi.length; k++)
        {
            var tuples = new Array();
            for (var w = 0; w < phi[k].length; w++)
            {
                tuples.push(""+phi[k][w].toPrecision(2)+"_"+vocab[w]);
            }
            
            tuples.sort().reverse();
            if(topTerms>vocab.length) topTerms=vocab.length;
            topicText[k]='';
            
            for (var t = 0; t < topTerms; t++)
            {
                var topicTerm=tuples[t].split("_")[1];
                var prob=parseInt(tuples[t].split("_")[0]*100);
                if (prob<0.0001) continue;
                terms.push([k,topicTerm,prob]);
                terms[topicTerm] = prob;
                console.log("topic "+k+": "+ topicTerm+" = " + prob  + "%");
                topicText[k] += ( topicTerm +" ");
            }
        }

        return terms;
        
    }

    function getTranscripts( talks_id )
    {
        var transcripts = [];

        return transcripts;
    }
};