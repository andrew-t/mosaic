'use strict'

document.addEventListener('DOMContentLoaded', e => {
	const uploader = document.getElementById('upload'),
		canvas = document.createElement('canvas'),
		form = document.getElementById('mosaic-form'),
		image = document.getElementById('img');

	// Useful for debugging:
	// document.body.appendChild(canvas);

	let imageLoaded, imageLoading;

	uploader.addEventListener('change', e => useFile(e.target.files[0]));
	useFile(uploader.files[0]);

	function useFile(f) {
		imageLoaded = false;
		imageLoading = null;
		image.classList.add('hidden');
		if (!f) return;
		if (!f.type.match('image.*')) {
			alert('Not a recognised image format.');
			return;
		}
		imageLoading = true;
		imageLoading = new Promise((resolve, reject) => {
			try {
				function onLoad() {
					imageLoaded = true;
					imageLoading = null;
					resolve();
					image.removeEventListener('load', onLoad);
					image.removeEventListener('error', onFail);
				}
				function onFail(e) {
					alert("Failed to upload image: " + e.message);
					imageLoaded = false;
					imageLoading = null;
					reject(e);
					image.removeEventListener('load', onLoad);
					image.removeEventListener('error', onFail);
				}
				image.addEventListener('load', onLoad);
				image.addEventListener('error', onFail);
				const reader = new FileReader();
				reader.addEventListener('load', e => image.src = e.target.result);
				reader.readAsDataURL(f);
				image.classList.remove('hidden');
			} catch(e) {
				onFail(e);
			}
		});
	}

	function storeImageToCanvas() {
		const scale = document.getElementById('max-size').value
			/ Math.max(image.naturalWidth, image.naturalHeight);
		canvas.width = ~~(image.naturalWidth * scale);
		canvas.height = ~~(image.naturalHeight * scale);
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image,
			0, 0, image.naturalWidth, image.naturalHeight,
			0, 0, canvas.width, canvas.height);
	}

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		if (imageLoading) await imageLoading;
		storeImageToCanvas();
		const sheet = makeExcelWorksheet(),
			mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
		JSZipUtils.getBinaryContent('imagexlsx.zip', (err, data) => {
			if (err) {
				alert(err.message);
				return;
			} else
			JSZip.loadAsync(data).then(xlsx => {
				xlsx.file("xl/worksheets/sheet1.xml", sheet);
				xlsx.generateAsync({ type: "blob", mimeType })
					.then(blob => saveAs(blob, "image.xlsx"))
					.catch(err => {
						console.error(err);
						return xlsx.generateAsync({ type: "base64" })
							.then(base64 =>
								window.location = "data:" + mimeType + ";base64," + base64)
							.catch(err => console.error(err));
					});
			});
		});
	});

	function makeExcelWorksheet() {
		const ctx = canvas.getContext('2d'),
			data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		function px(x, y, c) { return data.data[(y * canvas.width + x) * 4 + c]; }
		let sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><dimension ref="A1:${colName(canvas.width - 1)}${canvas.height * 3}"/><sheetViews><sheetView tabSelected="1" zoomScaleNormal="100" workbookViewId="0"/></sheetViews><sheetFormatPr defaultColWidth="5" defaultRowHeight="8" customHeight="1" x14ac:dyDescent="0.25"/><sheetData>`;
		for (let y = 0; y < canvas.height; ++y) {
			let r = `<row r="${y * 3 + 1}" spans="1:${canvas.width}" x14ac:dyDescent="0.25">`,
				g = `<row r="${y * 3 + 2}" spans="1:${canvas.width}" x14ac:dyDescent="0.25">`,
				b = `<row r="${y * 3 + 3}" spans="1:${canvas.width}" x14ac:dyDescent="0.25">`;
			for (let x = 0; x < canvas.width; ++x) {
				r += `<c r="${colName(x)}${y * 3 + 1}"><v>${px(x, y, 0)}</v></c>`;
				g += `<c r="${colName(x)}${y * 3 + 2}"><v>${px(x, y, 1)}</v></c>`;
				b += `<c r="${colName(x)}${y * 3 + 3}"><v>${px(x, y, 2)}</v></c>`;
			}
			sheet += `${r}</row>${g}</row>${b}</row>`;
		}
		sheet += '</sheetData>';
		const maxes = [ '0000FF', 'FF0000', '00FF00' ];
		for (let y = 1; y <= canvas.height * 3; ++y)
			sheet += `<conditionalFormatting sqref="A${y}:${colName(canvas.width - 1)}${y}"><cfRule type="colorScale" priority="${y}"><colorScale><cfvo type="num" val="0"/><cfvo type="num" val="255"/><color theme="1"/><color rgb="FF${maxes[y % 3]}"/></colorScale></cfRule></conditionalFormatting>`;
		sheet += '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
		return sheet;
	}
});

function letter(n) { return String.fromCharCode(~~n + 65); }
function colName(n) {
	if (n <= 25) return letter(n);
	if (n <= 701) {
		n -= 26;
		return letter(n / 26) + letter(n % 26);
	}
	n -= 702;
	const m = ~~(n / 26);
	return letter(m / 26) + letter(m % 26) + letter(n % 26);
}
