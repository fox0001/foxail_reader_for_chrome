Node.prototype.$ = function(selector) {
	return this.querySelector(selector);
};

Node.prototype.$$ = function(selector) {
	return this.querySelectorAll(selector);
};

var $ = function(selector) {
	if(/^<(\w+)>$/.test(selector)){
		return document.createElement(RegExp.$1);
	}else{
		return document.$(selector);
	}
};

var $$ = function(selector) {
	return document.$$(selector);
};

var sections = {};

var getAsyn = function(url, callback){
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onreadystatechange = function(){
		if (request.readyState === 4 && request.status === 200){
			callback(request.responseText);
		}
	};
	request.send();
};

var openTab = function(url){
	chrome.tabs.create({url:url});
};

var openWin = function(title, url){
	sections.win.$('header> span').innerText = title;
	sections.win.$('div> iframe').src = url;
	sections.win.style.display = 'block';
};

var shareWeibo = function(news){
	var url = 'http://service.weibo.com/share/share.php?language=zh_cn&appkey=696316965&searchPic=true&style=number&title=' 
			+ news.innerText + '&url=' + news.shareUrl;
	openWin('分享微博',url);
};

CnBeta = function(){};

CnBeta.prototype.url = 'http://www.cnbeta.com';

CnBeta.prototype.getListUrl = function(pageNum){
	(!pageNum || pageNum<=0) && (pageNum = 1);
	return 'http://m.cnbeta.com/wap/index.htm?page=' + pageNum;
}

CnBeta.prototype.getContentUrl = function(id){
	return 'http://m.cnbeta.com/wap/view_' + id + '.htm';
}

CnBeta.prototype.getShareUrl = function(id){
	return 'http://www.cnbeta.com/articles/' + id + '.htm';
}

CnBeta.prototype.showNewsList = function(pageNum){
	var url = this.getListUrl(pageNum);
	getAsyn(url, function(resTxt){
		if(!resTxt) return;
		
		var reg = new RegExp('<div class="list"><a href="/wap/view_(\\d+).htm">([^<]+)</a></div>','gim')
			,newsList = sections.list.$('div> ul')
			;
		newsList.innerHTML = '';
		while((result = reg.exec(resTxt))!=null){
			var news = $('<li>');
			news.id = result[1];
			news.shareUrl = cnBeta.getShareUrl(result[1]);
			news.innerText = result[2];
			news.addEventListener('click', function(e){
				cnBeta.showNewsContent(this);
				e.preventDefault();
				e.stopPropagation();
			});
			news.addEventListener('mouseup', function(e){
				if(e.button == 2){
					openTab(this.shareUrl);
					e.preventDefault();
					e.stopPropagation();
				}
			});
			news.addEventListener('mouseover', function(e){
				this.className = 'newsListHightlight';
			});
			news.addEventListener('mouseleave', function(e){
				this.className = '';
			});
			newsList.appendChild(news);
		}
		newsList.scrollIntoView();
		$('#pageNum').innerText = pageNum;
	});
}

CnBeta.prototype.showNewsContent = function(news){
	var url = this.getContentUrl(news.id);
	getAsyn(url, function(resTxt){
		if(!resTxt) return;
		
		var html = ''
			,newsList = sections.list
			,newsContent = sections.content.$('div')
			,reg = [
				/(<div class="title"><b>.+?<\/b><\/div>)/gi
				,/(<div class="time">[\w\W]+?<\/div>)/gi
				,/(<div class="content"><p[\w\W]+?<\/div>)\s+<a/gi
			]
			;
		
		$('#shareWeibo').addEventListener('click', function(){shareWeibo(news)});
		$('#contentRefresh').addEventListener('click', function(){cnBeta.showNewsContent(news)});
		
		newsList.style.display = 'none';
		newsContent.parentNode.style.display = 'block';
		for(var i=0,len = reg.length;i<len;i++){
			if((result = reg[i].exec(resTxt))!=null){
				html += RegExp.$1;
			}
		}
		html = html.replace(/<img.+?src=["'](.+?)["'].+?>/igm, 
				'<img style="max-width:100%" src="$1" longDesc="$1" alt="图片">');
		newsContent.innerHTML = html;
		
		html = html.replace(/<embed.+?src=["'](.+?)["'].+?>/igm, 
				'<img style="max-width:100%" src="img/video.png" longDesc="$1" alt="视频">');
		newsContent.innerHTML = html;
		
		var imgs = $$('section#content img');
		for(var i=0,len=imgs.length;i<len;i++){
			imgs[i].addEventListener('click', function(e){
				openWin(this.alt,this.longDesc);
				e.preventDefault();
				e.stopPropagation();
			});
		}
	});
}

CnBeta.prototype.showHome = function(){
	this.showNewsList(1);
}

CnBeta.prototype.showPrevPage = function(){
	var pageNum = parseInt($('#pageNum').innerText);
	pageNum--;
	pageNum < 1 && (pageNum = 1);
	this.showNewsList(pageNum);
}

CnBeta.prototype.showNextPage = function(){
	var pageNum = parseInt($('#pageNum').innerText);
	pageNum++;
	this.showNewsList(pageNum);
}

CnBeta.prototype.showRefresh = function(){
	var pageNum = parseInt($('#pageNum').innerText);
	pageNum < 1 && (pageNum = 1);
	this.showNewsList(pageNum);
}

var cnBeta = new CnBeta();

onload = function(){
	sections = {
		list: $('section#list')
		,content: $('section#content')
		,msg: $('section#msg')
		,win: $('section#win')
	}

	$('#pageNum').addEventListener('click', function(e){cnBeta.showRefresh()});
	$('#prevPage').addEventListener('click', function(e){cnBeta.showPrevPage()});
	$('#nextPage').addEventListener('click', function(e){cnBeta.showNextPage()});
	
	$('#msgClose').addEventListener('click', function(e){
		sections.msg.style.display='none';
	});
	$('#msgOk').addEventListener('click', function(e){
		sections.msg.style.display='none';
	});
	$('#contentBack').addEventListener('click', function(e){
		sections.content.style.display = 'none';
		sections.list.style.display = 'block';
	});
	$('#winClose').addEventListener('click', function(e){
		sections.win.style.display = 'none';
		sections.win.$('div> iframe').src = '';
	});
	cnBeta.showHome();
}
