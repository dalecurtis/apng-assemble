class ChunkWriter {
  constructor(type, arrayBuffer, offset) {
    this.view = new DataView(arrayBuffer, offset);
    this.pos = 4; // Save space for size at completion.
    for (let i = 0; i < type.length; ++i) {
      this.view.setUint8(this.pos, type[i].charCodeAt());
      this.pos += 1;
    }
  }
  writeUint32(value) {
    this.view.setUint32(this.pos, value, false);
    this.pos += 4;
  }
  writeUint16(value) {
    this.view.setUint16(this.pos, value, false);
    this.pos += 2;
  }
  writeUint8(value) {
    this.view.setUint8(this.pos, value, false);
    this.pos += 1;
  }
  writeBytes(array) {
    let dest = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos,
                              array.length);
    dest.set(array);
    this.pos += array.length;
  }
  size() { return this.pos; }
  closeChunk() {
    let data =
        new DataView(this.view.buffer, this.view.byteOffset + 4, this.pos - 4);
    const CRC32P = 0xEDB88320;
    this.view.setUint32(this.pos, crc32_compute_view(CRC32P, data), false);
    this.pos += 4;
    this.view.setUint32(0, this.pos - 12);
  }
}

function findChunk(arr, type) {
  let index = arr.findIndex((v, index, arr) => {
    if (index + 3 > arr.length || index - 4 < 0)
      return false;
    return v == type[0].charCodeAt() &&
           arr[index + 1] == type[1].charCodeAt() &&
           arr[index + 2] == type[2].charCodeAt() &&
           arr[index + 3] == type[3].charCodeAt();
  });
  return index < 0 ? index : index - 4;
}

function createACTL(frame_count) {
  let actl = new Uint8Array(20);
  let writer = new ChunkWriter('acTL', actl.buffer);
  writer.writeUint32(frame_count);
  writer.writeUint32(0); // num_plays (0=infinite)
  writer.closeChunk();
  return actl;
}

function createFCTL(sequence_number, width, height, delay_numerator,
                    delay_denominator) {
  let fctl = new Uint8Array(38);
  let writer = new ChunkWriter('fcTL', fctl.buffer);
  writer.writeUint32(sequence_number);
  writer.writeUint32(width);
  writer.writeUint32(height);
  writer.writeUint32(0); // x_offset
  writer.writeUint32(0); // y_offset
  writer.writeUint16(delay_numerator);
  writer.writeUint16(delay_denominator);
  writer.writeUint8(0); // dispose_op
  writer.writeUint8(0); // blend_op
  writer.closeChunk();
  return fctl;
}

function createAnimatedPNG(frames, width, height, delay_numerator,
                           delay_denominator) {
  // Total size should be size of all IDATs plus new fcTL, acTL chunks.
  let estimated_size = frames.reduce((a, b) => a + b.length, 0) * 1.25;
  let apng = new Uint8Array(estimated_size);
  let actual_size = 0;

  // Copy png signature + IHDR chunk out of first frame.
  let sig_plus_ihdr = frames[0].subarray(0, findChunk(frames[0], 'IDAT'));
  apng.set(sig_plus_ihdr, 0);
  actual_size += sig_plus_ihdr.length;

  // Write acTL.
  let actl = createACTL(frames.length);
  apng.set(actl, actual_size);
  actual_size += actl.length;

  let sequence_number = 0;
  for (let i = 0; i < frames.length; ++i) {
    let frame = frames[i];

    // Write fcTL.
    let fctl = createFCTL(sequence_number++, width, height, delay_numerator,
                          delay_denominator);
    apng.set(fctl, actual_size);
    actual_size += fctl.length;

    // Copy first frame as is (which may have many inner IDATs).
    if (i == 0) {
      let idat =
          frame.subarray(findChunk(frame, 'IDAT'), findChunk(frame, 'IEND'));
      apng.set(idat, actual_size);
      actual_size += idat.length;
      continue;
    }

    // Now convert IDAT chunks to fdAT -- each frame may have many IDATs.
    let index = findChunk(frame, 'IDAT');
    do {
      let input_view = new DataView(frame.buffer, frame.byteOffset + index);
      let idat_len = input_view.getUint32(false);
      let idat = frame.subarray(index + 8, index + 8 + idat_len);

      // fdAT is IDAT w/ sequence number added.
      let writer = new ChunkWriter('fdAT', apng.buffer, actual_size);
      writer.writeUint32(sequence_number++);
      writer.writeBytes(idat);
      writer.closeChunk();
      actual_size += writer.size();

      let chunk_end = index + idat_len + 12;
      index = findChunk(frame.subarray(chunk_end), 'IDAT');
      if (index >= 0)
        index += chunk_end;
    } while (index >= 0)
  }

  let iend = frames[0].subarray(findChunk(frames[0], 'IEND'));
  apng.set(iend, actual_size);
  actual_size += iend.length;
  return apng.subarray(0, actual_size);
}
