var hex_ascii = false;
var no_nbsp = false;
var grid_active = true;

var CTypes = Object.freeze({
	NOTHING:		[0, 'nothing', /^(|\.\.|\s{2})$/, '..'],
	TRASHBIN:		[1, 'trashbin', /^\\\/$/, '\\/'],
	CLONER:			[2, 'cloner', /^\/\\$/, '/\\'],
	DEFLECT_L:		[3, 'deflector-left', /^\/\/$/, '//'],
	DEFLECT_R:		[4, 'deflector-right', /^\\\\$/, '\\\\'],
	INCREMENT:		[5, 'incrementor', /^\+\+$/, '++'],
	DECREMENT:		[6, 'decrementor', /^\-\-$/, '--'],
	PORTAL:			[7, 'portal', /^P[A-Z\d]$/, 'P'],
	SYNCHRONISER:	[8, 'synchroniser', /^S[A-Z\d]$/, 'S'],
	LESSTHAN:		[9, 'less-than', /^\<[A-Z\d]$/, '<'],
	GREATERTHAN:	[10,'greater-than', /^\>[A-Z\d]$/, '>'],
	EQUALTO:		[11,'equal-to', /^=[A-Z\d]$/, '='],
	RANDOM:			[12,'random', /^R[A-Z\d\?]$/, 'R'],
//	SUBROUTINE:		[13,'subroutine', 'S?'],
	INPUT:			[15,'input', /^I[A-Z\d]$/, 'I'],
	OUTPUT:			[16,'output', /^O[A-Z\d\>\<]$/, 'O'],
	TERMINATE:		[17,'terminate', /^XX$/, 'XX'],
	HEXLITERAL:		[18,'hex-literal', /^[A-F\d]{2}$/, '??'],
	// must be manually created
	NAMEDSUBR:		[19,'subroutine', /^(?!x)x$/, '??'],
	INVALID: 		[99,'invalid', /^(?!x)x$/, '??'],
});
function Cell(text){
	var value = text.substr(1,1), type;
	if(text == '' || text.match(/^\s{2}$/)){
		this.type = CTypes.NOTHING;
		this.value = '';
		return;
	}
	if(text.match(CTypes.NOTHING[2])) type = CTypes.NOTHING;
	else if(text.match(CTypes.TRASHBIN[2])) type = CTypes.TRASHBIN;
	else if(text.match(CTypes.CLONER[2])) type = CTypes.CLONER;
	else if(text.match(CTypes.DEFLECT_L[2])) type = CTypes.DEFLECT_L;
	else if(text.match(CTypes.DEFLECT_R[2])) type = CTypes.DEFLECT_R;
	else if(text.match(CTypes.INCREMENT[2])) type = CTypes.INCREMENT;
	else if(text.match(CTypes.DECREMENT[2])) type = CTypes.DECREMENT;
	else if(text.match(CTypes.PORTAL[2])) type = CTypes.PORTAL;
	else if(text.match(CTypes.SYNCHRONISER[2])) type = CTypes.SYNCHRONISER;
	else if(text.match(CTypes.LESSTHAN[2])) type = CTypes.LESSTHAN;
	else if(text.match(CTypes.GREATERTHAN[2])) type = CTypes.GREATERTHAN;
	else if(text.match(CTypes.EQUALTO[2])) type = CTypes.EQUALTO;
	else if(text.match(CTypes.RANDOM[2])) type = CTypes.RANDOM;
	else if(text.match(CTypes.INPUT[2])) type = CTypes.INPUT;
	else if(text.match(CTypes.OUTPUT[2])) type = CTypes.OUTPUT;
	else if(text.match(CTypes.TERMINATE[2])) type = CTypes.TERMINATE;
	else if(text.match(CTypes.HEXLITERAL[2])) type = CTypes.HEXLITERAL, value = parseInt(text, 16); 
	else if(text.length == 1 && hex_ascii){
		type = CTypes.HEXLITERAL;
		if(no_nbsp && text == '\xA0')
			text = ' ';
		value = text.charCodeAt(0) % 256;
	}
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
		case CTypes.TERMINATE[0]:
			return this.type[3];
		case CTypes.PORTAL[0]:
		case CTypes.SYNCHRONISER[0]:
		case CTypes.LESSTHAN[0]:
		case CTypes.GREATERTHAN[0]:
		case CTypes.EQUALTO[0]:
		case CTypes.RANDOM[0]:
		//case CTypes.SUBROUTINE[0]:
		case CTypes.INPUT[0]:
		case CTypes.OUTPUT[0]:
			return this.type[3] + this.value;
		case CTypes.HEXLITERAL[0]:
			if(hex_ascii && html) return String.fromCharCode(this.value);
			else return ('00'+this.value.toString(16)).substr(-2).toUpperCase();
		case CTypes.NAMEDSUBR[0]:
			return this.value.str.substr(this.value.offset, 2);
		case CTypes.INVALID[0]:
			return this.value;
	}
};
Cell.prototype.copy = function(other){
	if(this.type[0] != CTypes.NAMEDSUBR[0])
		this.type = other.type, this.value = other.value;
	else{
		this.type = CTypes.INVALID;
		for(var i = 0; i < this.value.cells.length; ++i){
			var ocell = this.value.cells[i];
			if(ocell == this) continue;
			ocell.type = CTypes.INVALID;
			ocell.copy(new Cell(ocell.value.str.substr(ocell.value.offset, 2)));
		}
		this.type = other.type;
		this.value = other.value;
	}
};

