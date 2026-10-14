import binascii
import struct


def _crc_byte(crc, byte):
    return binascii.crc32(bytes([byte]), crc ^ 0xFFFFFFFF) ^ 0xFFFFFFFF


class _Keys:
    def __init__(self, password):
        self.k = [305419896, 591751049, 878082192]

        for char in password.encode():
            self.update(char)

    def update(self, byte):
        k0 = _crc_byte(self.k[0], byte)
        k1 = (((self.k[1] + (k0 & 0xFF)) & 0xFFFFFFFF) * 134775813 + 1) & 0xFFFFFFFF
        self.k = [k0, k1, _crc_byte(self.k[2], k1 >> 24)]

    def encrypt(self, data):
        out = bytearray()

        for plain in data:
            temp = (self.k[2] | 2) & 0xFFFF
            out.append(plain ^ (((temp * (temp ^ 1)) >> 8) & 0xFF))
            self.update(plain)

        return bytes(out)


def zipcrypto_zip(name, data, password):
    """Monta um ZIP com criptografia tradicional (ZipCrypto), como o do C6; o zipfile só sabe ler."""
    crc = binascii.crc32(data) & 0xFFFFFFFF
    header = bytes(range(11)) + bytes([crc >> 24])
    payload = _Keys(password).encrypt(header + data)
    raw_name = name.encode()
    common = struct.pack("<HHHHIII", 1, 0, 0, 0x21, crc, len(payload), len(data))
    local = b"PK\x03\x04" + struct.pack("<H", 20) + common + struct.pack("<HH", len(raw_name), 0) + raw_name + payload
    central = (
        b"PK\x01\x02" + struct.pack("<HH", 20, 20) + common
        + struct.pack("<HHHHHII", len(raw_name), 0, 0, 0, 0, 0, 0) + raw_name
    )
    end = b"PK\x05\x06" + struct.pack("<HHHHIIH", 0, 0, 1, 1, len(central), len(local), 0)

    return local + central + end
