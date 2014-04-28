/* 
 * Exo Aquatic Game 
 * Copyright (c) 2014 Luke Nickerson, aka. Deathray Games 
 */



var ExoAquaticGameClass = function (dataDeliveryObj) 
{
	this.version = "0.000";
	this.hasGameStarted = false;
	this.dataDelivery = dataDeliveryObj;
	this.game = {
		"version"  			: this.version

	};
	this.monitorAttributeArray = ["depth", "o2", "energy", "data", "discoveries", "health", "credits"];
	this.currentAction = "";
	
	
//==============(((((((((((((((( OOOOoooo Loop ooooOOOO ))))))))))))))))===

	this.isLooping 		= false;
	this.loopTimer 		= 0;
	this.loopIteration 	= 0;
	this.lastTime 		= 0;
	//==== Loop timing Constants
	this.loopDelay		= 14;
	// ^ Decrease for more fps
	// 1000 = 1 second
	// 100 = 1/10th of a second
	// 16 = 1/?th of a second = 62.5 fps (closest to 60 fps)
	// 10 = 1/100th of a second (better than 60 fps)
	// Needs to be less than 16 to accomodate for the time it takes to run the loop 'stuff'
	this.framesPerSecond = (1000 / this.loopDelay);
	this.secondsPerLoop	= (this.loopDelay / 1000);
	// Update certain things once every X iterations
	this.loopModulusMoreLessFrequent = Math.round(this.framesPerSecond * 3); // once per 5 seconds
	this.loopModulusLessFrequent = Math.round(this.framesPerSecond * 2); // once per two seconds
	this.loopModulus		= Math.round(this.framesPerSecond); // once per second
	this.loopModulusAction	= Math.round(this.framesPerSecond / 2); // twice per second
	
	this.loop = function () 
	{	
		var o = this;

		if (o.isLooping) {
			o.loopIteration++;
			if (o.loopIteration < 15000000) {
				o.loopTimer = window.setTimeout(function(){
					o.loop();
				}, o.loopDelay); 
			} else {
				o.loopIteration = 0;
				o.togglePause(true);
			}
		}
		
		// Every Frame...
		o.redrawGameWorld();
		o.addDeltaAttributes(o.secondsPerLoop);
		o.checkAttributeBoundaries();
		

		// Often... 
		if ((o.loopIteration % o.loopModulusAction) == 0) {

			o.redrawMonitor();

		}		
		
		// Update these only every second or so... 
		if ((o.loopIteration % o.loopModulus) == 0) {
			//console.log("Loop tick ~1/second");
			//o.addDeltaAttributes(1);
			
			o.checkDeath();
			o.checkFishSwimBy();
			o.checkAtHQ();
			o.checkMovement();
		}		
		
		// Less Frequent than every second...
		if ((o.loopIteration % o.loopModulusLessFrequent) == 0) {			
			o.checkAchievements();
		}

		// Even more less frequent...
		if ((o.loopIteration % o.loopModulusMoreLessFrequent) == 0) {
			o.redrawUpgrades();
			o.redrawAchievements();
		}			
	
	}	
	
	this.togglePause = function (forcePause) {
		if (typeof forcePause === 'boolean') {
			if (this.isLooping == !forcePause) return false;
			this.isLooping = !forcePause;
		} else {
			this.isLooping = !this.isLooping;
		}
		if (this.isLooping) this.loop();
		console.log("Game " + ((this.isLooping) ? "un" : "") + "paused.");
	}

/* ============ REDRAWS ============ */
	
	this.redrawMonitor = function () 
	{
		var o = this;
		var a = "";
		var i = 0;
		var len = o.monitorAttributeArray.length;
		var h = "";
		for (i=0; i < len; i++) {
			a = o.monitorAttributeArray[i];
			h += '<li id="' + a + 'Monitor">'
				+ '<div class="label"><span>' + a + '</span></div>'
				+ '<div class="bar">'
				+ '<div style="width: ' + ((o.game.current[a] / o.att.max[a]) * 100) 
				+ '%"></div></div>'
				+ '<div class="numbers">'
				+ Math.round(o.game.current[a]) + ' / ' + Math.round(o.att.max[a]) 
				+ ' (' + o.att.finalDelta[a] + ' per sec)'
			;
			if (a == "depth" && this.isAtHQ) h += " HQ";
			h += '</div></li>';
			/*
			o.$monitorBars[a][0].style.width = ((o.game.current[a] / o.att.max[a]) * 100) + "%";
			h = Math.round(o.game.current[a]) + " / " + Math.round(o.att.max[a]) 
				+ " (" + o.att.finalDelta[a] + " per sec)"
			;
			if (a == "depth" && this.isAtHQ) h += " HQ";
			o.$monitorNumbers[a][0].innerHTML = h;
			*/
		}
		o.$monitorList[0].innerHTML = h;
	}
	
	this.redrawGameWorld = function () 
	{	
		var d = Math.round((this.game.current.depth  * -5));
		//this.$gameWorld.css("background-position", "0 " + d + "px");
		this.$gameWorld[0].style.backgroundPosition = "0 " + (d - 900) + "px";
		d = 
		this.$ship[0].style.backgroundPosition = "50% " + (d - 35) + "px";
	
	}
	
	this.redrawUpgrades = function ()
	{
		var h = '';
		var upgradeKey = "";
		var upgrade = {};
		var isOwned = false;
		// Loop over all possible upgrades
		for (upgradeKey in this.ref.upgrades) {
			upgrade = this.ref.upgrades[upgradeKey];
			isOwned = (this.game.upgradeArray.indexOf(upgradeKey) > -1) ? true : false;
			isBuyable = (typeof upgrade.cost !== 'undefined') ? true : false;
			h += '<li' + ((isOwned) ? ' class="owned" ' : ' ') + '>'
				+ '<div class="name">' + upgrade.name + '</div>'
			;
			if (isBuyable && !isOwned) {
				h += '<button type="button" class="buy" data-upgradekey="' + upgradeKey
					+ '">Buy ' + upgrade.cost + ' cr</button>';
			}
			h += '<div class="details">'
				+ '<div class="key">' + upgradeKey + '</div>'
				+  upgrade.description 
				+ '<ul>'
			;
			if (isBuyable) {
				h += '<li>COST:' + upgrade.cost + '</li>';
			}
			h += '<li>MAX:' + JSON.stringify(upgrade.max) + '</li>'
				+ '<li>PER SECOND:' + JSON.stringify(upgrade.delta) + '</li>'
				+ '<li>ACTIVE:' + JSON.stringify(upgrade.active) + '</li>'
				+ '</ul></div>'
				+ '</li>'
			;
		}
		this.$upgradesList[0].innerHTML = h;
	}
	
	this.redrawAchievements = function ()
	{
		this.$achievementsList
	
	}
	
/* ============ CHECKS ============ */
	
	this.checkAttributeBoundaries = function ()
	{
		if (this.game.current.depth <= 0) {
			this.game.current.depth = 0;
			this.setCurrentAction("");
		} else if (this.game.current.depth >= this.att.max.depth) {
			this.game.current.health -= 1;
		}
		if (this.game.current.energy > this.att.max.energy) {
			this.game.current.energy = this.att.max.energy;
		}
		if (this.game.current.o2 > this.att.max.o2) {
			this.game.current.o2 = this.att.max.o2;
		}
		if (this.game.current.data > this.att.max.data) {
			this.game.current.data = this.att.max.data;
			this.setCurrentAction("");
		} else if (this.game.current.data < 0) {
			this.game.current.data = 0;
			this.setCurrentAction("");
		}
		if (this.game.current.discoveries > this.att.max.discoveries) {
			this.game.current.discoveries = this.att.max.discoveries;
			this.setCurrentAction("");
		} else if (this.game.current.discoveries < 0) {
			this.game.current.discoveries = 0;
			this.setCurrentAction("");
		}
	}
	
	this.checkAtHQ = function ()
	{
		this.isAtHQ = (this.game.current.depth <= 10) ? true : false;
		if (this.isAtHQ) {
			this.$monitors.addClass("atHQ");
			this.$controls.addClass("atHQ");
			this.$upgrades.addClass("atHQ");
		} else {
			this.$monitors.removeClass("atHQ");
			this.$controls.removeClass("atHQ");
			this.$upgrades.removeClass("atHQ");
		}
		return this.isAtHQ;
	}
	
	this.checkMovement = function ()
	{
		switch (this.currentAction) {
			case "Ascending" :
				this.$character[0].className = "up";
			break;
			case "Descending" :
				this.$character[0].className = "down";
			break;
			case "Scanning" :
				this.$character[0].className = "scanning";
			break;	
			case "Transmitting" :
			case "Analyzing" :
				this.$character[0].className = "analyzing";
			break;			
			default:
				this.$character[0].className = "";
		}
	}
	
	this.checkDeath = function ()
	{
		if (this.game.current.health <= 0) {
			this.setCurrentAction("");
			this.togglePause(true);
			this.openMenu("death");
		}
		return false;
	}
	
	this.checkFishSwimBy = function ()
	{
	
	}
	
	this.checkAchievements = function ()
	{
		
	}	
	
/* ============ (o) ============ */
	
	this.addDeltaAttributes = function (t) 
	{
		this.att.finalDelta = this.cloneDataObject(this.att.delta);
		// If we're at HQ, then we get special values
		if (this.isAtHQ) {
			this.att.finalDelta.o2 += 10;
			this.att.finalDelta.energy += 10;
			this.att.finalDelta.health += 1;
			this.att.finalDelta.analyze += 1;
			this.att.finalDelta.trasmission += 1;
		}	

		switch (this.currentAction) {
			case "Scanning" :
				this.att.finalDelta.data += this.att.active.scan;
			break;
			case "Analyzing" :
				this.att.finalDelta.data -= this.att.active.analyze;
				var r = 100 - (this.att.active.analyze);
				if (this.roll1d(r) == 1) {
					this.att.finalDelta.discoveries += 1;
				}
			break;
			case "Transmitting" :
				if (this.att.finalDelta.discoveries > 0) {
					// *** This calculation needs work...
					this.att.finalDelta.discoveries -= this.att.active.transmission;
					this.att.finalDelta.credits += this.att.active.transmission;
				}
			break;
			case "Repairing" :
				// this.game.current.health += this.att.finalDelta.health;
			break;
			case "Ascending" :
				this.att.finalDelta.depth -= this.att.active.depth;
			break;
			case "Descending" :
				this.att.finalDelta.depth += this.att.active.depth;				
			break;			
		}
		if (this.currentAction != "") {
			this.att.finalDelta.o2 		+= this.att.active.o2;
			this.att.finalDelta.energy 	+= this.att.active.energy;
		}
		// Add fraction of final Delta based on time
		this.game.current.o2 			+= (t * this.att.finalDelta.o2);
		this.game.current.energy 		+= (t * this.att.finalDelta.energy);
		this.game.current.data 			+= (t * this.att.finalDelta.data);
		this.game.current.discoveries 	+= (t * this.att.finalDelta.discoveries);
		this.game.current.credits 		+= (t * this.att.finalDelta.credits);
		this.game.current.depth			+= (t * this.att.finalDelta.depth);
	}


	this.setCurrentAction = function (actionName) 
	{
		this.$currentAction.fadeOut();
		var actionNameFeedback = actionName;
		// Make sure this action can be set.
		switch (actionName) {
			case "Scanning" :
				if (this.isAtHQ) {
					actionNameFeedback = "Too close to ship";
					actionName = "";
				}
			break;
			case "Analyzing" :
				if (this.game.current.data <= 0) {
					actionNameFeedback = "No data to analyze";
					actionName = "";
				}
			break;
			case "Transmitting" :
				if (this.game.current.discoveries <= 0) {
					actionNameFeedback = "No discoveries to send";
					actionName = "";
				} else if (!this.isAtHQ) {
					actionNameFeedback = "Too far from the HQ ship at the surface to transmit";
					actionName = "";
				}
			break;
			case "Ascending" :
			case "Descending" :
				this.checkMovement();
			break;
		}
		var $controlButtons = this.$controls.find('button');
		$controlButtons.removeClass("current");
		this.currentAction = actionName;
		this.$currentAction.fadeIn().html(actionNameFeedback);
		if (!this.isLooping) alert("Game is paused.");
		if (actionName == "") {
			return false;
		} else {
			$controlButtons.filter('.' + actionName).addClass("current");
			return true;
		}
	}
	
	this.buyUpgrade = function (upgradeKey) 
	{
		var price = this.ref.upgrades[upgradeKey].cost;
		if (price <= this.game.current.credits) {
			this.game.current.credits -= price;
			this.game.upgradeArray.push(upgradeKey);
			this.redrawUpgrades();
			this.calculateAttributes();
			//alert("Upgrade purchased");
			if (upgradeKey == "STARS") {
				this.openMenu("win");
			}
			return true;
		} else {
			alert("Cannot afford upgrade!");
			return false;
		}
	
	}
	
	
	
	
	
	
//===================== Menus ============================================



	this.openMenu = function (menuName) 
	{
		var o = this;
		o.togglePause(true);
		o.hideAllTips();
		o.closeMenus(function(){
			$('#title').fadeIn(200);
			$('#' + menuName + 'Menu').fadeIn(300);
		}, false);
	}
	
	this.closeMenus = function (callback, closeTitle) 
	{
		var $visibleMenus = $('.menu').filter(":visible");
		if (typeof closeTitle !== 'boolean' || closeTitle) {
			$('#title').fadeOut(200);
		}
		if ($visibleMenus.length > 0) {
			$visibleMenus.fadeOut(200, function(){ 
				if (typeof callback === 'function') callback(); 
			});
		} else {
			if (typeof callback === 'function') callback(); 
		}
	}
	
	this.openGame = function()
	{

		$('#game').show();
	}
	
	this.showTip = function(tipNum) 
	{
		var o = this;
		var $tip = $('.tip' + tipNum);
		console.log("Show Tip " + tipNum);
		$tip.fadeIn(300).off("click").click(function(e){
			$tip.hide(300);
			o.showTip((tipNum + 1));
		});
	}
	
	this.hideAllTips = function()
	{
		console.log("Hiding all tips");
		$('.tip').hide();
	}

//===================================== START / LOAD / SAVE ===============

	this.newGame = function()
	{
		var o = this;
		
		$('.doNewGame').removeClass("cta");
		$('.doContinueGame').show(1000).addClass("cta");
		
		this.closeMenus(function(){
			o.setGameDefaults();
			o.openGame();
			o.togglePause(false);
			// Initial draw...
			o.redrawGameWorld();
			o.redrawMonitor();
			o.redrawUpgrades();
			o.redrawAchievements();
			o.showTip(1);
		});
	}
	
	this.continueGame = function()
	{
		// *** Try load
		// *** makee sure game exists
		var doesSaveExist = false;
		// *** if it exists, then load
		if (doesSaveExist) {
			o.openGame();
			// *** load	
		} else { 	// if it doesn't exist, start new
			this.newGame();
		}
		return doesSaveExist;
	}

	this.setGameDefaults = function()
	{
		this.game.current = {	
			o2 				: 0
			,energy			: 0
			,depth			: 4
			,health			: 0	
			,data			: 0
			,discoveries	: 0
			,credits		: 0
		};
		this.game.discoveryArray 	= [];
		this.game.upgradeArray 		= ["PILOT", "JAC", "AT1", "HD1"];
		this.game.achievementArray 	= [];
		this.calculateAttributes();
		// start with full charges
		this.game.current.o2 = this.att.max.o2;
		this.game.current.energy = this.att.max.energy;
		this.game.current.health = this.att.max.health;
	}
	
	this.resetAttributes = function () 
	{
		this.att = {};
		this.att.max = {	
			o2	 		: 0		// depends on air tanks
			,energy		: 0		// depends on battery packs
			,depth 		: 0		// dependent on armor / structure
			,health		: 0	
			,data		: 0		// dependent on computer
			,discoveries : 0	// dependent on ??
			,transmissionRange : 0	// dependent on antenna
			,credits	: 10000	// static
		};
		this.att.delta = {
			o2			: 0		// depends on number of people
			,energy		: 0		// depends on all upgrades
			,depth		: 0		// dependent on engine
			,health		: 0		// none / healing tech
			,data		: 0		// none
			,discoveries : 0	// none
			,credits	: 0		// investments
			,scan		: 0		// dependent on scanner power
			,analyze	: 0		// dependent on analysis cpu
			,trasmission : 0	// dependent on comm software	
		};
		this.att.active = this.cloneDataObject(this.att.delta);
		this.att.finalDelta = this.cloneDataObject(this.att.delta);
	}
	
	this.calculateAttributes = function() 
	{
		this.resetAttributes();
		var i = 0;
		var len = this.game.upgradeArray.length;
		var upgrade = {};
		var a = {};
		// Loop through all upgrades that the character has
		for (var i=0; i < len; i++) {
			upgrade = this.ref.upgrades[ this.game.upgradeArray[i] ];
			// Does the upgrade have any max attributes?
			//if (typeof upgrade.max === 'object') {
				for (a in upgrade.max) {
					if (typeof this.att.max[a] !== 'undefined') {
						this.att.max[a] += upgrade.max[a];
					}
				}
			//}
			// does the upgrade have any delta attributes?
			//if (typeof upgrade.delta === 'object') {
				// Loop over all upgrade deltas
				for (a in upgrade.delta) {
					if (typeof this.att.delta[a] !== 'undefined') {
						this.att.delta[a] += upgrade.delta[a];
					}
				}
			//}
			// does the upgrade have any active attributes?
			//if (typeof upgrade.active === 'object') {
				// Loop over all upgrade deltas
				for (a in upgrade.active) {
					if (typeof this.att.active[a] !== 'undefined') {
						this.att.active[a] += upgrade.active[a];
					}
				}
			//}			
		}
		//this.game.delta.energy = -0.01 * len;
		//console.log("Max Attributes", this.att.max);
		//console.log("Delta Attributes", this.att.finalDelta);
	
	}

	
	
	
	
//=============================================================================
//=======SSSSSSS=========== SETUP ===============SSSSSSSSSSSSSSSSSSSSSS====

	
	
	this.setup = function()
	{
		var o = this;
		this.dataDelivery.deliver("data/game_data.json", function(refData){
			// Continue with setup after data is loaded...
			o.loadImages(refData.images);
			o.setupElements();
			o.setupEvents();
			o.setupReferenceData(refData);
			
			//o.availableRaces = refData.availableRaces;
			//o.unavailableRaces = refData.unavailableRaces;
			//o.allLikes = refData.allLikes;			
			//console.log("Load zone");
			//o.loadZone("SOUTH");
			
			// Find DOM elements
			//o.magickaElt = document.getElementById('magicka');
			//o.staminaElt = document.getElementById('stamina');
			//o.healthElt	= document.getElementById('health');		
			//o.targetHealthElt	= $('#target .health')[0];
			//o.$interface	= $('#interface');
			
			o.whenImagesLoaded(0, function(){
				//o.launchGame(true);
				o.openMenu("begin");
			});
			
		});
	}
	
	this.loadImages = function (imagesRefObj) 
	{
		this.imagesCount = 0;
		this.imagesLoadedCount = 0;
		this.images = [];
		var o = this;
		for (v in imagesRefObj) {
			o.imagesCount++;
			o.images[v] = new Image();
			o.images[v].src = 'images/' + imagesRefObj[v];
			o.images[v].onload = function () {
				o.imagesLoadedCount++;
			}
		}
		console.log("Loading " + o.imagesCount + " images. (" + o.imagesLoadedCount + " done so far.)");
		
		// *** Do some loop to wait for images to load	
	}
	
	this.whenImagesLoaded = function (loadCounter, callback)
	{
		if (this.imagesLoadedCount == this.imagesCount) {
			console.log("All " + this.imagesCount + " images loaded.");
			callback();
			//return true;
		} else if (loadCounter > 100) {
			console.error("Could not load images.");
			alert("ERROR - Could not load images.");
		} else {
			var o = this;
			loadCounter++;
			window.setTimeout(function(){
				o.whenImagesLoaded(loadCounter, callback);
			}, 200);
			//return false;
		}
	}
	
	this.setupElements = function ()
	{
		var o = this;
		this.$monitors = $('#monitors');
		this.$upgrades = $('#upgrades')
		this.$monitorList = this.$monitors.find('ul').first();
		this.$currentAction = $('.currentAction');
		this.$upgradesList = this.$upgrades.find('ul').first();
		this.$achievementsList = $('#achievements').find('ul').first();
		this.$controls = $('#controls');
		this.$ship = $('#ship');
		this.$swimby = $('#swimby');
		this.$character = $('#character');
		this.$gameWorld = $('#gameWorld');
		this.$monitorBars = {
			"o2" :				o.$monitorList.find('#o2Monitor').find('.bar > div')
			,"energy" :			o.$monitorList.find('#energyMonitor').find('.bar > div')
			,"depth" :			o.$monitorList.find('#depthMonitor').find('.bar > div')
			,"health" :			o.$monitorList.find('#healthMonitor').find('.bar > div')
			,"data" :			o.$monitorList.find('#dataMonitor').find('.bar > div')
			,"discoveries" :	o.$monitorList.find('#discoveriesMonitor').find('.bar > div')
			,"credits" :		o.$monitorList.find('#creditsMonitor').find('.bar > div')
		};
		this.$monitorNumbers = {
			"o2" :				o.$monitorList.find('#o2Monitor').find('.numbers')
			,"energy" :			o.$monitorList.find('#energyMonitor').find('.numbers')
			,"depth" :			o.$monitorList.find('#depthMonitor').find('.numbers')
			,"health" :			o.$monitorList.find('#healthMonitor').find('.numbers')
			,"data" :			o.$monitorList.find('#dataMonitor').find('.numbers')
			,"discoveries" :	o.$monitorList.find('#discoveriesMonitor').find('.numbers')
			,"credits" :		o.$monitorList.find('#creditsMonitor').find('.numbers')	
		};
	}
	
	this.setupReferenceData = function(redData)
	{
		var upgradeKey = "";
		var upgrade = {};
		this.ref = {
			upgrades : 			refData.upgrades
			,achievements : 	refData.achievements
		};
		for (upgradeKey in this.ref.upgrades) {
			upgrade = this.ref.upgrades[upgradeKey];
			if (typeof upgrade.max === 'undefined') upgrade.max = {};
			if (typeof upgrade.active === 'undefined') upgrade.active = {};
			if (typeof upgrade.delta === 'undefined') upgrade.delta = {};
			if (typeof upgrade.description === 'undefined') upgrade.description = "";
		}
	
	}

	this.setupEvents = function() {
		var o = this;
		var $doc = $(document);

		$('.openMenu').click(function(e){
			o.openMenu( $(this).data("menu") );
			e.preventDefault();
		});
		
		$('.doNewGame').click(function(e){			o.newGame();		});
		
		$('.doContinueGame').click(function(e){		o.continueGame(); 	});
		
		$('.doTogglePause').click(function(e){		o.togglePause(); 	});
		
		$('.doQuit').click(function(e){			
			window.location = 'http://www.ludumdare.com/compo/?author_name=deathray';
		});
		

		o.$controls.on("click", "button", function(e){
			var $target = $(e.target);
			var $button = $target.closest('button');
			if ($button.hasClass("current")) {
				o.setCurrentAction("");
			} else {
				o.setCurrentAction( $button.data("action") );
			}
		});	
		
		o.$upgradesList.on("click", "button", function(e){
			var $target = $(e.target);
			o.buyUpgrade( $target.data("upgradekey") );
		});
		
		
		$doc.keydown(function(e){
			//console.log("Key down - " + e.which);
			switch(e.which) {
				case 65:	// "a"
				case 37:	// Left
					o.moveEntity(o.game.pc,10,-1);
					//$('.left').addClass("activated");
				break;
				case 87:	// "e"
				case 38:	// Up Arrow
					o.jumpEnt(o.game.pc, 4); 
					//console.log("Up");
					//o.moveCharacter({ x : 0, y : 0 });
				break;
				case 68:	// "d"
				case 39:	// Right
					o.moveEntity(o.game.pc,10,1);
				break;
				case 40:
					//console.log("Down");
					//o.moveCharacter({ x : 0, y : 0 });
				break;
				case 16:	// Shift
				break;
				case 32:	// Space
					//$('.btn-SPACE').addClass("activated");
				break;
				case 69:	// "e"
					//$('.btn-E').addClass("activated");
				break;
				case 27:	// ESC
					//$('.btn-ESC').addClass("activated");
				break;


				default: return; // allow other keys to be handled
			}

			// prevent default action (eg. page moving up/down)
			// but consider accessibility (eg. user may want to use keys to choose a radio button)
			e.preventDefault();	
			
		}).keyup(function(e){
			console.log("Key up - " + e.which);
			switch(e.which) {
				case 65:	// "a"
				case 37:	// Left
					o.stopEntity(o.game.pc);
					//o.isMovingLeft = false;
				break;
				case 38:	// Up
				break;
				case 68:	// "d"
				case 39:	// Right
					o.stopEntity(o.game.pc);
					//o.isMovingRight = false;
				break;
				case 83:	// "s"
				case 40:	// Down
					o.toggleEntitySneaking(o.game.pc);
				break;
				case 16:	// Shift
					
				break;
				case 32:	// Space
					//o.jumpEnt(o.game.pc, 4);
					//o.activateReadiedInventoryItem();
				break;
				case 67:	// "c"
					// Crafting
				break;
				case 69:	// "e"
					//o.attack("PC", 1);
				break;
				case 88:	// "x"
					// ?
				break;	
				case 81:	// "q"
					//o.attack("PC", -1);
				break;
				case 90:	// "z"
					// ?
				break;
				case 27:	// ESC
					o.openMenu("start");
					//$('.btn-ESC').removeClass("activated");
				break;					
				case 49:	// 1
				case 50:	// 2
				case 51:	// 3
				case 52:	// 4
				case 53:	// 5
				case 54:	// 6
				case 55:	// 7
				case 56:	// 8
				case 57:	// 9
					//o.readyInventoryItem(e.which - 49);
				break;
				case 80:	// "p"
					o.togglePause();
				break;				
				case 109:	// - (numeric)
				case 189:	// -
					o.zoomOut();
				break;
				case 221:	// ]
					o.alterCanvasSize( 40 );
				break;
				case 219:	// [
					o.alterCanvasSize( -40 );
				break;
				case 107:	// + (numeric)
				case 187:	// = (+ with shift)
					o.zoomIn();
				break;
				default: return; // allow other keys to be handled
			}
			// prevent default action (eg. page moving up/down)
			// but consider accessibility (eg. user may want to use keys to choose a radio button)
			e.preventDefault();		
		});	
		
		
		
		
	}
	

	//========================================= Helper Functions

	this.roll1d = function (sides) {
		return (Math.floor(Math.random()*sides) + 1);
	}
	
	this.cloneDataObject = function (o) {
		return JSON.parse(JSON.stringify(o));
	}

	//=///======================================== Construction ==\\\\\========
	this.construction = function () {
		
		if (!window.localStorage) {
			alert("This browser does not support localStorage, so this app will not run properly. Please try another browser, such as the most current version of Google Chrome.");
		}
		if (!window.jQuery) { alert("ERROR - jQuery is not loaded!"); }
	}
	this.construction();

}
