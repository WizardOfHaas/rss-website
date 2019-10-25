(function(window, $, undefined)
    {
        'use strict';
    
		var congif = {};

		var feed_url = "https://adventofcomputing.libsyn.com/rss";

		var menu_items = [{
			name: "RSS Feed",
			icon_class: "fas fa-rss",
			href: feed_url
		},{
			name: "Apple Podcasts",
			icon_class: "fas fa-podcast",
			href: "https://podcasts.apple.com/us/podcast/advent-of-computing/id1459202600"
		},{
			name: "Spotify",
			icon_class: "fab fa-spotify",
			href: "https://open.spotify.com/show/6M4TTLm5laVMCAVTLpCV3f"
		},{
			name: "Youtube",
			icon_class: "fab fa-youtube",
			href: "https://www.youtube.com/channel/UChm-xJO0j1fl1uY_qJz5h4w"
		},{
			name: "Email",
			icon_class: "fas fa-at",
			href: "mailto:adventofcomputing@gmail.com"
		},{
			name: "Twitter",
			icon_class: "fab fa-twitter",
			href: "https://twitter.com/adventofcomp"
		},{
			name: "Buy Merch",
			icon_class: "fas fa-tshirt",
			href: "http://tee.pub/lic/MKt4UiBp22g"
		},{
			name: "Donate",
			icon_class: "fab fa-paypal",
			href: "https://paypal.me/adventofcomputing"
		}];

		var post_types = {
			'text': 'fas fa-sticky-note',
			'audio/mpeg': 'fas fa-play'
        };
        
        function RSSRender(config){
			var self = this;
			self.config = config;
			self.params = self.getUrlVars();

			self.render();
        }

		RSSRender.prototype.render = function(){
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
				console.log(feed);

				$("#logo").attr("src", feed.image.url);

				if(self.params.guid){
					feed.items = feed.items.filter(function(item){
						return item.guid.match(self.params.guid);
					});
				}else{
					$("#header-content").html(feed.description);
				}

				feed.items.forEach(function(item){
					var guid = item.guid;
					var type = "text";

					if(item.enclosure && item.enclosure.type){
						type = item.enclosure.type;
					}

					if(self.params.guid){
						var text =
							"<div class='row'>" +
								"<div class='col-md-12 item'>" +
									"<h3>" + item.title + "</h3>" +
									"<div>" + item.content + "</div>" +
								"</div>" +
							"</div>";

						$("#feed").append(text);

						item.link = item.link.replace("http://", "https://");

						$.get(item.link, function(d){
							var player_source = $(d).find('iframe:first')[0].src;
							player_source = player_source.replace("http://", "https://");
							player_source = player_source.replace("file://", "https://");
							player_source = player_source.replace("yes", "no");

							$('<iframe frameborder="0" scrolling="no" src="' + player_source + '"></iframe>').appendTo("#header-content");
							$("#header-content").addClass("player");
						});
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

					$("#feed iframe").remove();
				});
			});
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