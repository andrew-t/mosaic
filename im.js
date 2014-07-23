function handleFileDrop(evt) {
	handleDragOut(evt);
	pickfile(evt.dataTransfer.files[0]);
}
function handleFileSelect(evt) {
	pickfile(evt.target.files[0]);
}
function pickfile(f) {
	if (!f) return;
	if (!f.type.match('image.*')) {
		alert('Not a recognised image format.');
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		document.getElementById('im').src =  e.target.result;
	};
	reader.readAsDataURL(f);
	$('#im').show();
}
function handleUrlSelect(evt) {
	$('#im').attr('src', $('#url').val()).show();
}
function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
	document.getElementById('dropzone').style.borderColor = '#f00';
}
function handleDragOut(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	document.getElementById('dropzone').style.borderColor = '#bbb';
}

var pxsz;
function init() {
	dropZone = document.getElementById('dropzone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('dragleave', handleDragOut, false);
	dropZone.addEventListener('drop', handleFileDrop, false);
	document.getElementById('fi').addEventListener('change', handleFileSelect, false);
	//document.getElementById('url').addEventListener('change', handleUrlSelect, false);

	$("#dzf :input").change(function() {
		if (!$("#crop").is(':checked')) {
			//$('#dropzone').width('auto').height('auto');
			i = $('#im');
			$('#dropzone').css({
				'width' : i.width() + 'px',
				'height' : i.height() + 'px'
			});
		}
		else {
			w=$('#w').val(); h=$('#h').val();
			if (isNaN(w)) {
				alert('Value must be a number.');
				$('#w').val('100');
				return;
			}
			if (isNaN(h)) {
				alert('Value must be a number.');
				$('#h').val('100');
				return;
			}
			$('#dropzone').css({
				'width' : w + 'px',
				'height' : h + 'px'
			});
		}
	});

	$("#shownum").change(function() {
		if ($("#shownum").is(':checked'))
			$('#data').removeClass('hideNumbers');
		else
			$('#data').addClass('hideNumbers');
	});

	$('.tools').draggable();
	$('#im').load(function() {
		$('#crop').change();
		$("#shownum").change();
	});
}

function drawtable() {
	c = document.getElementById('can');
	d = document.getElementById('dropzone');
	i = document.getElementById('im');
	h = i.height; w = i.width;
	if (h > d.clientHeight) h = d.clientHeight;
	if (w > d.clientWidth) w = d.clientWidth;
	c.height = h; c.width = w;
	ctx = c.getContext("2d");
	ctx.drawImage(i, 0, 0);
	idata = ctx.getImageData(0, 0, w, h);

	t = document.getElementById('data');
	t.innerHTML = '';
	a = 0;
	for (y=0; y<h; ++y) {
		rows = [];
		for (i=0; i<3; ++i)
			rows[i] = document.createElement('tr');
		for (x=0; x<w; ++x) {
			// a = (y * idata.width + x) * 4;
			for (i=0; i<3; ++i) { // goes to 4 for alpha but ignore that
				cell = document.createElement('td');
				if ((i == 0) && (y == 0)) cell.className += " ch";
				if (x == 0) cell.className += " rh";
				v = idata.data[a++];
				switch(i) {
					case 0: cell.style.backgroundColor='rgb('+v+',0,0)'; break;
					case 1: cell.style.backgroundColor='rgb(0,'+v+',0)'; break;
					case 2: cell.style.backgroundColor='rgb(0,0,'+v+')'; break;
				}
				span = document.createElement('span');
				span.appendChild(document.createTextNode(v));
				cell.appendChild(span);
				//*/ cell.appendChild(document.createTextNode(v));
				rows[i].appendChild(cell);
			}
			++a;
		}
		for (i=0; i<3; ++i)
			t.appendChild(rows[i]);
	}
	$('#imtools').hide();
	$('#toolbar').show();
}
