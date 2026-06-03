import sys

for line in sys.stdin:
    if line.strip().startswith("Co-authored-by: Cursor"):
        continue
    sys.stdout.write(line)
