var hex_ascii = false;
var no_nbsp = false;
var grid_active = true;

var CTypes = Object.freeze({
	NOTHING:		[0, 'nothing', '..'],
	TRASHBIN:		[1, 'trashbin', '\\/'],
	CLONER:			[2, 'cloner', '/\\'],
	DEFLECT_L:		[3, 'deflector-left', '//'],
	DEFLECT_R:		[4, 'defector-right', '\\\\'],
	INCREMENT:		[5, 'incrementor', '++'],
	DECREMENT:		[6, 'decrementor', '--'],
	TELEPORTER:		[7, 'teleporter', 'T?'],
	PAUSE:			[8, 'pause', 'P?'],
	LESSTHAN:		[9, 'less-than', '<?'],
	GREATERTHAN:	[10,'greater-than', '>?'],
	EQUALTO:		[11,'equal-to', '=?'],
	RANDOM:			[12,'random', 'R?'],
	SUBROUTINE:		[13,'subroutine', 'S?'],
	NAMEDSUBR:		[14,'subroutine', 'Custom Regex'],
	INPUT:			[15,'input', 'I*'],
	OUTPUT:			[16,'output', 'O?'],
	OUTPUTEXIT:		[17,'output-exit', 'X?'],
	HEXLITERAL:		[18,'hex-literal', 'Custom Regex'],
	INVALID: 		[19, 'invalid', 'Default Value']
});
function Cell(text){
	var value = text.substr(1,1), type;
	if(text == '' || text.match(/^\s{2}$/)){
		this.type = CTypes.NOTHING;
		this.value = '';
		return;
	}
	function checkRegex(text, cmp){
		var regex = cmp;
		// escape all regex characters
		regex = regex.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&");
		regex = regex.replace('?','[A-Z\\d\\?]');
		regex = regex.replace('*','[A-Z\\d]');
		regex = '^' + regex + '$';
		return text.match(regex);
	}
	if(text == CTypes.NOTHING[2]) type = CTypes.NOTHING, value = '';
	else if(text == CTypes.TRASHBIN[2]) type = CTypes.TRASHBIN, value = '';
	else if(text == CTypes.CLONER[2]) type = CTypes.CLONER, value = '';
	else if(text == CTypes.DEFLECT_L[2]) type = CTypes.DEFLECT_L, value = '';
	else if(text == CTypes.DEFLECT_R[2]) type = CTypes.DEFLECT_R, value = '';
	else if(text == CTypes.INCREMENT[2]) type = CTypes.INCREMENT, value = '';
	else if(text == CTypes.DECREMENT[2]) type = CTypes.DECREMENT, value = '';
	else if(checkRegex(text,CTypes.TELEPORTER[2])) type = CTypes.TELEPORTER;
	else if(checkRegex(text,CTypes.PAUSE[2])) type = CTypes.PAUSE;
	else if(checkRegex(text,CTypes.LESSTHAN[2])) type = CTypes.LESSTHAN;
	else if(checkRegex(text,CTypes.GREATERTHAN[2])) type = CTypes.GREATERTHAN;
	else if(checkRegex(text,CTypes.EQUALTO[2])) type = CTypes.EQUALTO;
	else if(checkRegex(text,CTypes.RANDOM[2])) type = CTypes.RANDOM;
	else if(checkRegex(text,CTypes.SUBROUTINE[2])) type = CTypes.SUBROUTINE;
	else if(checkRegex(text,CTypes.INPUT[2])) type = CTypes.INPUT;
	else if(checkRegex(text,CTypes.OUTPUT[2])) type = CTypes.OUTPUT;
	else if(checkRegex(text,CTypes.OUTPUTEXIT[2])) type = CTypes.OUTPUTEXIT;
	else if(text.match(/^[A-F\d]{2}$/)) type = CTypes.HEXLITERAL, value = parseInt(text, 16); 
	else if(text.length == 1 && hex_ascii){
		type = CTypes.HEXLITERAL;
		if(no_nbsp && text == '\xA0')
			text = ' ';
		value = text.charCodeAt(0) % 256;
	}else if(text.match(/^[A-Z][a-z]$/) || text == 'MB') type = CTypes.NAMEDSUBR, value = text;
	else type = CTypes.INVALID, value = text;
	this.type = type;
	this.value = value;
};
Cell.prototype.isValid = function(){
	return this.type == CTypes.INVALID;
}
Cell.isValid = function(string){
	var temp_cell = new Cell(string);
	return Cell.isValid();
};
Cell.prototype.getClass = function(){
	return 'cell-' + this.type[1];
};
Cell.prototype.toString = function(html){
	switch(this.type[0]){
		case CTypes.NOTHING[0]:
		case CTypes.TRASHBIN[0]:
		case CTypes.CLONER[0]:
		case CTypes.DEFLECT_L[0]:
		case CTypes.DEFLECT_R[0]:
		case CTypes.INCREMENT[0]:
		case CTypes.DECREMENT[0]:
			return this.type[2];
		case CTypes.TELEPORTER[0]:
		case CTypes.PAUSE[0]:
		case CTypes.LESSTHAN[0]:
		case CTypes.GREATERTHAN[0]:
		case CTypes.EQUALTO[0]:
		case CTypes.RANDOM[0]:
		case CTypes.SUBROUTINE[0]:
		case CTypes.INPUT[0]:
		case CTypes.OUTPUT[0]:
		case CTypes.OUTPUTEXIT[0]:
			return this.type[2].substr(0,1) + this.value;
		case CTypes.HEXLITERAL[0]:
			if(hex_ascii && html) return String.fromCharCode(this.value);
			else return ('00'+this.value.toString(16)).substr(-2).toUpperCase();
		case CTypes.NAMEDSUBR[0]:
		case CTypes.INVALID[0]:
			return this.value;
	}
};

