#!/usr/bin/env python3
with open('index.html', 'rb') as f:
    cb = f.read()

idx = cb.find(b'matchRegs.forEach')
chunk = cb[idx:idx+400]
print(repr(chunk))

# The exact bytes to find
target = chunk[:chunk.find(b'listEl.innerHTML')]
print()
print("Target to replace:")
print(repr(target))
