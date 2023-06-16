// JavaScript CRC-32 implementation
// Modified https://simplycalc.com/crc32-source.php

function crc32_generate(reversedPolynomial) {
  var table = [];
  for (let i = 0; i < 256; i++) {
    let n = i;
    for (let j = 8; j > 0; j--) {
      if ((n & 1) == 1) {
        n = (n >>> 1) ^ reversedPolynomial;
      } else {
        n = n >>> 1;
      }
    }
    table[i] = n;
  }

  return table;
}

function crc32_initial() { return 0xFFFFFFFF; }

function crc32_add_byte(table, crc, byte) {
  crc = (crc >>> 8) ^ table[(byte) ^ (crc & 0x000000FF)];
  return crc;
}

function crc32_final(crc) {
  crc = ~crc;
  crc = (crc < 0) ? (0xFFFFFFFF + crc + 1) : crc;
  return crc;
}

function crc32_compute_view(reversedPolynomial, dataView) {
  var table = crc32_generate(reversedPolynomial);
  let crc = crc32_initial();
  for (let i = 0; i < dataView.byteLength; i++)
    crc = crc32_add_byte(table, crc, dataView.getUint8(i));
  return crc32_final(crc);
}