function Board(w, h, nm, abr, i){
	this.cells = [];
	this.width = w;
	this.height = h;
	for(var i = 0; i < this.width; ++i){
		this.cells[i] = [];
		for(var j = 0; j < this.height; ++j)
			this.cells[i][j] = new Cell('..');
	}
	this.name = nm;
	this.abbr = abr;
	this.id = i;
	this.comment = null;
	this.rowcomments = [];
	for(var i = 0; i < this.height; ++i)
		this.rowcomments[i] = null;
};
Board.prototype.getName = function(){
	return this.name;
};
Board.prototype.getAbbr = function(){
	return this.abbr;
};
Board.prototype.getID = function(){
	return this.id;
};
Board.prototype.getHeight = function(){
	return this.height;
};
Board.prototype.getWidth = function(){
	return this.width;
};
Board.prototype.getComments = function(){
	return this.comment;
};
Board.prototype.getRowComments = function(row){
	return this.rowcomments[row];
}
Board.prototype.setComments = function(comment){
	this.comment = comment;
};
Board.prototype.setRowComments = function(row, comment){
	this.rowcomments[row] = comment;
}
Board.prototype.toString = function(){
	var out = '';
	for(var j = 0; j < this.height; ++j){
		for(var i = 0; i < this.width; ++i){
			out += this.cells[i][j].toString(false) + ' ';
		}
		if(this.getRowComments(j) != null)
			out += '#' + this.getRowComments(j);
		out += '\n';
	}
	return out;
};
// todo: add comments to html
Board.prototype.toHTML = function(){
	var table = document.createElement('table');
	for(var j = 0; j < this.height; ++j){
		var row = document.createElement('tr');
		row.setAttribute('data-row', j);
		for(var i = 0; i < this.width; ++i){
			var td = document.createElement('td');
			td.setAttribute('id', 'cell-'+j+'-'+i);
			td.setAttribute('data-row', j);
			td.setAttribute('data-col', i);
			td.setAttribute('class', this.cells[i][j].getClass());
			td.setAttribute('contenteditable',true);
			td.appendChild(document.createTextNode(this.cells[i][j].toString(true)));
			row.appendChild(td);
		}
		table.appendChild(row);
	}
	return table;
};
Board.prototype.get = function(x,y){
	if(0 <= x && x <= this.height && 0 <= y && y <= this.width)
		return this.cells[y][x];
	else return null;
};
Board.prototype.set = function(x,y,val){
	if(0 <= x && x <= this.height && 0 <= y && y <= this.width)
		return this.cells[y][x] = val;
	else return null;
};
// Assumes format is space separated
function parseBoard(string, abbr, id){
debugger;
	// temp alternates name and content; move to object
	var raw = string.trim().split('\n'); 
	var h, w = 0;
	
	for(h = 0; h < raw.length; ++h){	
		raw[h] = raw[h].trim().split('#');
		raw[h][0] = raw[h][0].trim().split(' ');
		w = Math.max(raw[h][0].length, w);
	}
	var board = new Board(w, h, 'Board', abbr, id);
	for(var i = 0, j; i < raw.length; ++i){
		for(j = 0; j < raw[i][0].length; ++j)
			board.set(i,j,new Cell(raw[i][0][j]));
		for(; j < w; ++j)
			board.set(i,j,new Cell('..'));
		if(raw[i].length > 1)
			board.setRowComments(i, raw[i][1]);
	}
	return board;
}
function parseBoards(string){
	var raw;
	raw = ('MB:\n'+string.trim()).split(/([^\n]*):/);
	// empty element at raw[0]; remove
	raw.splice(0, 1);
	
	var boards = [];
	for(var i = 0; i < raw.length/2; ++i){
		var tmp;
		raw[2*i+1] = raw[2*i+1].trim();
		if(raw[2*i+1].charAt(0) == '#'){
			var q = raw[2*i+1].indexOf('\n');
			tmp = [raw[2*i+1].substr(q+1),raw[2*i+1].substr(1, q)];
		}else tmp = [raw[2*i+1]];
		var b = parseBoard(tmp[0], raw[2*i], i);
		if(tmp.length > 1)
			b.setComments(tmp[1]);
		boards.push(b);
	}
	
	return boards;
}

