<?php

// load image
if ($_FILES["fi"]["error"] > 0) abandonship('File upload error.');

             $image = @imagecreatefromjpeg($_FILES["fi"]["tmp_name"]);
if (!$image) $image = @imagecreatefrompng ($_FILES["fi"]["tmp_name"]);
if (!$image) $image = @imagecreatefromgif ($_FILES["fi"]["tmp_name"]);
if (!$image) abandonship('Error reading image.');

// check size
list($w, $h) = getimagesize($_FILES["fi"]["tmp_name"]);
//if ($w * $h * 12 > 5000000) abandonship('Image too large.');
if ($h > 21845 || $w > 16384)
    abandonship("I can only handle images of size at most 21845 x 16384!");

if (!isset($_POST['xlsx'])) {
	// save rather than open in browser
	header('Content-disposition: attachment; filename=image.csv');
	header('Content-type: text/csv');

	// parse to csv
	for ($y = 0; $y < $h; ++$y) {
		if ($y > 0) echo "\r\n";
		$colours = imagecolorsforindex($image, imagecolorat($image,  0, $y));
		$r = (string)$colours['red'];
		$g = (string)$colours['green'];
		$b = (string)$colours['blue'];
		for ($x = 1; $x < $w; ++$x) {
			$colours = imagecolorsforindex($image, imagecolorat($image, $x, $y));
			$r .= ',' . $colours['red'];
			$g .= ',' . $colours['green'];
			$b .= ',' . $colours['blue'];
		}
		echo $r . "\r\n" . $g . "\r\n" . $b;
	}
} else {
	$sheet1 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><dimension ref="A1:'.colname($w-1).($h*3).'"/><sheetViews><sheetView tabSelected="1" zoomScaleNormal="100" workbookViewId="0"/></sheetViews><sheetFormatPr defaultColWidth="5" defaultRowHeight="8" customHeight="1" x14ac:dyDescent="0.25"/><sheetData>';
	for ($y=0; $y < $h; $y++) { 
		$rr='<row r="'.($y*3+1).'" spans="1:'.$w.'" x14ac:dyDescent="0.25">';
		$gr='<row r="'.($y*3+2).'" spans="1:'.$w.'" x14ac:dyDescent="0.25">';
		$br='<row r="'.($y*3+3).'" spans="1:'.$w.'" x14ac:dyDescent="0.25">';
		for ($x=0; $x < $w; $x++) { 
			$colours = imagecolorsforindex($image,
				imagecolorat($image, $x, $y));
			$rr.='<c r="'.colname($x).($y*3+1).'"><v>'.$colours['red'].'</v></c>';
			$gr.='<c r="'.colname($x).($y*3+2).'"><v>'.$colours['green'].'</v></c>';
			$br.='<c r="'.colname($x).($y*3+3).'"><v>'.$colours['blue'].'</v></c>';
		}
		$sheet1.=$rr.'</row>'.$gr.'</row>'.$br.'</row>';
	}
	$sheet1.="</sheetData>";
	$c=array('0000FF', 'FF0000', '00FF00');
	for ($y=1; $y <= $h*3; $y++)
		$sheet1.='<conditionalFormatting sqref="A'.$y.':XFD'.$y.'"><cfRule type="colorScale" priority="'.$y.'"><colorScale><cfvo type="num" val="0"/><cfvo type="num" val="255"/><color theme="1"/><color rgb="FF'.$c[$y%3].'"/></colorScale></cfRule></conditionalFormatting>';
	$sheet1.='<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';

	$fn = $_FILES["fi"]["tmp_name"].'.xlsx';//tempnam('tmp', 'xlsx');
	copy('imagexlsx.zip', $fn);
	$zip = new ZipArchive;
	$res = $zip->open($fn);
	if ($res !== true) {
		abandonship("Zip error $res");
		unlink($fn);
	}
	$zip->addFromString('xl/worksheets/sheet1.xml', $sheet1);
	$zip->close();
	header('Content-disposition: attachment; filename=image.xlsx');
	header('Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	readfile($fn);
	unlink($fn);
}
die();

function colname($n) {
	if ($n<=25)
		return letter($n);
	elseif ($n<=701) {
		$n -= 26;
		return letter($n/26).letter($n%26);
	} else {
		$n -= 702;
		$m = floor($n/26);
		return letter($m/26).letter($m%26).letter($n%26);
	}
}

function letter($n) {
	return chr(65+floor($n));
}

function abandonship($message) {
	header('Content-type: text/html');
	echo '<html><head></head><body>';
	echo $message;
	echo '</body></html>';
	die();
}

?>