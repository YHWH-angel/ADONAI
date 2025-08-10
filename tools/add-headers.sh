YEAR=2025
while IFS= read -r -d '' f; do
  if grep -q 'The Bitcoin Core developers' "$f" && ! grep -q 'The Adonai Core developers' "$f"; then
    sed -i "/The Bitcoin Core developers/a // Modifications (c) ${YEAR} The Adonai Core developers" "$f"
    echo "[CHANGE] $f"
  fi
done < <(find src -type f \( -name "*.h" -o -name "*.cpp" \) -print0)