var boards = [new Board(10, 14, 'Main Board', 'MB', 0)];
var active_board = 0;
var active_tile = null;

// sets up grid handlers
function gridHandlers(){
	// add change event to all contentedittables
	$('[contenteditable]').on('focus', function() {
		var $this = $(this);
		$this.data('before', $this.html());
		return $this;
	}).on('blur keyup paste', function() {
		var $this = $(this);
		if ($this.data('before') !== $this.html()) {
			$this.data('before', $this.html());
			$this.trigger('change');
		}
		return $this;
	}).on('keypress', function(){
		return $(this).text().length <= 2;
	});
	var keydown = function(e){
		var code = (e.keyCode ? e.keyCode : e.which);
		var row = parseInt(active_tile.attr('data-row')), col = active_tile.attr('data-col');
		switch(code){
			case 37:
				if(col > 0){
					active_tile = $('#cell-'+(row)+'-'+(col-1));
					active_tile.focus();
				}
			break;
			case 38:
				if(row > 0){
					active_tile = $('#cell-'+(row-1)+'-'+(col));
					active_tile.focus();
				}
			break;
			case 39:
				if(col < boards[active_board].getHeight()){
					active_tile = $('#cell-'+(row)+'-'+(col+1));
					active_tile.focus();
				}
			break;
			case 40:
				if(row < boards[active_board].getWidth()){
					active_tile = $('#cell-'+(row+1)+'-'+(col));
					active_tile.focus();
				}
			break;
		}
	};
	
	$('td').on('change', function(){
		var $this = $(this);
		var row = $this.attr('data-row'), col = $this.attr('data-col');
		if($this.text().length > 2)
			$this.text($this.text().substr(0, 2));
		var newcell = new Cell($this.text()), newstring = newcell.toString(true);
		boards[active_board].set(row, col, newcell);
		$this.removeClass().addClass(boards[active_board].get(row, col).getClass());
	}).on('focus', function(){
		active_tile = $(this);
		if($(this).text() == '..') $(this).text('');
	}).on('blur', function(){
		var $this = $(this);
		if($this.text() == '\xA0\xA0') $this.text('');
		var row = $this.attr('data-row'), col = $this.attr('data-col');
		$this.text(boards[active_board].get(row,col).toString(true));
		if($this.text() == ''){
			var row = $this.attr('data-row'), col = $this.attr('data-col');
			$this.removeClass().addClass(boards[active_board].get(row,col).getClass());
		}
	}).on('keydown', keydown);
}

function redrawGrid(){
	$('#container').empty()[0].appendChild(boards[active_board].toHTML());
	gridHandlers();
}
function redrawSource(){
	var src = '';
	if(boards[0].getComments() != null)
		src += '#' + boards[0].getComments();
	src += boards[0].toString();
	for(var i = 1; i < boards.length; ++i){
		src += boards[i].getAbbr() + ':';
		if(boards[i].getComments() != null)
			src += ' #' + boards[i].getComments();
		src += '\n' + boards[i].toString();
	}
	var textarea = document.createElement('textarea');
	textarea.setAttribute('id','marbelous-source');
	textarea.value = src;
	var heading = document.createElement('h2');
	heading.appendChild(document.createTextNode('Marbelous Source'));
	$('#container').empty()[0].appendChild(heading);
	$('#container')[0].appendChild(textarea);
}

$(document).ready(function(){
	redrawGrid();
	$('#hex_ascii').on('change', function(){
		hex_ascii = $(this).is(':checked');
		redrawGrid();
	});
	$('#no_nbsp').on('change', function(){
		no_nbsp = $(this).is(':checked');
		redrawGrid();
	});
	$('#grid_source_toggle').on('click', function(){
		if(grid_active){
			redrawSource();
			$('#hex_ascii').attr('disabled', true);
			$('#no_nbsp').attr('disabled', true);
			$('#active_board').attr('disabled', true);
			//$('#new_board').attr('disabled', true);
			$('#grid_source_toggle').val('View Marbelous Board');
		}else{ 
			boards = parseBoards($('#marbelous-source').val());
			$('#hex_ascii').attr('disabled', false);
			$('#no_nbsp').attr('disabled', false);
			$('#active_board').attr('disabled', false);
			//$('#new_board').attr('disabled', false);
			$('#grid_source_toggle').val('View Marbelous Source');
			
			// refresh board list
			$('#active_board').empty();
			for(var i = 0; i < boards.length; ++i){
				var opt = document.createElement('option');
				opt.value = i;
				var txt = boards[i].getName() + ' (' + boards[i].getAbbr() + '/' + ('00'+i).substr(-2) + ')';
				opt.appendChild(document.createTextNode(txt));
				$('#active_board')[0].appendChild(opt);
			}
			
			active_board = 0;
			redrawGrid();
		}
		grid_active = !grid_active;
	});
	$('#active_board').on('change', function(){
		var nactive = $(this).val();
		if(nactive >= 0 && nactive < boards.length){
			active_board = nactive;
			redrawGrid();
		}
	});
});
