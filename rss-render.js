(function(window, $, undefined)
    {
        'use strict';
    
		var congif = {};

		var feed_url = "https://adventofcomputing.libsyn.com/rss";

		var post_types = {
			'text': 'fas fa-sticky-note',
			'audio/mpeg': 'fas fa-play'
		};
        
		function RSSRender(config){
			this.config = config;
			this.params = this.getUrlVars();
			this.covers = [];
			this.timeline = [];
			this.currentGUID = "";

			this.colors = ['#00429d', '#7ba8c6', '#a8d6c1', '#93c687', '#008000', '#ffaaa2', '#ea6372', '#c32750', '#93003a', '#1eac86', '#e2af39', '#eadac2', '#de3f27'];

			//self.render();
			return this;
		}

		RSSRender.prototype.render = function(callback){
			var self = this;

			self.config.menu_items.forEach(function(item){
				$("#side-menu").append(
					'<a href="' + item.href + '" class="menu-item"><div class="row">' +
						'<div class="col-md-4">' +
							'<div class="icon">' +
								'<i class="' + item.icon_class + ' fa-2x"></i>' +
							'</div>' +
						'</div>' +
						'<div class="col-md-8"><div class="vertical-align">' +
							'<span>' + item.name + '</span>' +
						'</div></div>' +
					'</div></a>'
				);
			});

			var parser = new RSSParser();

			parser.parseURL(self.config.feed_url, function(err, feed){
				self.feed = feed;

				$("#logo").attr("src", feed.image.url);

				if(self.params.guid){
					feed.items = feed.items.filter(function(item){
						return item.guid.match(self.params.guid);
					});
				}else{
					$("#header-content").html(feed.description);
				}

				var timeline_id = 0;

				feed.items.forEach(function(item){
					var guid = item.guid;
					var type = "text";

					if(item.enclosure && item.enclosure.type){
						type = item.enclosure.type;
					}

					if(self.covers.indexOf(item.itunes.image) < 0){
						self.covers.push(item.itunes.image);
					}

					if(self.params.guid){
						self.renderGUID(self.params.guid);
					}else{
						var text =
							"<div class='row'>" +
								"<div class='col-md-12 item'>" +
									"<a href='?guid=" + guid + "'>" +
										'<h3><span><i class="' + post_types[type] + ' fa-1x"></i></span>' + item.title + "</h3>" +
									"</a>" +
									"<div class='item-desc'>" + item.content + "</div>" +
									"<div class='more'><a href='?guid=" + guid + "'>More...</a></div>" +
								"</div>" +
							"</div>";

						$("#feed").append(text);
					}

					$("#feed iframe:last").remove();

					//Parse out timeline data
					var dates = item.content.match(/([1-2][0-9]{3}: [^<]*)/gm);

					if(dates){
						dates.forEach(function(d){
							var p = d.split(": ");

							self.timeline.push({
								id: timeline_id,
								episode: item.title,
								guid: item.guid,
								link: "http://adventofcomputing.com/?guid=" + item.guid,
								className: "ep-" + item.itunes.episode,
								group: parseInt(item.itunes.episode),
								style: "background-color:" + self.colors[Math.floor(item.itunes.episode % self.colors.length)],
								content: "<p class='ep-number'>E" + item.itunes.episode + "</p><p class='event'>" + p[1] + "</p>",
								start: p[0] + "-01-01"
							});

							timeline_id++;
						});
					}
				});

				if(callback){
					callback();
				}
			});
		};

		RSSRender.prototype.renderGUID = function(guid, target = "#feed"){
			var self = this;

			if(guid != self.currentGUID){
				self.currentGUID = guid;

				var item = self.feed.items.filter(function(item){
					return item.guid.match(guid);
				})[0];
	
				$("#logo").attr("src",  item.itunes.image);
	
				var text =
					"<div class='row'>" +
						"<div class='col-md-12 item'>" +
							"<h3>" + item.title + "</h3>" +
							"<div>" + item.content + "</div>" +
						"</div>" +
					"</div>";
				
				$(target).html(text);
				
				item.link = item.link.replace("http://", "https://");
	
				$.get(item.link, function(d){
					var player_source = $(d).find('iframe:last')[0].src;
					player_source = player_source.replace("http://", "https://");
					player_source = player_source.replace("file://", "https://");
					player_source = player_source.replace("yes", "no");
					$("#header-content").html('<iframe frameborder="0" scrolling="no" src="' + player_source + '"></iframe>');
					$("#header-content").addClass("player");
				});
				
				//Fetch itunes stuff
				self.getAppleData(item.title, function(episode){
					if(episode){
						$("<a href='" + episode.trackViewUrl + "'>" +
							"<img src='./img/apple_podcasts.svg'>" +
						"</a>").appendTo(target);
						
						//https://plinkhq.com/i/1459202600/e/1000459702408?to=googlepod
						$("<a href='https://plinkhq.com/i/" + episode.collectionId + "/e/" + episode.trackId + "?to=googlepod'>" +
							"<img src='./img/google_podcasts_badge.png'>" +
						"</a>").appendTo(target);
					}
				});
			}
		};

		RSSRender.prototype.getAppleData = function(title, cb){
			var self = this;
			//Fetch itunes stuff
			if(!self.itunes_data){
				$.ajax({
					url: "https://itunes.apple.com/lookup?id=1459202600&entity=podcastEpisode",
					dataType: "jsonp",
					success: function(d){
						self.itunes_data = d.results;
						self.getAppleData(title, cb);
					}
				});
			}else{
				var episode = self.itunes_data.filter(function(e){
					return e.trackName == title;
				});

				cb(episode[0] || false);
			}
		};

		/**
		   * This function coverts a DOM Tree into JavaScript Object. 
		    * @param srcDOM: DOM Tree to be converted. 
		     */
		RSSRender.prototype.xml2json = function(srcDOM){
			let children = [...srcDOM.children];
	    
			// base case for recursion. 
			if (!children.length) {
		        	return srcDOM.innerHTML
			}
         
	         	// initializing object to be returned. 
		        let jsonResult = {};
         
		        for (let child of children) {
	  		        // checking is child has siblings of same name. 
			        let childIsArray = children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;

			        // if child is array, save the values as array, else as strings. 
					if (childIsArray) {
			             if (jsonResult[child.nodeName] === undefined) {
			             	jsonResult[child.nodeName] = [xml2json(child)];
			             } else {
               				jsonResult[child.nodeName].push(xml2json(child));
		        	     }
	        	       } else {
			            jsonResult[child.nodeName] = xml2json(child);
			       }
	         	}
         
		        return jsonResult;
			};
			   
		RSSRender.prototype.getUrlVars = function(){
    		var vars = {};
    		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        		vars[key] = value;
    		});
    		return vars;
        }

    
        window.RSSRender = RSSRender;
        return window;
    }
)(window, $, undefined);
