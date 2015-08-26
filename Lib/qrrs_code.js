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
	this.mm;																// bits per symbol
	this.nn;																// symbols per block (= (1<<m)-1)
	this.nroots;															// number of generator roots = number of parity symbols
	this.fcr;																// first consecutive root, index form
	this.prim;																// primitive element, index form
	this.iprim;																// prim-th root of 1, index form
	this.pad;																// padding bytes in shortened block
	this.gfpoly;
	this.alpha_to = [];														// log lookup table
	this.index_of = [];														// antilog lookup table
	this.genpoly = [];														// generator polynomial
	
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
		var rs = null;
		
		if(symsize < 0 || symsize > 8)	return rs;
		if(fcr < 0 || fcr >= (1 << symsize))	return rs;
		if(prim <= 0 || prim >= (1 << symsize))	return rs;
        if(nroots < 0 || nroots >= (1 << symsize))	return rs;
        if(pad < 0 || pad >= ((1 << symsize) -1 - nroots)) return rs;
		
		rs = new QRrsItem();
		
		rs.mm = symsize;
		rs.nn = (1 << symsize ) - 1;
		rs.pad = pad;
	
		rs.alpha_to = array_fill(0, rs.nn + 1, 0);
		rs.index_of = array_fill(0, rs.nn + 1, 0);
		
		var NN = rs.nn;
		var A0 = NN;
		
		rs.index_of[0] = A0;
		rs.alpha_to[A0] = 0;
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
			rs = null;
			return rs;
		}
		
		rs.fcr = fcr;
		rs.prim = prim;
		rs.nroots = nroots;
		rs.gfpoly = gfpoly;
		
		var iprim;
		for(iprim = 1; (iprim % prim) != 0; iprim += rs.nn);
		
		rs.iprim = (iprim / prim);
		//console.log('iprim:' + rs.iprim);
		rs.genpoly[0] = 1;
		
		for(var i = 0, root = fcr * prim; i < nroots; i++, root += prim){
			rs.genpoly[i + 1] = 1;
			
			for(var j = i; j > 0; j--){
				if(rs.genpoly[j] != 0){
					rs.genpoly[j] = rs.genpoly[j - 1] ^ rs.alpha_to[rs.modnn(rs.index_of[rs.genpoly[j]] + root)];
				}
				else{
					rs.genpoly[j] = rs.genpoly[j - 1];
				}
			}
			
			rs.genpoly[0] = rs.alpha_to[rs.modnn(rs.index_of[rs.genpoly[0]] + root)];
		}
		
		for(var i = 0; i <= nroots; i++){
			rs.genpoly[i] = rs.index_of[rs.genpoly[i]];
		}
		
		return rs;
	};
	
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
			var feedback = INDEX_OF[data[i] ^ parity[0]];
			//console.log('feedback:' + feedback);
			if(feedback != A0){
				feedback = rs.modnn(NN - GENPOLY[NROOTS] + feedback);
				for(var j = 1; j < NROOTS; j++){
					parity[j] ^= ALPHA_TO[rs.modnn(feedback + GENPOLY[NROOTS - j])];
				}
			}
			
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

var QRrs = function(){
	this.items = [];
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
