/* 
 * Exo Aquatic Game 
 * Copyright (c) 2014 Luke Nickerson, aka. Deathray Games 
 */


var ExoAquaticEntityClass = function (entityType)
{
	this.type 			= entityType.toLowerCase();
	this.loc 			= { "x" : 0, "y" : 0, "z" : 1 };
	this.size 			= { "x" : 320, "y" : 160 };
	this.halfSize		= { "x" : 160, "y" : 80 };
	this.imageName		= "fish";
	this.isPhysics		= true;
	
	this.targetLoc 	= { "x" : 0, "y" : 0 };
	this.movementVel = { "x" : 0, "y" : 0 }; 
	this.facing 	= "right";
	this.movementFrame	= 1;	
}




var ExoAquaticGameClass = function (dataDeliveryObj) 
{
	this.version = "0.000";
	this.hasGameStarted = false;
	this.dataDelivery = dataDeliveryObj;
	this.game = {
		"version"  			: this.version
		,"currentZoneKey"	: ""
		,"entities" 		: {}
		,"pc" 				: {}
		,"species"			: {}
	};
	
	
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
	this.loopModulus		= Math.round(this.framesPerSecond); // once per second
	this.loopModulusAction	= Math.round(this.framesPerSecond / 2); // twice per second
	
	this.loop = function () 
	{	
		var o = this;
		
		
		
		o.redrawCanvas();
		
		
		
		
		
		
		
		
		
		
		
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

	

//=================== Movement & Physics =====\/\/\/\/\/\/\/\/\/\/\/\/=========

	this.gravity = -1;
	this.friction = 0.9;
	
	this.moveEntity = function (ent, desiredSpeed, direction) 
	{
		ent.movementVel.x += (1 * direction);
		// *** adjust max speed with acrobatics skill?
		var maxSpeed = (ent.isSneaking) ? 1 : 3;
		// You can only go as fast as the max speed
		if (desiredSpeed > maxSpeed) desiredSpeed = maxSpeed;
		if (Math.abs(ent.movementVel.x) > desiredSpeed) {
			ent.movementVel.x = desiredSpeed * direction;
		}
		//if (ent.type == "pc") {	console.log("movementVel = ", JSON.stringify(ent.movementVel));		}
		ent.stamina -= 0.6;
	}
	
	this.stopEntity = function (ent) 
	{
		ent.movementVel.x = 0;
	}
	
	this.knockbackEntity = function (ent, vel) {
		ent.vel.x = vel.x;
		ent.vel.y = vel.y;
	}
	
	this.jumpEnt = function (ent, y) 
	{
		var groundY = 0; // *** use terrain height
		if (ent.loc.y <= groundY) {
			ent.vel.y += y;
		}
		
	}
	
	this.groundPhysics = function (t) // *** allow for different times?
	{
		var o = this;
		var rightEdgeX = this.zones[this.game.currentZoneKey].rightEdgeX;
		var groundY = 0; // *** use terrain height
		
		// Loop through all entities that need physics
		o.loopOverEntities("physics", function(entKey, ent){
			var isOnGround = (ent.loc.y <= groundY);
			
			/*
			if (entKey == "PC") {
				if (ent.vel.x != 0 || ent.vel.y != 0) {
					console.log("PC vel = " + JSON.stringify(ent.vel));
					//console.log("PC loc = " + JSON.stringify(ent.loc));
				}
				//console.log(JSON.stringify(ent.movementVel));
			
			}
			*/
			
			// Ground walking and friction
			if (isOnGround) {
				if (ent.vel.y < 0) {
					ent.vel.y = 0;
				}
				if (ent.movementVel.x != 0) {	// If walking, then no friction			
				
					// If the velocity boost from walking 
					// doesn't put you over speed, then give a boost
					var newVelX = (ent.vel.x + ent.movementVel.x);
					if (Math.abs(newVelX) <= Math.abs(ent.movementVel.x)) {
						ent.vel.x = newVelX;
						//if (ent.type == "pc") { console.log("Setting Vel x to ", newVelX); }
					} else {
						ent.vel.x = ent.movementVel.x;
						//if (ent.type == "pc") { console.log("Max'd out"); }
					}
					/*
					if (ent.type == "pc") {
						console.log("movementVel = ",JSON.stringify(ent.movementVel));
						console.log("newVelX = ", newVelX);
						console.log("PC vel = " + JSON.stringify(ent.vel));
					}
					*/					
					
				} else { // If no walking movement, then do friction
					if (ent.vel.x != 0) {
						ent.vel.x = ent.vel.x * o.friction;
						if (ent.vel.x < 0.05 && ent.vel.x > -0.05) ent.vel.x = 0;
					}
				}

			} else { // Not on the ground, so subject to gravity
				ent.vel.y += o.gravity;
			}
			
			//ent.vel.x += ent.acc.x;
			ent.loc.x += ent.vel.x;
			//ent.vel.y += ent.acc.y;
			ent.loc.y += ent.vel.y;
			
			//ent.movementVel.x = 0;
			//ent.movementVel.y = 0;
			
			if (entKey == "PC") {
				if (ent.vel.x != 0 || ent.vel.y != 0) {
					//console.log("PC x = " + ent.loc.x);
					//console.log("PC vel = " + JSON.stringify(ent.vel));
					//console.log("PC loc = " + JSON.stringify(ent.loc));
				}
			}
			
			if (ent.loc.x < 0) {				ent.loc.x = 0; }
			else if (ent.loc.x > rightEdgeX) {	ent.loc.x = rightEdgeX; }
			if (ent.loc.y < groundY) {			ent.loc.y = groundY; }
			else if (ent.loc.y > 1000) {		ent.loc.y = 1000; }			
		});
		this.focusCoords.x = this.game.pc.loc.x;
		this.focusCoords.y = 0; //this.game.pc.loc.y;		
	}
	
	
	
//====================== Drawing and X,Y Coordinate Calculations ==============

	// Canvas Variables
	this.canvasElt 	= document.getElementById('canvas');
	this.ctx 		= this.canvasElt.getContext('2d');
	this.canvasScale 		= 1.0;
	this.zoomScale 			= 1.0;
	this.canvasDim 			= { "x" : 500, "y" : 500 };
	this.focusCanvasCoords 	= { 
		"x" : (this.canvasDim.x / 2)
		,"y" : (this.canvasDim.y / 2) 
	};
	this.focusCoords		= { "x" : 100, "y" : 0 };


	this.redrawCanvas = function () 
	{
		var o = this;
		var focusOffsetCoords = this.getFocusOffsetCoords();
		// Clear canvas
		this.ctx.save();
		this.ctx.clearRect(0,0,this.canvasDim.x,this.canvasDim.y);
		
		// Draw Ground
		// *** loop over ground array
		
		// Loop and draw decorative entities
		o.loopOverEntities("nearbyStatic", function(entKey, ent){
			o.drawEntity(entKey, focusOffsetCoords);
		});
	
		// Loop and draw entities
		o.loopOverEntities("nearbyFish", function(entKey, ent){
			o.drawEntity(entKey, focusOffsetCoords);
		});
		
		// Draw PC after other entities
		this.drawEntity("PC", focusOffsetCoords);		
		
		this.ctx.globalAlpha = 1.0;
		
		this.ctx.restore();		
	}
	
	this.resizeCanvasToElement = function (elt) 
	{
		var $win = $(elt);
		this.canvasElt.height = $win.height();
		this.canvasElt.width = $win.width();
		this.canvasDim 			= { 
			"x" 	: this.canvasElt.width
			,"y" 	: this.canvasElt.height
		};
		this.focusCanvasCoords 	= { 
			"x" : (this.canvasDim.x / 2)
			,"y" : (this.canvasDim.y / 2) 
		};
	}
	
	this.drawEntity = function(entKey, focusOffsetCoords) 
	{
		//entKey = this.entArrays.all[i];
		var ent = this.game.entities[entKey];
		if (typeof ent === 'undefined') console.log(ent, entKey);
		var entSize = this.getScaledCoords(ent.size);
		//var scaledBubbleSize = this.getScaledCoords(this.bubbleSize);
		var entLoc = this.getScaledCoords(ent.loc);
		var ecc = this.getEntityCanvasCoords(entLoc, entSize, focusOffsetCoords);
		
		// Draw things differently based on type?
		// *** select case ent.type
		switch (ent.type) {
			case "pc":
				//console.log("Drawing image", ecc, entSize);
			default:

			var entImage 	= this.images[ent.imageName];
			if (typeof entImage === 'undefined') console.error("drawEntity: image not found: " + ent.imageName, ent);
			//console.log("Drawing image", ent, ecc, entSize); zzz();
			this.ctx.drawImage(	entImage, ecc.x, ecc.y, entSize.x, entSize.y );
		}

		//this.ctx.globalAlpha = 1.0;
		
		if (entKey == this.selectedEntityKey) {
			this.ctx.strokeStyle = '#f60';
			this.ctx.strokeRect(ecc.x, ecc.y, entSize.x, entSize.y);
			//this.ctx.strokeCircle(ecc.x, ecc.y, 10);
		}
	}
	
	/*
	this.drawParticle = function(particle, focusOffsetCoords)
	{
		var pSize = this.getScaledCoords(particle.size);
		var pLoc = this.getScaledCoords(particle.loc);
		var pCanvasCoords = this.getEntityCanvasCoords(pLoc, pSize, focusOffsetCoords);	
		if (particle.burnout < 1) {
			this.ctx.globalAlpha = particle.burnout;
		} else {
			this.ctx.globalAlpha = 1.0;
		}
		this.ctx.fillStyle = particle.color;
		this.ctx.fillRect(pCanvasCoords.x, pCanvasCoords.y, pSize.x, pSize.y);
	}
	*/

	this.getScaledCoords = function (coords) {
		var s = {
			"x" 	: coords.x * this.zoomScale
			,"y" 	: coords.y * this.zoomScale
		};
		return s;
	}
	
	this.getDescaledCoords = function (coords) {
		var s = {
			"x" 	: coords.x / this.zoomScale
			,"y" 	: coords.y / this.zoomScale
		};
		return s;
	}	
	
	this.getFocusOffsetCoords = function () 
	{
		var fc = this.getScaledCoords(this.focusCoords);
		var focusOffsetCoords = {
			"x" : (fc.x - this.focusCanvasCoords.x)
			,"y" : (fc.y - this.focusCanvasCoords.y)
		};
		return focusOffsetCoords;
	}
	
	
	this.getEntityCanvasCoords = function (entScaledLoc, entScaledSize, focusOffsetCoords)
	{
		var entCanvasCoords = {
			"x" : (entScaledLoc.x - focusOffsetCoords.x  - (entScaledSize.x / 2))
			,"y" : ((entScaledLoc.y) - focusOffsetCoords.y  - (entScaledSize.y))
		};
		return entCanvasCoords;
	}
	
	this.getZoneCoords = function (canvasCoords) 
	{
		var focusOffsetCoords = this.getFocusOffsetCoords();
		var zoneCoords = {
			"x" : (canvasCoords.x + focusOffsetCoords.x)
			,"y" : ((canvasCoords.y + focusOffsetCoords.y) * -1)
		};
		zoneCoords = this.getDescaledCoords(zoneCoords);
		return zoneCoords;
	}
	
	//====Zoom
	
	this.zoomIn = function() {
		if (this.zoomScale > 15) {		return false; }
		else if (this.zoomScale < 1) {	this.zoomScale += 0.2; }
		else {							this.zoomScale += 0.5; }
		this.redraw();
		return this.zoomScale;
	}

	this.zoomOut = function() {
		if (this.zoomScale <= 0.21) {	return false; }
		else if (this.zoomScale <= 1) {	this.zoomScale -= 0.2; }
		else {							this.zoomScale -= 0.5; }
		this.redraw();
		return this.zoomScale;
	}
	
	this.getEntityEdges = function(ent) 
	{
		var edges = { 
			"left" 		: (ent.loc.x - ent.halfSize.x)
			,"right" 	: (ent.loc.x + ent.halfSize.x)
			,"top" 		: (ent.loc.y + ent.size.y)
			,"bottom" 	: (ent.loc.y)
		};
		return edges;
	}
	
	this.areCoordsWithinEdges = function (coords, edges) 
	{
		return (coords.x >= edges.left && coords.x <= edges.right
			&& coords.y >= edges.bottom && coords.y <= edges.top);
	}
	
	//==== Get Canvas Entity at x,y
	this.getEntityKeyAtZoneCoords = function (zoneCoords) 
	{
		var o = this;
		var foundKey = "";
		//console.log(zoneCoords);
		// Loop and draw entities
		o.loopOverEntities("nearbyNPCs", function(entKey, ent){
			var entEdges = o.getEntityEdges(ent);
			//console.log("Entity " + entKey + " -- " + JSON.stringify(entEdges));
			if (o.areCoordsWithinEdges(zoneCoords, entEdges)) {
				//console.log("FOUND!");
				foundKey = entKey;
				// ^ *** would be nice if we could return this value to avoid
				//		unnecessary looping once we've found the key.
			}
		});

		if (foundKey == "") {
			o.loopOverEntities("nearbyStatic", function(entKey, ent){
				var entEdges = o.getEntityEdges(ent);
				if (o.areCoordsWithinEdges(zoneCoords, entEdges)) {
					foundKey = entKey;
				}				
			});
		}
		if (foundKey == "") {
			var entEdges = o.getEntityEdges(o.game.pc);
			if (o.areCoordsWithinEdges(zoneCoords, entEdges)) {
				foundKey = "PC";
			}
		}		
		return foundKey;
	}	

	this.getEntityByIndex = function (i, arr) {
		if (typeof arr === 'undefined') arr = this.entArrays.nearby;
		return this.game.entities[arr[i]];
	}
	
	this.loopOverEntities = function (arrName, callback) 
	{
		var arr = this.entArrays[arrName];
		var arrLen = arr.length;
		var entKey = "";
		var ent = {};
		var i = 0;
		for (i = 0; i < arrLen; i++) {
			entKey = arr[i];
			ent = this.game.entities[entKey];
			var rtn = callback(entKey, ent);
			//console.log(rtn);
		}
	}
	
	

	
	
	
	
	
	
	
//===MMMMMMMMMMMMMMMMMMMM=== Menus ============================================



	this.openMenu = function (menuName) 
	{
		var o = this;
		o.togglePause(true);
		o.closeMenus(function(){
			$('#title').fadeIn(200);
			$('#' + menuName + 'Menu').fadeIn(300);
		}, false);
		o.hideHUDs();
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
	
	this.showHUDs = function()
	{
		// *** figure out if mobile mode is on or not
		$('.hud').not('.mobileMode').fadeIn(400);
	}
	
	this.hideHUDs = function()
	{
		$('.hud').hide(400);
	}
	
	this.openCanvas = function()
	{
		this.showHUDs();
		$('#canvasContainer').show();
	}

//===================================== START / LOAD / SAVE ===============

	this.newGame = function()
	{
		var o = this;
		o.populateEntities();
		
		this.closeMenus(function(){
			o.openCanvas();
			o.togglePause(false);
		});
	}
	
	this.continueGame = function()
	{
		// *** Try load
		// *** makee sure game exists
		var doesSaveExist = false;
		// *** if it exists, then load
		if (doesSaveExist) {
			o.openCanvas();
			// *** load	
		} else { 	// if it doesn't exist, start new
			this.newGame();
		}
		return doesSaveExist;
	}

	this.generateSpecies = function ()
	{
		this.game.species = {};
	
	}
	
	
	this.populateEntities = function () 
	{
		this.game.entities = {};
		this.entArrays = {
			"all" 				: []
			,"nearbyFish" 		: []
			,"nearbyStatic"		: []
			,"physics" 	: []
		};	
	
		this.game.pc = new ExoAquaticEntityClass("PC");
		this.game.pc.loc = { "x" : 100, "y" : 0 };
		this.game.pc.imageName = "sub";

		// Add PC
		this.game.entities["PC"] = this.game.pc;
		this.entArrays.all.push("PC");
		this.entArrays.physics.push("PC");
		
		// Add random Fish
		var i = 0;
		var entKey = "";
		var newEnt = {};
		for (i = 0; i < 100; i++) {
			entKey = "F" + i;
			this.game.entities[entKey] = new ExoAquaticEntityClass("fish");
			newEnt = this.game.entities[entKey];
			
			// *** get random size
			// *** get random species
			
			newEnt.loc.x = this.roll1d(2000) - 1000;
			newEnt.loc.y = this.roll1d(2000);
			
			// Add new ent key to arrays
			this.entArrays.all.push(entKey);
			this.entArrays.nearbyFish.push(entKey);
			this.entArrays.physics.push(entKey);

		}
		// Add random plants
		for (i=0; i < 25; i++) {
			entKey = "P" + i;
			this.game.entities[entKey] = new ExoAquaticEntityClass("plant");
			newEnt = this.game.entities[entKey];
			
			newEnt.loc.x = this.roll1d(2000) - 1000;
			// *** Make this whatever the ground is here
			newEnt.loc.y = 2000; 
			
			// Add new ent key to arrays
			this.entArrays.all.push(entKey);
			this.entArrays.nearbyStatic.push(entKey);
		}
	
		console.log("Entities" , this.game.entities);
	}


	
	
	
	
//=============================================================================
//=======SSSSSSS=========== SETUP ===============SSSSSSSSSSSSSSSSSSSSSS====

	
	
	this.setup = function()
	{
		var o = this;
		this.dataDelivery.deliver("data/game_data.json", function(refData){
			// Continue with setup after data is loaded...
			o.loadImages(refData.images);
			o.setupCanvas();
			o.setupEvents();
			
			//o.zones = refData.zones;
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

	this.setupCanvas = function () {
		/*
		this.canvasElt.setAttribute('width', this.canvasDim.x * this.canvasScale);
		this.canvasElt.setAttribute('height', this.canvasDim.y * this.canvasScale);
		*/
		var canvasContainerElt = $('#canvasContainer')[0];
		this.resizeCanvasToElement(canvasContainerElt);

		//this.ctx.imageSmoothingEnabled = false; // http://stackoverflow.com/questions/18547042/resizing-a-canvas-image-without-blurring-it
		this.ctx.save();
		this.ctx.scale(this.canvasScale,this.canvasScale);
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
