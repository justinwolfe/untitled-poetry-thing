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
	$( "#randomChoices, #selectedChoices, .connected" ).sortable({
		connectWith: ".connected, #trash, #newLine",
		tolerance: "pointer",
		activate: function ( event, ui ) {
			removeEdit();
			showGuides();
		},
		beforeStop: function( event, ui ) {
			var textContainer = ui.item;
			var splitTextData = splitWords(textContainer);
			textContainer.replaceWith(splitTextData.container);
			getChoices("suggested", splitTextData.finalWord);
			hideGuides();
		}
    });
	$("#trash").droppable({
		accept: ".word, .suggestedChoice, .randomChoice",
		drop: function(event, ui) {
			ui.draggable.remove();
		}
	});
	$("#newLine").droppable({
		accept: ".word, .suggestedChoice, .randomChoice",
		drop: function(event, ui) {
			var textContainer = ui.draggable;
			var splitTextData = splitWords(textContainer);
			getChoices("suggested", splitTextData.finalWord);
			addLine(splitTextData.container);
			ui.draggable.remove();
		}
	});
	$(".setup").remove();
	$("#poemContainer").on("dblclick", "li", function () {
		$(this).attr('contenteditable', 'true').addClass('edit').focus();
	}).on("blur", "li.edit", function () {
		$(this).attr('contenteditable', 'false');
		// use this to clean up punctuation 
		cleanEdit();
		$(this).removeClass('edit');
	}).on("keydown", "li.edit", function (event) {
		var keyCode = event.keyCode;
		var caretPosition = window.getSelection().getRangeAt(0).startOffset;
		var wordContainer = $(this);
		var word = wordContainer.text()
		var wordIndex = wordContainer.index();
		var wordsInLine = wordContainer.siblings().length;
		//space bar
		if (keyCode == 32){
			event.preventDefault(); 
			console.log(caretPosition + ", " + word.length); 
			if (caretPosition == 0){
				wordContainer.blur();
			} else if (caretPosition > 0 && caretPosition < word.length){
				wordContainer.text(word.substring(0, caretPosition));
				wordContainer.after("<li class='word edit' contenteditable='true'>" + word.substring(caretPosition, word.length) + "</li>");
				wordContainer.next('li').focus();
			} else if (caretPosition >= word.length){
				wordContainer.after("<li class='word edit' contenteditable='true'></li>").next('li').focus();
				var sel = window.getSelection();
				sel.collapseToEnd();
			};
		};
		// backspace
		if (keyCode == 8){
			if (caretPosition == 0){
				if (wordIndex > 0){
					wordContainer.prev('.word').attr('contenteditable', 'true').addClass('edit').focus();
					var elem = wordContainer.prev('.word').get(0);
					setEndOfContenteditable(elem);
				} else {
					var prevParent = wordContainer.parent().prev();
					if (prevParent.hasClass('line') == true){
						prevParent.children().last('.word').addClass('edit').attr('contenteditable', 'true').focus();
						var elem = prevParent.children().last('.word').get(0);
						setEndOfContenteditable(elem);
					} else {
						event.preventDefault();
					};
				};
				//need to fix this so container is deleted if it's empty but isn't if it's not
				//wordContainer.remove();	
			} else {
			};
		};
		// enter
		if (keyCode == 13){
			event.preventDefault(); 
			var passNodes = "";
			var stopRemove = false;
			if (caretPosition == 0){
				if (wordIndex < wordsInLine){
					passNodes = "<li class='word'>" + word + "</li>"
					wordContainer.siblings().each( function () {
						if ($(this).index() > wordIndex){
							var tempWord = $(this).text();
							passNodes += "<li class='word'>" + tempWord + "</li>";
							$(this).remove();
						};
					});
				} else {
					passNodes = "<li class='word'>" + word + "</li>"
				};
			} else if (caretPosition > 0 && caretPosition < word.length){
				stopRemove = true;
				if (wordIndex < wordsInLine){
					wordContainer.text(word.substring(0, caretPosition));
					wordContainer.after("<li class='word'>" + word.substring(caretPosition, word.length) + "</li>");
					wordContainer.siblings().each( function () {
						if ($(this).index() > wordIndex){
							var tempWord = $(this).text();
							passNodes += "<li class='word'>" + tempWord + "</li>";
							$(this).remove();
						};
					});
				} else {
					//set this to before the return
					wordContainer.text(word.substring(0, caretPosition));	
					passNodes = "<li class='word'>" + word.substring(caretPosition, word.length) + "</li>"
				};
			} else if (caretPosition >= word.length){
				stopRemove = true;
				if (wordIndex < wordsInLine){
					$(this).siblings().each( function () {
						if ($(this).index() > wordIndex){
							var tempWord = $(this).text();
							passNodes += "<li class='word'>" + tempWord + "</li>";
							$(this).remove();
						};
					});
					console.log(passNodes);
				} else {	
					passNodes = "<li class='word'></li>";
				};
			};
			var nextParent = wordContainer.parent().next();
			if (nextParent.hasClass('line') == true){
				nextParent.prepend(passNodes);
				nextParent.children().first('.word').addClass('edit').attr('contenteditable', 'true').focus();
			} else {		
				//addLine();
			};
			if (stopRemove == true){
				return;
			} else {
				$(this).remove();
			};
		};
	});
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
	for (i=0; i<3; i++){
		$("#poemContainer").append("<ul class='line connected'><li class='setup'></li></ul>");
	};
};

function addLine(container){
	$("#poemContainer").append("<ul class='line connected'><li class='setup'></li></ul>");
	$("#poemContainer").children().last().sortable({
		connectWith: ".connected, #trash, #newLine",
		tolerance: "pointer",
		activate: function ( event, ui ) {
			removeEdit();
			showGuides();
		},
		beforeStop: function( event, ui ) {
			var textContainer = ui.item
			var splitTextData = splitWords(textContainer);
			textContainer.replaceWith(splitTextData.container);
			getChoices("suggested", splitTextData.finalWord);
			hideGuides();
		}
    });
	$(".setup").remove();
	$("#poemContainer").children().last().append(container);
};

function removeEdit(){
	$(".edit").attr('contenteditable', 'false');
	$(".edit").removeClass('edit');
};

function cleanEdit(){
	$(".edit").each(function(){
		var text = $(this).text();
		console.log(text);
	});
};

function showGuides(){
	$(".line").addClass("lineGUIDE");
};

function hideGuides(){
	$(".line").removeClass("lineGUIDE");
};

function splitWords(container){
	var text = container.text();
	var textArray = [];
	var replaceText = "";
	var finalWord = "";
	if (text.indexOf(" ") != -1){
		textArray = text.split(" ");
		for (i=0; i<textArray.length; i++){
			replaceText += "<li class='word'>" + textArray[i] + "</li>";
		};
		finalWord = textArray.pop();
	} else {
		replaceText = "<li class='word'>" + container.text() + "</li>";
		finalWord = container.text();
	};
	return {
		container: replaceText,
		finalWord: finalWord
	};
};

// from Nico Burns at http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
function setEndOfContenteditable(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}