function Board(w, h, nm, i){
	this.cells = [];
	this.width = w;
	this.height = h;
	for(var i = 0; i < this.width; ++i){
		this.cells[i] = [];
		for(var j = 0; j < this.height; ++j)
			this.cells[i][j] = new Cell('..');
	}
	this.name = nm;
	this.id = i;
	this.comment = null;
	this.rowcomments = [];
	for(var i = 0; i < this.height; ++i)
		this.rowcomments[i] = null;
	this.inputs = 0;
	this.outputs = 0;
};
Board.prototype.getName = function(){
	return this.name;
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
};
Board.prototype.getInputs = function(){
	return this.inputs;
};
Board.prototype.getOutputs = function(){
	return this.outputs;
};
Board.prototype.setComments = function(comment){
	this.comment = comment;
};
Board.prototype.setRowComments = function(row, comment){
	this.rowcomments[row] = comment;
}
Board.prototype.toString = function(comments){
	if(typeof comments == "undefined") comments = true;
	var out = '';
	for(var j = 0; j < this.height; ++j){
		for(var i = 0; i < this.width; ++i){
			out += this.cells[i][j].toString(false) + ' ';
		}
		if(comments && this.getRowComments(j) != null)
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
			td.setAttribute('contenteditable',false);
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
	if(0 <= x && x <= this.height && 0 <= y && y <= this.width){
		var a = this.cells[y][x].copy(val);
		this.recalculateIO();
		return a;
	}else return null;
};
Board.prototype.recalculateIO = function(){
	var inp = 0, out = 0;
	for(var i = 0; i < this.width; ++i){
		for(var j = 0; j < this.height; ++j){
			switch(this.cells[i][j].type[0]){
				case CTypes.INPUT[0]:
					inp = Math.max(inp, parseInt(this.cells[i][j].value) + 1);
				break;
				case CTypes.OUTPUT[0]:
					out = Math.max(out, parseInt(this.cells[i][j].value) + 1);
				break;
			}
		}
	}
	this.inputs = inp;
	this.outputs = out;
};
function parseBoard(lines, name, index){
	lines = lines.map(function(s){ return s.trim(); });
	var h, w = 0;
	for(h = 0; h < lines.length; ++h){
		lines[h] = lines[h].split(/#(.*)/).map(function(s){ return s.trim(); });
		lines[h][0] = lines[h][0].match(/(\S{2})/g);
		w = Math.max(lines[h][0].length, w);
	}
	
	var board = new Board(w, h, name, index);
	for(var i = 0, j; i < lines.length; ++i){
		for(j = 0; j < lines[i][0].length; ++j)
			board.set(i,j,new Cell(lines[i][0][j]));
		for(; j < w; ++j)
			board.set(i,j,new Cell('..'));
		if(lines[i].length > 1)
			board.setRowComments(i, lines[i][1]);
	}
	return board;
}
// does not handle subroutines
function parseBoards(string){
	var lines = (':MB\n'+string.trim()).split('\n').map(function(s){ return s.trim(); });
	var boards = [];
	
	var comments = [], boardstart = [];
	for(var i = 0; i < lines.length; ++i)
		if(lines[i][0] == ':') boardstart[boardstart.length] = i, comments[i] = false;
		else if(lines[i][0] == '#') comments[i] = true;
		else comments[i] = false;

	var bnames = [];
	// get all board names
	for(var i = 0; i < boardstart.length; ++i)
		bnames[bnames.length] = lines[boardstart[i]].substr(1).split('#')[0].trim();
	
	for(var i = boardstart.length, j = lines.length - 1; i--; ){
		var pos = boardstart[i];
		// Collect all non-line comments and remove from lines array
		var bcomment = "";
		for(; j > pos; --j){
			if(comments[j]){
				bcomment = lines[j].substr(1) + '\n' + bcomment;
				lines.splice(j, 1);
			}
		}
		if(lines[j].indexOf('#') != -1)
			bcomment = lines[j].split(/#(.*)/)[1].trim() + '\n' + bcomment;
		lines.splice(j--, 1);
		for(; comments[j] && j > 0; --j){
			bcomment = lines[j].substr(1) + bcomment;
			lines.splice(j, 1);
		}
		// j now points to the start of the board information
		boards[i] = parseBoard(lines.splice(j+1), bnames[i], i);
	}
	return boards;
}

var boards = [new Board(10, 14, 'MB', 0)];
var active_board = 0;
var active_tile = [0, 0];
var selected_tiles = [ ];

function focus_tile(i,j,clear_selected){
	if(typeof clear_selected == 'undefined')
		clear_selected = true;
	if(clear_selected)
		for(var q = selected_tiles.length; q--; )
			select_tile(selected_tiles[q][0],selected_tiles[q][1]);
	var tile = $('#cell-'+active_tile[0]+'-'+active_tile[1]);
	if(tile.is(':focus'))
		tile.blur(), tile=$('#cell-'+active_tile[0]+'-'+active_tile[1]);
	tile.removeClass('focused');
	active_tile = [parseInt(i),parseInt(j)];
	tile = $('#cell-'+active_tile[0]+'-'+active_tile[1]);
	tile.addClass('focused');
}
function select_tile(i,j){
	var q;
	for(q = selected_tiles.length; q--; )
		if(selected_tiles[q][0] == i && selected_tiles[q][1] == j)
			break;
	i = parseInt(i), j = parseInt(j);
	if(q != -1){
		selected_tiles.splice(q, 1);
		$('#cell-'+i+'-'+j).removeClass('selected');
	}else{
		$('#cell-'+i+'-'+j).addClass('selected');
		selected_tiles[selected_tiles.length] = [i, j];
	}
}

// updates subroutine cell info
function updateSubroutine(){
	var subroutines = [];
	for(var i = boards.length; i--; ){
		subroutines[i] = {};
		subroutines[i].size = Math.max(1,boards[i].getInputs(),boards[i].getOutputs());
		// set .name to repeated name, filling up 2*.size chars
		subroutines[i].name = new Array(subroutines[i].size+1).join(boards[i].getName()).substr(0,2*subroutines[i].size);
	}
	subroutines.sort(function(a,b){
		return a.size - b.size;
	});
	for(var i = boards.length; i--; ){
		// get board as a string w/o comments
		var bs = boards[i].toString(false).replace(/ /g, '').split('\n');
		for(var j = bs.length; j--; ){
		debugger;
			for(var k = subroutines.length; k--; ){
				var ind = bs[j].indexOf(subroutines[k].name);
				if(ind != -1 && !(ind % 2)){
					ind /= 2;
					
					var arr = [];
					for(var q = 0; q < subroutines[k].size; ++q)
						arr[arr.length] = boards[i].cells[ind+q][j];
					for(var q = 0; q < subroutines[k].size; ++q){
						arr[q].type = CTypes.NAMEDSUBR;
						arr[q].value = { cells: arr, str: subroutines[k].name, offset: 2*q };
					}
					
					bs[j]=bs[j].replace(subroutines[k].name, "  ");
					++k; // allow for this name to be searched again
				}
			}
		}
	}
}
// sets up grid handlers
function gridHandlers(){
	$('td').on('click', function(e){
		if(e.ctrlKey)
			select_tile($(this).attr('data-row'), $(this).attr('data-col'));
		if($(this).hasClass('focused'))
			$('#cell-'+$(this).attr('data-row')+'-'+$(this).attr('data-col')).attr('contenteditable', true).focus();
		focus_tile($(this).attr('data-row'), $(this).attr('data-col'), !e.ctrlKey);
	}).on('focus', function(){
		if($(this).text() == '..') $(this).text('');
	}).on('blur', function(){
		var $this = $(this);
		if($this.text() == '\xA0\xA0') $this.text('');
		if($this.text().length > 2)
			$this.text($this.text().substr(0, 2));
		var row = $this.attr('data-row'), col = $this.attr('data-col');
		var newcell = new Cell($this.text()), newstring = newcell.toString(true);
		boards[active_board].set(row, col, newcell);
		$this.removeClass().addClass(boards[active_board].get(row, col).getClass());
		updateSubroutine(), redrawGrid();
		$this.attr('contenteditable',false);
	});
}

function redrawGrid(){
	$('#container').empty()[0].appendChild(boards[active_board].toHTML());
	gridHandlers();
}
function redrawSource(){
	var src = '';
	if(boards[0].getComments() != null){
		var r = boards[0].getComments().split('\n');
		for(var j = 0; j < r.length; j++)
			src += '#' + r[j] + '\n';
	}
	src += boards[0].toString();
	for(var i = 1; i < boards.length; ++i){
		src += ':' + boards[i].getName() + '\n';
		if(boards[i].getComments() != null){
			var r = boards[i].getComments().split('\n');
			for(var j = 0; j < r.length; j++)
				src += '#' + r[j] + '\n';
		}
		src += boards[i].toString();
	}
	var textarea = document.createElement('textarea');
	textarea.setAttribute('id','marbelous-source');
	textarea.value = src;
	var heading = document.createElement('h2');
	heading.appendChild(document.createTextNode('Marbelous Source'));
	$('#container').empty()[0].appendChild(heading);
	$('#container')[0].appendChild(textarea);
}
function gridDocHandler(){
	$(document).on('keydown', function(e){
		var code = e.which;
		var row = active_tile[0], col = active_tile[1];
		switch(code){
			case 37: // left
				if(col > 0){
					focus_tile(row, col-1);
				}
			break;
			case 38: // up
				if(row > 0){
					focus_tile(row-1, col);
				}
			break;
			case 9: // tab
			case 39: // right
				if(col < boards[active_board].getWidth() - 1){
					focus_tile(row, col+1);
				}
			break;
			case 13: // return/enter
			case 40: // down
				if(row < boards[active_board].getHeight() - 1){
					focus_tile(row+1, col);
				}
			break;
		}
		if(code == 13 || code == 9){
			e.preventDefault();
			return false;
		}
	}).on('keypress', function(e){
		//var c = String.fromCharCode(e.which);
		var row = active_tile[0], col = active_tile[1];
		//if(c.match(/^[A-Z\d\\\/\+\-=#]$/i))
		$('#cell-'+row+'-'+col).attr('contenteditable', true).focus();
	});;
}
function srcDocHandler(){
	$(document).off('keydown').off('keyup');
}

$(document).ready(function(){
	redrawGrid();
	gridDocHandler();
	focus_tile(0,0);
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
			srcDocHandler();
			redrawSource();
			$('#hex_ascii').attr('disabled', true);
			$('#no_nbsp').attr('disabled', true);
			$('#active_board').attr('disabled', true);
			//$('#new_board').attr('disabled', true);
			$('#grid_source_toggle').val('View Marbelous Board');
		}else{ 
			gridDocHandler();
			// todo: check if failed
			boards = parseBoards($('#marbelous-source').val());
			updateSubroutine();
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
				var txt = boards[i].getName() + ' (' + ('00'+i).substr(-2) + ')';
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
