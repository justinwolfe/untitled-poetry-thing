$(document).ready(function() {
	setInputs();
});

var runtime = {
	tokens: [],
	choiceLength: 2, 
	randomChoiceAmount: 25,
	suggestedChoiceAmount: 10,
	fileInputs: [],
	fileRequests: {},
	fileRequestIDs: [],
	requestCounter: 0,
	requestsStarted: false,
	requestsDone: false,
	inputString: ""
};

function setInputs(){
	runtime.fileInputs[0] = "Brown Corpus@assets/browncorpus.txt";
	runtime.fileInputs[1] = "Lives of the Artists by Giorgio Vasari@assets/livesoftheartists.txt";
	runtime.fileInputs[2] = "Grimm Fairy Tales@assets/grimm.txt";
	runtime.fileInputs[3] = "Moby Dick by Herman Melville@assets/mobydick.txt";
	for (i=0; i<runtime.fileInputs.length; i++){
		var tempArray = runtime.fileInputs[i].split("@");
		$("#fileInputContainer").append("<div><input type='checkbox' class='inputCheckbox' id='inputCheckbox" + i + "' value='" + tempArray[1] + "'>" + tempArray[0] + "</div>");
	};
	$("#startButton").click(function(){
		if (runtime.requestsStarted == false){
			collectInputs();
			runtime.requestsStarted = true;
		} else {
		};
	});
};

function collectInputs(){
	runtime.inputString += $("#textInput").val();
	$(".inputCheckbox").each(function(index){
		if ($(this).prop('checked') == true){
			runtime.fileRequests[$(this).attr('id')] = "started";
			runtime.fileRequestIDs.push($(this).attr('id'));
		};
	});
	if (runtime.fileRequestIDs.length >= 1){
		loadInputs();
	} else {
		processInputs();
	};
};

function loadInputs(){
	if (runtime.requestCounter < runtime.fileRequestIDs.length){
		var request = runtime.fileRequestIDs[runtime.requestCounter];
		var requestID = "#" + request;
		var requestLocation = $(requestID).val();
		$.get(requestLocation, function(data) {
			runtime.inputString += data;
			runtime.requestCounter += 1;
			if (runtime.requestCounter < runtime.fileRequestIDs.length){
				loadInputs();
			};
		}).done(function(){
			console.log(request + " done");
			runtime.fileRequests[request] = "done";
			for (var i=0; i<runtime.fileRequestIDs.length; i++){
				//setting it to true here so if it comes out of the loop still true, everything's done
				runtime.requestsDone = true;
				var id = runtime.fileRequestIDs[i];
				if (runtime.fileRequests[id] == "started"){
					runtime.requestsDone = false;
				};
			};
			if (runtime.requestsDone == true){
				processInputs();
			};
		});
	} else {
	};
};

function processInputs(){
	runtime.inputString = runtime.inputString.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g," ");
	runtime.inputString = runtime.inputString.replace(/"/g, "");
	runtime.inputString = runtime.inputString.replace(/(\r\n|\n|\r)/gm," ");
	runtime.inputString = runtime.inputString.replace(/\s{2,}/g, " ");
	runtime.inputString = runtime.inputString.toLowerCase();
	runtime.tokens = runtime.inputString.split(" "); 
	switchScreen();
	setUpLines();
	eventListeners();
	getChoices("random");
};

function switchScreen(){
	$("#inputScreen").hide();
	$("#writingScreen").show();
};

function eventListeners(){
	//$("ol.connected").sortable({group: 'connected', tolerance: -10});
	$( "#randomChoices, #selectedChoices, .connected" ).sortable({
      connectWith: ".connected",
	  tolerance: "pointer"
    })
// controls to add - new line, new stanza
	/*$("#randomChoices").on("click", "li", function() {
		var choice = $(this).text();
		$("#writingContainer").append("<li> " + choice + " </li>");
		if (choice.indexOf(" ") != -1){
			var tempArray = choice.split(" ");
			choice = tempArray.pop();
		};
		getChoices("suggested", choice);
	});
	$("#suggestedChoices").on("click", "li", function() {
		var choice = $(this).text();
		$("#writingContainer").append("<li> " + choice + " </li>");
		if (choice.indexOf(" ") != -1){
			var tempArray = choice.split(" ");
			choice = tempArray.pop();
		};
		getChoices("suggested", choice);
	});*/
};

function getChoices(type, word){
	var wordPositions = [];
	var choices = []; 
	if (type == "suggested"){
		for (i=0; i<runtime.tokens.length; i++){
			if (runtime.tokens[i] == word){
				wordPositions.push(i);
			};
		};
	} else if (type == "random"){
		for (i=0; i<runtime.randomChoiceAmount; i++){
			wordPositions.push(Math.floor((Math.random()*runtime.tokens.length - runtime.randomChoiceAmount)+0));
		};
	};
	for (i=0; i<wordPositions.length; i++){
		var tempChoice = wordPositions[i];
		var tempString = "";
		for (j=1; j<=runtime.choiceLength; j++){
			if (j>1){
				tempString += " ";
			};
			tempString += runtime.tokens[tempChoice + j];
		};
		choices.push(tempString);
	};
	if (type == "suggested"){
		giveChoices(choices, "#suggestedChoices");
	} else if (type == "random"){
		giveChoices(choices, "#randomChoices");
	};
};

function giveChoices(choices, container){
	var choicesString = "";
	if (container == "#suggestedChoices"){
		for (i=0; i<runtime.suggestedChoiceAmount; i++){
			var counter = Math.floor((Math.random()*choices.length)+0);
			choicesString += "<li class='suggestedChoice'>" + choices[counter] + "</li>";
		};
	} else if (container == "#randomChoices"){
		for (i=0; i<choices.length; i++){
			choicesString += "<li class='randomChoice'>" + choices[i] + "</li>";
		};
	};
	$(container).html("");
	$(container).append(choicesString);
};

function setUpLines(){
	for (i=0; i<10; i++){
		$("#poemContainer").append("<ul class='line connected'><li class='setup'></li></ul>");
	}
};

