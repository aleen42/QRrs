## About

- There is an algorithmn named **QR Code Encoder** in PHP, based on **Reed-Solomon** Encoding. For the purpose that I would like to do this in JavaScript, I have distributed this library - **QRrs**. I hope it is useful for you, because I have not found any libraries before I wrote this.

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

conVertCode = rsCode(testCode, RS_SYMSIZE, RS_GFPOLY, RS_FCR, RS_PRIM, RS_NROOTS, RS_PAD);
```

## Supported
 * PHP QR Code Encoder

## Thank you

<img src="./Thank_you.png">

## About me
<a href="http://aleen42.github.io/" target="_blank" ><img src="./pic/tail.gif"></a>
