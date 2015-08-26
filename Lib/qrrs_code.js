/*
 * JavaScript QR Code encoder
 *
 * Reed-Solomon error correction support
 * 
 * This algorithm is based on PHP QR Code encoder. For the hope that the 
 * library can be useful when encoding with JavaScript, it is distributed
 * on Github: 
 */

var QRrsItem = function(){
	
	this.mm;																// Bits per symbol
	this.nn;																// Symbols per block (= (1<<mm)-1)
	this.nroots;															// Number of generator roots = number of parity symbols
	this.fcr;																// First consecutive root, index form
	this.prim;																// Primitive element, index form
	this.iprim;																// prim-th root of 1, index form
	this.pad;																// Padding bytes in shortened block
	this.gfpoly;
	this.alpha_to = [];														// log lookup table
	this.index_of = [];														// Antilog lookup table
	this.genpoly = [];														// Generator polynomial
	
	//----------------------------------------------------------------------
	this.modnn = function(x){
		while(x >= this.nn){
			x -= this.nn;
			x = (x >> this.mm) + (x & this.nn);
		}
		return x;
	};
	
	//----------------------------------------------------------------------
	this.init_rs_char = function(symsize, gfpoly, fcr, prim, nroots, pad){
		
		// Common code for intializing a Reed-Solomon control block (char or int symbols)
		
		var rs = null;
		
		if(symsize < 0 || symsize > 8)	return rs;
		if(fcr < 0 || fcr >= (1 << symsize))	return rs;
		if(prim <= 0 || prim >= (1 << symsize))	return rs;
        if(nroots < 0 || nroots >= (1 << symsize))	return rs;	// Can't have more roots than symbol values!
        if(pad < 0 || pad >= ((1 << symsize) -1 - nroots)) return rs;	// Too much padding
		
		rs = new QRrsItem();
		
		rs.mm = symsize;
		rs.nn = (1 << symsize ) - 1;
		rs.pad = pad;
	
		rs.alpha_to = array_fill(0, rs.nn + 1, 0);
		rs.index_of = array_fill(0, rs.nn + 1, 0);
		
		// PHP style macro replacement ;)
		var NN = rs.nn;
		var A0 = NN;
		
		// Generate Galois field lookup tables
		rs.index_of[0] = A0;	// log(zero) = -inf
		rs.alpha_to[A0] = 0;	// alpha**-inf = 0
		var sr = 1;
		
		for(var i = 0; i < rs.nn; i++){
			rs.index_of[sr] = i;
			rs.alpha_to[i] = sr;
			sr <<= 1;
			if(sr & (1 << symsize)){
				sr ^= gfpoly;
			}
			sr &= rs.nn;
		}
		
		if(sr != 1){
			// field generator polynomial is not primitive!
			rs = null;
			return rs;
		}
		
		/* Form RS code generator polynomial from its roots */
		rs.genpoly = array_fill(0, nroots + 1, 0);
		
		rs.fcr = fcr;
		rs.prim = prim;
		rs.nroots = nroots;
		rs.gfpoly = gfpoly;
		
		/* Find prim-th root of 1, used in decoding */
		var iprim;
		for(iprim = 1; (iprim % prim) != 0; iprim += rs.nn);	// intentional empty-body loop!
		
		rs.iprim = (iprim / prim);
		rs.genpoly[0] = 1;
		
		for(var i = 0, root = fcr * prim; i < nroots; i++, root += prim){
			rs.genpoly[i + 1] = 1;
			
			// Multiply rs->genpoly[] by  @**(root + x)
			for(var j = i; j > 0; j--){
				if(rs.genpoly[j] != 0){
					rs.genpoly[j] = rs.genpoly[j - 1] ^ rs.alpha_to[rs.modnn(rs.index_of[rs.genpoly[j]] + root)];
				}
				else{
					rs.genpoly[j] = rs.genpoly[j - 1];
				}
			}
			
			// rs->genpoly[0] can never be zero
			rs.genpoly[0] = rs.alpha_to[rs.modnn(rs.index_of[rs.genpoly[0]] + root)];
		}
		
		// convert rs->genpoly[] to index form for quicker encoding
		for(var i = 0; i <= nroots; i++){
			rs.genpoly[i] = rs.index_of[rs.genpoly[i]];
		}
		return rs;
	};
	
	//----------------------------------------------------------------------
	this.encode_rs_char = function(rs, data, parity){
		var MM = rs.mm;
		var NN = rs.nn;
		var ALPHA_TO = rs.alpha_to;
		var INDEX_OF = rs.index_of;
		var GENPOLY = rs.genpoly;
		var NROOTS = rs.nroots;
		var FCR = rs.fcr;
		var PRIM = rs.prim;
		var IPRIM  = rs.iprim;
		var PAD = rs.pad;
		var A0 = NN;
		var parity = array_fill(0, NROOTS, 0);
		
		//console.log('parity:' + parity);
		
		for(var i = 0; i < (NN - NROOTS - PAD); i++){
			// feedback term is non-zero
            
			// This line is unnecessary when GENPOLY[NROOTS] is unity, as it must
			// always be for the polynomials constructed by init_rs()
			//$feedback = $this->modnn($NN - $GENPOLY[$NROOTS] + $feedback);
			var feedback = INDEX_OF[data[i] ^ parity[0]];
			if(feedback != A0){
				feedback = rs.modnn(NN - GENPOLY[NROOTS] + feedback);
				for(var j = 1; j < NROOTS; j++){
					parity[j] ^= ALPHA_TO[rs.modnn(feedback + GENPOLY[NROOTS - j])];
				}
			}
			
			// Shift 
			array_shift(parity);
			if(feedback != A0){
				//console.log('alpha:' + ALPHA_TO[rs.modnn(feedback + GENPOLY[0])]);
				array_push(parity, ALPHA_TO[rs.modnn(feedback + GENPOLY[0])]);
				//console.log(i++);
			}
			else{
				array_push(parity, 0);
			}
			
			//console.log('parity:' + parity);
		}
		
		//console.log('parity:' + parity);
		return parity;
	};
};

//##########################################################################

var QRrs = function(){
	
	this.items = [];
	
	//----------------------------------------------------------------------
	this.init_rs = function(symsize, gfpoly, fcr, prim, nroots, pad){
		for(var i = 0; i < this.items.length; i++){
			var rs = this.items[i];
			if(rs.pad != pad) continue;
			if(rs.nroots != nroots) continue;
			if(rs.mm != symsize) continue;
			if(rs.gfpoly != gfpoly) continue;
			if(rs.fcr != fcr) continue;
			if(rs.prim != prim) continue;
			return rs;
		}
		
		var qRrsItem = new QRrsItem();
		var rs = qRrsItem.init_rs_char(symsize, gfpoly, fcr, prim, nroots, pad);
		array_unshift(this.items, rs);
		return rs;	
	};
};

//##########################################################################

var rsCode = function(code, RS_SYMSIZE, RS_GFPOLY, RS_FCR, RS_PRIM, RS_NROOTS, RS_PAD){
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

//##########################################################################

var array_fill = function(start, number, value){
	var array = [];
	for(var i = start; i < start + number; i++)
		array[i] = value;
	return array;
};

var array_shift = function(array){
	return array.shift();
}

var array_unshift = function(array, value){
	return array.unshift(value);
}

var array_push = function(array, value){
	return array.push(value);
};

//##########################################################################

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

//##########################################################################

var array_to_str = function(array){
	var str = '';
	for(var i = 0; i < array.length; i++){
		str += String.fromCharCode(array[i]);
	}
	return str;
};
