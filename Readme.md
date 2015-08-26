## About

- There is an algorithmn named **QR Code Encoder**, based on **Reed-Solomon** Encoding.

## Usage

```js
var RS_SYMSIZE = 5;
var RS_GFPOLY = 0x25;
var RS_FCR = 1;
var RS_PRIM = 1;
var RS_NROOTS = 8;
var RS_DATA_LEN = 10;
var RS_TOTAL_LEN = RS_DATA_LEN + RS_NROOTS;
var RS_PAD = ((1 << RS_SYMSIZE) - 1 - RS_TOTAL_LEN);
var BB_CHARACTERS = "0123456789abcdefghijklmnopqrstuv";

function char_to_num (char) {
	var ascii = char.charCodeAt();
	//console.log("ascii  " + ascii);
	if (ascii >= 48 && ascii <= 57) {
		return ascii - 48;
	} else if (ascii >= 97 && ascii <= 118){
		return ascii - 87;
	}
}
		
function num_to_char(n){
	if(n >= 0 && n < 32)
	{
		return BB_CHARACTERS[n].charCodeAt();
	}
	return n;
}
		
		
var array_to_str = function(array){
	var str = '';
	for(var i = 0; i < array.length; i++){
		str += String.fromCharCode(array[i]);
	}
	return str;
};
        
var rsCode = function(code){
	if(code && code.length == 10){
		var data = [];
		var rs_code = [];
		for(var i = 0; i < RS_TOTAL_LEN; i++){
			if(i < RS_DATA_LEN){
				data[i] = char_to_num(code[i]);
			}
			else{
				data[i] = 0;
			}
		}
		var qRrs = new QRrs();
		var rs = qRrs.init_rs(RS_SYMSIZE, RS_GFPOLY, RS_FCR, RS_PRIM, RS_NROOTS, RS_PAD);
		var newcode = data[RS_DATA_LEN];
		var qRrsItem = new QRrsItem();
		var res = qRrsItem.encode_rs_char(rs, data ,newcode);
		//console.log(res);
				
		for(var i = 0; i < RS_DATA_LEN; i++){
			rs_code[i] = num_to_char(data[i]);
		}
		//console.log(array_to_str(rs_code));
		
		for(var i = 0; i < res.length; i++){
			rs_code[i + RS_DATA_LEN] = num_to_char(res[i]);
		}
				
		//console.log(array_to_str(rs_code));
				
		return rs_code;
	}
};
		
var get_code = function(){
	var testCode = document.getElementById('input').value;
	var conVertCode = '';
	conVertCode = rsCode(testCode);
	console.log(array_to_str(conVertCode));
	document.getElementById('output').innerHTML = 'Output: ' + array_to_str(conVertCode);
}
```

## Supported
 * PHP QR Code Encoder

## Thank you

<img src="./Thank_you.png">

## About me
<a href="http://aleen42.github.io/" target="_blank" ><img src="./pic/tail.gif"></a>
